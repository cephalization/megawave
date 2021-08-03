from typing import Optional, Union

from fastapi import APIRouter, Request
from starlette.responses import StreamingResponse

from megawave import files
from megawave.audio import AudioFile, AudioFile_Serialized
from megawave.streaming_audio import get_file_chunk_generator


def get_audio_file_sort_value(
    audio: AudioFile_Serialized, sort: str
) -> Union[str, int]:
    if sort == "artist":
        return AudioFile.getSafeArtist(audio).lower()

    return ""


def get_media_type(audio: AudioFile_Serialized) -> str:
    ext = audio.get("fileType", "")

    if ext == "mp3":
        print("audio/mpeg")
        return "audio/mpeg"
    elif ext == "wav":
        print("audio/wav")
        return "audio/wav"

    return ""


router = APIRouter()


@router.get("/songs")
def songs(sort: Optional[str] = None):
    songs = files.audioLibrary.serialize()
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
    song = files.audioLibrary.getById(id)
    requested_byte_range = req.headers.get("Range") or None

    # todo: move this streaming logic
    if song is not None and requested_byte_range is not None:
        chunk_generator, content_range_header = get_file_chunk_generator(
            song.filePath, requested_byte_range
        )

        return StreamingResponse(
            chunk_generator,
            headers={
                "Accept-Ranges": "bytes",
                "Content-Range": content_range_header,
                "Content-Type": get_media_type(song.serialize()),
            },
            status_code=206,
        )

    return {"error": {"message": "not found"}}, 404
