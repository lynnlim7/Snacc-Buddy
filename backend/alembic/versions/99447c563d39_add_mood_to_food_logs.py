"""add mood to food_logs

Revision ID: 99447c563d39
Revises: 2f8a45c69b31, a1b2c3d4e5f6
Create Date: 2026-06-12 00:00:00.000000

"""
from typing import Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '99447c563d39'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, None] = None
depends_on: Union[str, None] = None


def upgrade() -> None:
    op.add_column(
        'food_logs',
        sa.Column('mood', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='[]'),
    )


def downgrade() -> None:
    op.drop_column('food_logs', 'mood')
