/**
 * Setup Step 3 — "How tall are you?"
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

export default function HeightScreen() {
  const router = useRouter();
  const { height, set } = useOnboardingStore();
  const isValid = Number(height) >= 50 && Number(height) <= 300;

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <OnboardingHeader step={5} total={16} />
        <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.content}>
            <Text style={styles.header}>How tall are you?</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={[inputStyle as any, styles.input]}
                placeholder="Enter height"
                placeholderTextColor={colors.textLight}
                value={height}
                onChangeText={(t) => set({ height: t })}
                keyboardType="decimal-pad"
                inputMode="numeric"
                autoFocus
                returnKeyType="done"
                accessibilityLabel="Enter your height in centimetres"
              />
              <View style={styles.unitBadge}>
                <Text style={styles.unitText}>cm</Text>
              </View>
            </View>
            <Text style={styles.hint}>Growing your healthiest routine starts here</Text>
          </View>

          <View style={styles.footer}>
            <PillowButton
              label="Next"
              onPress={() => router.push("/onboarding/current-weight" as any)}
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
  unitBadge: {
    backgroundColor: colors.matcha, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.matchaBorder,
  },
  unitText: { fontFamily: fonts.body700, fontSize: 16, color: colors.text },
  hint: { fontFamily: fonts.body400, fontSize: 13, color: colors.textMuted },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
});
