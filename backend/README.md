# Brigade Coupes Rases backend

## Installation

At the project root, do:

```bash
cp .env.example .env
```

Then customize the content of `.env` if needed.

## Build and launch the containers
```bash
docker compose up -d --build
```

## Connect to the backend container

```bash
docker compose exec backend bash
```
The next commands will be run from the container (invoking make or poetry for example)

## (optional) Launch the development server

```bash
make devserver
```

## Run the tests

We are using sqlite for tests (so that we can run tests in the CI). We are using `geoalchemy2` as well, this means we need to add a geo lib compatible with sqlite just for the unit tests (`spatialite` ). To install it in local, run:
```
 sudo apt-get install -y libsqlite3-mod-spatialitemeans
```
Then run all the tests with:
```bash
poetry run python -m pytest
```
## Add a new backend package

```bash
poetry add package-name --group backend
```

## Seed the database

```bash
docker compose exec backend make seed-db
```
or directly from the container:

```bash
make seed-db
```

## Use the API

Once the server is running, you can access the API in `http://localhost:8000`.
You can see the OpenAPI docs in `http://localhost:8000/docs`. These are automatically generated from the code.