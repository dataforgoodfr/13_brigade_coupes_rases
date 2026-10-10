"""Create the default rules when they are missing

The API expects one rule of each type (area, slope, ecological_zoning) and
answers RULE_NOT_FOUND otherwise. They were only created by the seed scripts:
a database built from the migrations alone had none. Existing rules are kept
as they are. The ecological zoning rule starts without any zoning; an admin
chooses them in the settings.

Revision ID: c3d4e5f6a7b8
Revises: b7c1d2e3f4a5
Create Date: 2026-10-10 20:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c3d4e5f6a7b8"
down_revision: str | None = "b7c1d2e3f4a5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Same thresholds as common_seed.seed_rules
DEFAULT_RULES = {"area": 10.0, "slope": 2.0, "ecological_zoning": 0.5}


def upgrade() -> None:
    for rule_type, threshold in DEFAULT_RULES.items():
        op.get_bind().execute(
            sa.text(
                "INSERT INTO rules (type, threshold) "
                "SELECT CAST(:type AS VARCHAR), CAST(:threshold AS FLOAT) "
                "WHERE NOT EXISTS "
                "(SELECT 1 FROM rules WHERE type = CAST(:type AS VARCHAR))"
            ),
            {"type": rule_type, "threshold": threshold},
        )


def downgrade() -> None:
    # Rules may have been edited or linked to reports since: keep them.
    pass
