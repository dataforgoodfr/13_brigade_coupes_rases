# Airtable Sync

Script d'export des utilisateurs et des signalements de la base PostgreSQL vers
Airtable.

> Ce sous-projet est **indépendant** de la pipeline principale (`pipeline/`) et du bootstrap (`bootstrap/`).
> Il utilise **`uv`** (pas Poetry) pour rester léger — il tourne 2 fois par jour via GitHub Actions.

## Structure

```
airtable/
  scripts/
    sync_to_airtable.py   # point d'entrée : lecture SQL → écriture Airtable
    schemas.py            # champs Airtable de chaque table (nom, type)
  sql/
    users.sql             # requête de la table utilisateurs
    clear_cuts.sql        # requête de la table signalements
  requirements.txt        # 3 dépendances (uv)
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
| `AIRTABLE_TOKEN` | Personal access token (`pat...`), scopes `data.records:read`, `data.records:write`, `schema.bases:read`, `schema.bases:write` | Airtable → Account → Developer Hub |
| `AIRTABLE_BASE_ID` | ID de la base Airtable (`app...`) | URL de la base Airtable |
| `AIRTABLE_TABLE_USER` | ID (`tbl...`) ou nom de la table utilisateurs | URL de la table Airtable |
| `AIRTABLE_TABLE_CLEAR_CUT_REPORTS` | ID (`tbl...`) ou nom de la table signalements | URL de la table Airtable |

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

## Fonctionnement

Pour chacune des deux tables, le script :

1. exécute la requête de `sql/` sur la base ;
2. crée la table Airtable si elle n'existe pas et ajoute les champs manquants
   d'après `schemas.py` ;
3. **vide la table puis réinsère** tous les enregistrements (truncate & load).
   Toute modification faite à la main dans Airtable est donc écrasée.

## Ajouter une colonne

1. Ajouter la colonne à la requête dans `sql/` ;
2. déclarer le champ (nom, type Airtable) dans `schemas.py` : il est créé dans
   Airtable au prochain lancement.

## GitHub Actions

Le workflow [`.github/workflows/airtable-sync.yml`](../../.github/workflows/airtable-sync.yml)
tourne à 06:00 et 10:00 UTC et peut être lancé à la main (« Run workflow »).
Il lit les secrets du dépôt `PROD_DATABASE_URL`, `AIRTABLE_TOKEN`,
`AIRTABLE_BASE_ID`, `AIRTABLE_TABLE_USER` et `AIRTABLE_TABLE_CLEAR_CUT_REPORTS`.
