from typing import Optional, Union
from fastapi import APIRouter

from megawave import files
from megawave.audio import AudioFile, AudioFile_Serialized
from starlette.responses import FileResponse, StreamingResponse


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
    if sort != None:
        assert isinstance(sort, str)
        reverse = sort.startswith("-")
        sortKey = sort.replace("-", "")
        songs.sort(
            key=lambda k: get_audio_file_sort_value(k, sortKey) or "",
            reverse=reverse,
        )

    return {"data": {"songs": songs}}


@router.get("/songs/{id}")
def song(id: str):
    song = files.audioLibrary.getById(id)
    if song is not None:

        def iterfile():
            with open(song.filePath, mode="rb") as file_like:
                yield from file_like

        return StreamingResponse(
            iterfile(),
            media_type=get_media_type(song.serialize()),
        )

    return {"error": {"message": "not found"}}, 404
