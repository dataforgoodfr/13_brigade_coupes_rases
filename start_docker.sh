#!/bin/bash
# Lancer le projet ENTIÈREMENT via Docker (Solution la plus fiable sur Mac)

set -e

echo "Démarrage automatique de Docker..."
open -a Docker
echo "Attente du démon Docker..."
until docker info >/dev/null 2>&1; do sleep 1; done

echo "1. Construction des images et démarrage de la base de données..."
docker compose build
# --wait bloque jusqu'à ce que le healthcheck Postgres soit OK (plus de sleep en dur)
docker compose up -d --wait db
docker compose up -d pgadmin

echo "2. Initialisation de la base de données (Migrations et seeding)..."
docker compose run --rm backend poetry run alembic upgrade head
docker compose run --rm backend poetry run python -m seed_dev

echo "3. Démarrage de tous les services (API & Frontend)..."
docker compose up -d

echo "Tout est prêt et lancé ! 🎉"
echo "👉 Backend API : http://localhost:8080/docs"
echo "👉 Frontend Web : http://localhost:8081"
echo "👉 Base de Données (PgAdmin) : http://localhost:8888"
echo "Pour voir les logs : docker compose logs -f"
echo "Pour tout arrêter : docker compose down"
