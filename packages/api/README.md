# ~~ MEGAWAVE backend ~~

## Requirements

- python 3.7.7

- [poetry](https://python-poetry.org/docs/#installation)

  - python package and environment manager

- git

## Setup

- run `poetry install` to install all python project deps

- run `start.sh` to start api server on http://localhost:5001

  - See [the docs](https://python-poetry.org/docs/basic-usage/#using-poetry-run) for more details

  - If the server complains of an in use port and you are running Mac OS Monterey, follow [these instructions](https://developer.apple.com/forums/thread/682332)

## Environment

[Built with this guide](https://sourcery.ai/blog/python-best-practices/)

- mypy

  - allow devs to add compile-time type checking to python code

  - https://mypy.readthedocs.io/en/stable/cheat_sheet_py3.html

- pytest

  - test python files, check test coverage

- isort

  - sort/organization imports automatically

- black

  - automatically format code

- flake8

  - enforce code formatting

## Libraries (for now)

- mutagen

  - parse music files and their metadata

- fastAPI

  - super fast and simple API library
