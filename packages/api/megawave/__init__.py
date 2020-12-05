from flask import Flask

app = Flask(__name__)

from megawave import routes  # noqa -- flask requires this, flake8 mad

__all__ = [
    "routes",
]
