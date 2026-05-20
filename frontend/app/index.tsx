/**
 * Cover Screen — journal cover, first thing a user sees.
 */
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { PaperBackground } from "../components/PaperBackground";
import { PillowButton } from "../components/PillowButton";
import { colors, fonts, spacing } from "../constants/theme";

export default function CoverScreen() {
  const router = useRouter();

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>

        {/* ── Title block ── */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Snacc Buddy</Text>
          <Text style={styles.subtitle}>a cozy place for your daily bites</Text>
        </View>

        {/* ── Illustration area — swap View for Image once assets are ready ── */}
        <View style={styles.illustrationArea}>
          {/* Place hand-drawn food illustrations here:
              <Image source={require('../assets/illustrations/food-spread.png')}
                     style={styles.illustration} resizeMode="contain" /> */}
        </View>

        {/* ── Bottom CTA ── */}
        <View style={styles.cta}>
          <PillowButton
            label="Start"
            onPress={() => router.push("/onboarding/name" as any)}
            variant="pink"
          />

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

  titleBlock: {
    alignItems: "center",
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.heading700,
    fontSize: 64,
    color: colors.text,
    letterSpacing: -1,
    lineHeight: 68,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: fonts.heading400,
    fontSize: 18,
    color: colors.textMuted,
    textAlign: "center",
  },

  // Hand-drawn illustration placeholder — takes up the centre space
  illustrationArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  cta: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
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
    color: colors.softPink,
    textDecorationLine: "underline",
  },
});
