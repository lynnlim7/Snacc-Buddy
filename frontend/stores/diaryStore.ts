/**
 * Diary store — manages daily meal entries, calorie totals and streak.
 * Each MealEntry groups food photos under a single meal type.
 */
import { create } from "zustand";
import { foodApi } from "../services/api";
import { FoodLogResponse } from "../types/food";

export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack" | "Dessert" | "Supper";

export interface NutritionInfo {
  calories: number;
  /** Dot level 0–5 (calculated from grams vs daily targets) */
  proteinDots: number;
  carbsDots: number;
  fatDots: number;
  fiberDots: number;
  /** Raw gram values for reference */
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
}

export interface FoodPhoto {
  id: string;
  uri: string;
  name: string; // auto-detected or user-entered
  nutrition: NutritionInfo;
}

export interface MealEntry {
  id: string;
  type: MealType;
  photos: FoodPhoto[]; // max 5
  totalCalories: number;
  /** Selected mood stickers for this meal */
  mood: string[];
  /** Free-text diary note */
  note: string;
}

interface DiaryState {
  /** Key = "YYYY-MM-DD", value = meals for that day */
  mealsByDate: Record<string, MealEntry[]>;
  streak: number;
  setStreak: (n: number) => void;

  getMealsForDate: (date: string) => MealEntry[];
  getTotalCaloriesForDate: (date: string) => number;
  addMeal: (date: string, meal: MealEntry) => void;
  deleteMeal: (date: string, mealId: string) => void;
  addPhotoToMeal: (date: string, mealId: string, photo: FoodPhoto) => void;
  deletePhotoFromMeal: (date: string, mealId: string, photoId: string) => void;
  updateMealName: (date: string, mealId: string, photoId: string, name: string) => void;
  updateMealMood: (date: string, mealId: string, mood: string[]) => void;
  updateMealNote: (date: string, mealId: string, note: string) => void;
  loadLogsFromBackend: (date: string) => Promise<void>;
}

export const useDiaryStore = create<DiaryState>((set, get) => ({
  mealsByDate: {},
  streak: 0,
  setStreak: (n) => set({ streak: n }),

  getMealsForDate: (date) => get().mealsByDate[date] ?? [],

  getTotalCaloriesForDate: (date) =>
    (get().mealsByDate[date] ?? []).reduce((sum, m) => sum + m.totalCalories, 0),

  addMeal: (date, meal) =>
    set((state) => ({
      mealsByDate: {
        ...state.mealsByDate,
        [date]: [...(state.mealsByDate[date] ?? []), meal],
      },
    })),

  deleteMeal: (date, mealId) =>
    set((state) => ({
      mealsByDate: {
        ...state.mealsByDate,
        [date]: (state.mealsByDate[date] ?? []).filter((m) => m.id !== mealId),
      },
    })),

  addPhotoToMeal: (date, mealId, photo) =>
    set((state) => {
      const meals = state.mealsByDate[date] ?? [];
      return {
        mealsByDate: {
          ...state.mealsByDate,
          [date]: meals.map((m) => {
            if (m.id !== mealId) return m;
            const newPhotos = [...m.photos, photo].slice(0, 5); // max 5
            return {
              ...m,
              photos: newPhotos,
              totalCalories: newPhotos.reduce((s, p) => s + p.nutrition.calories, 0),
            };
          }),
        },
      };
    }),

  deletePhotoFromMeal: (date, mealId, photoId) =>
    set((state) => {
      const meals = state.mealsByDate[date] ?? [];
      return {
        mealsByDate: {
          ...state.mealsByDate,
          [date]: meals.map((m) => {
            if (m.id !== mealId) return m;
            const newPhotos = m.photos.filter((p) => p.id !== photoId);
            return {
              ...m,
              photos: newPhotos,
              totalCalories: newPhotos.reduce((s, p) => s + p.nutrition.calories, 0),
            };
          }),
        },
      };
    }),

  updateMealName: (date, mealId, photoId, name) =>
    set((state) => {
      const meals = state.mealsByDate[date] ?? [];
      return {
        mealsByDate: {
          ...state.mealsByDate,
          [date]: meals.map((m) => {
            if (m.id !== mealId) return m;
            return {
              ...m,
              photos: m.photos.map((p) =>
                p.id === photoId ? { ...p, name } : p
              ),
            };
          }),
        },
      };
    }),

  updateMealMood: (date, mealId, mood) =>
    set((state) => ({
      mealsByDate: {
        ...state.mealsByDate,
        [date]: (state.mealsByDate[date] ?? []).map((m) =>
          m.id !== mealId ? m : { ...m, mood }
        ),
      },
    })),

  updateMealNote: (date, mealId, note) =>
    set((state) => ({
      mealsByDate: {
        ...state.mealsByDate,
        [date]: (state.mealsByDate[date] ?? []).map((m) =>
          m.id !== mealId ? m : { ...m, note }
        ),
      },
    })),

  loadLogsFromBackend: async (date) => {
    const { items } = await foodApi.getLogs(100, 0);
    const forDate = items.filter((log) => log.created_at.startsWith(date));
    set((state) => {
      return {
        mealsByDate: {
          ...state.mealsByDate,
          [date]: forDate.map((log) => foodLogToMealEntry(log)),
        },
      };
    });
  },
}));

// ─── Helpers ──────────────────────────────────────────────────

/** Today's date string in YYYY-MM-DD */
export function todayKey(): string {
  return new Date().toISOString().split("T")[0];
}

/** Convert macro grams → 0–5 dot level */
export function calcDots(
  gram: number,
  dailyTarget: number
): number {
  return Math.min(5, Math.ceil((gram / dailyTarget) * 5));
}

// Typical daily targets (generic — will come from user profile later)
export const DAILY_TARGETS = {
  protein_g: 150,
  carbs_g:   250,
  fat_g:     65,
  fiber_g:   30,
};

function foodLogToMealEntry(log: FoodLogResponse): MealEntry {
  const name      = log.meal_name ?? "Unknown food";
  const calories  = log.estimated_total_calories;
  const protein_g = log.protein_g ?? 0;
  const carbs_g   = log.carbs_g   ?? 0;
  const fat_g     = log.fat_g     ?? 0;
  return {
    id:   log.id,
    type: (log.meal_type.charAt(0).toUpperCase() + log.meal_type.slice(1)) as MealType,
    photos: [{
      id:   log.id,
      uri:  "",   // no device-local URI for persisted entries; PolaroidStrip shows placeholder
      name,
      nutrition: {
        calories,
        protein_g,
        carbs_g,
        fat_g,
        fiber_g:     0,
        proteinDots: calcDots(protein_g, DAILY_TARGETS.protein_g),
        carbsDots:   calcDots(carbs_g,   DAILY_TARGETS.carbs_g),
        fatDots:     calcDots(fat_g,     DAILY_TARGETS.fat_g),
        fiberDots:   0,
      },
    }],
    totalCalories: calories,
    mood: log.mood ?? [],
    note: log.notes ?? "",
  };
}
