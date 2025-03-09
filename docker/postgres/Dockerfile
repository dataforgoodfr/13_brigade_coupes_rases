
FROM postgis/postgis:15-3.5

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-contrib \
    && rm -rf /var/lib/apt/lists/*

COPY ./docker/postgres/create-databases.sh /docker-entrypoint-initdb.d/
