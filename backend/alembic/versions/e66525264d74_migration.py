"""migration

Revision ID: e66525264d74
Revises: 9ebe91359050
Create Date: 2025-08-11 19:57:02.874166

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'e66525264d74'
down_revision: Union[str, None] = '9ebe91359050'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column('users', sa.Column('search_vector', postgresql.TEXT(), nullable=True))
    op.execute("""
        UPDATE users
        SET search_vector = concat(first_name,last_name,login,email)
    """)
    op.create_index(
        'ix_users_search_vector',
        'users',
        ['search_vector'],
    )


def downgrade():
    op.drop_index('ix_users_search_vector', table_name='users')
    op.drop_column('users', 'search_vector')
