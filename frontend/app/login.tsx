/**
 * Login Screen — for returning users.
 */
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PaperBackground } from "../components/PaperBackground";
import { PillowButton } from "../components/PillowButton";
import { colors, fonts, spacing, radius, inputStyle, microcopy } from "../constants/theme";
import { authApi } from "../services/api";
import { useAuthStore } from "../stores/authStore";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setToken = useAuthStore((s) => s.setToken);

  async function handleLogin() {
    setError("");
    setLoading(true);
    try {
      const token = await authApi.login(email, password);
      setToken(token);
      router.replace("/(tabs)" as any);
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Back */}
          <TouchableOpacity
            style={styles.back}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.content}>
            {/* Header */}
            <Text style={styles.header}>Welcome back</Text>
            <Text style={styles.sub}>Open your diary again</Text>

            {/* Inputs */}
            <View style={styles.fields}>
              <TextInput
                style={[inputStyle as any, styles.input]}
                placeholder="Email"
                placeholderTextColor={colors.textLight}
                value={email}
                onChangeText={(t) => { setEmail(t); setError(""); }}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
                accessibilityLabel="Email"
              />

              <View style={styles.passwordWrap}>
                <TextInput
                  style={[inputStyle as any, styles.input, { flex: 1 }]}
                  placeholder="Password"
                  placeholderTextColor={colors.textLight}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(""); }}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  accessibilityLabel="Password"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword((v) => !v)}
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
                <Text style={styles.errorText}>{error}</Text>
              ) : null}
            </View>

            <PillowButton
              label="Open my diary"
              onPress={handleLogin}
              loading={loading}
              variant="accent"
            />

            <TouchableOpacity style={styles.forgot} accessibilityRole="button">
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  kav: { flex: 1 },
  back: { padding: spacing.md },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    fontFamily: fonts.heading700,
    fontSize: 42,
    color: colors.text,
    lineHeight: 44,
  },
  sub: {
    fontFamily: fonts.heading400,
    fontSize: 20,
    color: colors.textMuted,
    marginTop: -spacing.sm,
  },
  fields: { gap: spacing.md },
  input: {
    fontFamily: fonts.body400,
    fontSize: 15,
    color: colors.text,
  },
  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  eyeBtn: {
    padding: spacing.sm,
  },
  errorText: {
    fontFamily: fonts.body400,
    fontSize: 13,
    color: colors.error,
    textAlign: "center",
  },
  forgot: { alignItems: "center" },
  forgotText: {
    fontFamily: fonts.body400,
    fontSize: 14,
    color: colors.textMuted,
    textDecorationLine: "underline",
  },
});
