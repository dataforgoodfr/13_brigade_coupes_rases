# Coupes Rases Development Infrastructure

## Setup

### Install docker
https://docs.docker.com/engine/install/

### Install the postgres client
https://www.postgresql.org/download/

### Build and start the infrastructure
```bash
docker compose up

# You can optionally run this command as a daemon
docker compose up -d
```

### Connect to the database
```bash
# If you want to use the docker exec command
docker exec -it coupes-rases-database psql -U devuser -d local

# If you don't want to use the docker exec command
PGPASSWORD=devuser psql -h localhost -U devuser -d local
```

### GUI client

https://dbeaver.io/
