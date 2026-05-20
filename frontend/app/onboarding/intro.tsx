/**
 * Onboarding — "Let's make this diary yours"
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { PaperBackground } from "../../components/PaperBackground";
import { PillowButton } from "../../components/PillowButton";
import { colors, fonts, spacing, journalCard } from "../../constants/theme";

const SETUP_ITEMS = [
  { text: "A few personal details" },
  { text: "Your health goals"      },
  { text: "Your food preferences"  },
];

export default function IntroScreen() {
  const router = useRouter();

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Text style={styles.header}>Let's make this{"\n"}diary yours</Text>
          <Text style={styles.sub}>
            A few quick questions so Snacc Buddy can fit naturally into your everyday life
          </Text>

          <View style={[journalCard(true), styles.card]}>
            <Text style={styles.cardTitle}>What we'll cover</Text>
            {SETUP_ITEMS.map((item) => (
              <View key={item.text} style={styles.cardRow}>
                <View style={styles.bullet} />
                <Text style={styles.cardText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.hint}>Takes about 2 minutes</Text>
        </View>

        <View style={styles.footer}>
          <PillowButton
            label="Continue"
            onPress={() => router.push("/onboarding/gender" as any)}
            variant="pink"
          />
        </View>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, gap: spacing.xl },
  header: { fontFamily: fonts.heading700, fontSize: 42, color: colors.text, lineHeight: 46 },
  sub: { fontFamily: fonts.heading400, fontSize: 19, color: colors.textMuted, lineHeight: 28 },
  card: { gap: spacing.md },
  cardTitle: { fontFamily: fonts.body700, fontSize: 12, color: colors.textMuted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: spacing.xs },
  cardRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.softPink, flexShrink: 0 },
  cardText: { fontFamily: fonts.body500, fontSize: 15, color: colors.text, flex: 1 },
  hint: { fontFamily: fonts.body400, fontSize: 13, color: colors.textMuted },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
});
