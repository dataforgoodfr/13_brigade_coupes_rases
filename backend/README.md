# Brigade Coupes Rases backend

## Installation

Get poetry `https://python-poetry.org/docs/#installation`

To install backend deps only:

```bash
poetry install --with backend
```

To install all dependencies:

```bash
poetry install
```

## Adding a new backend package

```bash
poetry add package-name --group backend
```

## Launch your containers
```bash
docker compose up -d --build
```

## Launch the server

```bash
cd ./backend
docker compose exec backend bash
poetry install --with backend
make devserver
```

Either way, once the server is running, you can access the API in `http://localhost:8000`. You can see the OpenAPI docs in `http://localhost:8000/docs`. These are automatically generated from the code.

## Run the tests

```bash
cd backend
poetry run python -m pytest
```
