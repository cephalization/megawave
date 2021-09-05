FROM python:3.7.11-alpine3.14 as base

ENV PYTHONFAULTHANDLER=1 \
  PYTHONHASHSEED=random \
  PYTHONUNBUFFERED=1

WORKDIR /app

FROM base as builder

ENV PIP_DEFAULT_TIMEOUT=100 \
  PIP_DISABLE_PIP_VERSION_CHECK=1 \
  PIP_NO_CACHE_DIR=1 \
  POETRY_VERSION=1.1.7

RUN apk add --no-cache gcc musl-dev python3-dev libffi-dev openssl-dev cargo
RUN pip install "poetry==$POETRY_VERSION"
RUN python -m venv /venv

COPY pyproject.toml poetry.lock ./
RUN poetry export -f requirements.txt | /venv/bin/pip install -r /dev/stdin

COPY . .
RUN poetry build && /venv/bin/pip install dist/*.whl

FROM base as final

RUN apk add --no-cache libffi libpq
COPY --from=builder /venv /venv
COPY --from=builder /app/main.py .
COPY --from=builder /app/config.ini .
COPY docker-entrypoint.sh ./
CMD ["./docker-entrypoint.sh"] 

# https://stackoverflow.com/questions/53835198/integrating-python-poetry-with-docker
# https://mherman.org/blog/dockerizing-a-react-app/