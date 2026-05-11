"""Sync PostgreSQL tables clear_cuts_reports and users to Airtable."""

import os
import sys

import psycopg2
import psycopg2.extras
from pyairtable import Api

DATABASE_URL = os.environ["DATABASE_URL"]
AIRTABLE_TOKEN = os.environ["AIRTABLE_TOKEN"]
AIRTABLE_BASE_ID = os.environ["AIRTABLE_BASE_ID"]

USERS_TABLE = "Users"
REPORTS_TABLE = "ClearCutReports"

AIRTABLE_BATCH_SIZE = 10


def get_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)


def fetch_users(conn):
    with conn.cursor() as cur:
        cur.execute("""
            SELECT
                id,
                first_name,
                last_name,
                login,
                email,
                role,
                is_active,
                created_at::text,
                updated_at::text
            FROM users
            WHERE deleted_at IS NULL
            ORDER BY id
        """)
        return cur.fetchall()


def fetch_reports(conn):
    with conn.cursor() as cur:
        cur.execute("""
            SELECT
                r.id,
                r.status,
                r.slope_area_hectare,
                r.total_area_hectare,
                r.total_ecological_zoning_area_hectare,
                r.first_cut_date::text,
                r.last_cut_date::text,
                r.created_at::text,
                r.updated_at::text,
                c.name                  AS city,
                d.code                  AS department_code,
                d.name                  AS department_name,
                u.login                 AS assigned_to,
                arb.login               AS assignment_requested_by
            FROM clear_cuts_reports r
            LEFT JOIN cities       c   ON r.city_id                    = c.id
            LEFT JOIN departments  d   ON c.department_id              = d.id
            LEFT JOIN users        u   ON r.user_id                    = u.id
            LEFT JOIN users        arb ON r.assignment_requested_by_id = arb.id
            ORDER BY r.id
        """)
        return cur.fetchall()


def to_fields(row):
    """Convert a psycopg2 RealDictRow to a plain dict with Airtable-safe values."""
    fields = {}
    for key, value in row.items():
        if value is None:
            continue
        if isinstance(value, bool):
            fields[key] = value
        elif isinstance(value, (int, float)):
            fields[key] = value
        else:
            fields[key] = str(value)
    return fields


def sync_table(table, pg_rows):
    """Upsert PostgreSQL rows into Airtable and delete removed rows."""
    # Index existing Airtable records by their pg id
    existing = {
        int(rec["fields"]["id"]): rec["id"]
        for rec in table.all(fields=["id"])
        if "id" in rec["fields"]
    }

    pg_ids = {row["id"] for row in pg_rows}
    to_create = []
    to_update = []

    for row in pg_rows:
        fields = to_fields(row)
        pg_id = row["id"]
        if pg_id in existing:
            to_update.append({"id": existing[pg_id], "fields": fields})
        else:
            to_create.append(fields)

    to_delete = [
        airtable_id
        for pg_id, airtable_id in existing.items()
        if pg_id not in pg_ids
    ]

    for i in range(0, len(to_create), AIRTABLE_BATCH_SIZE):
        table.batch_create(to_create[i : i + AIRTABLE_BATCH_SIZE])

    for i in range(0, len(to_update), AIRTABLE_BATCH_SIZE):
        table.batch_update(to_update[i : i + AIRTABLE_BATCH_SIZE])

    for i in range(0, len(to_delete), AIRTABLE_BATCH_SIZE):
        table.batch_delete(to_delete[i : i + AIRTABLE_BATCH_SIZE])

    return len(to_create), len(to_update), len(to_delete)


def main():
    api = Api(AIRTABLE_TOKEN)
    users_table = api.table(AIRTABLE_BASE_ID, USERS_TABLE)
    reports_table = api.table(AIRTABLE_BASE_ID, REPORTS_TABLE)

    with get_connection() as conn:
        print("Fetching data from PostgreSQL…")
        users = fetch_users(conn)
        reports = fetch_reports(conn)

    print(f"  {len(users)} users, {len(reports)} reports to sync")

    print("Syncing Users…")
    created, updated, deleted = sync_table(users_table, users)
    print(f"  created={created}  updated={updated}  deleted={deleted}")

    print("Syncing ClearCutReports…")
    created, updated, deleted = sync_table(reports_table, reports)
    print(f"  created={created}  updated={updated}  deleted={deleted}")

    print("Sync complete.")


if __name__ == "__main__":
    missing = [v for v in ("DATABASE_URL", "AIRTABLE_TOKEN", "AIRTABLE_BASE_ID") if not os.environ.get(v)]
    if missing:
        print(f"Missing environment variables: {', '.join(missing)}", file=sys.stderr)
        sys.exit(1)
    main()
