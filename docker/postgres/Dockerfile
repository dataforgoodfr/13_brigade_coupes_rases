
FROM postgis/postgis:15-3.5

RUN echo "Acquire::Check-Valid-Until \"false\";\nAcquire::Check-Date \"false\";" | tee /etc/apt/apt.conf.d/10no--check-valid-until \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-contrib \
    && rm -rf /var/lib/apt/lists/*

COPY ./docker/postgres/create-databases.sh /docker-entrypoint-initdb.d/
RUN chmod 777 /docker-entrypoint-initdb.d/create-databases.sh
