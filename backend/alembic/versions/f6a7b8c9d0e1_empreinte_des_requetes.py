"""Fingerprint of the request that created a report or a form version

Some phones send the same request several times within a few milliseconds.
A unique fingerprint lets the copies return the row created by the first one.

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-10-28 20:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f6a7b8c9d0e1"
down_revision: str | None = "e5f6a7b8c9d0"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

TABLES = ("clear_cuts_reports", "clear_cut_report_forms")


def upgrade() -> None:
    for table in TABLES:
        op.add_column(
            table, sa.Column("request_fingerprint", sa.String(64), nullable=True)
        )
        op.create_unique_constraint(
            f"{table}_request_fingerprint_key", table, ["request_fingerprint"]
        )


def downgrade() -> None:
    for table in TABLES:
        op.drop_constraint(f"{table}_request_fingerprint_key", table, type_="unique")
        op.drop_column(table, "request_fingerprint")
