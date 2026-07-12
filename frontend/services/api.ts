import axios from "axios";
import { config } from "../config";
import { getToken } from "../stores/authStore";
import { UserProfile } from "../stores/userStore";
import { AnalyzeResponse, DailySummary, FoodLogList, FoodLogResponse, GeminiAnalysis, WeeklySummary } from "../types/food";
import { CoachChatResponse, CoachInsight, CoachMessage, RecipeMetadata } from "../types/coach";

const client = axios.create({ baseURL: config.apiUrl });

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  /** fastapi-users login expects OAuth2 form-encoded: username + password */
  login: async (email: string, password: string): Promise<string> => {
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);
    const { data } = await client.post<{ access_token: string }>(
      "/auth/jwt/login",
      form.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    return data.access_token;
  },

  register: async (
    email: string,
    password: string,
    profile: Partial<Omit<UserProfile, "id" | "email">> = {}
  ): Promise<void> => {
    await client.post("/auth/register", { email, password, ...profile });
  },

  getMe: async (): Promise<UserProfile> => {
    const { data } = await client.get<UserProfile>("/users/me");
    return data;
  },

  updateProfile: async (
    updates: Partial<Omit<UserProfile, "id" | "email">>
  ): Promise<UserProfile> => {
    const { data } = await client.patch<UserProfile>("/users/me", updates);
    return data;
  },

  /** Request a verification email to be sent to the given address. */
  requestVerify: async (email: string): Promise<void> => {
    await client.post("/auth/request-verify-token", { email });
  },

  /** Complete email verification with the token from the verification link. */
  verifyEmail: async (token: string): Promise<void> => {
    await client.post("/auth/verify", { token });
  },
};

async function resizeWebBlob(blob: Blob, maxPx = 1920): Promise<Blob> {
  const img = new Image();
  const url = URL.createObjectURL(blob);
  await new Promise<void>((resolve) => { img.onload = () => resolve(); img.src = url; });
  const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  return new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.8)
  );
}

export const foodApi = {
  analyzeImage: async (imageUri: string): Promise<AnalyzeResponse> => {
    const form = new FormData();

    if (config.platformMode === "web") {
      const res = await fetch(imageUri);
      const raw = await res.blob();
      const blob = await resizeWebBlob(raw);
      form.append("image", blob, "food.jpg");
    } else {
      form.append("image", {
        uri: imageUri,
        type: "image/jpeg",
        name: "food.jpg",
      } as unknown as Blob);
    }

    const { data } = await client.post<AnalyzeResponse>("/api/v1/food/analyze", form);
    return data;
  },

  confirmLog: async (payload: {
    meal_type: string;
    image_urls: string[];
    analysis: GeminiAnalysis;
    inference_log_id?: string;
  }): Promise<FoodLogResponse> => {
    const { data } = await client.post<FoodLogResponse>("/api/v1/food/logs", payload);
    return data;
  },

  getLogs: async (limit = 20, offset = 0, date?: string): Promise<FoodLogList> => {
    const { data } = await client.get<FoodLogList>("/api/v1/food/logs", {
      params: { limit, offset, ...(date && { date }) },
    });
    return data;
  },

  getLog: async (logId: string): Promise<FoodLogResponse> => {
    const { data } = await client.get<FoodLogResponse>(`/api/v1/food/logs/${logId}`);
    return data;
  },

  getDailySummary: async (date?: string): Promise<DailySummary> => {
    const { data } = await client.get<DailySummary>("/api/v1/analytics/daily", {
      params: { target_date: date },
    });
    return data;
  },

  getWeeklySummary: async (): Promise<WeeklySummary> => {
    const { data } = await client.get<WeeklySummary>("/api/v1/analytics/weekly");
    return data;
  },

  getStreak: async (): Promise<number> => {
    const { data } = await client.get<{ streak: number }>("/api/v1/analytics/streak");
    return data.streak;
  },

  patchLog: async (logId: string, data: { notes?: string | null; mood?: string[] }): Promise<void> => {
    await client.patch(`/api/v1/food/logs/${logId}`, data);
  },

  deleteLog: async (logId: string): Promise<void> => {
    await client.delete(`/api/v1/food/logs/${logId}`);
  },

  refineAnalysis: async (payload: {
    prior_analysis: GeminiAnalysis;
    messages: Array<{ role: string; content: string }>;
    inference_log_id?: string;
  }): Promise<GeminiAnalysis> => {
    const { data } = await client.post<GeminiAnalysis>("/api/v1/food/chat", payload);
    return data;
  },
};

export const coachApi = {
  /** Ask the AI nutrition coach a question; the full conversation is sent each call. */
  chat: async (messages: CoachMessage[]): Promise<CoachChatResponse> => {
    const { data } = await client.post<CoachChatResponse>(
      "/api/v1/nutrition-coach/chat",
      { messages }
    );
    return data;
  },

  /** Fetch the latest deterministic nutrition insights (computed on every meal log). */
  getInsights: async (): Promise<CoachInsight> => {
    const { data } = await client.get<CoachInsight>("/api/v1/nutrition-coach/insights");
    return data;
  },

  /** On-demand Stage-1 trigger: refreshes memory snapshot, insights, and retrieval. */
  analyzeNow: async (): Promise<{ snapshot_id: string; insights: Record<string, boolean> }> => {
    const { data } = await client.post("/api/v1/nutrition-coach/analyze");
    return data;
  },

  /** Fetch recipe metadata (including validated source_url) for a DB recipe. */
  getRecipeMetadata: async (recipeId: string): Promise<RecipeMetadata> => {
    const { data } = await client.get<RecipeMetadata>(`/api/v1/recipes/${recipeId}`);
    return data;
  },
};
