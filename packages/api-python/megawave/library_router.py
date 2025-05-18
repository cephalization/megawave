from typing import Dict

from fastapi import APIRouter, Request, Response
from starlette.responses import StreamingResponse

from megawave.art_cache import ALBUM_ART_CACHE
from megawave.audio import AudioFile, get_audio_file_sort_value, get_media_type
from megawave.library import audioLibrary
from megawave.streaming_audio import get_file_chunk_generator
from megawave.util import filter_by_field

router = APIRouter(prefix="/library")


@router.get("/status")
def status():
    return {"data": audioLibrary.status}


@router.get("/art/{id}")
def art(id: str):
    art_entry = ALBUM_ART_CACHE.get(id, None)

    if art_entry is None:
        return {"error": {"message": "not found"}}, 404

    return Response(
        art_entry["art"]["bytes"],
        headers={
            "Content-Type": art_entry["art"]["mime"],
            "Cache-Control": "max-age=31536000",
        },
    )


@router.get("/songs")
def songs(
    sort: str | None = None,
    filter: str | None = None,
    subkeyfilter: str | None = None,
):
    """
    /songs?[sort]=[-]sortKeyStr&[filter]=filterStr&[subkeyfilter]=filterKeyStr-filterValueStr

    ex: /songs
      returns a list of songs, sorted by album name and track number by default
    ex: /songs?sort=artist
      returns a list of songs, sorted by artist alphabetically ascending
    ex: /songs?sort=-album
      returns a list of songs, sorted by album alphabetically descending, with songs in album sorted by track number, with non-album tracks at the end
    ex: /songs?filter=Daft%20Punk
      returns a list of songs, filtered by any whose keys contain the string "daft punk" (case insensitive)
    ex: /songs?subkeyfilter=artist-Daft%20Punk
      returns a list of songs, filtered by the artist key "daft punk" (case insensitive)
    ex: /songs?filter=never&subkeyfilter=album-nevermind
      returns a list of songs, filtered by the album key "nevermind" and the filter "never" (case insensitive), with songs in album sorted by track number
    """
    songs = audioLibrary.serialize()

    # Handle general song filtering
    if filter is not None:
        assert isinstance(filter, str)
        grouped_by_key: Dict = {"artist": [], "album": [], "name": []}
        for song in songs:
            would_match, match_key = AudioFile.matches_filter(song, filter)
            if would_match and match_key in grouped_by_key:
                grouped_by_key[match_key].append(song)
        songs = [
            *grouped_by_key["artist"],
            *grouped_by_key["name"],
            *grouped_by_key["album"],
        ]

    # Handle song subkey filtering
    if subkeyfilter is not None:
        assert isinstance(subkeyfilter, str)
        if "-" in subkeyfilter:
            field = subkeyfilter.split("-")[0]
            term = "".join(subkeyfilter.split(f"{field}-")[1:])
            songs = [song for song in songs if filter_by_field(term, field, song)]

    def get_track_number(song):
        track = song.get("track", None)
        return (
            track["no"]
            if track and isinstance(track, dict) and "no" in track
            else float("inf")
        )

    # Handle song sorting
    if sort is not None:
        assert isinstance(sort, str)
        reverse = sort.startswith("-")
        sort_key = sort.replace("-", "")

        def custom_sort_key(song):
            # Get the primary sort value
            primary_value = get_audio_file_sort_value(song, sort_key)
            if reverse:
                # For descending sort, we want missing values at the top instead of bottom
                primary_value = "" if primary_value == "zzzzz" else primary_value

            # If sorting by album, add track number as secondary sort
            if sort_key == "album":
                track_num = get_track_number(song)
                # Only reverse track numbers if we're sorting by album in descending order
                # AND we have an album-specific subkey filter
                should_reverse_tracks = (
                    reverse
                    and subkeyfilter is not None
                    and subkeyfilter.startswith("album-")
                )
                track_num = -track_num if should_reverse_tracks else track_num
                return (primary_value or "", track_num)

            # For all other sorts, add track number as ascending secondary sort
            track_num = get_track_number(song)
            return (primary_value or "", track_num)

        songs.sort(key=custom_sort_key, reverse=reverse)
    else:
        # Default sorting: by album name, then track number, with non-album tracks at the end
        def default_sort_key(song):
            album = song.get("album", None)
            album_name = album[0].lower() if album and len(album) > 0 else "zzzzz"
            track_num = get_track_number(song)
            return (album_name, track_num)

        songs.sort(key=default_sort_key)

    return {"data": {"songs": songs}}


@router.get("/songs/{id}")
def song(id: str, req: Request):
    """
    /songs/{id}

    ex: /songs/1234bcdf
      returns a stream of byte chunks of the song id={id} for the range requested by the Range header
    """
    song = audioLibrary.getById(id)
    requested_byte_range = req.headers.get("Range") or None

    if song is not None and requested_byte_range is not None:
        chunk_generator, content_range_header = get_file_chunk_generator(
            song.filePath, requested_byte_range
        )

        return StreamingResponse(
            chunk_generator,
            headers={
                "Accept-Ranges": "bytes",
                "Content-Range": content_range_header,
                "Content-Type": get_media_type(song.fileType),
            },
            status_code=206,
        )

    return {"error": {"message": "not found"}}, 404
