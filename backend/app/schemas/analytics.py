from datetime import date

from pydantic import BaseModel


class DailySummaryResponse(BaseModel):
    date: date
    total_calories: float
    total_protein_g: float
    total_carbs_g: float
    total_fat_g: float
    meal_count: int


class WeeklySummaryResponse(BaseModel):
    week: list[DailySummaryResponse]


class NutritionTargetsResponse(BaseModel):
    """Daily nutrition targets derived from the user's profile.

    Computed on-the-fly using Mifflin-St Jeor BMR + activity multiplier +
    goal adjustment. Macro split: Protein 30% · Carbs 40% · Fat 30%.
    """
    calorie_target: int
    protein_target_g: float
    carbs_target_g: float
    fat_target_g: float
