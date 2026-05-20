import { Platform } from "react-native";
import type { TextStyle, ViewStyle } from "react-native";

// ─── Colour palette ───────────────────────────────────────────
export const colors = {
  // Journal backgrounds
  bg:           "#F8F3EA", // Parchment — main background
  bgSecondary:  "#FFFDF8", // Off-white paper — cards / input fields
  bgCard:       "#FFF9F0", // Warm white for floating cards

  // Text
  text:         "#4A4036", // Warm dark brown — primary text
  textMuted:    "#9B8578", // Muted warm — secondary text
  textLight:    "#C4AFA6", // Light — hints, placeholders

  // Brand accents
  accent:       "#E8B98A", // Warm peach — primary CTA
  accentBorder: "#C89B7B", // Light brown — button shadow / border
  accentDark:   "#A87855", // Dark brown — pressed state

  // Palette accents
  softPink:       "#F3D6D0", // Soft pink — secondary selections
  softPinkBorder: "#DEB8B0", // Soft pink border
  matcha:         "#C8D5B9", // Matcha green — success / healthy
  matchaBorder:   "#A8BC95", // Matcha border
  lightBrown:     "#C89B7B", // Light brown — neutral accents

  // Utility
  white:  "#FFFDF8",
  error:  "#D97B78", // Soft red — error states
  border: "#E8DDD2", // Warm border dividers
} as const;

// ─── Typography (Caveat = handwritten headings, Nunito = friendly body) ────
export const fonts = {
  heading400: "Caveat_400Regular",
  heading600: "Caveat_600SemiBold",
  heading700: "Caveat_700Bold",
  body400:    "Nunito_400Regular",
  body500:    "Nunito_500Medium",
  body600:    "Nunito_600SemiBold",
  body700:    "Nunito_700Bold",
} as const;

// ─── Spacing scale ─────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ─── Border radius ─────────────────────────────────────────────
export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  pill: 100,
} as const;

// ─── Pillow button — main CTA ─────────────────────────────────
// Soft, rounded, with a hard offset shadow for "physical" feel
export function pillowButton(
  variant: "accent" | "pink" | "matcha" | "outline" = "accent"
): ViewStyle {
  const map = {
    accent:  { bg: colors.accent,     border: colors.accentBorder, shadow: colors.accentBorder },
    pink:    { bg: colors.softPink,   border: colors.softPinkBorder, shadow: colors.softPinkBorder },
    matcha:  { bg: colors.matcha,     border: colors.matchaBorder, shadow: colors.matchaBorder },
    outline: { bg: colors.bgSecondary, border: colors.border, shadow: colors.border },
  };
  const { bg, border, shadow } = map[variant];
  return {
    backgroundColor: bg,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: border,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
    ...Platform.select({
      ios: {
        shadowColor: shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 0,
      },
      android: { elevation: 4 },
    }),
  };
}

export const pillowButtonText: TextStyle = {
  fontFamily: fonts.heading700,
  fontSize: 20,
  color: colors.text,
  letterSpacing: 0.3,
};

// ─── Journal card ─────────────────────────────────────────────
export function journalCard(tinted: boolean = false): ViewStyle {
  return {
    backgroundColor: tinted ? colors.bgCard : colors.bgSecondary,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.accentBorder,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  };
}

// ─── Input field ──────────────────────────────────────────────
export const inputStyle: ViewStyle = {
  backgroundColor: colors.bgSecondary,
  borderRadius: radius.md,
  borderWidth: 1.5,
  borderColor: colors.border,
  paddingHorizontal: spacing.md,
  paddingVertical: 14,
  ...Platform.select({
    ios: {
      shadowColor: colors.accentBorder,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: { elevation: 1 },
  }),
};

// ─── Option chip — selectable choice pill ─────────────────────
export function optionChip(selected: boolean): ViewStyle {
  return {
    backgroundColor: selected ? colors.accent : colors.bgSecondary,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: selected ? colors.accentBorder : colors.border,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: selected ? colors.accentBorder : "#00000015",
        shadowOffset: { width: 0, height: selected ? 3 : 1 },
        shadowOpacity: selected ? 0.5 : 0.1,
        shadowRadius: 0,
      },
      android: { elevation: selected ? 3 : 1 },
    }),
  };
}

export function optionChipText(selected: boolean): TextStyle {
  return {
    fontFamily: fonts.body600,
    fontSize: 15,
    color: selected ? colors.text : colors.textMuted,
  };
}

// ─── Microcopy messages ───────────────────────────────────────
export const microcopy = {
  loading: "Flipping through your diary..",
  success: "Added to today's page!",
  error:   "Oops, please try again",
  saving:  "Pressing today's memory..",
  welcome: "Opening your diary..",
} as const;
