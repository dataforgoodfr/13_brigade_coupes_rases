# Coupes Rases Backend

## Development Infrastructure setup

### Install docker
https://docs.docker.com/engine/install/

### Install the postgres client
https://www.postgresql.org/download/

### Build and start the infrastructure
```bash
cd backend
docker compose up

# You can optionally run this command as a daemon
docker compose up -d
```

### Connect to the database
```bash
docker exec -it coupes-rases-database psql -U devuser -d local
POSTGRES_PASSWORD=devuser psql -h localhost -U devuser -d local
```
