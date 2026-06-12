import { useCallback } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { PaperBackground } from "../../components/PaperBackground";
import { useFoodStore } from "../../stores/foodStore";
import { useUserStore, UserProfile } from "../../stores/userStore";
import { DailySummary } from "../../types/food";
import { colors, fonts, spacing, radius } from "../../constants/theme";

const TRACK_HEIGHT = 100;

// ─── TDEE goal (mirrors index.tsx logic) ─────────────────────

function computeCalorieGoal(profile: UserProfile | null): number {
  if (!profile) return 2000;
  const { gender, age, height_cm, current_weight_kg, goal, lifestyle } = profile;
  if (!age || !height_cm || !current_weight_kg) return 2000;
  const genderOffset = gender === "male" ? 5 : gender === "female" ? -161 : -78;
  const bmr = 10 * current_weight_kg + 6.25 * height_cm - 5 * age + genderOffset;
  const activityMultiplier: Record<string, number> = {
    wfh: 1.2, retired: 1.2, full_time: 1.375, part_time: 1.375,
    student: 1.55, homemaker: 1.55,
  };
  const tdee = Math.round(bmr * (activityMultiplier[lifestyle ?? ""] ?? 1.375));
  const goalAdjustment: Record<string, number> = {
    lose_weight: -500, lose_fat: -300, gain_muscle: +300, eat_healthier: 0,
  };
  return Math.max(1200, tdee + (goalAdjustment[goal ?? ""] ?? 0));
}

// ─── Bar chart ────────────────────────────────────────────────

function BarTrack({ summary, maxCalories }: { summary: DailySummary; maxCalories: number }) {
  const pct = maxCalories > 0 ? (summary.total_calories / maxCalories) * 100 : 0;
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { height: `${pct}%` as any }]} />
    </View>
  );
}

function BarLabel({ summary }: { summary: DailySummary }) {
  const dayLabel = new Date(summary.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" });
  return (
    <View style={styles.barLabelWrap}>
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
  const profile     = useUserStore((s) => s.profile);
  const calorieGoal = computeCalorieGoal(profile);

  useFocusEffect(
    useCallback(() => {
      fetchWeeklySummary();
      fetchDailySummary();
    }, [])
  );

  const maxCalories = weeklySummary
    ? Math.max(...weeklySummary.week.map((d) => d.total_calories), calorieGoal, 1)
    : calorieGoal;

  // Goal line position as % from bottom of track area (clamped 0–100)
  const goalLinePct = Math.min((calorieGoal / maxCalories) * 100, 100);

  const todayReached = dailySummary
    ? Math.round((dailySummary.total_calories / calorieGoal) * 100)
    : 0;

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

          {!isLoadingAnalytics && !dailySummary && !weeklySummary && (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>Nothing here yet</Text>
              <Text style={styles.emptyBody}>
                Log your first meal on the scan tab and your stats will appear here
              </Text>
            </View>
          )}

          {dailySummary && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Today</Text>
              <Text style={styles.calorieHero}>
                {dailySummary.total_calories}
                <Text style={styles.calorieUnit}> kcal</Text>
              </Text>
              <Text style={styles.goalCaption}>
                Goal: {calorieGoal.toLocaleString()} kcal · {todayReached}% reached
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

              {/* Track area with goal line overlay */}
              <View style={styles.trackArea}>
                {/* Goal line */}
                <View
                  style={[styles.goalLine, { bottom: `${goalLinePct}%` as any }]}
                  pointerEvents="none"
                >
                  <View style={styles.goalLineDash} />
                  <Text style={styles.goalLineLabel}>{calorieGoal.toLocaleString()}</Text>
                </View>

                {/* Bars */}
                <View style={styles.trackRow}>
                  {weeklySummary.week.map((d) => (
                    <BarTrack key={d.date} summary={d} maxCalories={maxCalories} />
                  ))}
                </View>
              </View>

              {/* Day + calorie labels */}
              <View style={styles.labelRow}>
                {weeklySummary.week.map((d) => (
                  <BarLabel key={d.date} summary={d} />
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

  // ── Empty state ──
  emptyWrap: {
    alignItems:  "center",
    paddingTop:  spacing.xxl,
    gap:         spacing.md,
  },
  emptyTitle: {
    fontFamily: fonts.heading700,
    fontSize:   28,
    color:      colors.text,
    lineHeight: 32,
  },
  emptyBody: {
    fontFamily: fonts.heading400,
    fontSize:   17,
    color:      colors.textMuted,
    textAlign:  "center",
    lineHeight: 25,
  },

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
  goalCaption: {
    fontFamily: fonts.body500,
    fontSize:   13,
    color:      colors.textMuted,
    marginTop:  -spacing.sm,
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
  trackArea: {
    position: "relative",
    height:   TRACK_HEIGHT,
  },
  trackRow: {
    flexDirection: "row",
    alignItems:    "flex-end",
    height:        TRACK_HEIGHT,
    gap:           spacing.xs,
  },
  barTrack: {
    flex:            1,
    height:          "100%",
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
  labelRow: {
    flexDirection: "row",
    gap:           spacing.xs,
    marginTop:     -spacing.xs,
  },
  barLabelWrap: {
    flex:        1,
    alignItems:  "center",
    gap:         2,
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

  // ── Goal line ──
  goalLine: {
    position:      "absolute",
    left:          0,
    right:         0,
    flexDirection: "row",
    alignItems:    "center",
    zIndex:        1,
  },
  goalLineDash: {
    flex:           1,
    height:         1.5,
    borderTopWidth: 1.5,
    borderStyle:    "dashed",
    borderColor:    colors.accentBorder,
  },
  goalLineLabel: {
    fontFamily:  fonts.body600,
    fontSize:    10,
    color:       colors.accentBorder,
    marginLeft:  4,
    lineHeight:  12,
  },
});
