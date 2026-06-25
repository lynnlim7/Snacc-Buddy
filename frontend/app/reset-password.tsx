/**
 * Reset Password — dual mode.
 *
 *  • No `token` param  → "request" mode: enter email, send a reset link
 *    (POST /auth/forgot-password). Reached from the login "Forgot password?" link.
 *  • `token` present   → "reset" mode: choose a new password
 *    (POST /auth/reset-password). Reached from the link in the reset email
 *    (FRONTEND_RESET_PASSWORD_URL?token=...).
 */
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PaperBackground } from "../components/PaperBackground";
import { PillowButton } from "../components/PillowButton";
import { colors, fonts, spacing, inputStyle } from "../constants/theme";
import { authApi } from "../services/api";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string; email?: string }>();
  const token = typeof params.token === "string" ? params.token : undefined;

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableOpacity
            style={styles.back}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color={colors.textMuted} />
          </TouchableOpacity>

          {token ? (
            <ResetForm token={token} onDone={() => router.replace("/login" as any)} />
          ) : (
            <RequestForm initialEmail={typeof params.email === "string" ? params.email : ""} />
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PaperBackground>
  );
}

/* ── Request mode: send the reset link ── */
function RequestForm({ initialEmail }: { initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function submit() {
    if (!emailValid || loading) return;
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
    } finally {
      // Always show success — the endpoint never reveals whether the email exists.
      setLoading(false);
      setSent(true);
    }
  }

  if (sent) {
    return (
      <Confirmation
        icon="mail-outline"
        title="Check your email"
        body={`If an account exists for ${email}, we've sent a password reset link. Open it to choose a new password.`}
      />
    );
  }

  return (
    <View style={styles.content}>
      <Text style={styles.header}>Reset password</Text>
      <Text style={styles.sub}>Enter your email and we'll send a reset link</Text>

      <View style={styles.fields}>
        <TextInput
          style={[inputStyle as any, styles.input]}
          placeholder="Email"
          placeholderTextColor={colors.textLight}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="send"
          onSubmitEditing={submit}
          accessibilityLabel="Email"
        />
      </View>

      <PillowButton
        label="Send reset link"
        onPress={submit}
        loading={loading}
        disabled={!emailValid}
        variant="accent"
      />
    </View>
  );
}

/* ── Reset mode: set a new password using the email token ── */
function ResetForm({ token, onDone }: { token: string; onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const canSubmit = password.length >= 8 && password === confirm;

  async function submit() {
    if (!canSubmit || loading) return;
    setError("");
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      if (detail === "RESET_PASSWORD_BAD_TOKEN") {
        setError("This reset link is invalid or has expired. Request a new one.");
      } else if (detail?.reason) {
        setError(detail.reason);
      } else {
        setError("Couldn't reset your password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Confirmation
        icon="checkmark-circle-outline"
        title="Password updated"
        body="Your password has been reset. You can now log in with your new password."
        actionLabel="Go to login"
        onAction={onDone}
      />
    );
  }

  return (
    <View style={styles.content}>
      <Text style={styles.header}>New password</Text>
      <Text style={styles.sub}>Choose a new password for your account</Text>

      <View style={styles.fields}>
        <View style={styles.passwordWrap}>
          <TextInput
            style={[inputStyle as any, styles.input, { flex: 1 }]}
            placeholder="New password"
            placeholderTextColor={colors.textLight}
            value={password}
            onChangeText={(t) => { setPassword(t); setError(""); }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            accessibilityLabel="New password"
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

        <TextInput
          style={[inputStyle as any, styles.input]}
          placeholder="Confirm new password"
          placeholderTextColor={colors.textLight}
          value={confirm}
          onChangeText={(t) => { setConfirm(t); setError(""); }}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={submit}
          accessibilityLabel="Confirm new password"
        />

        {password.length > 0 && password.length < 8 ? (
          <Text style={styles.hintText}>Password must be at least 8 characters.</Text>
        ) : null}
        {confirm.length > 0 && password !== confirm ? (
          <Text style={styles.hintText}>Passwords don't match.</Text>
        ) : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <PillowButton
        label="Reset password"
        onPress={submit}
        loading={loading}
        disabled={!canSubmit}
        variant="accent"
      />
    </View>
  );
}

/* ── Shared confirmation panel ── */
function Confirmation({
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={[styles.content, styles.confirmContent]}>
      <View style={styles.confirmIcon}>
        <Ionicons name={icon} size={40} color={colors.primary} />
      </View>
      <Text style={styles.header}>{title}</Text>
      <Text style={styles.sub}>{body}</Text>
      {actionLabel && onAction ? (
        <PillowButton label={actionLabel} onPress={onAction} variant="accent" />
      ) : null}
    </View>
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
  confirmContent: {
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: spacing.xxl,
  },
  confirmIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    fontFamily: fonts.heading700,
    fontSize: 42,
    color: colors.text,
    lineHeight: 44,
    textAlign: "left",
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
  eyeBtn: { padding: spacing.sm },
  hintText: {
    fontFamily: fonts.body400,
    fontSize: 13,
    color: colors.textMuted,
  },
  errorText: {
    fontFamily: fonts.body400,
    fontSize: 13,
    color: colors.error,
    textAlign: "center",
  },
});
