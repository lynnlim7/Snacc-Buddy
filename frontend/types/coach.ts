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
