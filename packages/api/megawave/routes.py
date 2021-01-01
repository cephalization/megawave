from megawave import app
from flask import send_from_directory

from . import files


@app.route("/")
def index():
    return {
        "hello": ["world"],
        "world": "hello",
        "items": [1, 2, 3, 4, 5, 6],
        "audio": files.audioLibrary.serialize(),
    }


@app.route("/song/<id>")
def song(id):
    song = files.audioLibrary.getById(id)
    if song is not None:
        return send_from_directory(song.fileDir, song.fileName)

    return {"error": {"message": "not found"}}, 404
