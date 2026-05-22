import { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Caveat_400Regular,
  Caveat_600SemiBold,
  Caveat_700Bold,
} from "@expo-google-fonts/caveat";
import {
  useFonts as useNunitoFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from "@expo-google-fonts/nunito";
import { colors } from "../constants/theme";
import { useAuthStore } from "../stores/authStore";
import { useUserStore } from "../stores/userStore";
import { authApi } from "../services/api";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const router = useRouter();

  const [caveatLoaded] = useFonts({
    Caveat_400Regular,
    Caveat_600SemiBold,
    Caveat_700Bold,
  });

  const [nunitoLoaded] = useNunitoFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  // Once fonts are ready, restore session from SecureStore
  useEffect(() => {
    if (!caveatLoaded || !nunitoLoaded) return;

    (async () => {
      const token = await useAuthStore.getState().loadFromStorage();
      if (token) {
        try {
          const me = await authApi.getMe();
          useUserStore.getState().setProfile(me);
        } catch {
          // Token expired or invalid — clear it so the user goes to login
          useAuthStore.getState().clear();
        }
      }
      setReady(true);
    })();
  }, [caveatLoaded, nunitoLoaded]);

  // After initialization, navigate to tabs if a valid session exists
  useEffect(() => {
    if (!ready) return;

    (async () => {
      if (useAuthStore.getState().token) {
        router.replace("/(tabs)" as any);
      }
      await SplashScreen.hideAsync();
    })();
  }, [ready]);

  if (!caveatLoaded || !nunitoLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: "fade_from_bottom",
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
