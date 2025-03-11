FROM python:3.11-buster as builder

RUN pip install poetry

ENV POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=1 \
    POETRY_VIRTUALENVS_CREATE=1 \
    POETRY_CACHE_DIR=/tmp/poetry_cache

WORKDIR /app

COPY pyproject.toml poetry.lock ./
RUN touch README.md

RUN --mount=type=cache,target=$POETRY_CACHE_DIR poetry install --without dev --no-root

FROM builder as development 

RUN groupadd --gid 1000 devuser \
    && useradd --uid 1000 --gid 1000 -m devuser \
    && apt-get update \
    && apt-get install -y sudo \
    && echo devuser ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/devuser \
    && chmod 0440 /etc/sudoers.d/devuser

USER devuser

FROM python:3.11-slim-buster as runtime

ENV VIRTUAL_ENV=/app/.venv \
    PATH="/app/.venv/bin:$PATH"

COPY --from=builder ${VIRTUAL_ENV} ${VIRTUAL_ENV}

COPY app ./app

ENTRYPOINT ["python", "-m", "app.main", "--host", "0.0.0.0", "--port", "8080", "--proxy-headers", "--forwarded-allow-ips=*"]