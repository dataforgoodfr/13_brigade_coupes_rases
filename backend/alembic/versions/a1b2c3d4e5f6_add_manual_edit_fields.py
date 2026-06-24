"""Add manual edition tracking to clear cuts and reported_at to reports

Allows admins and assigned volunteers to correct the initial information and
perimeter of a clear cut. Manually edited cuts are flagged so the data pipeline
does not overwrite them unless overriding is explicitly re-enabled.

Revision ID: a1b2c3d4e5f6
Revises: 548e40e6ac01
Create Date: 2026-06-24 17:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: str | None = "548e40e6ac01"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "clear_cuts",
        sa.Column(
            "is_manually_edited",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
    )
    op.add_column(
        "clear_cuts",
        sa.Column("manually_edited_at", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "clear_cuts",
        sa.Column("manually_edited_by_id", sa.Integer(), nullable=True),
    )
    op.add_column(
        "clear_cuts",
        sa.Column(
            "allow_pipeline_override",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
    )
    op.create_foreign_key(
        "fk_clear_cuts_manually_edited_by_id_users",
        "clear_cuts",
        "users",
        ["manually_edited_by_id"],
        ["id"],
    )
    op.add_column(
        "clear_cuts_reports",
        sa.Column("reported_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("clear_cuts_reports", "reported_at")
    op.drop_constraint(
        "fk_clear_cuts_manually_edited_by_id_users",
        "clear_cuts",
        type_="foreignkey",
    )
    op.drop_column("clear_cuts", "allow_pipeline_override")
    op.drop_column("clear_cuts", "manually_edited_by_id")
    op.drop_column("clear_cuts", "manually_edited_at")
    op.drop_column("clear_cuts", "is_manually_edited")
