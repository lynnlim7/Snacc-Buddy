import uuid
from typing import Literal

from pydantic import BaseModel, Field


class CoachMessage(BaseModel):
    """One turn in the coaching conversation."""

    role: Literal["user", "coach"]
    content: str


class CoachRecipe(BaseModel):
    """A recipe suggestion surfaced inside a coach reply.

    Macro fields are optional so the model can omit what it cannot estimate.
    Until the RAG Recipe Knowledge Base lands these are model-generated
    suggestions; the shape matches the planned retrieval output so the
    frontend does not change when real retrieval is wired in.
    """

    title: str
    tags: list[str] = []
    calories: int | None = None
    protein_g: float | None = None
    carbs_g: float | None = None
    fat_g: float | None = None
    time_minutes: int | None = None
    reason: str | None = None


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
