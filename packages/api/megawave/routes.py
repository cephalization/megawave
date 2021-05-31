from megawave import app
from flask import send_from_directory

from . import files


@app.route("/songs")
def songs():
    return {"data": {"songs": files.audioLibrary.serialize()}}


@app.route("/songs/<id>")
def song(id):
    song = files.audioLibrary.getById(id)
    if song is not None:
        return send_from_directory(song.fileDir, song.fileName)

    return {"error": {"message": "not found"}}, 404
