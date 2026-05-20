/**
 * Setup Step 8 — "Anything you avoid eating?"
 */
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { PaperBackground } from "../../components/PaperBackground";
import { PillowButton } from "../../components/PillowButton";
import { OnboardingHeader } from "../../components/OnboardingHeader";
import { colors, fonts, spacing, optionChip, optionChipText } from "../../constants/theme";

const DIETS = [
  { id: "vegetarian", label: "Vegetarian",         emoji: "🥗" },
  { id: "vegan",      label: "Vegan",              emoji: "🌱" },
  { id: "halal",      label: "Halal",              emoji: "☪️" },
  { id: "kosher",     label: "Kosher",             emoji: "✡️" },
  { id: "gluten",     label: "Gluten-free",        emoji: "🌾" },
  { id: "dairy",      label: "Dairy-free",         emoji: "🥛" },
  { id: "nut",        label: "Nut allergy",        emoji: "🥜" },
  { id: "seafood",    label: "No seafood",         emoji: "🦐" },
];

export default function DietaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [hasRestrictions, setHasRestrictions] = useState<boolean | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggleDiet(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleNext() {
    const dietary = hasRestrictions ? [...selected].join(",") : "none";
    router.push({ pathname: "/onboarding/health" as any, params: { ...params, dietary } });
  }

  const canContinue = hasRestrictions === false || (hasRestrictions === true && selected.size > 0);

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <OnboardingHeader step={10} total={16} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.header}>Anything you avoid eating?</Text>
          <Text style={styles.sub}>Food allergies, dietary preferences or restrictions</Text>

          {/* Yes / No first */}
          <View style={styles.yesNoRow}>
            {[
              { label: "No, nothing special", value: false },
              { label: "Yes, I have some", value: true },
            ].map((opt) => (
              <View
                key={String(opt.value)}
                style={[optionChip(hasRestrictions === opt.value), styles.yesNoBtn]}
              >
                <Text
                  style={optionChipText(hasRestrictions === opt.value)}
                  onPress={() => setHasRestrictions(opt.value)}
                  accessibilityRole="button"
                >
                  {opt.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Diet selectors — only shown if Yes */}
          {hasRestrictions === true && (
            <View style={styles.restrictions}>
              <Text style={styles.restrictionsLabel}>Select all that apply</Text>
              <View style={styles.chipGrid}>
                {DIETS.map((d) => (
                  <View key={d.id} style={[optionChip(selected.has(d.id)), styles.chip]}>
                    <Text
                      style={[optionChipText(selected.has(d.id)), styles.chipText]}
                      onPress={() => toggleDiet(d.id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected.has(d.id) }}
                    >
                      {d.emoji}{"  "}{d.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <PillowButton label="Next →" onPress={handleNext} disabled={!canContinue} />
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
  sub: { fontFamily: fonts.heading400, fontSize: 18, color: colors.textMuted, marginTop: -spacing.md },
  yesNoRow: { gap: spacing.sm },
  yesNoBtn: { alignItems: "flex-start", paddingHorizontal: 20, paddingVertical: 16 },
  restrictions: { gap: spacing.md },
  restrictionsLabel: { fontFamily: fonts.body600, fontSize: 13, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.6 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { paddingHorizontal: 16, paddingVertical: 10 },
  chipText: { fontSize: 14 },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
});
