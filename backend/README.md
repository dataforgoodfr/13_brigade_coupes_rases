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

## Run the server

It might be easier to run db + server with the docker-compose file in the root of the project.

```bash
poetry run docker-start
```

If you want to run the server manually, you need to have a postgres database running. Then run the following command to start the server:

```bash
poetry run backend-start
```

Either way, once the server is running, you can access the API in `http://localhost:8000`. You can see the OpenAPI docs in `http://localhost:8000/docs`. These are automatically generated from the code.

## Run the tests

```bash
python -m pytest
```
