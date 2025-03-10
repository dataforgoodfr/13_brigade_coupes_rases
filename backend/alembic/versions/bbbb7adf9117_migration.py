"""migration

Revision ID: bbbb7adf9117
Revises: 4ae4ff0f990a
Create Date: 2025-03-06 12:10:25.017596

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bbbb7adf9117'
down_revision: Union[str, None] = '4ae4ff0f990a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('user_clear_cut')
    op.drop_index('ix_items_id', table_name='items')
    op.drop_index('ix_items_name', table_name='items')
    op.drop_table('items')
    op.create_index(op.f('ix_clear_cuts_boundary'), 'clear_cuts', ['boundary'], unique=False)
    op.create_index(op.f('ix_clear_cuts_location'), 'clear_cuts', ['location'], unique=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_clear_cuts_location'), table_name='clear_cuts')
    op.drop_index(op.f('ix_clear_cuts_boundary'), table_name='clear_cuts')
    op.create_table('items',
    sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('name', sa.VARCHAR(), autoincrement=False, nullable=True),
    sa.Column('description', sa.VARCHAR(), autoincrement=False, nullable=True),
    sa.PrimaryKeyConstraint('id', name='items_pkey')
    )
    op.create_index('ix_items_name', 'items', ['name'], unique=False)
    op.create_index('ix_items_id', 'items', ['id'], unique=False)
    op.create_table('user_clear_cut',
    sa.Column('user_id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('clear_cut_id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.ForeignKeyConstraint(['clear_cut_id'], ['clear_cuts.id'], name='user_clear_cut_clear_cut_id_fkey'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='user_clear_cut_user_id_fkey'),
    sa.PrimaryKeyConstraint('user_id', 'clear_cut_id', name='user_clear_cut_pkey')
    )
    # ### end Alembic commands ###
