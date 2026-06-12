import { useEffect } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PaperBackground } from "../../components/PaperBackground";
import { useFoodStore } from "../../stores/foodStore";
import { DailySummary } from "../../types/food";
import { colors, fonts, spacing, radius } from "../../constants/theme";

// ─── Bar chart ────────────────────────────────────────────────

function DayBar({ summary, maxCalories }: { summary: DailySummary; maxCalories: number }) {
  const pct = maxCalories > 0 ? (summary.total_calories / maxCalories) * 100 : 0;
  const dayLabel = new Date(summary.date).toLocaleDateString("en-US", { weekday: "short" });

  return (
    <View style={styles.barWrapper}>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { height: `${pct}%` as any }]} />
      </View>
      <Text style={styles.barLabel}>{dayLabel}</Text>
      <Text style={styles.barCal}>{summary.total_calories > 0 ? summary.total_calories : ""}</Text>
    </View>
  );
}

// ─── Macro chip ───────────────────────────────────────────────

function MacroChip({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <View style={styles.macroChip}>
      <Text style={styles.macroChipValue}>
        {Math.round(value)}<Text style={styles.macroChipUnit}>{unit}</Text>
      </Text>
      <Text style={styles.macroChipLabel}>{label}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const { weeklySummary, dailySummary, isLoadingAnalytics, fetchWeeklySummary, fetchDailySummary } =
    useFoodStore();

  useEffect(() => {
    fetchWeeklySummary();
    fetchDailySummary();
  }, []);

  const maxCalories = weeklySummary
    ? Math.max(...weeklySummary.week.map((d) => d.total_calories), 1)
    : 1;

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.heading}>Stats</Text>

          {isLoadingAnalytics && (
            <ActivityIndicator color={colors.accent} style={styles.loader} />
          )}

          {dailySummary && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Today</Text>
              <Text style={styles.calorieHero}>
                {dailySummary.total_calories}
                <Text style={styles.calorieUnit}> kcal</Text>
              </Text>
              <View style={styles.macroRow}>
                <MacroChip label="Protein" value={dailySummary.total_protein_g} unit="g" />
                <MacroChip label="Carbs"   value={dailySummary.total_carbs_g}   unit="g" />
                <MacroChip label="Fat"     value={dailySummary.total_fat_g}     unit="g" />
              </View>
            </View>
          )}

          {weeklySummary && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Past 7 days</Text>
              <View style={styles.chartRow}>
                {weeklySummary.week.map((d) => (
                  <DayBar key={d.date} summary={d} maxCalories={maxCalories} />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </PaperBackground>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.xl,
    paddingBottom:     spacing.xxl,
    gap:               spacing.lg,
  },
  heading: {
    fontFamily: fonts.heading700,
    fontSize:   42,
    color:      colors.text,
    lineHeight: 44,
  },
  loader: { marginVertical: spacing.xl },

  // ── Cards ──
  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius:    radius.lg,
    borderWidth:     1.5,
    borderColor:     colors.border,
    padding:         spacing.md,
    gap:             spacing.md,
  },
  cardLabel: {
    fontFamily:    fonts.body600,
    fontSize:      12,
    color:         colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // ── Today ──
  calorieHero: {
    fontFamily: fonts.heading700,
    fontSize:   56,
    color:      colors.accent,
    lineHeight: 58,
  },
  calorieUnit: {
    fontFamily: fonts.heading400,
    fontSize:   28,
    color:      colors.textMuted,
  },
  macroRow: {
    flexDirection: "row",
    gap:           spacing.sm,
  },
  macroChip: {
    flex:            1,
    backgroundColor: colors.bg,
    borderRadius:    radius.md,
    borderWidth:     1.5,
    borderColor:     colors.border,
    padding:         spacing.sm,
    alignItems:      "center",
    gap:             spacing.xs,
  },
  macroChipValue: {
    fontFamily: fonts.heading700,
    fontSize:   22,
    color:      colors.text,
  },
  macroChipUnit: {
    fontFamily: fonts.body400,
    fontSize:   14,
    color:      colors.textMuted,
  },
  macroChipLabel: {
    fontFamily: fonts.body500,
    fontSize:   12,
    color:      colors.textMuted,
  },

  // ── Bar chart ──
  chartRow: {
    flexDirection: "row",
    alignItems:    "flex-end",
    height:        120,
    gap:           spacing.xs,
  },
  barWrapper: {
    flex:        1,
    alignItems:  "center",
    gap:         spacing.xs,
  },
  barTrack: {
    flex:            1,
    width:           "100%",
    backgroundColor: colors.border,
    borderRadius:    radius.sm,
    justifyContent:  "flex-end",
    overflow:        "hidden",
  },
  barFill: {
    backgroundColor: colors.accent,
    borderRadius:    radius.sm,
    minHeight:       4,
  },
  barLabel: {
    fontFamily: fonts.body500,
    fontSize:   11,
    color:      colors.textMuted,
  },
  barCal: {
    fontFamily: fonts.body400,
    fontSize:   10,
    color:      colors.textLight,
  },
});
