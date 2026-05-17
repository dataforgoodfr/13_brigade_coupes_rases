"""
Sync clear-cut reports from PostgreSQL to Airtable.
Stratégie : truncate & load (suppression totale puis réinsertion).

Usage:
    cd data_pipeline/airtable
    uv run --no-project --with-requirements requirements.txt scripts/sync_to_airtable.py

Variables d'environnement requises (voir .env.example) :
    DATABASE_URL
    AIRTABLE_TOKEN              Personal access token (pat...) — scopes requis :
                                  data.records:read, data.records:write
                                  schema.bases:read, schema.bases:write
    AIRTABLE_BASE_ID            ID de la base (app...)
    AIRTABLE_TABLE_USER         Nom ou ID de la table users
    AIRTABLE_TABLE_CLEAR_CUT_REPORTS  Nom ou ID de la table clear cut reports
"""

import os
import time
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from uuid import UUID

import psycopg2
import psycopg2.extras
import requests
from dotenv import load_dotenv
from pyairtable import Api
from schemas import CLEAR_CUT_REPORTS_FIELDS, USERS_FIELDS

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]
AIRTABLE_TOKEN = os.environ["AIRTABLE_TOKEN"]
AIRTABLE_BASE_ID = os.environ["AIRTABLE_BASE_ID"]
AIRTABLE_TABLE_USER = os.environ["AIRTABLE_TABLE_USER"]
AIRTABLE_TABLE_CLEAR_CUT_REPORTS = os.environ["AIRTABLE_TABLE_CLEAR_CUT_REPORTS"]

AIRTABLE_API_URL = "https://api.airtable.com/v0"
SQL_DIR = Path(__file__).parent.parent / "sql"


def load_sql(filename: str) -> str:
    return (SQL_DIR / filename).read_text()


def _serialize_value(value: object) -> object:
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, list):
        return "\n".join(str(v) for v in value if v is not None)
    return value


def _serialize_record(row: dict) -> dict:
    """Convertit les types Python non-sérialisables et supprime les None."""
    return {k: _serialize_value(v) for k, v in row.items() if v is not None}


def fetch_from_db(sql: str) -> list[dict]:
    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql)
            return [_serialize_record(dict(row)) for row in cur.fetchall()]
    finally:
        conn.close()


def _find_table(api: Api, base_id: str, name_or_id: str):
    """Retrouve une TableSchema par son nom OU son id."""
    schema = api.base(base_id).schema()
    return next(
        (t for t in schema.tables if t.name == name_or_id or t.id == name_or_id),
        None,
    )


def _rename_fields_if_needed(
    api: Api,
    base_id: str,
    table_id: str,
    renames: dict[str, str],
) -> None:
    """Renomme les champs d'une table existante si les anciens noms sont présents."""
    table = _find_table(api, base_id, table_id)
    if table is None:
        print(f"  WARNING: table {table_id} introuvable pour rename")
        return

    existing_names = {f.name: f.id for f in table.fields}
    print(f"  Champs actuels: {sorted(existing_names.keys())}")
    headers = {"Authorization": f"Bearer {AIRTABLE_TOKEN}"}

    renamed = False
    for old_name, new_name in renames.items():
        if old_name in existing_names and new_name not in existing_names:
            field_id = existing_names[old_name]
            url = f"{AIRTABLE_API_URL}/meta/bases/{base_id}/tables/{table.id}/fields/{field_id}"
            resp = requests.patch(url, headers=headers, json={"name": new_name})
            resp.raise_for_status()
            print(f"  Champ '{old_name}' renommé en '{new_name}'.")
            renamed = True

    if renamed:
        # Vérification après rename
        table_after = _find_table(api, base_id, table_id)
        if table_after:
            print(
                f"  Champs après rename: {sorted(f.name for f in table_after.fields)}"
            )


def _ensure_fields_exist(
    api: Api,
    base_id: str,
    table_id: str,
    expected_fields: list[dict],
) -> None:
    """Crée les champs manquants dans une table existante via l'API Metadata."""
    table = _find_table(api, base_id, table_id)
    if table is None:
        return

    existing_names = {f.name for f in table.fields}
    headers = {"Authorization": f"Bearer {AIRTABLE_TOKEN}"}

    created = []
    for field_spec in expected_fields:
        if field_spec["name"] not in existing_names:
            url = f"{AIRTABLE_API_URL}/meta/bases/{base_id}/tables/{table.id}/fields"
            resp = requests.post(url, headers=headers, json=field_spec)
            resp.raise_for_status()
            created.append(field_spec["name"])

    if created:
        print(f"  Champs créés ({len(created)}): {created}")
        # Petite pause pour laisser Airtable propager le schema
        time.sleep(2)
        table_after = _find_table(api, base_id, table_id)
        if table_after:
            print(
                f"  Champs après création: {sorted(f.name for f in table_after.fields)}"
            )


def get_or_create_table(api: Api, base_id: str, table_name: str, fields: list[dict]):
    """Retourne (Table, TableSchema). Crée la table si elle n'existe pas."""
    table_schema = _find_table(api, base_id, table_name)

    if table_schema is None:
        print(f"  Table '{table_name}' absente → création...")
        api.base(base_id).create_table(table_name, fields=fields)
        table_schema = _find_table(api, base_id, table_name)
        print(f"  Table '{table_name}' créée (id={table_schema.id}).")
    else:
        print(f"  Table '{table_schema.name}' (id={table_schema.id}) déjà existante.")

    # Toujours utiliser l'ID réel pour les opérations
    return api.table(base_id, table_schema.id), table_schema


def truncate_and_load(table, records: list[dict]) -> None:
    existing = table.all()
    if existing:
        print(f"  Suppression de {len(existing)} enregistrements existants...")
        table.batch_delete([r["id"] for r in existing])

    print(f"  Insertion de {len(records)} enregistrements...")
    print(f"  Premier record: {records[0] if records else 'aucun'}")
    table.batch_create(records, typecast=True)


def sync_table(
    api: Api,
    table_name: str,
    sql_file: str,
    fields_schema: list[dict],
    field_renames: dict[str, str] | None = None,
) -> None:
    print(f"\n{'=' * 50}")
    print(f"Sync : {table_name}")

    print("  Récupération des données depuis la BDD...")
    records = fetch_from_db(load_sql(sql_file))
    print(f"  {len(records)} enregistrements récupérés.")

    table, table_schema = get_or_create_table(
        api, AIRTABLE_BASE_ID, table_name, fields_schema
    )

    if field_renames:
        _rename_fields_if_needed(api, AIRTABLE_BASE_ID, table_schema.id, field_renames)

    _ensure_fields_exist(api, AIRTABLE_BASE_ID, table_schema.id, fields_schema)

    truncate_and_load(table, records)
    print(f"  Sync '{table_name}' terminée.")


def main() -> None:
    api = Api(AIRTABLE_TOKEN)

    sync_table(
        api,
        AIRTABLE_TABLE_USER,
        "users.sql",
        USERS_FIELDS,
        field_renames={
            "user_id": "id"
        },  # rollback du rename précédent (quirk Airtable primary field)
    )
    sync_table(
        api,
        AIRTABLE_TABLE_CLEAR_CUT_REPORTS,
        "clear_cuts.sql",
        CLEAR_CUT_REPORTS_FIELDS,
    )

    print("\nSync complète.")


if __name__ == "__main__":
    main()
