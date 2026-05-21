import { create } from "zustand";

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  gender: string | null;
  age: number | null;
  height_cm: number | null;
  current_weight_kg: number | null;
  goal_weight_kg: number | null;
  goal: string | null;
  lifestyle: string | null;
  has_dietary_restrictions: boolean | null;
  has_conditions: boolean | null;
  condition_type: string | null;
}

interface UserStore {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;
  clear: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  clear: () => set({ profile: null }),
}));

export const getUserProfile = () => useUserStore.getState().profile;
