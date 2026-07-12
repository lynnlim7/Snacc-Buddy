"""add_dietary_types_column

Revision ID: 13dde47d80f6
Revises: c0d1e2f3a4b5
Create Date: 2026-06-30 17:09:07.989871

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '13dde47d80f6'
down_revision: Union[str, None] = 'c0d1e2f3a4b5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # IF NOT EXISTS guards against re-running when a prior crashed deploy already applied this
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS dietary_types TEXT[]")


def downgrade() -> None:
    op.drop_column('users', 'dietary_types')
