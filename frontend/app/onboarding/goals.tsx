/**
 * Onboarding Step 2 — "What brings you here?"
 */
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { PaperBackground } from "../../components/PaperBackground";
import { PillowButton } from "../../components/PillowButton";
import { OnboardingHeader } from "../../components/OnboardingHeader";
import {
  colors,
  fonts,
  spacing,
  optionChip,
  optionChipText,
} from "../../constants/theme";

const GOALS = [
  { id: "lose_weight",      label: "Losing weight",                    emoji: "⚖️" },
  { id: "gain_muscle",      label: "Gaining muscle",                   emoji: "💪" },
  { id: "lose_fat",         label: "Losing fat, not weight",           emoji: "🔥" },
  { id: "eat_healthier",    label: "Eating healthier without losing weight", emoji: "🥗" },
];

export default function GoalsScreen() {
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name: string }>();
  const [selected, setSelected] = useState<string | null>(null);

  function handleNext() {
    if (!selected) return;
    router.push({ pathname: "/onboarding/mindset" as any, params: { name, goal: selected } });
  }

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <OnboardingHeader step={1} total={16} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.header}>
            Hi {name || "there"}!{"\n"}What brings you here?
          </Text>
          <Text style={styles.sub}>Choose the one that feels most like you</Text>

          <View style={styles.options}>
            {GOALS.map((g) => (
              <View key={g.id} style={[optionChip(selected === g.id), styles.option]}>
                <Text
                  style={[optionChipText(selected === g.id), styles.optionText]}
                  onPress={() => setSelected(g.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selected === g.id }}
                >
                  {g.emoji}{"  "}{g.label}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PillowButton
            label="Next →"
            onPress={handleNext}
            disabled={!selected}
            variant="accent"
          />
        </View>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    fontFamily: fonts.heading700,
    fontSize: 38,
    color: colors.text,
    lineHeight: 44,
  },
  sub: {
    fontFamily: fonts.heading400,
    fontSize: 18,
    color: colors.textMuted,
    marginTop: -spacing.sm,
  },
  options: { gap: spacing.sm },
  option: { alignItems: "flex-start", paddingHorizontal: 20, paddingVertical: 16 },
  optionText: { fontSize: 16, lineHeight: 22 },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
});
