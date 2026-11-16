"""Reports followed by the association

An admin marks a report as followed; only those reports are synced to Notion.

Revision ID: a7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-11-16 10:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a7b8c9d0e1f2"
down_revision: str | None = "f6a7b8c9d0e1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "clear_cuts_reports", sa.Column("prioritized_at", sa.DateTime(), nullable=True)
    )
    op.add_column(
        "clear_cuts_reports",
        sa.Column("prioritized_by_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "clear_cuts_reports_prioritized_by_id_fkey",
        "clear_cuts_reports",
        "users",
        ["prioritized_by_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "clear_cuts_reports_prioritized_by_id_fkey",
        "clear_cuts_reports",
        type_="foreignkey",
    )
    op.drop_column("clear_cuts_reports", "prioritized_by_id")
    op.drop_column("clear_cuts_reports", "prioritized_at")
