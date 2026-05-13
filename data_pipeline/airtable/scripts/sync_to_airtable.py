"""
Sync clear-cut reports from PostgreSQL to Airtable.

Usage:
    uv run --with-requirements requirements.txt \
        data_pipeline/airtable/scripts/sync_to_airtable.py

Or with env file:
    uv run scripts/sync_to_airtable.py  (from data_pipeline/airtable/)

Required environment variables:
    DATABASE_URL        PostgreSQL connection string
    AIRTABLE_TOKEN      Personal access token (starts with pat...)
    AIRTABLE_BASE_ID    Airtable base ID (starts with app...)
    AIRTABLE_TABLE_ID   Airtable table ID or name
"""

import os

from dotenv import load_dotenv



load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]
AIRTABLE_TOKEN = os.environ["AIRTABLE_TOKEN"]
AIRTABLE_BASE_ID = os.environ["AIRTABLE_BASE_ID"]
AIRTABLE_TABLE_USER = os.environ["AIRTABLE_TABLE_USER"]
AIRTABLE_TABLE_CLEAR_CUT_REPORTS = os.environ["AIRTABLE_TABLE_CLEAR_CUT_REPORTS"]


# Tester les credentials
print(
    DATABASE_URL, "\n",
    AIRTABLE_TOKEN, "\n",
    AIRTABLE_BASE_ID, "\n",
    AIRTABLE_TABLE_USER, "\n",
    AIRTABLE_TABLE_CLEAR_CUT_REPORTS
)


# def fetch_from_db() -> list[dict]:
#     """Fetch records to sync from PostgreSQL. À implémenter."""
#     raise NotImplementedError


# def sync_to_airtable(records: list[dict]) -> None:
#     """Push records to Airtable. À implémenter."""
#     raise NotImplementedError


# def main() -> None:
#     print("Fetching data from database...")
#     records = fetch_from_db()
#     print(f"{len(records)} records fetched.")

#     print("Syncing to Airtable...")
#     sync_to_airtable(records)
#     print("Done.")


# if __name__ == "__main__":
#     main()
