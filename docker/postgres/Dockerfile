
FROM postgres:13

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-contrib \
        postgresql-13-postgis \
    && rm -rf /var/lib/apt/lists/*

COPY ./docker/postgres/create-databases.sh /docker-entrypoint-initdb.d/
