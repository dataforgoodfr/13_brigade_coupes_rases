#!/bin/bash
# Lancer les dépendances (Base de données et serveurs) en local

echo "Démarrage automatique de Docker..."
open -a Docker
echo "Attente de Docker (10s)..."
sleep 10

echo "1. Démarrage de la base de données..."
docker compose up -d db pgadmin

echo "2. Démarrage de l'API (Backend)..."
osascript -e 'tell app "Terminal" to do script "cd \"'$PWD'/backend\" && source .venv/bin/activate && python3 -m poetry run python -m app.main --host=0.0.0.0 --port=8080 --reload --proxy-headers --forwarded-allow-ips=*"'

echo "3. Démarrage de l'Interface Web (Frontend)..."
osascript -e 'tell app "Terminal" to do script "cd \"'$PWD'/frontend\" && pnpm dev"'

echo "Tout est lancé ! Backend dispo sur localhost:8080, Frontend sur localhost:5173"
