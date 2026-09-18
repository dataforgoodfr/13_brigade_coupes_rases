# Data pipeline

Trois sous-projets indépendants cohabitent dans ce dossier :

| Dossier | Rôle | Exécution |
|---|---|---|
| [`pipeline/`](./pipeline/README.md) | Mise à jour mensuelle : récupère les alertes RADD depuis Earth Engine, détecte les nouveaux clusters depuis la dernière date en base, les enrichit et publie un fichier « gold » dans S3. | Image Docker (`Dockerfile`, conda + GDAL) |
| [`bootstrap/`](./bootstrap/README.md) | Chargement unique des détections historiques 2018-2025. **Efface la base.** | Poetry, en local |
| [`airtable/`](./airtable/README.md) | Export des utilisateurs et des signalements de PostgreSQL vers Airtable. | `uv`, deux fois par jour via GitHub Actions |

`pipeline/` et `bootstrap/` partagent ce `pyproject.toml` ; `airtable/` a son
propre `requirements.txt`.

## Arborescence

```
data_pipeline/
├── pipeline/          # pipeline mensuelle (scripts/, data/ pour les fichiers locaux)
├── bootstrap/         # chargement historique (scripts/, data/ pour les fichiers téléchargés)
├── airtable/          # export Airtable (scripts/, sql/)
├── tests/             # pytest, fonctions pures de pipeline/
├── .env.example       # variables pour pipeline/ et bootstrap/
├── Dockerfile         # image d'exécution de pipeline/ (contexte de build : racine du dépôt)
├── pyproject.toml     # configuration Poetry, pytest, couverture et mypy
└── README.md
```

## Installation

### 1. Variables d'environnement

```bash
cp .env.example .env
```

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
S3_ENDPOINT=https://s3.fr-par.scw.cloud
S3_BUCKET_NAME=brigade-coupe-rase-s3
S3_REGION=fr-par
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
EARTH_ENGINE_PROJECT=...
GOOGLE_SERVICE_ACCOUNT_KEY='{"type": "service_account", ...}'
```

Les identifiants Scaleway Object Storage et la clé du compte de service Google
sont dans la base KeePass du projet. Ne jamais versionner `.env` (il est ignoré
par git). Exécuter la pipeline ou télécharger les fichiers du bootstrap les
demande ; pas les tests.

Pour un usage interactif, la clé de compte de service peut être remplacée par
une connexion Google une fois pour toutes : `poetry run earthengine authenticate`
(la commande `earthengine` vient du paquet `earthengine-api`, installé dans
l'environnement Poetry). `EARTH_ENGINE_PROJECT` reste nécessaire.

### 2. Installer les dépendances

Python 3.14 et [Poetry](https://python-poetry.org/docs/#installation) :

```bash
cd data_pipeline
poetry install
```

GDAL (`osgeo`) ne s'installe pas avec pip, et `pipeline/scripts` comme
`bootstrap/scripts` l'importent : les exécuter demande l'image Docker, qui
embarque GDAL depuis conda-forge, ou un environnement conda avec `gdal`. Les
tests et la vérification des types fonctionnent dans l'environnement Poetry.

### 3. Docker (pour exécuter la pipeline)

Le Dockerfile attend la **racine du dépôt** comme contexte de build, comme sur
Clever Cloud :

```bash
docker build -f data_pipeline/Dockerfile -t data-pipeline:latest .
docker run --rm --env-file data_pipeline/.env -e PYTHONUNBUFFERED=1 data-pipeline:latest
```

Les étapes et l'organisation de S3 sont dans [pipeline/README.md](./pipeline/README.md).

## Vérifications

```bash
poetry run pytest             # tests/, sans base ni S3, couverture de pipeline/
poetry run mypy               # strict, périmètre dans pyproject.toml ([tool.mypy])
pre-commit run --all-files    # depuis la racine du dépôt (ruff)
```

Les tests visent les fonctions pures de la pipeline (regroupement, superposition,
rapprochement des nouveaux clusters avec la référence) ; `tests/conftest.py`
remplace `osgeo` par un module vide. Les mêmes vérifications tournent en CI
(`.github/workflows/pipeline-ci.yml`).
