"""Recompute the users' search text with separators

The before_insert listener used to run an UPDATE on a row that did not exist
yet, and before_update copied the previous values: accounts created by an
admin were not searchable. The listener now sets the value itself; this fills
existing rows in the same format.

Revision ID: b7c1d2e3f4a5
Revises: 9a6084dee075
Create Date: 2026-09-27 11:00:00.000000

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b7c1d2e3f4a5"
down_revision: str | None = "9a6084dee075"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        "UPDATE users "
        "SET search_vector = concat_ws(' ', first_name, last_name, login, email)"
    )


def downgrade() -> None:
    op.execute(
        "UPDATE users SET search_vector = concat(first_name, last_name, login, email)"
    )
