from dataclasses import dataclass

_ACTIVITY_MULTIPLIER: dict[str, float] = {
    "retired":   1.2,
    "full_time": 1.375,
    "part_time": 1.375,
    "student":   1.55,
    "homemaker": 1.55,
}

_FALLBACK_CALORIES = 2000.0
_FALLBACK_PROTEIN_G = 150.0
_FALLBACK_CARBS_G = 200.0
_FALLBACK_FAT_G = 67.0


@dataclass
class NutritionTargets:
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float


def compute_nutrition_targets(
    gender: str | None,
    age: int | None,
    height_cm: float | None,
    weight_kg: float | None,
    lifestyle: str | None,
) -> NutritionTargets:
    """Mifflin-St Jeor BMR × activity multiplier, adjusted by BMI category.

    Mirrors frontend utils/nutrition.ts computeNutritionTargets so backend
    insight rules and frontend displays agree on the same targets.
    """
    if not (age and height_cm and weight_kg):
        return NutritionTargets(
            calories=_FALLBACK_CALORIES,
            protein_g=_FALLBACK_PROTEIN_G,
            carbs_g=_FALLBACK_CARBS_G,
            fat_g=_FALLBACK_FAT_G,
        )

    gender_offset = 5 if gender == "male" else -161 if gender == "female" else -78
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + gender_offset

    multiplier = _ACTIVITY_MULTIPLIER.get(lifestyle or "", 1.375)
    tdee = bmr * multiplier

    height_m = height_cm / 100
    bmi = weight_kg / (height_m**2)
    if bmi < 16:
        adjustment = 700.0
    elif bmi < 18.5:
        adjustment = 400.0
    elif bmi < 25:
        adjustment = 0.0
    elif bmi < 30:
        adjustment = -400.0
    elif bmi < 35:
        adjustment = -600.0
    else:
        adjustment = -750.0

    calories = max(1200.0, tdee + adjustment)

    return NutritionTargets(
        calories=round(calories),
        protein_g=round((calories * 0.30) / 4),
        carbs_g=round((calories * 0.40) / 4),
        fat_g=round((calories * 0.30) / 9),
    )
