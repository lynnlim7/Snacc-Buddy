/**
 * Coach Tab — AI Nutrition Insights dashboard.
 *
 * Surfaces the deterministic NutritionInsightEngine output (Stage 1B) as
 * actionable insight cards. Updated on every meal log; can also be refreshed
 * manually. Taps through to the Chat tab for personalised coaching.
 */
import React, { useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors, fonts, radius, spacing } from "../../constants/theme";
import { useCoachStore } from "../../stores/coachStore";
import { CoachInsight } from "../../types/coach";

// ─── Insight card definitions ─────────────────────────────────────────────────

interface InsightCard {
  key: keyof CoachInsight;
  label: string;
  description: (insight: CoachInsight) => string;
  icon: string;
  color: string;
}

const INSIGHT_CARDS: InsightCard[] = [
  {
    key: "protein_deficit",
    label: "Low Protein",
    description: (i) =>
      i.protein_adherence_pct != null
        ? `You're hitting ${Math.round(i.protein_adherence_pct * 100)}% of your protein target on average this week.`
        : "Your average protein intake is below your daily target.",
    icon: "barbell-outline",
    color: "#E0A4B0",
  },
  {
    key: "fibre_deficit",
    label: "Low Fibre",
    description: (i) =>
      i.fibre_adherence_pct != null
        ? `Fibre intake is at ${Math.round(i.fibre_adherence_pct * 100)}% of the 25 g/day recommendation.`
        : "Your average fibre intake is below the daily recommendation.",
    icon: "leaf-outline",
    color: "#A8D5A2",
  },
  {
    key: "excess_sodium",
    label: "High Sodium",
    description: () =>
      "Your average sodium intake exceeds the 2,300 mg/day upper limit. Consider reducing processed foods.",
    icon: "alert-circle-outline",
    color: "#F4A261",
  },
  {
    key: "calorie_surplus",
    label: "Calorie Surplus",
    description: (i) =>
      i.calorie_adherence_pct != null && i.calorie_target != null
        ? `You're averaging ${Math.round(i.calorie_adherence_pct * 100)}% of your ${Math.round(i.calorie_target)} kcal target.`
        : "Your average intake is more than 10% above your calorie target.",
    icon: "flame-outline",
    color: "#E76F51",
  },
  {
    key: "low_meal_consistency",
    label: "Inconsistent Logging",
    description: () =>
      "You've logged meals on fewer than 4 of the last 7 days. Consistent logging improves your coach's accuracy.",
    icon: "calendar-outline",
    color: "#9BB8D3",
  },
];

// ─── Components ───────────────────────────────────────────────────────────────

function InsightChip({
  card,
  insight,
}: {
  card: InsightCard;
  insight: CoachInsight;
}) {
  const triggered = insight[card.key] as boolean;
  return (
    <View style={[styles.card, triggered ? styles.cardActive : styles.cardInactive]}>
      <View style={[styles.cardIcon, { backgroundColor: triggered ? card.color + "33" : colors.bgSecondary }]}>
        <Ionicons
          name={card.icon as any}
          size={22}
          color={triggered ? card.color : colors.textLight}
        />
      </View>
      <View style={styles.cardText}>
        <Text style={[styles.cardLabel, !triggered && styles.cardLabelInactive]}>
          {card.label}
        </Text>
        {triggered ? (
          <Text style={styles.cardDesc}>{card.description(insight)}</Text>
        ) : (
          <Text style={styles.cardDescGood}>✓ On track</Text>
        )}
      </View>
    </View>
  );
}

function CalorieSummaryBar({ insight }: { insight: CoachInsight }) {
  if (!insight.avg_calories_7d || !insight.calorie_target) return null;
  const pct = Math.min(insight.avg_calories_7d / insight.calorie_target, 1.5);
  const over = pct > 1.05;
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>7-day calorie average</Text>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            { width: `${Math.min(pct * 100, 100)}%` as any, backgroundColor: over ? "#E76F51" : colors.primary },
          ]}
        />
        <View style={styles.barTarget} />
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryVal}>{Math.round(insight.avg_calories_7d)} kcal avg</Text>
        <Text style={styles.summaryMuted}>Target {Math.round(insight.calorie_target)} kcal</Text>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CoachScreen() {
  const { insights, insightsLoading, loadInsights, refreshInsights } = useCoachStore();

  useEffect(() => {
    loadInsights();
  }, []);

  const onRefresh = useCallback(async () => {
    await refreshInsights();
  }, []);

  const activeCount = insights
    ? INSIGHT_CARDS.filter((c) => insights[c.key] as boolean).length
    : 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={insightsLoading} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Nutrition Insights</Text>
        <Text style={styles.sub}>Updated automatically when you log a meal.</Text>

        {insightsLoading && !insights ? (
          <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />
        ) : !insights ? (
          <View style={styles.empty}>
            <Ionicons name="restaurant-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No insights yet</Text>
            <Text style={styles.emptyDesc}>Log your first meal and your personalized insights will appear here.</Text>
          </View>
        ) : (
          <>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {activeCount === 0
                  ? "All good — you're on track! 🎉"
                  : `${activeCount} insight${activeCount > 1 ? "s" : ""} need your attention`}
              </Text>
            </View>

            <CalorieSummaryBar insight={insights} />

            {INSIGHT_CARDS.map((card) => (
              <InsightChip key={card.key} card={card} insight={insights} />
            ))}

            <TouchableOpacity
              style={styles.chatButton}
              onPress={() => router.push("/(tabs)/chat")}
              activeOpacity={0.85}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFF" />
              <Text style={styles.chatButtonText}>Ask your coach</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.md, paddingBottom: 48 },

  heading: { fontFamily: fonts.heading, fontSize: 26, color: colors.text, marginBottom: 4 },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, marginBottom: spacing.md },

  badge: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  badgeText: { fontFamily: fonts.body500, fontSize: 14, color: colors.text, textAlign: "center" },

  summaryCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  summaryTitle: { fontFamily: fonts.body500, fontSize: 13, color: colors.textMuted, marginBottom: 8 },
  barTrack: { height: 8, backgroundColor: colors.bgSecondary, borderRadius: 4, overflow: "hidden", marginBottom: 6, position: "relative" },
  barFill: { height: "100%", borderRadius: 4, position: "absolute", left: 0 },
  barTarget: { position: "absolute", right: 0, top: -2, bottom: -2, width: 2, backgroundColor: colors.textMuted, opacity: 0.4 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryVal: { fontFamily: fonts.body500, fontSize: 13, color: colors.text },
  summaryMuted: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },

  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  cardActive: { backgroundColor: colors.bgCard, borderColor: colors.primaryLight },
  cardInactive: { backgroundColor: colors.bg, borderColor: "transparent", opacity: 0.7 },
  cardIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  cardText: { flex: 1 },
  cardLabel: { fontFamily: fonts.body500, fontSize: 14, color: colors.text, marginBottom: 2 },
  cardLabelInactive: { color: colors.textMuted },
  cardDesc: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  cardDescGood: { fontFamily: fonts.body, fontSize: 12, color: "#5A9E6F" },

  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    marginTop: spacing.md,
  },
  chatButtonText: { fontFamily: fonts.body500, fontSize: 15, color: "#FFF" },

  empty: { alignItems: "center", marginTop: 64, gap: 12 },
  emptyTitle: { fontFamily: fonts.body500, fontSize: 17, color: colors.text },
  emptyDesc: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, textAlign: "center", maxWidth: 280 },
});
