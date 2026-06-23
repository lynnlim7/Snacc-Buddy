import { create } from "zustand";
import { coachApi } from "../services/api";
import { CoachInsight } from "../types/coach";

interface CoachState {
  insights: CoachInsight | null;
  insightsLoading: boolean;
  insightsError: string | null;

  loadInsights: () => Promise<void>;
  refreshInsights: () => Promise<void>;
}

export const useCoachStore = create<CoachState>((set) => ({
  insights: null,
  insightsLoading: false,
  insightsError: null,

  loadInsights: async () => {
    set({ insightsLoading: true, insightsError: null });
    try {
      const data = await coachApi.getInsights();
      set({ insights: data, insightsLoading: false });
    } catch (err: any) {
      const is404 = err?.response?.status === 404;
      set({
        insightsLoading: false,
        insightsError: is404 ? null : "Failed to load insights",
        insights: is404 ? null : null,
      });
    }
  },

  refreshInsights: async () => {
    try {
      await coachApi.analyzeNow();
    } catch {
      // Fire-and-forget: if analyze fails, silently skip
    }
    set({ insightsLoading: true, insightsError: null });
    try {
      const data = await coachApi.getInsights();
      set({ insights: data, insightsLoading: false });
    } catch {
      set({ insightsLoading: false });
    }
  },
}));
