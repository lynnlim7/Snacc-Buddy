/**
 * Setup Step 10 — "Your diary stays personal"
 * Privacy policy + T&C acceptance before account creation.
 */
import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PaperBackground } from "../../components/PaperBackground";
import { PillowButton } from "../../components/PillowButton";
import { OnboardingHeader } from "../../components/OnboardingHeader";
import { colors, fonts, spacing, journalCard } from "../../constants/theme";

// Replace with actual URLs when available
const TERMS_URL = "https://snaccbuddy.app/terms";
const PRIVACY_URL = "https://snaccbuddy.app/privacy";

const PROMISES = [
  "Your diary entries are only visible to you",
  "We never sell your personal data",
  "Your information stays between you and Snacc Buddy",
];

export default function PrivacyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [accepted, setAccepted] = useState(false);

  function openLink(url: string) {
    Linking.openURL(url).catch(() => {});
  }

  function handleFinish() {
    if (!accepted) return;
    router.push({ pathname: "/onboarding/account" as any, params });
  }

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <OnboardingHeader step={12} total={16} />

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.header}>Your diary stays personal</Text>
          <Text style={styles.sub}>
            Your information is only used to personalise your nutrition experience
          </Text>

          {/* Privacy promises */}
          <View style={[journalCard(true), styles.promiseCard]}>
            {PROMISES.map((p) => (
              <View key={p} style={styles.promiseRow}>
                <Ionicons name="lock-closed" size={16} color={colors.matcha} />
                <Text style={styles.promiseText}>{p}</Text>
              </View>
            ))}
          </View>

          {/* Doc links */}
          <View style={styles.docLinks}>
            <TouchableOpacity
              style={styles.docLink}
              onPress={() => openLink(TERMS_URL)}
              accessibilityRole="link"
              accessibilityLabel="Open Terms and Conditions"
            >
              <Ionicons name="document-text-outline" size={18} color={colors.accentBorder} />
              <Text style={styles.docLinkText}>Terms and Conditions</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.docLink}
              onPress={() => openLink(PRIVACY_URL)}
              accessibilityRole="link"
              accessibilityLabel="Open Privacy Policy"
            >
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.accentBorder} />
              <Text style={styles.docLinkText}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Checkbox */}
          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setAccepted((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: accepted }}
          >
            <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
              {accepted && <Ionicons name="checkmark" size={14} color={colors.white} />}
            </View>
            <Text style={styles.checkLabel}>
              I've read and accepted the Terms and Conditions and Privacy Policy
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.footer}>
          <PillowButton
            label="Finish set up"
            onPress={handleFinish}
            disabled={!accepted}
            variant="accent"
          />
        </View>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xl, gap: spacing.xl },
  header: { fontFamily: fonts.heading700, fontSize: 38, color: colors.text, lineHeight: 44 },
  sub: { fontFamily: fonts.heading400, fontSize: 18, color: colors.textMuted, lineHeight: 26, marginTop: -spacing.md },

  promiseCard: { gap: spacing.md },
  promiseRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  promiseText: { fontFamily: fonts.body400, fontSize: 14, color: colors.text, flex: 1, lineHeight: 20 },

  docLinks: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: "hidden",
  },
  docLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
  },
  docLinkText: { fontFamily: fonts.body600, fontSize: 15, color: colors.text, flex: 1 },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },

  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.bgSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accentBorder,
  },
  checkLabel: {
    fontFamily: fonts.body400,
    fontSize: 14,
    color: colors.text,
    flex: 1,
    lineHeight: 21,
  },

  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
});
