/**
 * Cover Screen — the very first thing a user sees.
 * Looks like the cover of a handwritten food journal.
 */
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { PaperBackground } from "../components/PaperBackground";
import { PillowButton } from "../components/PillowButton";
import { colors, fonts, spacing, radius } from "../constants/theme";

// Decorative food emoji stand-ins — replace with hand-drawn PNG assets
// by importing them and passing to <Image source={require('...')} />
const FOOD_ITEMS = ["🍎", "🥑", "🍊", "🫐", "🥦", "🍋", "🍓", "🥕"];

export default function CoverScreen() {
  const router = useRouter();

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        {/* ── Top decorative band ── */}
        <View style={styles.topBand}>
          <Text style={styles.tagline}>my little food diary</Text>
        </View>

        {/* ── Journal title block ── */}
        <View style={styles.titleBlock}>
          {/* Decorative spine lines */}
          <View style={styles.spineLines}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={styles.spineLine} />
            ))}
          </View>

          <Text style={styles.title}>Snacc</Text>
          <Text style={styles.titleAccent}>Buddy</Text>

          <Text style={styles.subtitle}>
            a cozy place for{"\n"}your daily bites
          </Text>
        </View>

        {/* ── Food illustrations ── */}
        <View style={styles.foodRing}>
          {FOOD_ITEMS.map((emoji, i) => {
            const angle = (i / FOOD_ITEMS.length) * 2 * Math.PI;
            const radiusPx = 90;
            const x = Math.cos(angle) * radiusPx;
            const y = Math.sin(angle) * radiusPx * 0.7;
            return (
              <View
                key={i}
                style={[
                  styles.foodBubble,
                  {
                    transform: [{ translateX: x }, { translateY: y }],
                    // Stagger sizes for organic feel
                    width: i % 2 === 0 ? 52 : 44,
                    height: i % 2 === 0 ? 52 : 44,
                  },
                ]}
              >
                <Text style={{ fontSize: i % 2 === 0 ? 26 : 22 }}>{emoji}</Text>
              </View>
            );
          })}
          {/* Centre journal icon */}
          <View style={styles.journalCenter}>
            <Text style={styles.journalIcon}>📖</Text>
          </View>
        </View>

        {/* ── Bottom CTA area ── */}
        <View style={styles.cta}>
          <View style={styles.btnWrap}>
            <PillowButton
              label="Start"
              onPress={() => router.push("/onboarding/name" as any)}
              variant="accent"
            />
          </View>

          {/* Login row */}
          <View style={styles.loginRow}>
            <Text style={styles.loginPrompt}>Already have an account?</Text>
            <TouchableOpacity
              onPress={() => router.push("/login" as any)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Log in"
            >
              <Text style={styles.loginLink}>Log in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  topBand: {
    alignItems: "center",
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  tagline: {
    fontFamily: fonts.heading400,
    fontSize: 16,
    color: colors.textMuted,
    letterSpacing: 1.2,
  },

  titleBlock: {
    alignItems: "center",
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  spineLines: {
    width: 120,
    gap: 5,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  spineLine: {
    width: "100%",
    height: 1.5,
    backgroundColor: colors.border,
    borderRadius: 1,
  },
  title: {
    fontFamily: fonts.heading700,
    fontSize: 64,
    color: colors.text,
    lineHeight: 64,
    letterSpacing: -1,
  },
  titleAccent: {
    fontFamily: fonts.heading700,
    fontSize: 64,
    color: colors.accent,
    lineHeight: 60,
    letterSpacing: -1,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontFamily: fonts.heading400,
    fontSize: 18,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 26,
    marginTop: spacing.sm,
  },

  // Food ring
  foodRing: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
  },
  foodBubble: {
    position: "absolute",
    borderRadius: radius.pill,
    backgroundColor: colors.bgCard,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  journalCenter: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.bgSecondary,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  journalIcon: { fontSize: 30 },

  // CTA
  cta: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  btnWrap: { width: "100%" },
  loginRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  loginPrompt: {
    fontFamily: fonts.body400,
    fontSize: 14,
    color: colors.textMuted,
  },
  loginLink: {
    fontFamily: fonts.body700,
    fontSize: 14,
    color: colors.accentBorder,
    textDecorationLine: "underline",
  },
});
