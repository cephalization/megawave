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
      returns a list of songs, sorted by album alphabetically descending
    ex: /songs?filter=Daft%20Punk
      returns a list of songs, filtered by any whose keys contain the string "Daft Punk"
    ex: /songs?subkeyfilter=artist-Daft%20Punk
      returns a list of songs, filtered by the artist key "Daft Punk"
    """
    songs = audioLibrary.serialize()

    print(f"filter: {filter}, subkeyfilter: {subkeyfilter}")

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
        field = subkeyfilter.split("-")[0]
        if field is not None:
            term = "".join(subkeyfilter.split(f"{field}-")[1:])
            songs = [song for song in songs if filter_by_field(term, field, song)]
        # TODO: return a warning about incorrect filter format if subkeyfilter does not contain "-"
    # Handle song subkey sorting
    if sort is not None:
        assert isinstance(sort, str)
        reverse = sort.startswith("-")
        sortKey = sort.replace("-", "")

        # For descending sort, we want missing values at the top instead of bottom
        # So we temporarily flip "zzzzz" to "" for the sort
        if reverse:
            songs.sort(
                key=lambda k: str(get_audio_file_sort_value(k, sortKey)).replace(
                    "zzzzz", ""
                ),
                reverse=True,
            )
        else:
            songs.sort(
                key=lambda k: get_audio_file_sort_value(k, sortKey) or "",
                reverse=False,
            )
    else:
        # Default sorting: by album name, then track number, with non-album tracks at the end
        def sort_key(song):
            # Get album name, defaulting to None if not present
            album = song.get("album", None)
            # Handle both None and empty list cases
            album_name = album[0].lower() if album and len(album) > 0 else None

            # Get track number, defaulting to infinity if not present
            track = song.get("track", None)
            track_num = (
                track["no"]
                if track and isinstance(track, dict) and "no" in track
                else float("inf")
            )

            # Songs without albums go to the end
            if album_name is None:
                return ("zzzzz", float("inf"))

            return (album_name, track_num)

        # Sort
        songs.sort(key=sort_key)

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
