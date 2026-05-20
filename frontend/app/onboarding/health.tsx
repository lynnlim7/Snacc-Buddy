/**
 * Setup Step 9 — "Any health conditions we should keep in mind?"
 */
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { PaperBackground } from "../../components/PaperBackground";
import { PillowButton } from "../../components/PillowButton";
import { OnboardingHeader } from "../../components/OnboardingHeader";
import { colors, fonts, spacing, optionChip, optionChipText } from "../../constants/theme";

const CONDITIONS = [
  { id: "hypertension", label: "Hypertension (high blood pressure)", emoji: "❤️" },
  { id: "diabetes",     label: "Diabetes",                           emoji: "🩺" },
  { id: "pcos",         label: "PCOS",                              emoji: "🌸" },
  { id: "thyroid",      label: "Thyroid condition",                 emoji: "🦋" },
  { id: "ibs",          label: "IBS or digestive issues",          emoji: "🌿" },
  { id: "cholesterol",  label: "High cholesterol",                  emoji: "💛" },
  { id: "none",         label: "None of these",                     emoji: "✅" },
];

export default function HealthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (id === "none") {
        // "None" deselects everything else
        return next.has("none") ? new Set() : new Set(["none"]);
      }
      next.delete("none"); // deselect "None" if a condition is picked
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleNext() {
    const conditions = [...selected].join(",") || "none";
    router.push({ pathname: "/onboarding/privacy" as any, params: { ...params, conditions } });
  }

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <OnboardingHeader step={11} total={16} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.header}>Any health conditions we should keep in mind?</Text>
          <Text style={styles.sub}>This helps provide safer nutrition guidance</Text>

          <View style={styles.options}>
            {CONDITIONS.map((c) => (
              <View key={c.id} style={[optionChip(selected.has(c.id)), styles.option]}>
                <Text
                  style={[optionChipText(selected.has(c.id)), styles.optionText]}
                  onPress={() => toggle(c.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected.has(c.id) }}
                >
                  {c.emoji}{"  "}{c.label}
                </Text>
              </View>
            ))}
          </View>

          <Text style={styles.hint}>Your information is kept private and never shared</Text>
        </ScrollView>

        <View style={styles.footer}>
          <PillowButton label="Next →" onPress={handleNext} disabled={selected.size === 0} />
        </View>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xl, gap: spacing.xl },
  header: { fontFamily: fonts.heading700, fontSize: 38, color: colors.text, lineHeight: 44 },
  sub: { fontFamily: fonts.heading400, fontSize: 18, color: colors.textMuted, marginTop: -spacing.md, lineHeight: 26 },
  options: { gap: spacing.sm },
  option: { alignItems: "flex-start", paddingHorizontal: 20, paddingVertical: 14 },
  optionText: { fontSize: 15, lineHeight: 22 },
  hint: { fontFamily: fonts.body400, fontSize: 13, color: colors.textMuted },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
});
