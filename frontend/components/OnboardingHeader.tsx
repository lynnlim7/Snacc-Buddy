import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, fonts, spacing } from "../constants/theme";

interface OnboardingHeaderProps {
  /** 0-based current step */
  step: number;
  /** Total number of setup steps */
  total: number;
  showBack?: boolean;
}

/**
 * Progress dots + optional back arrow for onboarding screens.
 */
export function OnboardingHeader({
  step,
  total,
  showBack = true,
}: OnboardingHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.root}>
      {showBack ? (
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}

      {/* Progress dots */}
      <View style={styles.dots}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === step && styles.dotActive,
              i < step && styles.dotDone,
            ]}
          />
        ))}
      </View>

      {/* Step counter */}
      <Text style={styles.counter}>
        {step + 1}/{total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  placeholder: { width: 22 },
  dots: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  dotDone: {
    backgroundColor: colors.matcha,
  },
  counter: {
    fontFamily: fonts.body400,
    fontSize: 12,
    color: colors.textMuted,
    minWidth: 28,
    textAlign: "right",
  },
});
