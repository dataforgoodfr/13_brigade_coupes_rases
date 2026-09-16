#!/bin/bash
# Lancer toute la pile (base, API, frontend) via Docker, base migrée et peuplée.
# Première fois ou après un changement de schéma : docker compose down -v && ./start_docker.sh

set -e

if ! docker info > /dev/null 2>&1; then
    echo "Docker ne répond pas : démarrer Docker Desktop (ou le démon docker) puis relancer." >&2
    exit 1
fi

echo "1. Construction des images et démarrage de la base de données..."
docker compose build
docker compose up -d db pgadmin

echo "2. Attente de PostgreSQL..."
until docker compose exec -T db pg_isready -U devuser -d local > /dev/null 2>&1; do
    sleep 1
done

echo "3. Migrations et jeu de données de développement..."
docker compose run --rm backend poetry run alembic upgrade head
docker compose run --rm backend poetry run python -m seed_dev

echo "4. Démarrage de tous les services (API et frontend)..."
docker compose up -d

echo "Tout est lancé."
echo "  API      : http://localhost:8080/docs"
echo "  Frontend : http://localhost:8081"
echo "  pgAdmin  : http://localhost:8888"
echo "Logs : docker compose logs -f — arrêt : docker compose down"
