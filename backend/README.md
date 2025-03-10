# Brigade Coupes Rases backend

## DevContainer 
Install VsCode extension ms-vscode-remote.remote-containers. 
Open backend in devcontainer. 

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

local, run:
Once the container is running

```bash
docker compose exec backend bash
poetry install --with dev
make test
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


## Clever cloud 
Application URL : [https://app-5292f305-0563-4fd7-b50a-56f6caf806db.cleverapps.io/](https://app-5292f305-0563-4fd7-b50a-56f6caf806db.cleverapps.io/)  
Swagger UI : [https://app-5292f305-0563-4fd7-b50a-56f6caf806db.cleverapps.io/docs](https://app-5292f305-0563-4fd7-b50a-56f6caf806db.cleverapps.io/docs)  
PostgreSQL Database : postgresql://u8jhjikkyhen5eq6xym9:<password in keepass>@bfy8coqxxtfuonsdwsb1-postgresql.services.clever-cloud.com:50013/bfy8coqxxtfuonsdwsb1  