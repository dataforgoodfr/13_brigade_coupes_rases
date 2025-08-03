"""migration

Revision ID: d09d496c8f6e
Revises: 00e6819cb4e2
Create Date: 2025-07-28 20:51:37.132356

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import geoalchemy2


# revision identifiers, used by Alembic.
revision: str = 'd09d496c8f6e'
down_revision: Union[str, None] = '00e6819cb4e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add a new temporary boolean column
    op.add_column('clear_cut_report_forms', sa.Column('nearby_zone_tmp', sa.Boolean(), nullable=True))

    # 2. Map string values to boolean in the new column
    op.execute("""
        UPDATE clear_cut_report_forms
        SET nearby_zone_tmp = 
            CASE
                WHEN lower(nearby_zone) IN ('true', '1', 't', 'yes', 'y') THEN TRUE
                WHEN lower(nearby_zone) IN ('false', '0', 'f', 'no', 'n') THEN FALSE
                ELSE NULL
            END
    """)

    # 3. Drop the old column
    op.drop_column('clear_cut_report_forms', 'nearby_zone')

    # 4. Rename the new column to the original name
    op.alter_column('clear_cut_report_forms', 'nearby_zone_tmp', new_column_name='nearby_zone')

def downgrade() -> None:
    # 1. Add a new temporary string column
    op.add_column('clear_cut_report_forms', sa.Column('nearby_zone_tmp', sa.String(), nullable=True))

    # 2. Map boolean values back to string
    op.execute("""
        UPDATE clear_cut_report_forms
        SET nearby_zone_tmp = 
            CASE
                WHEN nearby_zone IS TRUE THEN 'true'
                WHEN nearby_zone IS FALSE THEN 'false'
                ELSE NULL
            END
    """)

    # 3. Drop the boolean column
    op.drop_column('clear_cut_report_forms', 'nearby_zone')

    # 4. Rename the new column to the original name
    op.alter_column('clear_cut_report_forms', 'nearby_zone_tmp', new_column_name='nearby_zone')