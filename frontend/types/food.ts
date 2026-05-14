export interface Ingredient {
  name: string;
  amount: string;
}

export interface MacroNutrients {
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
}

export interface FoodLog {
  id: string;
  user_id: string;
  food_name: string;
  ingredients: Ingredient[];
  serving_size: string | null;
  origin: string | null;
  calories: number;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  confidence: number | null;
  notes: string | null;
  image_url: string | null;
  created_at: string;
}

export interface FoodLogList {
  items: FoodLog[];
  total: number;
}

export interface DailySummary {
  date: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  meal_count: number;
}

export interface WeeklySummary {
  week: DailySummary[];
}
