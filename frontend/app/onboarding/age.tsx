/**
 * Setup Step 2 — "How old are you?"
 */
import React from "react";
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { PaperBackground } from "../../components/PaperBackground";
import { PillowButton } from "../../components/PillowButton";
import { OnboardingHeader } from "../../components/OnboardingHeader";
import { useOnboardingStore } from "../../stores/onboardingStore";
import { colors, fonts, spacing, inputStyle } from "../../constants/theme";

export default function AgeScreen() {
  const router = useRouter();
  const { age, set } = useOnboardingStore();
  const isValid = Number(age) >= 13 && Number(age) <= 120;

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <OnboardingHeader step={4} total={16} />
        <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.content}>
            <Text style={styles.header}>How old are you?</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={[inputStyle as any, styles.input]}
                placeholder="Age"
                placeholderTextColor={colors.textLight}
                value={age}
                onChangeText={(t) => set({ age: t })}
                keyboardType="number-pad"
                inputMode="numeric"
                autoFocus
                returnKeyType="done"
                accessibilityLabel="Enter your age"
              />
              <Text style={styles.unit}>years</Text>
            </View>
            <Text style={styles.hint}>No pressure — this stays private</Text>
          </View>

          <View style={styles.footer}>
            <PillowButton
              label="Next"
              onPress={() => router.push("/onboarding/height" as any)}
              disabled={!isValid}
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
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.xl },
  header: { fontFamily: fonts.heading700, fontSize: 42, color: colors.text, lineHeight: 46 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  input: { flex: 1, fontFamily: fonts.heading600, fontSize: 28, color: colors.text, textAlign: "center" },
  unit: { fontFamily: fonts.body500, fontSize: 16, color: colors.textMuted },
  hint: { fontFamily: fonts.body400, fontSize: 13, color: colors.textMuted },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
});
