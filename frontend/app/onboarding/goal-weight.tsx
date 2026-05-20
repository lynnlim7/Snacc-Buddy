/**
 * Setup Step 5 — "What feels like a comfortable goal for you?"
 */
import React, { useState, useMemo } from "react";
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { PaperBackground } from "../../components/PaperBackground";
import { PillowButton } from "../../components/PillowButton";
import { OnboardingHeader } from "../../components/OnboardingHeader";
import { colors, fonts, spacing, inputStyle, journalCard } from "../../constants/theme";

function healthyRange(heightCm: number) {
  const h = heightCm / 100;
  const low = Math.round(18.5 * h * h);
  const high = Math.round(24.9 * h * h);
  return { low, high };
}

export default function GoalWeightScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ height: string; currentWeight: string }>();
  const [goal, setGoal] = useState("");

  const range = useMemo(() => {
    const h = Number(params.height);
    return h > 0 ? healthyRange(h) : null;
  }, [params.height]);

  const isValid = Number(goal) >= 20 && Number(goal) <= 500;

  function handleNext() {
    if (!isValid) return;
    router.push({ pathname: "/onboarding/pace" as any, params: { ...params, goalWeight: goal } });
  }

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <OnboardingHeader step={7} total={16} />
        <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.content}>
            <Text style={styles.header}>What feels like a comfortable goal for you?</Text>

            <View style={styles.inputWrap}>
              <TextInput
                style={[inputStyle as any, styles.input]}
                placeholder="0.0"
                placeholderTextColor={colors.textLight}
                value={goal}
                onChangeText={setGoal}
                keyboardType="decimal-pad"
                inputMode="decimal"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleNext}
                accessibilityLabel="Enter your goal weight in kilograms"
              />
              <View style={styles.unitBadge}>
                <Text style={styles.unitText}>kg</Text>
              </View>
            </View>

            {range && (
              <View style={[journalCard(true), styles.rangeCard]}>
                <Text style={styles.rangeLabel}>Recommended healthy range</Text>
                <Text style={styles.rangeValue}>{range.low}–{range.high} kg</Text>
              </View>
            )}

            <Text style={styles.hint}>Goals can always change later 🌿</Text>
          </View>

          <View style={styles.footer}>
            <PillowButton label="Next →" onPress={handleNext} disabled={!isValid} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  kav: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.xl },
  header: { fontFamily: fonts.heading700, fontSize: 38, color: colors.text, lineHeight: 44 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  input: { flex: 1, fontFamily: fonts.heading600, fontSize: 36, color: colors.text, textAlign: "center" },
  unitBadge: {
    backgroundColor: colors.softPink, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.softPinkBorder,
  },
  unitText: { fontFamily: fonts.body700, fontSize: 16, color: colors.text },
  rangeCard: { gap: 4 },
  rangeLabel: { fontFamily: fonts.body400, fontSize: 12, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.6 },
  rangeValue: { fontFamily: fonts.heading600, fontSize: 22, color: colors.accent },
  hint: { fontFamily: fonts.body400, fontSize: 13, color: colors.textMuted },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
});
