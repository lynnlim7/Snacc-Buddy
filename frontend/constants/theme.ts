import { Platform } from "react-native";
import type { TextStyle, ViewStyle } from "react-native";

// ─── Colour palette ───────────────────────────────────────────
export const colors = {
  // Primary pink
  pink50:  "#FFF5F7",
  pink100: "#FFE4EC",
  pink200: "#FFB3C6",
  pink300: "#FF85A1",
  pink400: "#FF6B8B",
  pink500: "#E8607A",
  pink600: "#D4506A",

  // Accent colours (matching landing page)
  mint:     "#A8E6CF",
  mintBorder: "#7ECFB0",
  lavender:  "#D4B8E0",
  lavenderBorder: "#B89DD0",
  peach:    "#FFD3A5",
  peachBorder: "#FFBA7A",
  lemon:    "#FFEAA7",
  lemonBorder: "#FFD97A",

  // Text
  textDark:  "#2D1B2E",
  textMid:   "#6B3A4E",
  textMuted: "#A07890",

  // Neutral
  white: "#FFFFFF",
  bg:    "#FFF5F7",
} as const;

// ─── Typography ───────────────────────────────────────────────
export const fonts = {
  heading400: "Baloo2_400Regular",
  heading600: "Baloo2_600SemiBold",
  heading700: "Baloo2_700Bold",
  heading800: "Baloo2_800ExtraBold",
  body400: "Nunito_400Regular",
  body500: "Nunito_500Medium",
  body600: "Nunito_600SemiBold",
  body700: "Nunito_700Bold",
} as const;

// ─── Clay card helper ─────────────────────────────────────────
// On iOS the offset shadow gives the clay pop; Android uses the border alone.
type ClayVariant = "pink" | "mint" | "lavender" | "peach" | "lemon";

const clayBorderColors: Record<ClayVariant, string> = {
  pink:     colors.pink200,
  mint:     colors.mintBorder,
  lavender: colors.lavenderBorder,
  peach:    colors.peachBorder,
  lemon:    colors.lemonBorder,
};

export function clayCard(variant: ClayVariant = "pink"): ViewStyle {
  const border = clayBorderColors[variant];
  return {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: border,
    ...Platform.select({
      ios: {
        shadowColor: border,
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 1,
        shadowRadius: 0,
      },
      android: { elevation: 3 },
    }),
  };
}

// ─── Clay button ──────────────────────────────────────────────
export const clayButton: ViewStyle = {
  backgroundColor: colors.pink300,
  borderRadius: 14,
  borderWidth: 2.5,
  borderColor: colors.pink600,
  paddingVertical: 14,
  alignItems: "center",
  ...Platform.select({
    ios: {
      shadowColor: colors.pink600,
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 0,
    },
    android: { elevation: 4 },
  }),
};

export const clayButtonText: TextStyle = {
  color: colors.white,
  fontFamily: fonts.heading700,
  fontSize: 16,
};

export const clayButtonOutline: ViewStyle = {
  backgroundColor: colors.white,
  borderRadius: 14,
  borderWidth: 2.5,
  borderColor: colors.pink200,
  paddingVertical: 14,
  alignItems: "center",
  ...Platform.select({
    ios: {
      shadowColor: colors.pink200,
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 0,
    },
    android: { elevation: 2 },
  }),
};

export const clayButtonOutlineText: TextStyle = {
  color: colors.pink500,
  fontFamily: fonts.heading700,
  fontSize: 16,
};
