type PlatformMode = "web" | "app";

function getPlatformMode(): PlatformMode {
  const mode = process.env.EXPO_PUBLIC_PLATFORM_MODE;
  if (mode === "web" || mode === "app") return mode;
  return "app";
}

export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000",
  platformMode: getPlatformMode(),
} as const;
