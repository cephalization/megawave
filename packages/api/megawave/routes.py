from typing import Union
from megawave import app, files
from flask import send_from_directory, request
from megawave.audio import AudioFile, AudioFile_Serialized


def get_audio_file_sort_value(
    audio: AudioFile_Serialized, sort: str
) -> Union[str, int]:
    if sort == "artist":
        return AudioFile.getSafeArtist(audio).lower()

    return ""


@app.route("/songs")
def songs():
    sort: Union[str, None] = request.args.get("sort", None)
    reverse = True if sort is not None and sort.startswith("-") else False
    songs = files.audioLibrary.serialize()
    if sort is not None:
        songs.sort(
            key=lambda k: get_audio_file_sort_value(k, sort.replace("-", "")) or "",
            reverse=reverse,
        )

    return {"data": {"songs": songs}}


@app.route("/songs/<id>")
def song(id):
    song = files.audioLibrary.getById(id)
    if song is not None:
        return send_from_directory(song.fileDir, song.fileName)

    return {"error": {"message": "not found"}}, 404
