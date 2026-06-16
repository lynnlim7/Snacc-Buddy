import { UserProfile } from "../stores/userStore";

/** Compute TDEE-based daily calorie goal using Mifflin-St Jeor BMR. */
export function computeCalorieGoal(profile: UserProfile | null): number {
  if (!profile) return 2000;
  const { gender, age, height_cm, current_weight_kg, goal, lifestyle } = profile;
  if (!age || !height_cm || !current_weight_kg) return 2000;

  const genderOffset = gender === "male" ? 5 : gender === "female" ? -161 : -78;
  const bmr = 10 * current_weight_kg + 6.25 * height_cm - 5 * age + genderOffset;

  const activityMultiplier: Record<string, number> = {
    wfh: 1.2, retired: 1.2, full_time: 1.375, part_time: 1.375,
    student: 1.55, homemaker: 1.55,
  };
  const tdee = Math.round(bmr * (activityMultiplier[lifestyle ?? ""] ?? 1.375));

  const goalAdjustment: Record<string, number> = {
    lose_weight: -500, lose_fat: -300, gain_muscle: +300, eat_healthier: 0,
  };
  return Math.max(1200, tdee + (goalAdjustment[goal ?? ""] ?? 0));
}
