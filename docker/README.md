# Development database image

`postgres/Dockerfile` builds the PostgreSQL/PostGIS image used by the `db`
service of the root `docker-compose.yml`; `create-databases.sh` creates one
database per name listed in `DATABASES` (`local` for development, `test` for
the backend tests).

## Start the database

From the repository root:

```bash
docker compose up db pgadmin        # add -d to run in the background
```

PostgreSQL listens on `localhost:5432`, user and password `devuser`, container
`coupes-rases-database`. Data is kept in the `coupes-rases-data` volume;
`docker compose down -v` deletes it.

## Connect to the database

pgAdmin runs on [http://localhost:8888](http://localhost:8888)
(`devuser@devuser.com` / `devuser`); register the server with host `db`, port
`5432`, database `postgres`, user and password `devuser`.

With the [psql client](https://www.postgresql.org/download/):

```bash
docker exec -it coupes-rases-database psql -U devuser -d local
# or, without docker exec
PGPASSWORD=devuser psql -h localhost -U devuser -d local
```

Any other client works, for instance [DBeaver](https://dbeaver.io/).
