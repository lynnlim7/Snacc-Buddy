import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class Ingredient(BaseModel):
    name: str
    amount: str


class MacroNutrients(BaseModel):
    protein_g: float | None = None
    carbs_g: float | None = None
    fat_g: float | None = None


class GeminiAnalysis(BaseModel):
    food_name: str
    ingredients: list[Ingredient]
    serving_size: str | None = None
    origin: str | None = None
    calories: int
    macros: MacroNutrients = Field(default_factory=MacroNutrients)
    confidence: float = Field(ge=0.0, le=1.0, default=0.8)
    notes: str | None = None


class FoodLogCreate(BaseModel):
    user_id: str
    image_url: str | None = None
    analysis: GeminiAnalysis


class FoodLogResponse(BaseModel):
    id: uuid.UUID
    user_id: str
    food_name: str
    ingredients: list[Ingredient]
    serving_size: str | None
    origin: str | None
    calories: int
    protein_g: float | None
    carbs_g: float | None
    fat_g: float | None
    confidence: float | None
    notes: str | None
    image_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class FoodLogList(BaseModel):
    items: list[FoodLogResponse]
    total: int
