"""Replace slope_area_ratio_percentage with slope_area_hectare

Revision ID: 00e6819cb4e2
Revises: ecea69da3c50
Create Date: 2025-07-11 11:08:07.056675

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "00e6819cb4e2"
down_revision: str | None = "ecea69da3c50"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column(
        "clear_cuts_reports", sa.Column("slope_area_hectare", sa.Float(), nullable=True)
    )
    op.drop_index(
        "ix_clear_cuts_reports_slope_area_ratio_percentage",
        table_name="clear_cuts_reports",
    )
    op.create_index(
        op.f("ix_clear_cuts_reports_slope_area_hectare"),
        "clear_cuts_reports",
        ["slope_area_hectare"],
        unique=False,
    )
    op.drop_column("clear_cuts_reports", "slope_area_ratio_percentage")
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column(
        "clear_cuts_reports",
        sa.Column(
            "slope_area_ratio_percentage",
            sa.DOUBLE_PRECISION(precision=53),
            autoincrement=False,
            nullable=True,
        ),
    )
    op.drop_index(
        op.f("ix_clear_cuts_reports_slope_area_hectare"),
        table_name="clear_cuts_reports",
    )
    op.create_index(
        "ix_clear_cuts_reports_slope_area_ratio_percentage",
        "clear_cuts_reports",
        ["slope_area_ratio_percentage"],
        unique=False,
    )
    op.drop_column("clear_cuts_reports", "slope_area_hectare")
    # ### end Alembic commands ###
