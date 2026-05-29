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
