# ~~ MEGAWAVE backend ~~

## Requirements

- python 3.7

- pipenv

- git

## Setup

- run `pipenv install` to install python deps

## Environment

[Built with this guide](https://sourcery.ai/blog/python-best-practices/)

- mypy

  - allow devs to add compile-time type checking to python code

- pytest

  - test python files, check test coverage

- isort

  - sort/organization imports automatically

- black

  - automatically format code

- flake8

  - enforce code formatting

## Libraries (for now)

- pyscopg2

  - postgresql adapter

## Troubleshooting

- I need to commit but pre-commit hooks are not working

  - Add the `--no-verify` flag to your git commit command to bypass pre-commit checks temporarily
