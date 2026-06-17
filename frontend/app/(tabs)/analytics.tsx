import { useCallback } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { PaperBackground } from "../../components/PaperBackground";
import { useFoodStore } from "../../stores/foodStore";
import { useUserStore } from "../../stores/userStore";
import { computeCalorieGoal } from "../../utils/nutrition";
import { DailySummary } from "../../types/food";
import { colors, fonts, spacing, radius } from "../../constants/theme";

// ─── Ruled lines (mirrors diary page) ────────────────────────

const { height: SCREEN_H } = Dimensions.get("window");
const LINE_SPACING  = 38;
const HEADER_OFFSET = 180;
const NUM_LINES     = Math.ceil((SCREEN_H - HEADER_OFFSET) / LINE_SPACING) + 4;

const TRACK_HEIGHT = 100;

function RuledLines() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {Array.from({ length: NUM_LINES }).map((_, i) => (
        <View
          key={i}
          style={[styles.ruledLine, { top: HEADER_OFFSET + i * LINE_SPACING }]}
        />
      ))}
    </View>
  );
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

  const goalLinePct  = Math.min((calorieGoal / maxCalories) * 100, 100);
  const todayReached = dailySummary
    ? Math.round((dailySummary.total_calories / calorieGoal) * 100)
    : 0;
  const todayFillPct = dailySummary && dailySummary.total_calories > 0
    ? Math.max(3, Math.min(100, todayReached))
    : 0;

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <RuledLines />

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Today card — matches diary CalorieCard ── */}
          {dailySummary && (
            <>
              <Text style={styles.sectionHeading}>Today</Text>
              <View style={styles.sectionUnderline} />

              <View style={styles.todayCard}>
                <Text style={styles.cardLabel}>calories</Text>
                <Text style={styles.calorieHero}>
                  {dailySummary.total_calories.toLocaleString()}
                </Text>

                {/* Progress bar — mirrors diary CalorieCard */}
                <View style={styles.progressTrack}>
                  {todayFillPct > 0 && (
                    <View style={[styles.progressFill, { width: `${todayFillPct}%` as any }]} />
                  )}
                </View>

                <Text style={styles.goalCaption}>
                  Goal: {calorieGoal.toLocaleString()} kcal · {todayReached}% reached
                </Text>

                <View style={styles.macroRow}>
                  <MacroChip label="Protein" value={dailySummary.total_protein_g} unit="g" />
                  <MacroChip label="Carbs"   value={dailySummary.total_carbs_g}   unit="g" />
                  <MacroChip label="Fat"     value={dailySummary.total_fat_g}      unit="g" />
                </View>
              </View>
            </>
          )}

          {/* ── Weekly chart ── */}
          {weeklySummary && (
            <>
              <Text style={styles.sectionHeading}>Past 7 days</Text>
              <View style={styles.sectionUnderline} />

              <View style={styles.weekCard}>
                {/* Track area with goal line overlay */}
                <View style={styles.trackArea}>
                  <View
                    style={[styles.goalLine, { bottom: `${goalLinePct}%` as any }]}
                    pointerEvents="none"
                  >
                    <View style={styles.goalLineDash} />
                    <Text style={styles.goalLineLabel}>{calorieGoal.toLocaleString()}</Text>
                  </View>

                  <View style={styles.trackRow}>
                    {weeklySummary.week.map((d) => (
                      <BarTrack key={d.date} summary={d} maxCalories={maxCalories} />
                    ))}
                  </View>
                </View>

                <View style={styles.labelRow}>
                  {weeklySummary.week.map((d) => (
                    <BarLabel key={d.date} summary={d} />
                  ))}
                </View>
              </View>
            </>
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
    paddingTop:        spacing.lg,
    paddingBottom:     120,
    gap:               spacing.md,
  },

  // ── Ruled lines (mirrors diary) ──
  ruledLine: {
    position:        "absolute",
    left:            0,
    right:           0,
    height:          1,
    backgroundColor: colors.border,
    opacity:         0.45,
  },

  // ── Header (mirrors diary headerRow) ──
  headerRow: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "flex-start",
    marginBottom:   spacing.sm,
  },
  greetingText: {
    fontFamily: fonts.body400,
    fontSize:   14,
    color:      colors.textMuted,
  },
  heading: {
    fontFamily: fonts.body700,
    fontSize:   18,
    color:      colors.text,
  },

  loader: { marginVertical: spacing.xl },

  // ── Section heading + underline (mirrors diary "Meals" section) ──
  sectionHeading: {
    fontFamily: fonts.heading700,
    fontSize:   30,
    color:      colors.text,
    marginTop:  spacing.md,
  },
  sectionUnderline: {
    height:          1.5,
    backgroundColor: colors.text,
    marginTop:       4,
    marginBottom:    spacing.sm,
  },

  // ── Today card (mirrors diary CalorieCard — softPink) ──
  todayCard: {
    backgroundColor: colors.softPink,
    borderRadius:    radius.lg,
    borderWidth:     1.5,
    borderColor:     colors.softPinkBorder,
    padding:         spacing.md,
    gap:             spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor:   colors.softPinkBorder,
        shadowOffset:  { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius:  0,
      },
      android: { elevation: 3 },
    }),
  },
  cardLabel: {
    fontFamily:    fonts.body600,
    fontSize:      13,
    color:         colors.text,
    opacity:       0.7,
  },
  calorieHero: {
    fontFamily:    fonts.heading700,
    fontSize:      52,
    color:         colors.text,
    lineHeight:    56,
    letterSpacing: -1,
  },

  // ── Progress bar (matches diary CalorieCard) ──
  progressTrack: {
    height:          10,
    borderRadius:    5,
    backgroundColor: "rgba(74, 64, 54, 0.12)",
    overflow:        "hidden",
  },
  progressFill: {
    height:          "100%",
    borderRadius:    5,
    backgroundColor: colors.softPinkBorder,
  },
  goalCaption: {
    fontFamily: fonts.body400,
    fontSize:   12,
    color:      colors.text,
    opacity:    0.6,
  },

  // ── Macro chips ──
  macroRow: {
    flexDirection: "row",
    gap:           spacing.sm,
  },
  macroChip: {
    flex:            1,
    backgroundColor: colors.bg,
    borderRadius:    radius.md,
    borderWidth:     1.5,
    borderColor:     colors.softPinkBorder,
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

  // ── Weekly chart card (bgSecondary — separate feel from today) ──
  weekCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius:    radius.lg,
    borderWidth:     1.5,
    borderColor:     colors.border,
    padding:         spacing.md,
    gap:             spacing.md,
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
    backgroundColor: colors.softPinkBorder,
    borderRadius:    radius.sm,
    minHeight:       4,
  },
  labelRow: {
    flexDirection: "row",
    gap:           spacing.xs,
    marginTop:     -spacing.xs,
  },
  barLabelWrap: {
    flex:       1,
    alignItems: "center",
    gap:        2,
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
    fontFamily: fonts.body600,
    fontSize:   10,
    color:      colors.accentBorder,
    marginLeft: 4,
    lineHeight: 12,
  },

  // ── Empty state ──
  emptyWrap: {
    alignItems: "center",
    paddingTop: spacing.xxl,
    gap:        spacing.md,
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
});
