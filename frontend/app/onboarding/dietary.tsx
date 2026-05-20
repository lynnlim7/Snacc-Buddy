/**
 * Setup Step 8 — "Anything you avoid eating?"
 */
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { PaperBackground } from "../../components/PaperBackground";
import { PillowButton } from "../../components/PillowButton";
import { OnboardingHeader } from "../../components/OnboardingHeader";
import { useOnboardingStore } from "../../stores/onboardingStore";
import { colors, fonts, spacing, optionChip, optionChipText } from "../../constants/theme";

const DIETS = [
  { id: "vegetarian", label: "Vegetarian"   },
  { id: "vegan",      label: "Vegan"        },
  { id: "halal",      label: "Halal"        },
  { id: "kosher",     label: "Kosher"       },
  { id: "gluten",     label: "Gluten-free"  },
  { id: "dairy",      label: "Dairy-free"   },
  { id: "nut",        label: "Nut allergy"  },
  { id: "seafood",    label: "Seafood allergy"   },
];

export default function DietaryScreen() {
  const router = useRouter();
  const { hasRestrictions, dietary, set } = useOnboardingStore();

  function toggleDiet(id: string) {
    const next = dietary.includes(id)
      ? dietary.filter((d) => d !== id)
      : [...dietary, id];
    set({ dietary: next });
  }

  const canContinue =
    hasRestrictions === false || (hasRestrictions === true && dietary.length > 0);

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <OnboardingHeader step={10} total={16} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.header}>Anything you avoid eating?</Text>
          <Text style={styles.sub}>Food allergies, dietary preferences or restrictions</Text>

          {/* Yes / No */}
          <View style={styles.yesNoRow}>
            {[
              { label: "No, nothing special", value: false },
              { label: "Yes, I have some",    value: true  },
            ].map((opt) => (
              <View
                key={String(opt.value)}
                style={[optionChip(hasRestrictions === opt.value), styles.yesNoBtn]}
              >
                <Text
                  style={optionChipText(hasRestrictions === opt.value)}
                  onPress={() => set({ hasRestrictions: opt.value })}
                  accessibilityRole="button"
                >
                  {opt.label}
                </Text>
              </View>
            ))}
          </View>

          {hasRestrictions === true && (
            <View style={styles.restrictions}>
              <Text style={styles.restrictionsLabel}>Select all that apply</Text>
              <View style={styles.chipGrid}>
                {DIETS.map((d) => (
                  <View key={d.id} style={[optionChip(dietary.includes(d.id)), styles.chip]}>
                    <Text
                      style={[optionChipText(dietary.includes(d.id)), styles.chipText]}
                      onPress={() => toggleDiet(d.id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: dietary.includes(d.id) }}
                    >
                      {d.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <PillowButton
            label="Next"
            onPress={() => router.push("/onboarding/health" as any)}
            disabled={!canContinue}
            variant="pink"
          />
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
