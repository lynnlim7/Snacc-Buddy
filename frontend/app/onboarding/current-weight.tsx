/**
 * Setup Step 4 — "Where are you starting from?"
 */
import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { PaperBackground } from "../../components/PaperBackground";
import { PillowButton } from "../../components/PillowButton";
import { OnboardingHeader } from "../../components/OnboardingHeader";
import { colors, fonts, spacing, inputStyle } from "../../constants/theme";

export default function CurrentWeightScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [weight, setWeight] = useState("");

  const isValid = Number(weight) >= 20 && Number(weight) <= 500;

  function handleNext() {
    if (!isValid) return;
    router.push({ pathname: "/onboarding/goal-weight" as any, params: { ...params, currentWeight: weight } });
  }

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <OnboardingHeader step={6} total={16} />
        <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.content}>
            <Text style={styles.header}>Where are you{"\n"}starting from?</Text>
            <Text style={styles.sub}>No judgement here — this is just your starting point</Text>

            <View style={styles.inputWrap}>
              <TextInput
                style={[inputStyle as any, styles.input]}
                placeholder="0.0"
                placeholderTextColor={colors.textLight}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                inputMode="decimal"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleNext}
                accessibilityLabel="Enter your current weight in kilograms"
              />
              <View style={styles.unitBadge}>
                <Text style={styles.unitText}>kg</Text>
              </View>
            </View>
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
  header: { fontFamily: fonts.heading700, fontSize: 42, color: colors.text, lineHeight: 46 },
  sub: { fontFamily: fonts.heading400, fontSize: 18, color: colors.textMuted, lineHeight: 26, marginTop: -spacing.md },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  input: { flex: 1, fontFamily: fonts.heading600, fontSize: 36, color: colors.text, textAlign: "center" },
  unitBadge: {
    backgroundColor: colors.softPink, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.softPinkBorder,
  },
  unitText: { fontFamily: fonts.body700, fontSize: 16, color: colors.text },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
});
