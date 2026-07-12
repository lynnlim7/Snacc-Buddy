"""add missing food_logs columns

Revision ID: d4e5f6a7b8c9
Revises: 13dde47d80f6
Create Date: 2026-07-09 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = '13dde47d80f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # IF NOT EXISTS guards against re-running when a prior crashed deploy already applied this
    op.execute("""
        ALTER TABLE food_logs
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            ADD COLUMN IF NOT EXISTS inference_log_id UUID REFERENCES ai_inference_logs(id) ON DELETE SET NULL
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_food_logs_inference_log_id
            ON food_logs (inference_log_id)
    """)


def downgrade() -> None:
    op.drop_index('ix_food_logs_inference_log_id', table_name='food_logs')
    op.drop_column('food_logs', 'inference_log_id')
    op.drop_column('food_logs', 'updated_at')
