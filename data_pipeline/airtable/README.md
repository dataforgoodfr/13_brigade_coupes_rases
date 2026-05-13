# Airtable Sync

Script de synchronisation des données de la base PostgreSQL vers Airtable.

> Ce sous-projet est **indépendant** de la pipeline principale (`pipeline/`) et du bootstrap (`bootstrap/`).
> Il utilise **`uv`** (pas Poetry) pour rester léger — il tourne 2 fois par jour via GitHub Actions.

## Structure

```
airtable/
  scripts/
    __init__.py
    sync_to_airtable.py   # point d'entrée : fetch DB → push Airtable
  requirements.txt        # 3 dépendances uniquement (uv)
  .env.example            # variables d'environnement requises
  README.md
```

## Dépendances

| Package | Rôle |
|---|---|
| `pyairtable` | Client officiel Airtable API v2 |
| `psycopg2-binary` | Connexion PostgreSQL |
| `python-dotenv` | Chargement du `.env` en local |

## Variables d'environnement

Copie `.env.example` en `.env` et remplis les valeurs :

```bash
cp .env.example .env
```

| Variable | Description | Où la trouver |
|---|---|---|
| `DATABASE_URL` | Connection string PostgreSQL | Clever Cloud / local Docker |
| `AIRTABLE_TOKEN` | Personal access token | Airtable → Account → Developer Hub |
| `AIRTABLE_BASE_ID` | ID de la base Airtable (`app...`) | URL de la base Airtable |
| `AIRTABLE_TABLE_ID` | ID ou nom de la table (`tbl...`) | URL de la table Airtable |

## Lancer en local

### Prérequis : installer `uv`

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Lancer le script

```bash
cd data_pipeline/airtable

uv run --no-project --with-requirements requirements.txt scripts/sync_to_airtable.py
```

> `--no-project` est obligatoire : sans lui, `uv` remonte dans `data_pipeline/` et trouve le `pyproject.toml` de la pipeline, ce qui crée un conflit de venv.

## Implémenter l'intégration

Le fichier `scripts/sync_to_airtable.py` contient deux fonctions à compléter :

### 1. `fetch_from_db() -> list[dict]`

Requête SQL sur la BDD pour récupérer les données à synchroniser.
Connexion via `psycopg2` directement (pas besoin de SQLAlchemy ici) :

```python
import psycopg2
import psycopg2.extras

def fetch_from_db() -> list[dict]:
    conn = psycopg2.connect(DATABASE_URL)
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("SELECT ... FROM clear_cuts_reports WHERE ...")
        return [dict(row) for row in cur.fetchall()]
```

### 2. `sync_to_airtable(records: list[dict]) -> None`

Push vers Airtable via `pyairtable`. La lib gère la pagination et le rate-limiting automatiquement :

```python
from pyairtable import Api

def sync_to_airtable(records: list[dict]) -> None:
    api = Api(AIRTABLE_TOKEN)
    table = api.table(AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID)

    # Stratégie à choisir : upsert (recommandé) ou recréation complète
    table.batch_upsert(
        records,
        key_fields=["id"],   # champ qui sert de clé de déduplication
        replace=True,
    )
```

> **Stratégie de sync :** `batch_upsert` avec une clé (`id` du rapport) est recommandé pour éviter les doublons si le job retourne sur un enregistrement déjà présent.

## Ajouter d'autres colonnes Airtable

Les champs disponibles dans la BDD sont définis dans `pipeline/scripts/db_export.py`.
Les principaux candidats pour Airtable :

| Champ BDD | Type | Description |
|---|---|---|
| `id` | UUID | Identifiant unique du rapport |
| `status` | string | Statut du workflow (`to_validate`, `validated`...) |
| `area_hectare` | float | Surface en hectares |
| `observation_start_date` | date | Début de la période d'observation |
| `observation_end_date` | date | Fin de la période d'observation |
| `ecological_zoning_area_hectare` | float | Surface en zone Natura 2000 |

## GitHub Actions (à venir)

Le workflow sera dans `.github/workflows/airtable-sync.yml`.
Il tournera 2x/jour et utilisera les secrets GitHub :
- `DATABASE_URL`
- `AIRTABLE_TOKEN`
- `AIRTABLE_BASE_ID`
- `AIRTABLE_TABLE_ID`
