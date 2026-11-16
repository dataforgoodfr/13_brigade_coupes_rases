"""History of manually corrected perimeters

Each manual correction of a clear cut's perimeter keeps the previous perimeter,
its area, the date and the author of the correction.

Revision ID: b8c9d0e1f2a3
Revises: a7b8c9d0e1f2
Create Date: 2026-11-16 18:00:00.000000

"""

from collections.abc import Sequence

import geoalchemy2
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b8c9d0e1f2a3"
down_revision: str | None = "a7b8c9d0e1f2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "clear_cut_boundary_history",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("clear_cut_id", sa.Integer(), nullable=False),
        sa.Column(
            "previous_boundary",
            geoalchemy2.types.Geometry(
                geometry_type="MULTIPOLYGON",
                srid=4326,
                from_text="ST_GeomFromEWKT",
                name="geometry",
                nullable=False,
            ),
            nullable=False,
        ),
        sa.Column("previous_area_hectare", sa.Float(), nullable=False),
        sa.Column("edited_at", sa.DateTime(), nullable=False),
        sa.Column("edited_by_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["clear_cut_id"], ["clear_cuts.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["edited_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_clear_cut_boundary_history_clear_cut_id",
        "clear_cut_boundary_history",
        ["clear_cut_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_clear_cut_boundary_history_clear_cut_id",
        table_name="clear_cut_boundary_history",
    )
    op.drop_table("clear_cut_boundary_history")
