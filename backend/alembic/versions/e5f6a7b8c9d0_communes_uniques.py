"""One city per INSEE code, attached to its department

The first production seed attached every city to the Aisne (02), skipped the
Ain (01) department and its first city, and loaded the delegated and
associated communes of cities_2024.csv (empty DEP column) as extra rows
sharing the INSEE code of their current commune. A later script moved most
cities to their department, but left the Ain cities and one row of each
duplicated code in the Aisne.

This migration aligns the table with the current communes of cities_2024.csv:
missing departments and cities are created, reports on a duplicated row are
moved to the kept row, the other rows are deleted, and the name and department
of each city come from the file. Delegated communes with their own INSEE code
are kept, in the department of that code; cities absent from the file are kept
as they are. An empty table is left to the seed scripts.

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-10-22 16:00:00.000000

"""

import csv
from collections.abc import Sequence
from pathlib import Path

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e5f6a7b8c9d0"
down_revision: str | None = "d4e5f6a7b8c9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

DATA_DIR = Path(__file__).resolve().parents[2] / "data"


def read_csv(filename: str) -> list[dict[str, str]]:
    with open(DATA_DIR / filename, encoding="utf-8") as file:
        return list(csv.DictReader(file))


def department_of(insee_code: str) -> str:
    return insee_code[:3] if insee_code.startswith("97") else insee_code[:2]


def reference_cities() -> list[dict[str, str | bool]]:
    """Current communes, then the delegated and associated communes (empty DEP)
    that kept their own INSEE code, attached to the department of that code."""
    rows = read_csv("cities_2024.csv")
    cities: dict[str, dict[str, str | bool]] = {
        row["COM"]: {
            "code": row["COM"],
            "dep": row["DEP"],
            "name": row["LIBELLE"],
            "current": True,
        }
        for row in rows
        if row["DEP"]
    }
    for row in rows:
        if not row["DEP"] and row["COM"] not in cities:
            cities[row["COM"]] = {
                "code": row["COM"],
                "dep": department_of(row["COM"]),
                "name": row["LIBELLE"],
                "current": False,
            }
    return list(cities.values())


def align_cities(bind: sa.Connection) -> None:
    bind.execute(
        sa.text("CREATE TEMP TABLE cog_departments (code TEXT PRIMARY KEY, name TEXT)")
    )
    bind.execute(
        sa.text("INSERT INTO cog_departments VALUES (:code, :name)"),
        [
            {"code": row["DEP"], "name": row["LIBELLE"]}
            for row in read_csv("departments_2024.csv")
        ],
    )
    bind.execute(
        sa.text(
            "CREATE TEMP TABLE cog_cities "
            "(code TEXT PRIMARY KEY, dep TEXT, name TEXT, current BOOLEAN)"
        )
    )
    bind.execute(
        sa.text("INSERT INTO cog_cities VALUES (:code, :dep, :name, :current)"),
        reference_cities(),
    )

    bind.execute(
        sa.text(
            "INSERT INTO departments (code, name) "
            "SELECT code, name FROM cog_departments g "
            "WHERE NOT EXISTS (SELECT 1 FROM departments d WHERE d.code = g.code)"
        )
    )

    bind.execute(
        sa.text(
            "CREATE TEMP TABLE department_ids AS "
            "SELECT DISTINCT ON (code) code, id FROM departments ORDER BY code, id"
        )
    )

    # Per INSEE code, keep the row named after the current commune, else the oldest.
    bind.execute(
        sa.text(
            "CREATE TEMP TABLE kept_cities AS "
            "SELECT DISTINCT ON (c.zip_code) c.zip_code, c.id "
            "FROM cities c JOIN cog_cities g ON g.code = c.zip_code "
            "ORDER BY c.zip_code, (c.name = g.name) DESC, c.id"
        )
    )
    bind.execute(
        sa.text(
            "UPDATE clear_cuts_reports r SET city_id = k.id "
            "FROM cities c JOIN kept_cities k ON k.zip_code = c.zip_code "
            "WHERE r.city_id = c.id AND c.id <> k.id"
        )
    )
    bind.execute(
        sa.text(
            "DELETE FROM cities c USING kept_cities k "
            "WHERE c.zip_code = k.zip_code AND c.id <> k.id"
        )
    )
    bind.execute(
        sa.text(
            "UPDATE cities c SET name = g.name, department_id = d.id "
            "FROM cog_cities g JOIN department_ids d ON d.code = g.dep "
            "WHERE g.code = c.zip_code "
            "AND (c.name <> g.name OR c.department_id <> d.id)"
        )
    )
    bind.execute(
        sa.text(
            "INSERT INTO cities (zip_code, name, department_id) "
            "SELECT g.code, g.name, d.id "
            "FROM cog_cities g JOIN department_ids d ON d.code = g.dep "
            "WHERE g.current "
            "AND NOT EXISTS (SELECT 1 FROM cities c WHERE c.zip_code = g.code)"
        )
    )

    bind.execute(
        sa.text("DROP TABLE kept_cities, department_ids, cog_cities, cog_departments")
    )


def upgrade() -> None:
    bind = op.get_bind()
    if bind.execute(sa.text("SELECT EXISTS (SELECT 1 FROM cities)")).scalar():
        align_cities(bind)

    op.drop_index("ix_cities_zip_code", table_name="cities")
    op.create_index("ix_cities_zip_code", "cities", ["zip_code"], unique=True)


def downgrade() -> None:
    # The deleted rows were duplicates: only the uniqueness is undone.
    op.drop_index("ix_cities_zip_code", table_name="cities")
    op.create_index("ix_cities_zip_code", "cities", ["zip_code"], unique=False)
