"""add_ai_governance_tables

Revision ID: a1b2c3d4e5f6
Revises: bc07eafa8785
Create Date: 2026-06-11 00:00:00.000000

This migration adds the complete AI Governance bounded context:

Tables created (in FK-safe order):
    1. ai_models
    2. prompt_versions
    3. ai_inference_logs
    4. risk_assessments
    5. human_reviews

Cross-domain change:
    - food_logs.inference_log_id (nullable FK → ai_inference_logs.id)

PostgreSQL ENUMs created:
    model_provider_enum, model_status_enum, risk_tier_enum,
    prompt_status_enum, inference_status_enum

Indexes:
    Partial unique index on ai_models (is_default=true) — one default model
    Partial unique index on prompt_versions (model_id, is_active=true) — one active prompt per model
    Time-series indexes on ai_inference_logs.created_at for dashboard queries

Design decisions:
    - food_logs.inference_log_id uses ON DELETE SET NULL:
      governance audit records must outlive nutrition data
    - risk_assessments.inference_id uses ON DELETE CASCADE:
      risk records are derived data; purging an inference purges its assessment
    - human_reviews.inference_id uses ON DELETE RESTRICT:
      human reviews are evidence artifacts; block deletion if a review exists
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "a1b2c3d4e5f6"
down_revision: str | None = "2f8a45c69b31"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ── 1. ai_models ─────────────────────────────────────────────────────────
    # ENUM types are created implicitly by op.create_table on first use.
    # Subsequent tables that share an ENUM use create_type=False to skip re-creation.
    op.create_table(
        "ai_models",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column(
            "provider",
            sa.Enum("google", "openai", "anthropic", "internal", name="model_provider_enum"),
            nullable=False,
        ),
        sa.Column("model_identifier", sa.String(255), nullable=False),
        sa.Column("version", sa.String(100), nullable=False),
        sa.Column(
            "status",
            sa.Enum("active", "deprecated", "retired", name="model_status_enum"),
            nullable=False,
            server_default="active",
        ),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "capabilities",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="[]",
        ),
        sa.Column(
            "risk_tier",
            sa.Enum("low", "medium", "high", name="risk_tier_enum"),
            nullable=False,
            server_default="medium",
        ),
        sa.Column("owner", sa.String(255), nullable=True),
        sa.Column("created_by", sa.String(255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint("model_identifier", "version", name="uq_ai_models_identifier_version"),
    )
    op.create_index("ix_ai_models_status", "ai_models", ["status"])
    op.create_index("ix_ai_models_provider", "ai_models", ["provider"])
    # Partial unique index: enforces only ONE default model at the DB level
    op.create_index(
        "ix_ai_models_one_default",
        "ai_models",
        ["is_default"],
        unique=True,
        postgresql_where=sa.text("is_default = true"),
    )

    # ── 3. prompt_versions ────────────────────────────────────────────────────
    op.create_table(
        "prompt_versions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "model_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("ai_models.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("prompt_template", sa.Text(), nullable=False),
        sa.Column("content_hash", sa.String(64), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("draft", "active", "retired", name="prompt_status_enum"),
            nullable=False,
            server_default="draft",
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_by", sa.String(255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint("model_id", "version", name="uq_prompt_versions_model_version"),
    )
    op.create_index("ix_prompt_versions_model_id", "prompt_versions", ["model_id"])
    # Partial unique index: enforces only ONE active prompt per model at the DB level
    op.create_index(
        "ix_prompt_versions_one_active",
        "prompt_versions",
        ["model_id"],
        unique=True,
        postgresql_where=sa.text("is_active = true"),
    )

    # ── 4. ai_inference_logs ──────────────────────────────────────────────────
    op.create_table(
        "ai_inference_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "food_log_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("food_logs.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "model_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("ai_models.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "prompt_version_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("prompt_versions.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("request_hash", sa.String(64), nullable=True),
        sa.Column(
            "request_payload",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="{}",
        ),
        sa.Column(
            "response_payload",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="{}",
        ),
        sa.Column("confidence_score", sa.Float(), nullable=True),
        sa.Column("latency_ms", sa.Integer(), nullable=True),
        sa.Column("token_usage", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "success", "failed", "cache_hit", "timeout", "parse_error",
                name="inference_status_enum",
            ),
            nullable=False,
            server_default="success",
        ),
        sa.Column(
            "risk_level",
            sa.Enum("low", "medium", "high", name="risk_tier_enum", create_type=False),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_inference_logs_food_log_id", "ai_inference_logs", ["food_log_id"])
    op.create_index("ix_inference_logs_model_id", "ai_inference_logs", ["model_id"])
    op.create_index("ix_inference_logs_prompt_version_id", "ai_inference_logs", ["prompt_version_id"])
    op.create_index("ix_inference_logs_request_hash", "ai_inference_logs", ["request_hash"])
    # Primary time-series index — most dashboard queries filter on created_at
    op.create_index("ix_inference_logs_created_at", "ai_inference_logs", ["created_at"])
    # Composite index for model-scoped time-series queries
    op.create_index(
        "ix_inference_logs_model_created",
        "ai_inference_logs",
        ["model_id", "created_at"],
    )
    # Partial index: only index rows with a risk level (filters out nulls)
    op.create_index(
        "ix_inference_logs_risk_level",
        "ai_inference_logs",
        ["risk_level"],
        postgresql_where=sa.text("risk_level IS NOT NULL"),
    )

    # ── 5. risk_assessments ───────────────────────────────────────────────────
    op.create_table(
        "risk_assessments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "inference_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("ai_inference_logs.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("risk_score", sa.Integer(), nullable=False),
        sa.Column(
            "risk_level",
            sa.Enum("low", "medium", "high", name="risk_tier_enum", create_type=False),
            nullable=False,
        ),
        sa.Column(
            "reasons",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="[]",
        ),
        sa.Column(
            "evaluated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_risk_assessments_inference_id", "risk_assessments", ["inference_id"])
    op.create_index("ix_risk_assessments_risk_level", "risk_assessments", ["risk_level"])

    # ── 6. human_reviews ──────────────────────────────────────────────────────
    op.create_table(
        "human_reviews",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "inference_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("ai_inference_logs.id", ondelete="RESTRICT"),
            nullable=False,
            unique=True,
        ),
        sa.Column("reviewer_id", sa.String(255), nullable=True),
        sa.Column("original_food_name", sa.String(255), nullable=True),
        sa.Column("corrected_food_name", sa.String(255), nullable=True),
        sa.Column("original_calories", sa.Integer(), nullable=True),
        sa.Column("corrected_calories", sa.Integer(), nullable=True),
        sa.Column("review_notes", sa.Text(), nullable=True),
        # Float storage: 0.0=APPROVED, 0.5=REVIEW_REQUIRED, 1.0=REJECTED
        # Enables SQL rate calculations: AVG(valid_flag), SUM(valid_flag=0.0)/COUNT(*)
        sa.Column("valid_flag", sa.Float(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_human_reviews_inference_id", "human_reviews", ["inference_id"])
    op.create_index("ix_human_reviews_valid_flag", "human_reviews", ["valid_flag"])
    op.create_index("ix_human_reviews_created_at", "human_reviews", ["created_at"])

    # ── 7. Cross-domain link: food_logs ↔ ai_inference_logs ──────────────────
    # Non-breaking: nullable column. Existing rows unaffected.
    # ON DELETE SET NULL: governance audit records outlive nutrition data.
    op.add_column(
        "food_logs",
        sa.Column(
            "inference_log_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("ai_inference_logs.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.create_index("ix_food_logs_inference_log_id", "food_logs", ["inference_log_id"])


def downgrade() -> None:
    # Reverse in opposite dependency order

    op.drop_index("ix_food_logs_inference_log_id", table_name="food_logs")
    op.drop_column("food_logs", "inference_log_id")

    op.drop_table("human_reviews")
    op.drop_table("risk_assessments")
    op.drop_table("ai_inference_logs")
    op.drop_table("prompt_versions")
    op.drop_table("ai_models")

    # Drop ENUMs last — tables must be dropped before their enum columns
    op.execute("DROP TYPE IF EXISTS inference_status_enum")
    op.execute("DROP TYPE IF EXISTS prompt_status_enum")
    op.execute("DROP TYPE IF EXISTS risk_tier_enum")
    op.execute("DROP TYPE IF EXISTS model_status_enum")
    op.execute("DROP TYPE IF EXISTS model_provider_enum")
