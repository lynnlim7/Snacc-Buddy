import axios from "axios";
import { DailySummary, FoodLog, FoodLogList, WeeklySummary } from "../types/food";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

const client = axios.create({ baseURL: BASE_URL });

export const foodApi = {
  analyzeImage: async (userId: string, imageUri: string): Promise<FoodLog> => {
    const form = new FormData();
    form.append("image", {
      uri: imageUri,
      type: "image/jpeg",
      name: "food.jpg",
    } as unknown as Blob);

    const { data } = await client.post<FoodLog>(
      `/api/v1/food/analyze?user_id=${encodeURIComponent(userId)}`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
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
