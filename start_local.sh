#!/bin/bash
# Lancer les dépendances (Base de données et serveurs) en local

echo "Démarrage automatique de Docker..."
open -a Docker
echo "Attente du démon Docker..."
until docker info >/dev/null 2>&1; do sleep 1; done

echo "1. Démarrage de la base de données (attente du healthcheck)..."
docker compose up -d --wait db
docker compose up -d pgadmin

echo "1b. Migrations + seed des données de dev (via le conteneur backend)..."
docker compose run --rm backend poetry run alembic upgrade head
docker compose run --rm backend poetry run python -m seed_dev

echo "2. Démarrage de l'API (Backend)..."
osascript -e 'tell app "Terminal" to do script "cd \"'$PWD'/backend\" && source .venv/bin/activate && python3 -m poetry run python -m app.main --host=0.0.0.0 --port=8080 --reload --proxy-headers --forwarded-allow-ips=*"'

echo "3. Démarrage de l'Interface Web (Frontend)..."
osascript -e 'tell app "Terminal" to do script "cd \"'$PWD'/frontend\" && pnpm dev"'

echo "Tout est lancé ! Backend dispo sur localhost:8080, Frontend sur localhost:5173"
