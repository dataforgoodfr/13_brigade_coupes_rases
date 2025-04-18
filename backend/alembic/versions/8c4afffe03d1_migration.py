"""migration

Revision ID: 8c4afffe03d1
Revises: 8042be50cde3
Create Date: 2025-04-18 20:50:12.329605

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import geoalchemy2


# revision identifiers, used by Alembic.
revision: str = '8c4afffe03d1'
down_revision: Union[str, None] = '8042be50cde3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('clear_cuts', sa.Column('bdf_resinous_area_hectare', sa.Float(), nullable=True))
    op.add_column('clear_cuts', sa.Column('bdf_decidous_area_hectare', sa.Float(), nullable=True))
    op.add_column('clear_cuts', sa.Column('bdf_mixed_area_hectare', sa.Float(), nullable=True))
    op.add_column('clear_cuts', sa.Column('bdf_poplar_area_hectare', sa.Float(), nullable=True))
    op.add_column('clear_cuts', sa.Column('ecological_zoning_area_hectare', sa.Float(), nullable=True))
    op.drop_column('clear_cuts', 'ecological_zoning_area_ha')
    op.drop_column('clear_cuts', 'bdf_mixed_area_ha')
    op.drop_column('clear_cuts', 'bdf_poplar_area_ha')
    op.drop_column('clear_cuts', 'bdf_decidous_area_ha')
    op.drop_column('clear_cuts', 'bdf_resinous_area_ha')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('clear_cuts', sa.Column('bdf_resinous_area_ha', sa.DOUBLE_PRECISION(precision=53), autoincrement=False, nullable=True))
    op.add_column('clear_cuts', sa.Column('bdf_decidous_area_ha', sa.DOUBLE_PRECISION(precision=53), autoincrement=False, nullable=True))
    op.add_column('clear_cuts', sa.Column('bdf_poplar_area_ha', sa.DOUBLE_PRECISION(precision=53), autoincrement=False, nullable=True))
    op.add_column('clear_cuts', sa.Column('bdf_mixed_area_ha', sa.DOUBLE_PRECISION(precision=53), autoincrement=False, nullable=True))
    op.add_column('clear_cuts', sa.Column('ecological_zoning_area_ha', sa.DOUBLE_PRECISION(precision=53), autoincrement=False, nullable=True))
    op.drop_column('clear_cuts', 'ecological_zoning_area_hectare')
    op.drop_column('clear_cuts', 'bdf_poplar_area_hectare')
    op.drop_column('clear_cuts', 'bdf_mixed_area_hectare')
    op.drop_column('clear_cuts', 'bdf_decidous_area_hectare')
    op.drop_column('clear_cuts', 'bdf_resinous_area_hectare')
    # ### end Alembic commands ###
