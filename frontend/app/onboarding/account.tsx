/**
 * Setup Step 11 — "Save your diary" — Account creation.
 */
import React, { useState } from "react";
import {
  View, Text, TextInput, StyleSheet, KeyboardAvoidingView,
  Platform, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PaperBackground } from "../../components/PaperBackground";
import { PillowButton } from "../../components/PillowButton";
import { OnboardingHeader } from "../../components/OnboardingHeader";
import { colors, fonts, spacing, inputStyle, microcopy } from "../../constants/theme";

export default function AccountScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = emailValid && password.length >= 8;

  async function handleCreate() {
    if (!canSubmit) return;
    setError("");
    setLoading(true);
    try {
      // TODO: wire up to registration API with all params
      await new Promise((r) => setTimeout(r, 1500));
      router.replace({ pathname: "/onboarding/final-welcome" as any, params });
    } catch {
      setError(microcopy.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <OnboardingHeader step={13} total={16} />
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
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
                  onPress={() => setShowPassword((v) => !v)}
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

              {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>

            <Text style={styles.hint}>
              Your diary is always yours. No spam, ever.
            </Text>
          </View>

          <View style={styles.footer}>
            <PillowButton
              label="Create my diary"
              onPress={handleCreate}
              loading={loading}
              disabled={!canSubmit}
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
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.xl },
  header: { fontFamily: fonts.heading700, fontSize: 42, color: colors.text, lineHeight: 46 },
  sub: { fontFamily: fonts.heading400, fontSize: 19, color: colors.textMuted, lineHeight: 27, marginTop: -spacing.md },
  fields: { gap: spacing.md },
  inputText: { fontFamily: fonts.body400, fontSize: 15, color: colors.text },
  passwordRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  eyeBtn: { padding: spacing.sm },
  error: { fontFamily: fonts.body400, fontSize: 13, color: colors.error, textAlign: "center" },
  hint: { fontFamily: fonts.body400, fontSize: 13, color: colors.textMuted },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
});
