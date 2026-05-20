/**
 * Onboarding — "Let's make this diary yours" intro to setup questions.
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { PaperBackground } from "../../components/PaperBackground";
import { PillowButton } from "../../components/PillowButton";
import { colors, fonts, spacing, journalCard } from "../../constants/theme";

const SETUP_ITEMS = [
  { emoji: "🌸", text: "A few personal details" },
  { emoji: "🎯", text: "Your health goals" },
  { emoji: "🍽️", text: "Your food preferences" },
];

export default function IntroScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Text style={styles.emoji}>✏️</Text>
          <Text style={styles.header}>Let's make this{"\n"}diary yours</Text>
          <Text style={styles.sub}>
            A few quick questions so Snacc Buddy can fit naturally into your everyday life
          </Text>

          {/* What to expect */}
          <View style={[journalCard(true), styles.card]}>
            <Text style={styles.cardTitle}>What we'll cover</Text>
            {SETUP_ITEMS.map((item) => (
              <View key={item.text} style={styles.cardRow}>
                <Text style={styles.cardEmoji}>{item.emoji}</Text>
                <Text style={styles.cardText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.hint}>Takes about 2 minutes — and it's worth it 🌿</Text>
        </View>

        <View style={styles.footer}>
          <PillowButton
            label="Continue"
            onPress={() => router.push({ pathname: "/onboarding/gender" as any, params })}
            variant="accent"
          />
        </View>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    gap: spacing.xl,
    alignItems: "flex-start",
  },
  emoji: { fontSize: 48 },
  header: {
    fontFamily: fonts.heading700,
    fontSize: 42,
    color: colors.text,
    lineHeight: 46,
  },
  sub: {
    fontFamily: fonts.heading400,
    fontSize: 19,
    color: colors.textMuted,
    lineHeight: 28,
  },
  card: { width: "100%", gap: spacing.md },
  cardTitle: {
    fontFamily: fonts.body700,
    fontSize: 14,
    color: colors.textMuted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  cardRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  cardEmoji: { fontSize: 20, width: 28 },
  cardText: { fontFamily: fonts.body500, fontSize: 15, color: colors.text, flex: 1 },
  hint: { fontFamily: fonts.body400, fontSize: 13, color: colors.textMuted },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
});
