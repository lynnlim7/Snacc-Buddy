import { create } from "zustand";
import { AnalyzeResponse, DailySummary, FoodLogResponse, WeeklySummary } from "../types/food";
import { foodApi } from "../services/api";

const DEFAULT_USER_ID = "guest";

interface FoodState {
  userId: string;
  logs: FoodLogResponse[];
  logsTotal: number;
  logsOffset: number;
  isLoadingLogs: boolean;

  isAnalyzing: boolean;
  lastAnalyzed: AnalyzeResponse | null;

  dailySummary: DailySummary | null;
  weeklySummary: WeeklySummary | null;
  isLoadingAnalytics: boolean;

  error: string | null;
}

interface FoodActions {
  setUserId: (id: string) => void;
  analyzeImage: (imageUri: string) => Promise<AnalyzeResponse | null>;
  fetchLogs: (reset?: boolean) => Promise<void>;
  fetchMoreLogs: () => Promise<void>;
  fetchDailySummary: (date?: string) => Promise<void>;
  fetchWeeklySummary: () => Promise<void>;
  clearError: () => void;
}

export const useFoodStore = create<FoodState & FoodActions>((set, get) => ({
  userId: DEFAULT_USER_ID,
  logs: [],
  logsTotal: 0,
  logsOffset: 0,
  isLoadingLogs: false,

  isAnalyzing: false,
  lastAnalyzed: null,

  dailySummary: null,
  weeklySummary: null,
  isLoadingAnalytics: false,

  error: null,

  setUserId: (id) => set({ userId: id }),

  analyzeImage: async (imageUri) => {
    set({ isAnalyzing: true, error: null });
    try {
      const response = await foodApi.analyzeImage(imageUri);
      set({ isAnalyzing: false, lastAnalyzed: response });
      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      set({ isAnalyzing: false, error: message });
      return null;
    }
  },

  fetchLogs: async (reset = true) => {
    set({ isLoadingLogs: true, error: null });
    try {
      const offset = reset ? 0 : get().logsOffset;
      const { items, total } = await foodApi.getLogs(20, offset);
      set({
        isLoadingLogs: false,
        logs: reset ? items : [...get().logs, ...items],
        logsTotal: total,
        logsOffset: offset + items.length,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load logs";
      set({ isLoadingLogs: false, error: message });
    }
  },

  fetchMoreLogs: async () => {
    const { logsOffset, logsTotal, isLoadingLogs } = get();
    if (isLoadingLogs || logsOffset >= logsTotal) return;
    await get().fetchLogs(false);
  },

  fetchDailySummary: async (date) => {
    set({ isLoadingAnalytics: true, error: null });
    try {
      const summary = await foodApi.getDailySummary(date);
      set({ isLoadingAnalytics: false, dailySummary: summary });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load summary";
      set({ isLoadingAnalytics: false, error: message });
    }
  },

  fetchWeeklySummary: async () => {
    set({ isLoadingAnalytics: true, error: null });
    try {
      const summary = await foodApi.getWeeklySummary();
      set({ isLoadingAnalytics: false, weeklySummary: summary });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load weekly data";
      set({ isLoadingAnalytics: false, error: message });
    }
  },

  clearError: () => set({ error: null }),
}));
