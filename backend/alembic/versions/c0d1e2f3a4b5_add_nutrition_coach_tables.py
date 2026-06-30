"""add_nutrition_coach_tables

Revision ID: c0d1e2f3a4b5
Revises: a1b2c3d4e5f6
Create Date: 2026-06-23 00:00:00.000000

Tables created:
    1. recipes  — recipe knowledge base with pgvector embedding column
    2. user_nutrition_summary  — Stage-1 memory snapshot per orchestration run
    3. nutrition_insights  — deterministic rule outputs keyed by user + summary

Indexes:
    recipes: HNSW cosine index on embedding_vector; B-tree on calories, protein_g;
             GIN on diet_tags (metadata filtering for retrieval funnel)
    user_nutrition_summary: (user_id, snapshot_date DESC) for latest-snapshot lookups
    nutrition_insights: (user_id, created_at DESC) for chat-time reads
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c0d1e2f3a4b5"
down_revision: str | None = "a1b2c3d4e5f6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_EMBEDDING_DIM = 768


def upgrade() -> None:
    # Enable pgvector extension (idempotent)
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # ── recipes ──────────────────────────────────────────────────────────────
    op.create_table(
        "recipes",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("title", sa.Text, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("calories", sa.Integer, nullable=True),
        sa.Column("protein_g", sa.Float, nullable=True),
        sa.Column("carbs_g", sa.Float, nullable=True),
        sa.Column("fat_g", sa.Float, nullable=True),
        sa.Column("fibre_g", sa.Float, nullable=True),
        sa.Column("sodium_mg", sa.Float, nullable=True),
        sa.Column("ingredients", sa.ARRAY(sa.Text), nullable=True),
        sa.Column("diet_tags", sa.ARRAY(sa.Text), nullable=True),
        sa.Column("cuisine_type", sa.String(100), nullable=True),
        sa.Column("time_minutes", sa.Integer, nullable=True),
        sa.Column("source_url", sa.Text, nullable=True),
        sa.Column(
            "embedding_vector",
            sa.Text,  # placeholder — overridden by raw DDL below
            nullable=True,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    # Replace the placeholder column with the real vector type
    op.execute(f"ALTER TABLE recipes DROP COLUMN embedding_vector")
    op.execute(f"ALTER TABLE recipes ADD COLUMN embedding_vector vector({_EMBEDDING_DIM})")

    # HNSW index — recall-oriented cosine search
    op.execute(
        "CREATE INDEX recipes_embedding_hnsw ON recipes "
        "USING hnsw (embedding_vector vector_cosine_ops)"
    )
    # B-tree indexes for metadata filtering (retrieval funnel steps 4-5)
    op.create_index("recipes_calories_idx", "recipes", ["calories"])
    op.create_index("recipes_protein_g_idx", "recipes", ["protein_g"])
    # GIN index for array containment queries on diet_tags
    op.execute("CREATE INDEX recipes_diet_tags_gin ON recipes USING GIN (diet_tags)")

    # ── user_nutrition_summary ────────────────────────────────────────────────
    op.create_table(
        "user_nutrition_summary",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.String(255), nullable=False),
        sa.Column("snapshot_date", sa.Date, nullable=False),
        # 7d per-day averages
        sa.Column("avg_calories_7d", sa.Float, nullable=True),
        sa.Column("avg_protein_g_7d", sa.Float, nullable=True),
        sa.Column("avg_carbs_g_7d", sa.Float, nullable=True),
        sa.Column("avg_fat_g_7d", sa.Float, nullable=True),
        sa.Column("avg_fibre_g_7d", sa.Float, nullable=True),
        sa.Column("avg_sodium_g_7d", sa.Float, nullable=True),
        # 30d per-day averages
        sa.Column("avg_calories_30d", sa.Float, nullable=True),
        sa.Column("avg_protein_g_30d", sa.Float, nullable=True),
        sa.Column("avg_carbs_g_30d", sa.Float, nullable=True),
        sa.Column("avg_fat_g_30d", sa.Float, nullable=True),
        sa.Column("avg_fibre_g_30d", sa.Float, nullable=True),
        sa.Column("avg_sodium_g_30d", sa.Float, nullable=True),
        # Logging consistency
        sa.Column("logging_frequency_7d", sa.Float, nullable=True),
        # Computed targets
        sa.Column("calorie_target", sa.Float, nullable=True),
        sa.Column("protein_target_g", sa.Float, nullable=True),
        sa.Column("carbs_target_g", sa.Float, nullable=True),
        sa.Column("fat_target_g", sa.Float, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index(
        "user_nutrition_summary_user_date_idx",
        "user_nutrition_summary",
        ["user_id", sa.text("snapshot_date DESC")],
    )

    # ── nutrition_insights ────────────────────────────────────────────────────
    op.create_table(
        "nutrition_insights",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.String(255), nullable=False),
        sa.Column(
            "summary_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("user_nutrition_summary.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("protein_deficit", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("fibre_deficit", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("excess_sodium", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("calorie_surplus", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("weight_loss_stalled", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("low_meal_consistency", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("protein_adherence_pct", sa.Float, nullable=True),
        sa.Column("calorie_adherence_pct", sa.Float, nullable=True),
        sa.Column("fibre_adherence_pct", sa.Float, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("nutrition_insights_user_id_idx", "nutrition_insights", ["user_id"])
    op.create_index(
        "nutrition_insights_user_created_idx",
        "nutrition_insights",
        ["user_id", sa.text("created_at DESC")],
    )


def downgrade() -> None:
    op.drop_table("nutrition_insights")
    op.drop_table("user_nutrition_summary")
    op.drop_index("recipes_diet_tags_gin", table_name="recipes")
    op.drop_index("recipes_protein_g_idx", table_name="recipes")
    op.drop_index("recipes_calories_idx", table_name="recipes")
    op.execute("DROP INDEX IF EXISTS recipes_embedding_hnsw")
    op.drop_table("recipes")
