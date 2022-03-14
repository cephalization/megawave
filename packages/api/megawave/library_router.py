from typing import Optional

from fastapi import APIRouter, Request
from starlette.responses import StreamingResponse

from megawave import files
from megawave.audio import get_audio_file_sort_value, get_media_type
from megawave.streaming_audio import get_file_chunk_generator
from megawave.util import filter_by_field

router = APIRouter(prefix="/library")


@router.get("/songs")
def songs(sort: Optional[str] = None, subkeyfilter: Optional[str] = None):
    """
    /songs?[sort]=[-]sortKeyStr&[subkeyfilter]=filterKeyStr-filterValueStr

    ex: /songs
      returns an unsorted/unfiltered list of songs
    ex: /songs?sort=artist
      returns a list of songs, sorted by artist alphabetically ascending
    ex: /songs?sort=-album
      returns a list of songs, sorted by album alphabetically descending
    ex: /songs?subkeyfilter=artist-Daft%20Punk
      returns a list of songs, filtered by the artist key "Daft Punk"
    """
    songs = files.audioLibrary.serialize()

    if subkeyfilter is not None:
        assert isinstance(subkeyfilter, str)
        field = subkeyfilter.split("-")[0]
        if field is not None:
            term = "".join(subkeyfilter.split(f"{field}-")[1:])
            songs = [song for song in songs if filter_by_field(term, field, song)]
        # TODO: return a warning about incorrect filter format if subkeyfilter does not contain "-"
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
