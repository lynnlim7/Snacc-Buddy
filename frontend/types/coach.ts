export interface CoachMessage {
  role: "user" | "coach";
  content: string;
}

export interface CoachRecipe {
  title: string;
  tags: string[];
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  time_minutes?: number | null;
  reason?: string | null;
}

export interface CoachChatResponse {
  reply: string;
  in_scope: boolean;
  recipes: CoachRecipe[];
  inference_log_id?: string | null;
}

export interface CoachInsight {
  protein_deficit: boolean;
  fibre_deficit: boolean;
  excess_sodium: boolean;
  calorie_surplus: boolean;
  low_meal_consistency: boolean;
  protein_adherence_pct?: number | null;
  calorie_adherence_pct?: number | null;
  fibre_adherence_pct?: number | null;
  avg_calories_7d?: number | null;
  calorie_target?: number | null;
  computed_at: string;
}
