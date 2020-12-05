from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

from megawave import routes  # noqa -- flask requires this, flake8 mad

__all__ = [
    "routes",
]
