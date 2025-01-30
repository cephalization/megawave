# MEGAWAVE Backend

## Requirements

- Python 3.12+
- [UV](https://github.com/astral-sh/uv) - An extremely fast Python package installer and resolver
- Git

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
    uv venv
    source .venv/bin/activate  # On Unix/macOS
    # or
    .venv\Scripts\activate     # On Windows

    uv pip install -e ".[dev]"  # Install with dev dependencies
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

- [pytest](https://docs.pytest.org/)
  - Testing framework with coverage reporting
  - Run with `uv run pytest`

## Key Libraries

- [FastAPI](https://fastapi.tiangolo.com/)
  - Modern, fast web framework for building APIs
  - Automatic OpenAPI documentation
  - Type checking and validation

- [mutagen](https://mutagen.readthedocs.io/)
  - Parse music files and their metadata
  - Supports multiple audio formats
