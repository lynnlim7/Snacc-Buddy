/**
 * Setup Step 1 — "How do you identify?"
 */
import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { PaperBackground } from "../../components/PaperBackground";
import { PillowButton } from "../../components/PillowButton";
import { OnboardingHeader } from "../../components/OnboardingHeader";
import { colors, fonts, spacing, optionChip, optionChipText } from "../../constants/theme";

const GENDERS = [
  { id: "male",       label: "Male",       emoji: "♂️" },
  { id: "female",     label: "Female",     emoji: "♀️" },
  { id: "non_binary", label: "Non-binary", emoji: "⚧" },
  { id: "prefer_not", label: "Prefer not to say", emoji: "🤍" },
];

export default function GenderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selected, setSelected] = useState<string | null>(null);

  function handleNext() {
    if (!selected) return;
    router.push({ pathname: "/onboarding/age" as any, params: { ...params, gender: selected } });
  }

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <OnboardingHeader step={3} total={16} />
        <View style={styles.content}>
          <Text style={styles.header}>How do you identify?</Text>
          <Text style={styles.microcopy}>This helps personalise your experience</Text>

          <View style={styles.options}>
            {GENDERS.map((g) => (
              <View
                key={g.id}
                style={[optionChip(selected === g.id), styles.option]}
              >
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
        </View>

        <View style={styles.footer}>
          <PillowButton label="Next →" onPress={handleNext} disabled={!selected} />
        </View>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.xl },
  header: { fontFamily: fonts.heading700, fontSize: 42, color: colors.text, lineHeight: 46 },
  microcopy: { fontFamily: fonts.body400, fontSize: 13, color: colors.textMuted, marginTop: -spacing.md },
  options: { gap: spacing.sm },
  option: { alignItems: "flex-start", paddingHorizontal: 20, paddingVertical: 16 },
  optionText: { fontSize: 16 },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
});
