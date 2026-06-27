/**
 * Setup Step 11 — "Save your diary" — Account creation.
 */
import React, { useState } from "react";
import {
  View, Text, TextInput, StyleSheet, KeyboardAvoidingView,
  Platform, TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PaperBackground } from "../../components/PaperBackground";
import { PillowButton } from "../../components/PillowButton";
import { OnboardingHeader } from "../../components/OnboardingHeader";
import { colors, fonts, spacing, inputStyle } from "../../constants/theme";
import { authApi } from "../../services/api";
import { useOnboardingStore } from "../../stores/onboardingStore";

export default function AccountScreen() {
  const router = useRouter();
  const onboarding = useOnboardingStore();
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [showPassword, setShow]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [alreadyExists, setAlreadyExists] = useState(false);

  const [registered, setRegistered] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit  = emailValid && password.length >= 8;

  async function handleCreate() {
    if (!canSubmit) return;
    setError("");
    setAlreadyExists(false);
    setLoading(true);
    try {
      const profile = {
        name: onboarding.name || null,
        gender: onboarding.gender || null,
        age: onboarding.age ? parseInt(onboarding.age, 10) : null,
        height_cm: onboarding.height ? parseFloat(onboarding.height) : null,
        current_weight_kg: onboarding.currentWeight ? parseFloat(onboarding.currentWeight) : null,
        goal_weight_kg: onboarding.goalWeight ? parseFloat(onboarding.goalWeight) : null,
        goal: onboarding.goal || null,
        lifestyle: onboarding.lifestyle || null,
        has_dietary_restrictions: onboarding.hasRestrictions,
        has_conditions: onboarding.conditions.length > 0,
        condition_type: onboarding.conditions.length > 0
          ? [...onboarding.conditions, onboarding.customCondition].filter(Boolean).join(",")
          : null,
      };
      await authApi.register(email, password, profile);
      onboarding.reset();
      setRegistered(true);
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      if (detail === "REGISTER_USER_ALREADY_EXISTS") {
        setError("An account with this email already exists.");
        setAlreadyExists(true);
      } else {
        setError(typeof detail === "string" ? detail : "Registration failed. Try a different email.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (registered) {
    return (
      <PaperBackground>
        <SafeAreaView style={styles.safe}>
          <View style={styles.confirmContent}>
            <Ionicons name="mail-outline" size={56} color={colors.softPink} />
            <Text style={styles.header}>Check your email</Text>
            <Text style={styles.sub}>
              We sent a verification link to{"\n"}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>
            <Text style={styles.hint}>
              Click the link in the email to activate your account, then log in.
            </Text>
            <PillowButton
              label="Go to login"
              onPress={() => router.replace("/login" as any)}
              variant="pink"
            />
          </View>
        </SafeAreaView>
      </PaperBackground>
    );
  }

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <OnboardingHeader step={13} total={16} />
        <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.content}>
            <Text style={styles.header}>Save your diary</Text>
            <Text style={styles.sub}>
              Create an account to keep your entries, progress and memories safe
            </Text>

            <View style={styles.fields}>
              <TextInput
                style={[inputStyle as any, styles.inputText]}
                placeholder="Email address"
                placeholderTextColor={colors.textLight}
                value={email}
                onChangeText={(t) => { setEmail(t); setError(""); }}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
                accessibilityLabel="Email address"
              />

              <View style={styles.passwordRow}>
                <TextInput
                  style={[inputStyle as any, styles.inputText, { flex: 1 }]}
                  placeholder="Password (min. 8 characters)"
                  placeholderTextColor={colors.textLight}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(""); }}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleCreate}
                  accessibilityLabel="Password"
                />
                <TouchableOpacity
                  onPress={() => setShow((v) => !v)}
                  style={styles.eyeBtn}
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {error ? (
                <View style={styles.errorBlock}>
                  <Text style={styles.error}>{error}</Text>
                  {alreadyExists && (
                    <TouchableOpacity onPress={() => router.push("/login" as any)} accessibilityRole="button">
                      <Text style={styles.loginLink}>Log in instead</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.footer}>
            <PillowButton
              label="Create my diary"
              onPress={handleCreate}
              loading={loading}
              disabled={!canSubmit}
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
  confirmContent: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.lg,
  },
  emailHighlight: { fontFamily: fonts.body700, color: colors.text },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.xl },
  header: { fontFamily: fonts.heading700, fontSize: 42, color: colors.text, lineHeight: 46 },
  sub: { fontFamily: fonts.heading400, fontSize: 19, color: colors.textMuted, lineHeight: 27, marginTop: -spacing.md },
  fields: { gap: spacing.md },
  inputText: { fontFamily: fonts.body400, fontSize: 15, color: colors.text },
  passwordRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  eyeBtn: { padding: spacing.sm },
  errorBlock: { alignItems: "center", gap: spacing.xs },
  error: { fontFamily: fonts.body400, fontSize: 13, color: colors.error, textAlign: "center" },
  loginLink: { fontFamily: fonts.body700, fontSize: 13, color: colors.softPink, textDecorationLine: "underline" },
  hint: { fontFamily: fonts.body400, fontSize: 13, color: colors.textMuted },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
});
