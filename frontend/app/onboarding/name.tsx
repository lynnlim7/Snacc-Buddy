/**
 * Onboarding Step 1 — "What should I call you?"
 * Everything centred. Next button light pink.
 */
import React, { useRef } from "react";
import {
  View, Text, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PaperBackground } from "../../components/PaperBackground";
import { PillowButton } from "../../components/PillowButton";
import { useOnboardingStore } from "../../stores/onboardingStore";
import { colors, fonts, spacing, inputStyle } from "../../constants/theme";

export default function NameScreen() {
  const router = useRouter();
  const { name, set } = useOnboardingStore();
  const inputRef = useRef<TextInput>(null);

  function handleNext() {
    if (!name.trim()) return;
    router.push("/onboarding/goals" as any);
  }

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity
          style={styles.back}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={colors.textMuted} />
        </TouchableOpacity>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.content}>
            <Text style={styles.header}>Welcome to your food diary</Text>
            <Text style={styles.sub}>
              Let's personalise your diary.{"\n"}What should I call you?
            </Text>

            {/* Centred name input */}
            <View style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                style={[inputStyle as any, styles.input]}
                placeholder="Your name…"
                placeholderTextColor={colors.textLight}
                value={name}
                onChangeText={(t) => set({ name: t })}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleNext}
                accessibilityLabel="Enter your name"
                textAlign="center"
              />
              {name.length > 0 && (
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => { set({ name: "" }); inputRef.current?.focus(); }}
                  accessibilityLabel="Clear name"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.hint}>
              This is how Snacc Buddy will greet you every day
            </Text>
          </View>

          <View style={styles.footer}>
            <PillowButton
              label="Next"
              onPress={handleNext}
              disabled={!name.trim()}
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
  back: { padding: spacing.md },
  kav: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    alignItems: "center",
    gap: spacing.lg,
  },
  header: {
    fontFamily: fonts.heading700,
    fontSize: 38,
    color: colors.text,
    lineHeight: 44,
    textAlign: "center",
  },
  sub: {
    fontFamily: fonts.heading400,
    fontSize: 20,
    color: colors.textMuted,
    lineHeight: 28,
    textAlign: "center",
  },
  inputRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: fonts.heading600,
    fontSize: 22,
    color: colors.text,
    textAlign: "center",
  },
  clearBtn: { padding: 4 },
  hint: {
    fontFamily: fonts.body400,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
});
