import { Platform } from "react-native";
import type { TextStyle, ViewStyle } from "react-native";

// ─── Colour palette ───────────────────────────────────────────
// Brand swatches:
//   Lemon Soda    #FFFDE9  warm cream     page background (diary paper)
//   Cotton Candy  #FFD7E7  blush pink     cards, inputs, secondary surfaces
//   Hibiscus Tonic#E0A4B0  mauve pink     accents, macro bars, chart fills
//   Cherry Cola   #7C0116  deep wine      primary buttons, active states
//   Deep Cherry   #47131C  near-black wine body text, foreground
export const colors = {
  // Backgrounds
  bg:           "#FFFDE9", // Lemon Soda — warm cream page background
  bgSecondary:  "#FFD7E7", // Cotton Candy — blush inputs, search bars, banners
  bgCard:       "#FFF4F8", // pale blush — content cards

  // Text
  text:         "#47131C", // Deep Cherry — primary text / foreground
  textMuted:    "#8A4A56", // muted wine — secondary text
  textLight:    "#C08A98", // light mauve — hints / placeholders

  // Primary brand — Cherry Cola wine (active states, CTAs, rings)
  primary:       "#7C0116", // Cherry Cola — primary button, active tab, donut fill
  primaryLight:  "#FCE2EA", // pale pink — tag / pill / chip fills
  primaryBorder: "#E0A4B0", // Hibiscus Tonic — borders, macro bars, chart fills

  // Brand accents — CTA = wine
  accent:       "#7C0116", // Cherry Cola — primary CTA
  accentBorder: "#5A0210", // deep wine — button shadow / border
  accentDark:   "#47131C", // Deep Cherry — pressed state

  // Palette accents (blush family)
  softPink:       "#FFD7E7", // Cotton Candy — secondary selections
  softPinkBorder: "#E0A4B0", // Hibiscus Tonic — border
  matcha:         "#C8D5B9", // sage green — success / healthy / fibre
  matchaBorder:   "#A8BC95", // sage border
  lightBrown:     "#E0A4B0", // mauve — neutral accents

  // Selected state (blush) — used by onboarding chips
  pastelBlue:       "#FFD7E7", // Cotton Candy — selected
  pastelBlueBorder: "#E0A4B0", // Hibiscus Tonic — selected border / shadow

  // Utility
  white:  "#FFFFFF",
  error:  "#C0392B", // clear red — distinct from wine primary
  border: "#F2D6DE", // soft blush dividers
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
// Selected = saturated Cotton Candy blush; unselected = palest blush card tint.
export function optionChip(selected: boolean): ViewStyle {
  return {
    backgroundColor: selected ? colors.pastelBlue : colors.bgCard,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: selected ? colors.pastelBlueBorder : colors.border,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: selected ? colors.pastelBlueBorder : "#00000015",
        shadowOffset: { width: 0, height: selected ? 3 : 1 },
        shadowOpacity: selected ? 0.4 : 0.1,
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
