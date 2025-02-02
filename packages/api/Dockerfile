FROM python:3.12-slim-bookworm AS builder

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set environment variables
ENV PYTHONFAULTHANDLER=1 \
  PYTHONHASHSEED=random \
  PYTHONUNBUFFERED=1 \
  UV_SYSTEM_PYTHON=1 \
  UV_COMPILE_BYTECODE=1

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
  build-essential \
  curl \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies first (for better caching)
COPY pyproject.toml ./
RUN --mount=type=cache,target=/root/.cache/uv \
  uv pip install --system -r pyproject.toml

# Copy the project and install it
COPY . .
RUN --mount=type=cache,target=/root/.cache/uv \
  uv pip install --system -e .

FROM python:3.12-slim-bookworm AS final

# Install uv in the final stage
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy Python packages and application files
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /app/megawave ./megawave
COPY --from=builder /app/main.py .
COPY docker-entrypoint.sh ./
COPY start.sh ./
ARG MUSIC_LIBRARY_PATH
ENV MUSIC_LIBRARY_PATH=${MUSIC_LIBRARY_PATH}

CMD ["./docker-entrypoint.sh"]

# https://stackoverflow.com/questions/53835198/integrating-python-poetry-with-docker
# https://mherman.org/blog/dockerizing-a-react-app/