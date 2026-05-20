/**
 * Setup Step 9 — "Any health conditions we should keep in mind?"
 * Includes an "Other" option with a free-text input.
 */
import React from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { PaperBackground } from "../../components/PaperBackground";
import { PillowButton } from "../../components/PillowButton";
import { OnboardingHeader } from "../../components/OnboardingHeader";
import { useOnboardingStore } from "../../stores/onboardingStore";
import { colors, fonts, spacing, optionChip, optionChipText, inputStyle } from "../../constants/theme";

const CONDITIONS = [
  { id: "hypertension", label: "Hypertension (high blood pressure)" },
  { id: "diabetes",     label: "Diabetes"                           },
  { id: "pcos",         label: "PCOS"                              },
  { id: "thyroid",      label: "Thyroid condition"                 },
  { id: "ibs",          label: "IBS or digestive issues"          },
  { id: "cholesterol",  label: "High cholesterol"                  },
  { id: "none",         label: "None of these"                     },
  { id: "other",        label: "Other"                             },
];

export default function HealthScreen() {
  const router = useRouter();
  const { conditions, customCondition, set } = useOnboardingStore();

  function toggle(id: string) {
    let next: string[];
    if (id === "none") {
      // "None" clears all others
      next = conditions.includes("none") ? [] : ["none"];
    } else {
      // Selecting a real condition removes "none"
      const without = conditions.filter((c) => c !== "none");
      next = without.includes(id)
        ? without.filter((c) => c !== id)
        : [...without, id];
    }
    set({ conditions: next });
  }

  const showOtherInput = conditions.includes("other");
  const canContinue =
    conditions.length > 0 &&
    (!showOtherInput || customCondition.trim().length > 0);

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <OnboardingHeader step={11} total={16} />
        <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.header}>Any health conditions we should keep in mind?</Text>
            <Text style={styles.sub}>This helps provide safer nutrition guidance</Text>

            <View style={styles.options}>
              {CONDITIONS.map((c) => (
                <View key={c.id} style={[optionChip(conditions.includes(c.id)), styles.option]}>
                  <Text
                    style={[optionChipText(conditions.includes(c.id)), styles.optionText]}
                    onPress={() => toggle(c.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: conditions.includes(c.id) }}
                  >
                    {c.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* "Other" free-text input */}
            {showOtherInput && (
              <View style={styles.otherWrap}>
                <Text style={styles.otherLabel}>Please describe your condition</Text>
                <TextInput
                  style={[inputStyle as any, styles.otherInput]}
                  placeholder="Type your condition here…"
                  placeholderTextColor={colors.textLight}
                  value={customCondition}
                  onChangeText={(t) => set({ customCondition: t })}
                  autoFocus
                  returnKeyType="done"
                  accessibilityLabel="Describe your health condition"
                />
              </View>
            )}

            <Text style={styles.hint}>Your information is kept private and never shared</Text>
          </ScrollView>

          <View style={styles.footer}>
            <PillowButton
              label="Next"
              onPress={() => router.push("/onboarding/privacy" as any)}
              disabled={!canContinue}
              variant="pink"
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  kav: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xl, gap: spacing.xl },
  header: { fontFamily: fonts.heading700, fontSize: 38, color: colors.text, lineHeight: 44 },
  sub: { fontFamily: fonts.heading400, fontSize: 18, color: colors.textMuted, marginTop: -spacing.md, lineHeight: 26 },
  options: { gap: spacing.sm },
  option: { alignItems: "flex-start", paddingHorizontal: 20, paddingVertical: 14 },
  optionText: { fontSize: 15, lineHeight: 22 },
  otherWrap: { gap: spacing.sm },
  otherLabel: { fontFamily: fonts.body600, fontSize: 13, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.6 },
  otherInput: { fontFamily: fonts.body400, fontSize: 15, color: colors.text },
  hint: { fontFamily: fonts.body400, fontSize: 13, color: colors.textMuted },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
});
