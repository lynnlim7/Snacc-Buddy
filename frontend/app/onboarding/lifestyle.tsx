/**
 * Setup Step 7 — "What does your everyday life look like?"
 */
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { PaperBackground } from "../../components/PaperBackground";
import { PillowButton } from "../../components/PillowButton";
import { OnboardingHeader } from "../../components/OnboardingHeader";
import { colors, fonts, spacing, optionChip, optionChipText } from "../../constants/theme";

const LIFESTYLES = [
  { id: "student",        label: "Student",               emoji: "📚" },
  { id: "part_time",      label: "Working part-time",     emoji: "⏰" },
  { id: "full_time",      label: "Working full-time",     emoji: "💼" },
  { id: "wfh",            label: "Working from home",     emoji: "🏠" },
  { id: "homemaker",      label: "Stay-at-home parent",   emoji: "🧸" },
  { id: "retired",        label: "Retired",               emoji: "🌅" },
];

export default function LifestyleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selected, setSelected] = useState<string | null>(null);

  function handleNext() {
    if (!selected) return;
    router.push({ pathname: "/onboarding/dietary" as any, params: { ...params, lifestyle: selected } });
  }

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <OnboardingHeader step={9} total={16} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.header}>What does your everyday life look like?</Text>
          <Text style={styles.microcopy}>Your routine helps shape your recommendations</Text>

          <View style={styles.options}>
            {LIFESTYLES.map((l) => (
              <View key={l.id} style={[optionChip(selected === l.id), styles.option]}>
                <Text
                  style={[optionChipText(selected === l.id), styles.optionText]}
                  onPress={() => setSelected(l.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selected === l.id }}
                >
                  {l.emoji}{"  "}{l.label}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PillowButton label="Next →" onPress={handleNext} disabled={!selected} />
        </View>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xl, gap: spacing.lg },
  header: { fontFamily: fonts.heading700, fontSize: 38, color: colors.text, lineHeight: 44 },
  microcopy: { fontFamily: fonts.body400, fontSize: 13, color: colors.textMuted, marginTop: -spacing.md },
  options: { gap: spacing.sm },
  option: { alignItems: "flex-start", paddingHorizontal: 20, paddingVertical: 16 },
  optionText: { fontSize: 16 },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
});
