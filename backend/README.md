# Brigade Coupes Rases backend

## Data 

All coordinates returned from the Api follow this format : latitude/longitude


## Development

### DevContainer

You should develop inside a devcontainer directly, with this feature all developers will have the same environment of development.
To do this :

- Install VsCode extension ms-vscode-remote.remote-containers.
- Open backend in devcontainer.

### Installation

### Build and launch the containers

```bash
docker compose up -d --build
```

### (optional) Launch the development server

```bash
make devserver
```

### Run the tests

```bash
poetry install --with dev
make test
```

### Add a new backend package

```bash
poetry add package-name --group backend
```

### Seed the database

```bash
make seed-db
```

### Use the API

Once the server is running, you can access the API in `http://localhost:8000`.
You can see the OpenAPI docs in `http://localhost:8000/docs`. These are automatically generated from the code.

### Clever cloud

Application URL : [https://app-5292f305-0563-4fd7-b50a-56f6caf806db.cleverapps.io/](https://app-5292f305-0563-4fd7-b50a-56f6caf806db.cleverapps.io/)
Swagger UI : [https://app-5292f305-0563-4fd7-b50a-56f6caf806db.cleverapps.io/docs](https://app-5292f305-0563-4fd7-b50a-56f6caf806db.cleverapps.io/docs)
PostgreSQL Database : postgresql://u8jhjikkyhen5eq6xym9:<password in keepass>@bfy8coqxxtfuonsdwsb1-postgresql.services.clever-cloud.com:50013/bfy8coqxxtfuonsdwsb1

### Environment variables

DATABASE_URL = Connection string to connect to postgres database.
ENVIRONMENT = development
ALLOWED_ORIGINS = domain names used to allow CORS
