import { UserProfile } from "../stores/userStore";

export interface NutritionTargets {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface BMIResult {
  value: number;           // rounded to 1 decimal
  category: string;        // "Underweight" | "Normal" | "Overweight" | "Obese" | "Severely obese"
  calorieAdjustment: number; // kcal added to TDEE (negative = deficit)
}

/** Classify BMI and return the calorie adjustment to apply to TDEE. */
export function computeBMI(weight_kg: number, height_cm: number): BMIResult {
  const heightM = height_cm / 100;
  const value = weight_kg / (heightM * heightM);

  let category: string;
  let calorieAdjustment: number;

  if (value < 16) {
    category = "Severely underweight";
    calorieAdjustment = 700;
  } else if (value < 18.5) {
    category = "Underweight";
    calorieAdjustment = 400;
  } else if (value < 25) {
    category = "Normal";
    calorieAdjustment = 0;
  } else if (value < 30) {
    category = "Overweight";
    calorieAdjustment = -400;
  } else if (value < 35) {
    category = "Obese";
    calorieAdjustment = -600;
  } else {
    category = "Severely obese";
    calorieAdjustment = -750;
  }

  return { value: Math.round(value * 10) / 10, category, calorieAdjustment };
}

/**
 * Compute daily nutrition targets.
 *
 * Energy baseline: Mifflin-St Jeor BMR × activity multiplier (TDEE).
 * Calorie goal:    TDEE adjusted by BMI category — not by user-stated goal.
 *   Normal BMI     → maintenance (no adjustment)
 *   Overweight     → −400 kcal deficit
 *   Obese          → −600 kcal deficit
 *   Severely obese → −750 kcal deficit
 *   Underweight    → +400 kcal surplus
 * Macro split: Protein 30% · Carbs 40% · Fat 30% of total calories.
 */
export function computeNutritionTargets(profile: UserProfile | null): NutritionTargets {
  const fallback: NutritionTargets = { calories: 2000, protein_g: 150, carbs_g: 200, fat_g: 67 };
  if (!profile) return fallback;

  const { gender, age, height_cm, current_weight_kg, lifestyle } = profile;
  if (!age || !height_cm || !current_weight_kg) return fallback;

  // Mifflin-St Jeor BMR
  const genderOffset = gender === "male" ? 5 : gender === "female" ? -161 : -78;
  const bmr = 10 * current_weight_kg + 6.25 * height_cm - 5 * age + genderOffset;

  // Activity-adjusted TDEE
  const activityMultiplier: Record<string, number> = {
    wfh: 1.2, retired: 1.2, full_time: 1.375, part_time: 1.375,
    student: 1.55, homemaker: 1.55,
  };
  const tdee = bmr * (activityMultiplier[lifestyle ?? ""] ?? 1.375);

  // BMI-driven calorie adjustment
  const { calorieAdjustment } = computeBMI(current_weight_kg, height_cm);
  const calories = Math.max(1200, Math.round(tdee + calorieAdjustment));

  return {
    calories,
    protein_g: Math.round((calories * 0.30) / 4),
    carbs_g:   Math.round((calories * 0.40) / 4),
    fat_g:     Math.round((calories * 0.30) / 9),
  };
}

/** Convenience wrapper — calorie goal only (preserves existing callers). */
export function computeCalorieGoal(profile: UserProfile | null): number {
  return computeNutritionTargets(profile).calories;
}
