"""migration

Revision ID: 9ebe91359050
Revises: f2e84934dca4
Create Date: 2025-08-11 19:02:09.744942

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import geoalchemy2


# revision identifiers, used by Alembic.
revision: str = '9ebe91359050'
down_revision: Union[str, None] = 'f2e84934dca4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Rename columns instead of dropping and recreating
    op.alter_column('users', 'firstname', new_column_name='first_name')
    op.alter_column('users', 'lastname', new_column_name='last_name')


def downgrade() -> None:
    # Reverse the renames
    op.alter_column('users', 'first_name', new_column_name='firstname')
    op.alter_column('users', 'last_name', new_column_name='lastname')