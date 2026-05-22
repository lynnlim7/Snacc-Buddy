import { Platform } from "react-native";
import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";

// SecureStore is native-only; fall back to localStorage on web
const storage = {
  get: (key: string): Promise<string | null> =>
    Platform.OS === "web"
      ? Promise.resolve(localStorage.getItem(key))
      : SecureStore.getItemAsync(key),
  set: (key: string, value: string): Promise<void> =>
    Platform.OS === "web"
      ? Promise.resolve(localStorage.setItem(key, value))
      : SecureStore.setItemAsync(key, value),
  remove: (key: string): Promise<void> =>
    Platform.OS === "web"
      ? Promise.resolve(localStorage.removeItem(key))
      : SecureStore.deleteItemAsync(key),
};

interface AuthState {
  token: string | null;
  setToken: (token: string) => void;
  clear: () => void;
  loadFromStorage: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  setToken: (token) => {
    storage.set(TOKEN_KEY, token).catch(() => {});
    set({ token });
  },
  clear: () => {
    storage.remove(TOKEN_KEY).catch(() => {});
    set({ token: null });
  },
  loadFromStorage: async () => {
    const stored = await storage.get(TOKEN_KEY);
    set({ token: stored });
    return stored;
  },
}));

/** Read token outside React components (e.g. axios interceptor) */
export const getToken = () => useAuthStore.getState().token;
