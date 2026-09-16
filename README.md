# Brigade des Coupes Rases 🌳

Application de [Canopée](https://www.canopee.ong/) pour détecter, suivre et vérifier les coupes rases abusives en France : les alertes issues de l'imagerie satellite sont chargées dans une base PostGIS, puis des bénévoles les contrôlent sur le terrain via une carte interactive et un formulaire.

Projet [Data For Good](https://dataforgood.fr/), saison 13.

- [Backend](./backend/README.md) — API FastAPI
- [Frontend](./frontend/README.md) — application React
- [Data pipeline](./data_pipeline/README.md) — ingestion des alertes et des couches de référence
- [Analytics](./analytics/README.md) — notebooks d'exploration
- [Documentation](./doc/README.md)
- [Contribuer](./CONTRIBUTING.md) — branches, commits, vérifications avant une pull request

## Contexte

La déforestation et les coupes rases illégales représentent une menace majeure pour les écosystèmes et la biodiversité. Il existe cependant un manque de transparence et de contrôle sur ces pratiques, qui rend leur suivi et leur régulation difficiles.

Canopée, association engagée pour la protection des forêts, cherche à automatiser la détection des coupes rases abusives à partir d'un algorithme de surveillance satellite. Les alertes générées doivent être centralisées, analysées et validées ; ce processus était jusqu'ici manuel et fastidieux.

## Objectifs

- Automatiser le traitement des coupes rases détectées par l'algorithme existant (GlobEO).
- Stocker et organiser les informations sur chaque coupe rase détectée.
- Permettre aux bénévoles et aux administrateurs de consulter, compléter et valider ces informations.
- Identifier les coupes rases illégales et produire des statistiques exploitables.
- Optionnellement, répliquer l'identification des coupes rases pour réduire le délai de mise à jour.

## Architecture

1. **Data pipeline** (`data_pipeline/`) : récupère les alertes satellite (GlobEO / SUFOSAT), les regroupe en polygones, les enrichit avec les couches de référence (Natura 2000, BD Forêt, cadastre, pente) et les charge dans la base. Tourne en tâche planifiée dans un conteneur Docker.
2. **Base de données** : PostgreSQL avec PostGIS pour les coupes rases et leurs métadonnées spatiales.
3. **Backend** (`backend/`) : API REST FastAPI + SQLAlchemy, avec authentification et rôles (administrateur, bénévole).
4. **Frontend** (`frontend/`) : application React / Vite, carte Leaflet, formulaires de contrôle utilisables hors connexion (PWA).
5. **Stockage objet** : bucket S3 pour les données intermédiaires de la pipeline et les photos des formulaires.

Le tout est hébergé sur [Clever Cloud](https://www.clever-cloud.com/).

```
📁 13_brigade_coupes_rases
├── 📁 backend/        API et gestion de la base de données
├── 📁 frontend/       application web (carte, formulaires)
├── 📁 data_pipeline/  collecte et traitement des données
├── 📁 analytics/      notebooks d'analyse
├── 📁 doc/            documentation
├── 📁 docker/         images Docker de déploiement
└── 📁 keepass/        secrets partagés (chiffrés)
```

<details>
<summary>Diagramme des flux (Mermaid)</summary>

```mermaid
flowchart LR
    %% External Entities
    SOURCES[Public Data Sources<br>Monthly & One-Time] -->|Fetch Data| ETL
    Users[End Users] -->|Access<br>via Browser| FRONT

    %% Main Clever Cloud subgraph
    subgraph CC["CleverCloud"]

      %% Data Engineering Subgraph
      subgraph DE["Data Engineering"]
      ETL[Docker-based Ingestion Jobs]
      Cron[CleverCloud Cron Add-On]
      AutoScale[Autoscaling<br>CleverCloud]
      end

      %% Backend Subgraph
      subgraph BK["Backend"]
      BE[FastAPI Backend<br> - Docker]
      end

      %% Storage Subgraph
      subgraph ST["Storage"]
      S3[(S3 Object Storage)]
      DB[(PostgreSQL w/ PostGIS)]
      end

      %% Frontend Subgraph
      subgraph FE["Frontend"]
      FRONT[Frontend React/Vite<br>]
      end

      %% Observability Subgraph
      subgraph OBS["Observability"]
      Logs[CleverCloud Logs & Metrics]
      end

      %% Shared Environment Variables
      EnvVars[Built-in Env Variables]

    end

    %% Connections & Data Flows
    ETL -->|Raw/Intermediate Data| S3
    ETL -->|Transformed Data| DB
    Cron -->|Triggers| ETL
    AutoScale --> |Autoscales| ETL
    EnvVars -.-> ETL
    EnvVars -.-> BE
    EnvVars -.-> FRONT
    BE -->|Reads/Writes| DB
    BE --> |Reads/Writes Images| S3
    FRONT -->|API Calls| BE
    Logs -.-> ETL
    Logs -.-> BE
    Logs -.-> FRONT

    %% Styles for Readability
    style CC fill:#F0F9FF,stroke:#0369A1,stroke-width:2px,corner-radius:8px
    style DE fill:#ECFEFF,stroke:#05B4FE,stroke-width:1px,corner-radius:8px
    style BK fill:#FFF7ED,stroke:#F97316,stroke-width:1px,corner-radius:8px
    style FE fill:#FFFBEB,stroke:#F59E0B,stroke-width:1px,corner-radius:8px
    style OBS fill:#FAE8FF,stroke:#C026D3,stroke-width:1px,corner-radius:8px

    %% Custom Component Colors
    style DB fill:#CFFAFE,stroke:#0891B2,stroke-width:1px,color:#000000  %% Soft Teal for Storage
    style S3 fill:#CFFAFE,stroke:#0891B2,stroke-width:1px,color:#000000  %% Soft Teal for Storage

    style ETL fill:#FEE2E2,stroke:#DC2626,stroke-width:1px,color:#000000  %% Warm Coral for Docker
    style BE fill:#FEE2E2,stroke:#DC2626,stroke-width:1px,color:#000000  %% Warm Coral for Docker

    style Cron fill:#DBEAFE,stroke:#2563EB,stroke-width:1px,color:#000000  %% Cool Blue for CleverCloud
    style AutoScale fill:#DBEAFE,stroke:#2563EB,stroke-width:1px,color:#000000  %% Cool Blue for CleverCloud
    style Logs fill:#DBEAFE,stroke:#2563EB,stroke-width:1px,color:#000000  %% Cool Blue for CleverCloud

    style FRONT fill:#FEF3C7,stroke:#D97706,stroke-width:1px,color:#000000  %% Soft Amber for Frontend
```

</details>

## Démarrer en local

Prérequis :

- [Docker](https://docs.docker.com/get-docker/) et Docker Compose ;
- [Python 3.13](https://www.python.org/downloads/) et [Poetry](https://python-poetry.org/docs/#installation) (installation avec pipx recommandée, hors de tout environnement virtuel du projet) pour `backend/`, `data_pipeline/` et `analytics/`, chacun avec son propre `pyproject.toml` ;
- [Node.js 22](https://nodejs.org/en) (version dans `frontend/.nvmrc`) et [pnpm](https://pnpm.io/installation) pour `frontend/`.

Chaque README de sous-projet détaille sa propre installation ; ce qui suit est le chemin le plus court.

### Base de données

```bash
docker compose up db pgadmin
```

PostgreSQL écoute sur `localhost:5432`. pgAdmin est sur [http://localhost:8888](http://localhost:8888/) (`devuser@devuser.com` / `devuser`) ; pour y ajouter le serveur : hôte `db`, port `5432`, base `postgres`, utilisateur et mot de passe `devuser`.

### Backend

```bash
cd backend
poetry install
poetry run alembic upgrade head        # créer / mettre à jour les tables
poetry run python -m seed_dev          # jeu de données de développement
make devserver                         # http://localhost:8080/docs
```

### Frontend

```bash
cd frontend
pnpm install
pnpm dev                               # http://localhost:5173
pnpm build                             # vérification des types + build de production
pnpm test:unit && pnpm test:browser    # tests
```

### Data pipeline

```bash
cd data_pipeline
poetry install
# Charger un échantillon de données réalistes
poetry run python -m bootstrap.scripts.seed_database \
  --natura2000-concat-filepath bootstrap/data/natura2000/natura2000_concat.fgb \
  --enriched-clear-cuts-filepath bootstrap/data/sufosat/sufosat_clusters_enriched.fgb \
  --database-url postgresql://devuser:devuser@localhost:5432/local --sample 1000
# Puis synchroniser les signalements côté backend
curl -X POST "http://localhost:8080/api/v1/clear-cuts-reports/sync-reports"
```

## Secrets

Les secrets partagés sont dans la [base KeePass](./keepass/secrets.kdbx) du dépôt ([installer KeePass](https://keepass.info/index.html)). Le mot de passe s'obtient auprès des responsables de sous-équipes.

Cette base est la source de vérité : tout secret utilisé par le projet (comptes cloud, CI/CD, clés d'API, chaînes de connexion…) doit y être référencé.

## Déploiement et opérations

### Branches et déploiement

Les pull requests visent `develop`. La fusion de `develop` dans `main` déclenche, via GitHub Actions, la création d'un tag et d'une release puis le déploiement sur Clever Cloud du backend et du frontend, et la publication du Storybook sur GitHub Pages.

Les workflows peuvent aussi être lancés à la main depuis l'onglet Actions (bouton « Run workflow »).

**Backend CI** : tests du backend (pytest, mypy) puis déploiement.

![](doc/images/backend_ci.png)

**Frontend CI** : lint, tests unitaires et navigateur (Playwright) puis déploiement.

![](doc/images/frontend_ci.png)

> Si le déploiement échoue avec « The clever-cloud application is up-to-date », aucun nouveau commit n'a été créé depuis le dernier déploiement (c'est le cas sur la capture ci-dessus).

**Database Actions** : actions manuelles sur la base (upgrade, setup, reset).

![](doc/images/database_ci.png)

### Bucket S3

```bash
# Lister les fichiers
aws s3 ls s3://brigade-coupe-rase-s3 --recursive --profile d4g-s13-brigade-coupes-rases

# Supprimer les fichiers de développement
aws s3 rm s3://brigade-coupe-rase-s3/development/reports/ --recursive --profile d4g-s13-brigade-coupes-rases

# Mettre à jour la configuration CORS (fichier dans frontend/s3cors.json)
aws s3api put-bucket-cors --bucket brigade-coupe-rase-s3 --cors-configuration file://frontend/s3cors.json --profile d4g-s13-brigade-coupes-rases
```
