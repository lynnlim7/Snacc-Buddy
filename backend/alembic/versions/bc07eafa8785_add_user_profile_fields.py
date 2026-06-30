"""add_user_profile_fields

Revision ID: bc07eafa8785
Revises: 
Create Date: 2026-05-21 13:25:56.020988

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY, UUID

revision: str = 'bc07eafa8785'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(length=320), nullable=False),
        sa.Column('hashed_password', sa.String(length=1024), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_superuser', sa.Boolean(), nullable=False),
        sa.Column('is_verified', sa.Boolean(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=True),
        sa.Column('gender', sa.String(length=20), nullable=True),
        sa.Column('age', sa.Integer(), nullable=True),
        sa.Column('height_cm', sa.Float(), nullable=True),
        sa.Column('current_weight_kg', sa.Float(), nullable=True),
        sa.Column('goal_weight_kg', sa.Float(), nullable=True),
        sa.Column('goal', sa.String(length=50), nullable=True),
        sa.Column('lifestyle', sa.String(length=50), nullable=True),
        sa.Column('dietary_restrictions', sa.Boolean(), nullable=True),
        sa.Column('dietary_types', ARRAY(sa.Text()), nullable=True, server_default='{}'),
        sa.Column('medical_conditions', sa.Boolean(), nullable=True),
        sa.Column('condition_type', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')

