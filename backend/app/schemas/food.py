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
    origin: str | None = None
    estimated_total_calories: int
    macros: MacroNutrients = Field(default_factory=MacroNutrients)
    overall_confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    ambiguity_flags: list[str] = []
    notes: str | None = None


class FoodLogList(BaseModel):
    items: list["FoodLogResponse"]
    total: int


class FoodLogCreate(BaseModel):
    user_id: str
    meal_type: str
    image_urls: list[str] = []
    analysis: GeminiAnalysis


class FoodLogConfirm(BaseModel):
    meal_type: str
    image_urls: list[str] = []
    analysis: GeminiAnalysis


class FoodLogUpdate(BaseModel):
    meal_type: str | None = None
    meal_name: str | None = None
    serving_size: str | None = None
    estimated_total_calories: int | None = None
    protein_g: float | None = None
    carbs_g: float | None = None
    fat_g: float | None = None
    notes: str | None = None


class FoodLogResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    user_id: str
    meal_type: str
    meal_name: str | None = None
    ingredients: list
    serving_size: str | None = None
    preparation_method: str | None = None
    estimated_total_calories: int
    protein_g: float | None = None
    carbs_g: float | None = None
    fat_g: float | None = None
    fibre_g: float | None = None
    sugar_g: float | None = None
    sodium_g: float | None = None
    visible_sauces_or_oils: bool = False
    cuisine_type: str | None = None
    restaurant_or_brand: str | None = None
    confidence: float | None = None
    ambiguity_flags: list = []
    notes: str | None = None
    image_url: list = []
    created_at: datetime

