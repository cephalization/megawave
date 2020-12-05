from megawave import app


@app.route("/")
def index():
    return {"hello": ["world"], "world": "hello", "items": [1, 2, 3, 4, 5, 6]}
