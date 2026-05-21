import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class Ingredient(BaseModel):
    name: str
    confidence: float | None = None

class Quantity(BaseModel):
    value: float
    unit: str


class MacroNutrients(BaseModel):
    protein_g: float | None = None
    carbs_g: float | None = None
    fat_g: float | None = None
    fibre_g: float | None = None
    sugar_g: float | None = None
    sodium_g: float | None = None


class GeminiAnalysis(BaseModel):
    food_name: str
    serving_size: str | None = None
    estimated_quantity: Quantity | None = None
    preparation_method: str | None = None
    ingredients: list[Ingredient] = []
    possible_alternatives: list[str] = []
    visible_sauces_or_oils: bool = False
    cuisine_type: str | None = None
    restaurant_or_brand: str | None = None
    serving_size: str | None = None
    origin: str | None = None
    estimated_total_calories: int
    macros: MacroNutrients = Field(default_factory=MacroNutrients)
    confidence: float = Field(ge=0.0, le=1.0)
    ambiguity_flags: list[str] = []
    notes: str | None = None


class FoodLogCreate(BaseModel):
    user_id: str
    image_url: str | None = None
    analysis: GeminiAnalysis

