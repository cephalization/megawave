import os
from typing import Optional, Union

from fastapi import APIRouter, Request
from starlette.responses import StreamingResponse

from megawave import files
from megawave.audio import AudioFile, AudioFile_Serialized

BYTES_PER_RESPONSE = 325160

# https://github.com/tiangolo/fastapi/issues/1240
# todo: move this


def chunk_generator_from_stream(stream, chunk_size, start, size):
    bytes_read = 0

    stream.seek(start)

    while bytes_read < size:
        bytes_to_read = min(chunk_size, size - bytes_read)
        yield stream.read(bytes_to_read)
        bytes_read = bytes_read + bytes_to_read

    stream.close()


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

    # todo: move this streaming logic
    if song is not None:
        asked = req.headers.get("Range")

        # todo: optimize this, songs take too long to start streaming
        stream = open(song.filePath, mode="rb")
        total_size = os.path.getsize(song.filePath)

        start_byte_requested = int(asked.split("=")[-1][:-1])
        end_byte_planned = (
            min(start_byte_requested + BYTES_PER_RESPONSE, total_size) - 1
        )

        chunk_generator = chunk_generator_from_stream(
            stream,
            chunk_size=50000,
            start=start_byte_requested,
            size=BYTES_PER_RESPONSE,
        )

        return StreamingResponse(
            chunk_generator,
            headers={
                "Accept-Ranges": "bytes",
                "Content-Range": (
                    f"bytes {start_byte_requested}-" f"{end_byte_planned}/{total_size}"
                ),
                "Content-Type": get_media_type(song.serialize()),
            },
            status_code=206,
        )

    return {"error": {"message": "not found"}}, 404
