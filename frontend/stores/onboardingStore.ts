/**
 * Onboarding state store — persists all user answers so navigating
 * back and forward never loses a selection.
 */
import { create } from "zustand";

interface OnboardingData {
  name: string;
  goal: string;
  mindset: string;
  gender: string;
  age: string;
  height: string;
  currentWeight: string;
  goalWeight: string;
  pace: string;          // 'slow' | 'moderate' | 'fast'
  lifestyle: string;
  hasRestrictions: boolean | null;
  dietary: string[];     // selected diet IDs
  conditions: string[];  // selected health condition IDs
  customCondition: string; // free-text "other" condition
}

interface OnboardingStore extends OnboardingData {
  set: (updates: Partial<OnboardingData>) => void;
  reset: () => void;
}

const DEFAULTS: OnboardingData = {
  name: "",
  goal: "",
  mindset: "",
  gender: "",
  age: "",
  height: "",
  currentWeight: "",
  goalWeight: "",
  pace: "moderate",
  lifestyle: "",
  hasRestrictions: null,
  dietary: [],
  conditions: [],
  customCondition: "",
};

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  ...DEFAULTS,
  set: (updates) => set((state) => ({ ...state, ...updates })),
  reset: () => set(DEFAULTS),
}));
