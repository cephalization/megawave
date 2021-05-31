from megawave import app, files
from flask import send_from_directory


@app.route("/songs")
def songs():
    return {"data": {"songs": files.audioLibrary.serialize()}}


@app.route("/songs/<id>")
def song(id):
    song = files.audioLibrary.getById(id)
    if song is not None:
        return send_from_directory(song.fileDir, song.fileName)

    return {"error": {"message": "not found"}}, 404
