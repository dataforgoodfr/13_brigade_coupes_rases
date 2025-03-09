FROM python:3.13 as base

WORKDIR /code/backend

RUN curl -sSL https://install.python-poetry.org | python3 -

# Add Poetry to PATH
ENV PATH="/root/.local/bin:${PATH}"

COPY . /code/

# Activate virtual env for subsequent poetry calls
RUN poetry config virtualenvs.in-project true

FROM base as development

RUN poetry install --with backend,dev --no-interaction

FROM base as production

# Install dependencies (runtime only)
RUN poetry install --with backend

CMD ["poetry", "run","uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--proxy-headers", "--forwarded-allow-ips=*"]
