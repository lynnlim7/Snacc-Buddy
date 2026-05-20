/**
 * Onboarding Step 1 — "What should I call you?"
 */
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PaperBackground } from "../../components/PaperBackground";
import { PillowButton } from "../../components/PillowButton";
import {
  colors,
  fonts,
  spacing,
  inputStyle,
} from "../../constants/theme";

export default function NameScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const inputRef = useRef<TextInput>(null);

  function handleNext() {
    if (!name.trim()) return;
    // Store name in global state / AsyncStorage before navigating
    router.push({ pathname: "/onboarding/goals" as any, params: { name: name.trim() } });
  }

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <View style={styles.content}>
            {/* Diary header */}
            <View style={styles.diaryLabel}>
              <Text style={styles.diaryLabelText}>new entry</Text>
            </View>

            <Text style={styles.header}>Welcome to your{"\n"}food diary</Text>
            <Text style={styles.sub}>
              Let's personalise your diary.{"\n"}What should I call you?
            </Text>

            {/* Name input */}
            <View style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                style={[inputStyle as any, styles.input]}
                placeholder="Your name…"
                placeholderTextColor={colors.textLight}
                value={name}
                onChangeText={setName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleNext}
                accessibilityLabel="Enter your name"
              />
              {name.length > 0 && (
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => { setName(""); inputRef.current?.focus(); }}
                  accessibilityLabel="Clear name"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.hint}>
              This is how Snacc Buddy will greet you every day 🌿
            </Text>
          </View>

          {/* Next button sits above keyboard */}
          <View style={styles.footer}>
            <PillowButton
              label="Next →"
              onPress={handleNext}
              disabled={!name.trim()}
              variant="accent"
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    gap: spacing.lg,
  },
  diaryLabel: {
    alignSelf: "flex-start",
    backgroundColor: colors.matcha,
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.matchaBorder,
  },
  diaryLabelText: {
    fontFamily: fonts.heading400,
    fontSize: 13,
    color: colors.text,
    letterSpacing: 0.8,
  },
  header: {
    fontFamily: fonts.heading700,
    fontSize: 42,
    color: colors.text,
    lineHeight: 46,
  },
  sub: {
    fontFamily: fonts.heading400,
    fontSize: 20,
    color: colors.textMuted,
    lineHeight: 28,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: fonts.heading600,
    fontSize: 22,
    color: colors.text,
  },
  clearBtn: { padding: 4 },
  hint: {
    fontFamily: fonts.body400,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
});
