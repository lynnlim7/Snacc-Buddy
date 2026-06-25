/**
 * Verify Email — dual mode.
 *
 *  • No `token` param  → "request" mode: enter email, send a verification link
 *    (POST /auth/request-verify-token). Reached from the login "Verify your email" link.
 *  • `token` present   → "verify" mode: auto-completes verification on mount
 *    (POST /auth/verify). Reached from the link in the verification email
 *    (FRONTEND_VERIFY_EMAIL_URL?token=...).
 */
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

export default function VerifyEmailScreen() {
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
            <VerifyToken token={token} onDone={() => router.replace("/login" as any)} />
          ) : (
            <RequestForm initialEmail={typeof params.email === "string" ? params.email : ""} />
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PaperBackground>
  );
}

/* ── Verify mode: complete verification from the email token ── */
function VerifyToken({ token, onDone }: { token: string; onDone: () => void }) {
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await authApi.verifyEmail(token);
        if (active) setStatus("success");
      } catch (e: any) {
        const detail = e?.response?.data?.detail;
        if (detail === "VERIFY_USER_ALREADY_VERIFIED") {
          if (active) setStatus("success");
        } else if (active) {
          setStatus("error");
          setMessage(
            detail === "VERIFY_USER_BAD_TOKEN"
              ? "This verification link is invalid or has expired. Request a new one."
              : "Couldn't verify your email. Please try again."
          );
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  if (status === "verifying") {
    return (
      <View style={[styles.content, styles.confirmContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.sub}>Verifying your email…</Text>
      </View>
    );
  }

  if (status === "success") {
    return (
      <Confirmation
        icon="checkmark-circle-outline"
        title="Email verified"
        body="Your email address has been verified. You're all set!"
        actionLabel="Go to login"
        onAction={onDone}
      />
    );
  }

  return (
    <Confirmation
      icon="alert-circle-outline"
      title="Verification failed"
      body={message}
      actionLabel="Back to login"
      onAction={onDone}
    />
  );
}

/* ── Request mode: send (or resend) a verification link ── */
function RequestForm({ initialEmail }: { initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function submit() {
    if (!emailValid || loading) return;
    setLoading(true);
    try {
      await authApi.requestVerify(email);
    } finally {
      // Always show success — the endpoint never reveals account state.
      setLoading(false);
      setSent(true);
    }
  }

  if (sent) {
    return (
      <Confirmation
        icon="mail-outline"
        title="Check your email"
        body={`If ${email} needs verifying, we've sent a verification link. Open it to confirm your address.`}
      />
    );
  }

  return (
    <View style={styles.content}>
      <Text style={styles.header}>Verify email</Text>
      <Text style={styles.sub}>Enter your email and we'll send a verification link</Text>

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
        label="Send verification link"
        onPress={submit}
        loading={loading}
        disabled={!emailValid}
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
  },
  sub: {
    fontFamily: fonts.heading400,
    fontSize: 20,
    color: colors.textMuted,
    marginTop: -spacing.sm,
    textAlign: "center",
  },
  fields: { gap: spacing.md },
  input: {
    fontFamily: fonts.body400,
    fontSize: 15,
    color: colors.text,
  },
});
