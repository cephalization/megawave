# MEGAWAVE Backend

## Requirements

- Git
- [UV](https://github.com/astral-sh/uv) - An extremely fast Python package installer and resolver
- Python 3.12+ (uv will install this)

## Setup

1. Install UV:

    ```bash
    # On macOS/Linux
    curl -LsSf https://astral.sh/uv/install.sh | sh

    # On Windows
    powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
    ```

2. Create virtual environment and install dependencies:

    ```bash
    uv sync --all-extras
    ```

3. Start the API server:

    ```bash
    ./start.sh  # Starts server on http://localhost:5001
    ```

Note: If the server complains of an in-use port and you are running Mac OS Monterey, follow [these instructions](https://developer.apple.com/forums/thread/682332).

## Development Tools

The project uses modern Python development tools, all configured in `pyproject.toml`:

- [Ruff](https://github.com/astral-sh/ruff)
  - Lightning-fast Python linter and formatter
  - Replaces isort, black, and flake8 with a single tool

- [mypy](https://mypy.readthedocs.io/)
  - Static type checking
  - Run with `./typecheck.sh`
  - [Type hints cheat sheet](https://mypy.readthedocs.io/en/stable/cheat_sheet_py3.html)

## Key Libraries

- [FastAPI](https://fastapi.tiangolo.com/)
  - Modern, fast web framework for building APIs
  - Automatic OpenAPI documentation
  - Type checking and validation

- [mutagen](https://mutagen.readthedocs.io/)
  - Parse music files and their metadata
  - Supports multiple audio formats
