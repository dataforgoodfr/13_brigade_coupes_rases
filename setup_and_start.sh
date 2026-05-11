#!/bin/bash
set -e

echo "Démarrage automatique de Docker..."
open -a Docker
echo "Attente de Docker (10s)..."
sleep 10

echo "1. Checking and starting Docker containers (DB & pgadmin)..."
docker compose up -d db pgadmin
echo "Waiting for DB to be healthy..."
sleep 10

echo "2. Backend Setup..."
cd backend

if ! python3 -m poetry --version &> /dev/null; then
    echo "Poetry is not installed. Installing it via pip..."
    python3 -m pip install --user poetry
fi

python3 -m poetry install
echo "Running database migrations..."
python3 -m poetry run alembic upgrade head
echo "Seeding database..."
python3 -m poetry run python -m seed_dev
cd ..

echo "3. Frontend Setup..."
cd frontend
if ! command -v pnpm &> /dev/null; then
    echo "pnpm is not installed. Using npm to install pnpm globally..."
    npm install -g pnpm
fi
pnpm i
cd ..

echo "Setup completed successfully!"
