import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

export interface UserProfile {
  id: string;
  email: string;
  is_verified: boolean;
  name: string | null;
  gender: string | null;
  age: number | null;
  height_cm: number | null;
  current_weight_kg: number | null;
  goal_weight_kg: number | null;
  goal: string | null;
  lifestyle: string | null;
  dietary_restrictions: boolean | null;
  dietary_types: string[] | null;
  medical_conditions: boolean | null;
  condition_type: string | null;
}

const PROFILE_KEY = "user_profile";

const storage = {
  get: (): Promise<string | null> =>
    Platform.OS === "web"
      ? Promise.resolve(localStorage.getItem(PROFILE_KEY))
      : SecureStore.getItemAsync(PROFILE_KEY),
  set: (value: string): Promise<void> =>
    Platform.OS === "web"
      ? Promise.resolve(void localStorage.setItem(PROFILE_KEY, value))
      : SecureStore.setItemAsync(PROFILE_KEY, value),
  remove: (): Promise<void> =>
    Platform.OS === "web"
      ? Promise.resolve(void localStorage.removeItem(PROFILE_KEY))
      : SecureStore.deleteItemAsync(PROFILE_KEY),
};

interface UserStore {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;
  clear: () => void;
  loadFromStorage: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
  profile: null,

  setProfile: (profile) => {
    storage.set(JSON.stringify(profile)).catch(() => {});
    set({ profile });
  },

  clear: () => {
    storage.remove().catch(() => {});
    set({ profile: null });
  },

  loadFromStorage: async () => {
    try {
      const raw = await storage.get();
      if (raw) set({ profile: JSON.parse(raw) as UserProfile });
    } catch {
      // corrupted cache — ignore, fresh fetch will overwrite
    }
  },
}));

export const getUserProfile = () => useUserStore.getState().profile;
