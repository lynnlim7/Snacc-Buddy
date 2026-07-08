/**
 * Setup Step 10 — "Your diary stays personal"
 * T&C and Privacy Policy are inline grey links, not stacked buttons.
 */
import React from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PaperBackground } from "../../components/PaperBackground";
import { PillowButton } from "../../components/PillowButton";
import { OnboardingHeader } from "../../components/OnboardingHeader";
import { PDFViewerModal } from "../../components/PDFViewerModal";
import { useOnboardingStore } from "../../stores/onboardingStore";
import { colors, fonts, spacing, journalCard } from "../../constants/theme";

const TERMS_ASSET   = require("../../assets/Terms_and_Conditions.pdf");
const PRIVACY_ASSET = require("../../assets/Privacy_Policy.pdf");

const PROMISES = [
  "Your diary entries are only visible to you",
  "We never sell your personal data",
  "Your information stays between you and Snacc Buddy",
];

export default function PrivacyScreen() {
  const router = useRouter();
  const [accepted, setAccepted] = React.useState(false);
  const [pdfModal, setPdfModal] = React.useState<{ title: string; asset: number } | null>(null);

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <OnboardingHeader step={12} total={16} />

        <PDFViewerModal
          visible={pdfModal !== null}
          title={pdfModal?.title ?? ""}
          asset={pdfModal?.asset ?? TERMS_ASSET}
          onClose={() => setPdfModal(null)}
        />

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.header}>Your diary stays personal</Text>
          <Text style={styles.sub}>
            Your information is only used to personalise your nutrition experience
          </Text>

          {/* Privacy promises card */}
          <View style={[journalCard(true), styles.promiseCard]}>
            {PROMISES.map((p) => (
              <View key={p} style={styles.promiseRow}>
                <View style={styles.bullet} />
                <Text style={styles.promiseText}>{p}</Text>
              </View>
            ))}

            {/* Inline doc links — two small grey links side by side */}
            <View style={styles.docRow}>
              <TouchableOpacity
                onPress={() => setPdfModal({ title: "Terms and Conditions", asset: TERMS_ASSET })}
                accessibilityRole="link"
                accessibilityLabel="Terms and Conditions"
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={styles.docLink}>Terms and Conditions</Text>
              </TouchableOpacity>
              <Text style={styles.docSep}>·</Text>
              <TouchableOpacity
                onPress={() => setPdfModal({ title: "Privacy Policy", asset: PRIVACY_ASSET })}
                accessibilityRole="link"
                accessibilityLabel="Privacy Policy"
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={styles.docLink}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
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
            onPress={() => router.push("/onboarding/account" as any)}
            disabled={!accepted}
            variant="pink"
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
  promiseRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.softPink, marginTop: 7, flexShrink: 0 },
  promiseText: { fontFamily: fonts.body400, fontSize: 14, color: colors.text, flex: 1, lineHeight: 20 },

  // Two grey inline links side by side
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
    flexWrap: "wrap",
  },
  docLink: {
    fontFamily: fonts.body400,
    fontSize: 12,
    color: colors.textMuted,
    textDecorationLine: "underline",
  },
  docSep: {
    fontFamily: fonts.body400,
    fontSize: 12,
    color: colors.textLight,
  },

  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: colors.border, backgroundColor: colors.bgSecondary,
    alignItems: "center", justifyContent: "center", marginTop: 1, flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: colors.softPink, borderColor: colors.softPinkBorder },
  checkLabel: { fontFamily: fonts.body400, fontSize: 14, color: colors.text, flex: 1, lineHeight: 21 },

  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
});
