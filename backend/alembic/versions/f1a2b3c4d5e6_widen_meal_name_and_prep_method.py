"""widen meal_name and preparation_method columns

Revision ID: f1a2b3c4d5e6
Revises: 99447c563d39
Create Date: 2026-06-18

"""
from alembic import op
import sqlalchemy as sa

revision = 'f1a2b3c4d5e6'
down_revision = '99447c563d39'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column('food_logs', 'meal_name',
                    existing_type=sa.String(50),
                    type_=sa.String(255),
                    existing_nullable=True)
    op.alter_column('food_logs', 'preparation_method',
                    existing_type=sa.String(50),
                    type_=sa.String(100),
                    existing_nullable=True)


def downgrade() -> None:
    op.alter_column('food_logs', 'meal_name',
                    existing_type=sa.String(255),
                    type_=sa.String(50),
                    existing_nullable=True)
    op.alter_column('food_logs', 'preparation_method',
                    existing_type=sa.String(100),
                    type_=sa.String(50),
                    existing_nullable=True)
