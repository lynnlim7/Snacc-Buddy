import uuid
from typing import Literal

from pydantic import BaseModel, Field
from datetime import datetime


class CoachMessage(BaseModel):
    """One turn in the coaching conversation."""

    role: Literal["user", "coach"]
    content: str


class CoachRecipe(BaseModel):
    """A recipe suggestion surfaced inside a coach reply.

    Macro fields are optional so the model can omit what it cannot estimate.
    `recipe_id` is populated only when the recipe comes from the DB knowledge base —
    omit it for model-generated suggestions.
    """

    title: str
    tags: list[str] = []
    calories: int | None = None
    protein_g: float | None = None
    carbs_g: float | None = None
    fat_g: float | None = None
    time_minutes: int | None = None
    reason: str | None = None
    recipe_id: str | None = None


class RecipeMetadataResponse(BaseModel):
    """Lightweight recipe metadata returned by GET /api/v1/recipes/{id}.

    `source_url` is only present when the URL passes provider validation.
    """

    id: str
    title: str
    calories: int | None = None
    protein_g: float | None = None
    carbs_g: float | None = None
    fat_g: float | None = None
    fibre_g: float | None = None
    diet_tags: list[str] = []
    cuisine_type: str | None = None
    source_url: str | None = None


class CoachChatRequest(BaseModel):
    """Full conversation history. The latest user turn is the question to answer."""

    messages: list[CoachMessage] = Field(..., min_length=1)


class CoachChatResponse(BaseModel):
    reply: str
    # False when the question falls outside nutrition/this app's scope — the
    # reply will be a polite redirect rather than an answer.
    in_scope: bool = True
    recipes: list[CoachRecipe] = []
    inference_log_id: uuid.UUID | None = None


class CoachInsightResponse(BaseModel):
    """Serialised output of the deterministic NutritionInsightEngine."""

    protein_deficit: bool
    fibre_deficit: bool
    excess_sodium: bool
    calorie_surplus: bool
    low_meal_consistency: bool
    protein_adherence_pct: float | None = None
    calorie_adherence_pct: float | None = None
    fibre_adherence_pct: float | None = None
    avg_calories_7d: float | None = None
    calorie_target: float | None = None
    computed_at: str
