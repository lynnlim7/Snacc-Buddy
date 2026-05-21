import axios from "axios";
import { config } from "../config";
import { getToken } from "../stores/authStore";
import { UserProfile } from "../stores/userStore";
import { DailySummary, FoodLog, FoodLogList, WeeklySummary } from "../types/food";

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
};

export const foodApi = {
  analyzeImage: async (imageUri: string): Promise<FoodLog> => {
    const form = new FormData();

    if (config.platformMode === "web") {
      const res = await fetch(imageUri);
      const blob = await res.blob();
      form.append("image", blob, "food.jpg");
    } else {
      form.append("image", {
        uri: imageUri,
        type: "image/jpeg",
        name: "food.jpg",
      } as unknown as Blob);
    }

    const { data } = await client.post<FoodLog>("/api/v1/food/analyze", form);
    return data;
  },

  getLogs: async (userId: string, limit = 20, offset = 0): Promise<FoodLogList> => {
    const { data } = await client.get<FoodLogList>("/api/v1/food/logs", {
      params: { user_id: userId, limit, offset },
    });
    return data;
  },

  getLog: async (userId: string, logId: string): Promise<FoodLog> => {
    const { data } = await client.get<FoodLog>(`/api/v1/food/logs/${logId}`, {
      params: { user_id: userId },
    });
    return data;
  },

  getDailySummary: async (userId: string, date?: string): Promise<DailySummary> => {
    const { data } = await client.get<DailySummary>("/api/v1/analytics/daily", {
      params: { user_id: userId, target_date: date },
    });
    return data;
  },

  getWeeklySummary: async (userId: string): Promise<WeeklySummary> => {
    const { data } = await client.get<WeeklySummary>("/api/v1/analytics/weekly", {
      params: { user_id: userId },
    });
    return data;
  },
};
