FROM python:3.11 as builder
ARG SRC_DIR="."
RUN pip install poetry

ENV POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=1 \
    POETRY_VIRTUALENVS_CREATE=1 \
    POETRY_CACHE_DIR=/tmp/poetry_cache

WORKDIR /app

COPY "${SRC_DIR}/pyproject.toml" "${SRC_DIR}/poetry.lock" ./
RUN touch README.md

RUN  poetry install --without dev --no-root

FROM builder as development 

RUN  useradd -ms /bin/bash devuser \
        && chown -R devuser ./ \
        && chown -R devuser /tmp/poetry_cache 

USER devuser

RUN  poetry install

FROM python:3.11-slim-buster as runtime

ARG SRC_DIR="."
ENV VIRTUAL_ENV=/app/.venv \
    PATH="/app/.venv/bin:$PATH"


COPY "${SRC_DIR}/app" ./app
COPY --from=builder ${VIRTUAL_ENV} ${VIRTUAL_ENV}

ENTRYPOINT ["python", "-m", "app.main", "--host", "0.0.0.0", "--port", "8080", "--proxy-headers", "--forwarded-allow-ips=*"]
