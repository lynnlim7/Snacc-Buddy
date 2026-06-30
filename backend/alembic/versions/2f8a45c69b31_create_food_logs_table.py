"""create food_logs table

Revision ID: 2f8a45c69b31
Revises: bc07eafa8785
Create Date: 2026-05-21 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '2f8a45c69b31'
down_revision: Union[str, None] = 'bc07eafa8785'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('food_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', sa.String(length=255), nullable=False),
        sa.Column('meal_type', sa.String(length=50), nullable=False),
        sa.Column('meal_name', sa.String(length=255), nullable=True),
        sa.Column('serving_size', sa.String(length=100), nullable=True),
        sa.Column('preparation_method', sa.String(length=100), nullable=True),
        sa.Column('ingredients', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='[]'),
        sa.Column('estimated_total_calories', sa.Integer(), nullable=False),
        sa.Column('protein_g', sa.Float(), nullable=True),
        sa.Column('carbs_g', sa.Float(), nullable=True),
        sa.Column('fat_g', sa.Float(), nullable=True),
        sa.Column('fibre_g', sa.Float(), nullable=True),
        sa.Column('sugar_g', sa.Float(), nullable=True),
        sa.Column('sodium_g', sa.Float(), nullable=True),
        sa.Column('visible_sauces_or_oils', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('cuisine_type', sa.String(length=100), nullable=True),
        sa.Column('restaurant_or_brand', sa.String(length=252), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('ambiguity_flags', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='[]'),
        sa.Column('mood', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='[]'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('raw_response', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('image_url', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='[]'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_food_logs_user_id', 'food_logs', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_food_logs_user_id', table_name='food_logs')
    op.drop_table('food_logs')
