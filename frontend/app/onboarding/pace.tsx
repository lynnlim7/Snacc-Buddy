/**
 * Setup Step 6 — "What pace feels right for you?"
 * Horizontal scroll-snap slider with three cosy labels.
 */
import React, { useRef, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, Dimensions, NativeScrollEvent, NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { PaperBackground } from "../../components/PaperBackground";
import { PillowButton } from "../../components/PillowButton";
import { OnboardingHeader } from "../../components/OnboardingHeader";
import { colors, fonts, spacing, radius, journalCard } from "../../constants/theme";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = SCREEN_W - spacing.xl * 2;

const PACES = [
  {
    id: "slow",
    label: "Slowly but surely",
    emoji: "🐢",
    description: "Gentle changes that stick. Sustainable and kind to yourself.",
    deficit: "~250 kcal/day",
  },
  {
    id: "moderate",
    label: "Somewhere in the middle",
    emoji: "🚶",
    description: "A balanced approach. Progress without feeling deprived.",
    deficit: "~500 kcal/day",
  },
  {
    id: "fast",
    label: "As fast as possible",
    emoji: "🏃",
    description: "More structured. Needs consistency — but results come quicker.",
    deficit: "~750 kcal/day",
  },
];

export default function PaceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [activeIndex, setActiveIndex] = useState(1); // default: moderate
  const scrollRef = useRef<ScrollView>(null);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / (CARD_W + spacing.md));
    setActiveIndex(index);
  }

  function handleNext() {
    router.push({
      pathname: "/onboarding/lifestyle" as any,
      params: { ...params, pace: PACES[activeIndex].id },
    });
  }

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <OnboardingHeader step={8} total={16} />

        <View style={styles.header}>
          <Text style={styles.title}>What pace feels{"\n"}right for you?</Text>
          <Text style={styles.sub}>There's no rush — choose what feels sustainable</Text>
        </View>

        {/* Horizontal snap scroll */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled={false}
          snapToInterval={CARD_W + spacing.md}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onMomentumScrollEnd={onScroll}
          // Start on middle card
          contentOffset={{ x: CARD_W + spacing.md, y: 0 }}
        >
          {PACES.map((pace, i) => (
            <View
              key={pace.id}
              style={[
                journalCard(i === activeIndex),
                styles.paceCard,
                i === activeIndex && styles.paceCardActive,
              ]}
            >
              <Text style={styles.paceEmoji}>{pace.emoji}</Text>
              <Text style={[styles.paceLabel, i === activeIndex && styles.paceLabelActive]}>
                {pace.label}
              </Text>
              <Text style={styles.paceDesc}>{pace.description}</Text>
              <View style={styles.deficitBadge}>
                <Text style={styles.deficitText}>{pace.deficit}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Dot indicators */}
        <View style={styles.dots}>
          {PACES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>

        <View style={styles.footer}>
          <PillowButton label="Next →" onPress={handleNext} />
        </View>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.sm, marginBottom: spacing.xl },
  title: { fontFamily: fonts.heading700, fontSize: 38, color: colors.text, lineHeight: 44 },
  sub: { fontFamily: fonts.heading400, fontSize: 18, color: colors.textMuted },

  scrollContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  paceCard: {
    width: CARD_W,
    gap: spacing.md,
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  paceCardActive: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  paceEmoji: { fontSize: 52 },
  paceLabel: {
    fontFamily: fonts.heading700,
    fontSize: 24,
    color: colors.textMuted,
    textAlign: "center",
  },
  paceLabelActive: { color: colors.text },
  paceDesc: {
    fontFamily: fonts.body400,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: spacing.md,
  },
  deficitBadge: {
    backgroundColor: colors.matcha,
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.matchaBorder,
  },
  deficitText: { fontFamily: fonts.body600, fontSize: 13, color: colors.text },

  dots: { flexDirection: "row", justifyContent: "center", gap: 8, marginVertical: spacing.md },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { width: 20, backgroundColor: colors.accent, borderRadius: 4 },

  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
});
