from typing import Dict, Optional

from fastapi import APIRouter, Request, Response
from starlette.responses import StreamingResponse

from megawave import files
from megawave.art_cache import ALBUM_ART_CACHE
from megawave.audio import AudioFile, get_audio_file_sort_value, get_media_type
from megawave.streaming_audio import get_file_chunk_generator
from megawave.util import filter_by_field

router = APIRouter(prefix="/library")


@router.get("/art/{id}")
def art(id: str):
    art_entry = ALBUM_ART_CACHE.get(id, None)

    if art_entry is None:
        return {"error": {"message": "not found"}}, 404

    return Response(
        art_entry["art"]["bytes"],
        headers={"Content-Type": art_entry["art"]["mime"]},
    )


@router.get("/songs")
def songs(
    sort: Optional[str] = None,
    filter: Optional[str] = None,
    subkeyfilter: Optional[str] = None,
):
    """
    /songs?[sort]=[-]sortKeyStr&[filter]=filterStr&[subkeyfilter]=filterKeyStr-filterValueStr

    ex: /songs
      returns an unsorted/unfiltered list of songs
    ex: /songs?sort=artist
      returns a list of songs, sorted by artist alphabetically ascending
    ex: /songs?sort=-album
      returns a list of songs, sorted by album alphabetically descending
    ex: /songs?filter=Daft%20Punk
      returns a list of songs, filtered by any whose keys contain the string "Daft Punk"
    ex: /songs?subkeyfilter=artist-Daft%20Punk
      returns a list of songs, filtered by the artist key "Daft Punk"
    """
    songs = files.audioLibrary.serialize()

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
        songs.sort(
            key=lambda k: get_audio_file_sort_value(k, sortKey) or "",
            reverse=reverse,
        )

    return {"data": {"songs": songs}}


@router.get("/songs/{id}")
def song(id: str, req: Request):
    """
    /songs/{id}

    ex: /songs/1234bcdf
      returns a stream of byte chunks of the song id={id} for the range requested by the Range header
    """
    song = files.audioLibrary.getById(id)
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
