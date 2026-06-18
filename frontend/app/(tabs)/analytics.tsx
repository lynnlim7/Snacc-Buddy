/**
 * Progress Tab — 7-day overview screen.
 * Figma design: eyebrow + heading, 4 stat cards (2×2), segmented control,
 * calorie line chart, weight line chart, macro grouped bar chart.
 */
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PaperBackground } from "../../components/PaperBackground";
import { LineChart, ChartDataPoint } from "../../components/LineChart";
import { useFoodStore } from "../../stores/foodStore";
import { useUserStore } from "../../stores/userStore";
import { computeCalorieGoal, computeNutritionTargets } from "../../utils/nutrition";
import { colors, fonts, spacing, radius } from "../../constants/theme";

const { width: SCREEN_W } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_W - spacing.xl * 2 - spacing.md * 2;

type Segment = "Calories" | "Weight" | "Macros";
const SEGMENTS: Segment[] = ["Calories", "Weight", "Macros"];

// Macro colour palette — consistent with the rest of the app
const MACRO_COLORS = {
  protein: "#9B5468",  // mauve rose
  carbs:   "#A8C5DA",  // pastel blue
  fat:     "#C5B8E8",  // lavender
};

// ─── Grouped macro bar chart ──────────────────────────────────

interface MacroBarDay {
  label:   string;
  protein: number;
  carbs:   number;
  fat:     number;
}

function MacroBarChart({ data, width }: { data: MacroBarDay[]; width: number }) {
  const PAD_L  = 40;
  const PAD_R  = 8;
  const PAD_T  = 8;
  const PAD_B  = 28;
  const height = 200;

  const [tooltip, setTooltip] = useState<{
    x: number; y: number; day: MacroBarDay;
  } | null>(null);

  if (data.length === 0) return null;

  const chartW = width - PAD_L - PAD_R;
  const chartH = height - PAD_T - PAD_B;

  const maxVal = Math.max(
    ...data.flatMap((d) => [d.protein, d.carbs, d.fat]),
    1
  );

  const gridSteps = 4;
  const gridVals: number[] = [];
  for (let i = 0; i <= gridSteps; i++) {
    gridVals.push(Math.round((maxVal / gridSteps) * i));
  }

  const groupW    = chartW / data.length;
  const barPad    = groupW * 0.12;
  const barW      = (groupW - barPad * 2) / 3;

  function toY(v: number) {
    return PAD_T + chartH - (v / maxVal) * chartH;
  }
  function barH(v: number) {
    return Math.max((v / maxVal) * chartH, v > 0 ? 2 : 0);
  }

  // Native fallback — simple grouped bars using Views
  if (Platform.OS !== "web") {
    return (
      <View style={{ height, paddingBottom: PAD_B, paddingLeft: PAD_L }}>
        <View style={{ flex: 1, flexDirection: "row", alignItems: "flex-end", gap: 4 }}>
          {data.map((d, i) => {
            const dayMax = Math.max(d.protein, d.carbs, d.fat, 1);
            return (
              <View key={i} style={{ flex: 1, flexDirection: "row", alignItems: "flex-end", gap: 1, height: "100%" }}>
                {[
                  { v: d.protein, c: MACRO_COLORS.protein },
                  { v: d.carbs,   c: MACRO_COLORS.carbs   },
                  { v: d.fat,     c: MACRO_COLORS.fat      },
                ].map(({ v, c }, j) => (
                  <View
                    key={j}
                    style={{
                      flex: 1,
                      height: `${Math.max((v / maxVal) * 100, v > 0 ? 3 : 0)}%` as any,
                      backgroundColor: c,
                      borderRadius: 3,
                    }}
                  />
                ))}
              </View>
            );
          })}
        </View>
        <View style={{ flexDirection: "row", gap: 4, marginTop: 4 }}>
          {data.map((d, i) => (
            <View key={i} style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontFamily: fonts.body400, fontSize: 10, color: colors.textMuted }}>{d.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={{ width, height }}>
      {(React as any).createElement(
        "svg",
        {
          width,
          height,
          viewBox: `0 0 ${width} ${height}`,
          style: { display: "block", overflow: "visible" },
          onMouseLeave: () => setTooltip(null),
        },

        // ── Grid lines + y-axis labels ──
        ...gridVals.map((gv) =>
          (React as any).createElement(
            "g",
            { key: `grid-${gv}` },
            (React as any).createElement("line", {
              x1: PAD_L, y1: toY(gv), x2: PAD_L + chartW, y2: toY(gv),
              stroke: "#E8DDD2", strokeWidth: 1,
            }),
            (React as any).createElement(
              "text",
              {
                x: PAD_L - 4, y: toY(gv) + 4,
                textAnchor: "end", fontSize: 9,
                fill: "#9B8578", fontFamily: "sans-serif",
              },
              String(gv)
            )
          )
        ),

        // ── Bars per day ──
        ...data.map((d, i) => {
          const groupX = PAD_L + i * groupW + barPad;
          const bars = [
            { v: d.protein, c: MACRO_COLORS.protein },
            { v: d.carbs,   c: MACRO_COLORS.carbs   },
            { v: d.fat,     c: MACRO_COLORS.fat      },
          ];
          return (React as any).createElement(
            "g",
            {
              key: `group-${i}`,
              style: { cursor: "pointer" },
              onMouseEnter: (e: any) => {
                const rect = e.currentTarget.closest("svg").getBoundingClientRect();
                const cx = groupX + (barW * 3) / 2;
                setTooltip({ x: cx, y: PAD_T, day: d });
              },
            },
            // Hover hit area (invisible, full group height)
            (React as any).createElement("rect", {
              x: groupX - barPad / 2, y: PAD_T,
              width: groupW, height: chartH,
              fill: "transparent",
            }),
            // Three bars
            ...bars.map(({ v, c }, j) =>
              (React as any).createElement("rect", {
                key: `bar-${j}`,
                x: groupX + j * barW,
                y: toY(v),
                width: barW - 1,
                height: barH(v),
                fill: c,
                rx: 3,
                opacity: tooltip?.day.label === d.label ? 1 : 0.85,
              })
            ),
            // X-axis label
            (React as any).createElement(
              "text",
              {
                x: groupX + (barW * 3) / 2,
                y: height - 8,
                textAnchor: "middle", fontSize: 10,
                fill: "#9B8578", fontFamily: "sans-serif",
              },
              d.label
            )
          );
        }),

        // ── Tooltip ──
        tooltip && (() => {
          const tx = Math.min(tooltip.x, width - 110);
          const ty = tooltip.y + 10;
          const lines = [
            { label: tooltip.day.label, color: colors.text,           bold: true },
            { label: `${tooltip.day.protein}g protein`, color: MACRO_COLORS.protein, bold: false },
            { label: `${tooltip.day.carbs}g carbs`,     color: MACRO_COLORS.carbs,   bold: false },
            { label: `${tooltip.day.fat}g fat`,          color: MACRO_COLORS.fat,     bold: false },
          ];
          return (React as any).createElement(
            "g",
            { key: "tooltip" },
            // Shadow rect
            (React as any).createElement("rect", {
              x: tx + 1, y: ty + 2,
              width: 110, height: lines.length * 18 + 12,
              rx: 8, fill: "rgba(0,0,0,0.08)",
            }),
            // Background
            (React as any).createElement("rect", {
              x: tx, y: ty,
              width: 110, height: lines.length * 18 + 12,
              rx: 8, fill: "#FFFFFF",
              stroke: "#E8DDD2", strokeWidth: 1,
            }),
            // Lines
            ...lines.map(({ label, color, bold }, li) =>
              (React as any).createElement(
                "text",
                {
                  key: `tt-${li}`,
                  x: tx + 10, y: ty + 14 + li * 18,
                  fontSize: 11,
                  fill: color,
                  fontFamily: "sans-serif",
                  fontWeight: bold ? "700" : "400",
                },
                label
              )
            )
          );
        })()
      )}
    </View>
  );
}

// ─── Stat card ────────────────────────────────────────────────

function StatCard({
  label, value, unit, trend, icon,
}: {
  label: string;
  value: string | number;
  unit?: string;
  trend?: string;
  icon: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIconWrap}>
        <Ionicons name={icon as any} size={16} color={colors.primary} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statValueRow}>
        <Text style={styles.statValue}>{value}</Text>
        {unit && <Text style={styles.statUnit}>{unit}</Text>}
      </View>
      {trend !== undefined && (
        <Text style={styles.statTrend}>{trend}</Text>
      )}
    </View>
  );
}

// ─── Segmented control ────────────────────────────────────────

function SegmentedControl({
  value,
  onChange,
}: {
  value: Segment;
  onChange: (v: Segment) => void;
}) {
  return (
    <View style={styles.segmentedControl}>
      {SEGMENTS.map((s) => (
        <TouchableOpacity
          key={s}
          style={[styles.segment, value === s && styles.segmentActive]}
          onPress={() => onChange(s)}
          activeOpacity={0.75}
        >
          <Text style={[styles.segmentText, value === s && styles.segmentTextActive]}>{s}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const { weeklySummary, isLoadingAnalytics, fetchWeeklySummary, fetchDailySummary } =
    useFoodStore();
  const profile     = useUserStore((s) => s.profile);
  const calorieGoal = computeCalorieGoal(profile);
  const targets     = computeNutritionTargets(profile);

  const [segment, setSegment] = useState<Segment>("Calories");

  useFocusEffect(
    useCallback(() => {
      fetchWeeklySummary();
      fetchDailySummary();
    }, [])
  );

  // ── Derived stats ──
  const week        = weeklySummary?.week ?? [];
  const activeDays  = week.filter((d) => d.total_calories > 0).length;
  const avgCalories = activeDays > 0
    ? Math.round(week.reduce((s, d) => s + d.total_calories, 0) / activeDays)
    : 0;
  const avgProtein  = activeDays > 0
    ? Math.round(week.reduce((s, d) => s + d.total_protein_g, 0) / activeDays)
    : 0;
  const daysOnTrack = week.filter(
    (d) => d.total_calories > 0 && Math.abs(d.total_calories - calorieGoal) / calorieGoal <= 0.15
  ).length;

  // ── Chart data ──
  const chartDataCalories: ChartDataPoint[] = week.map((d) => ({
    label: new Date(d.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" }),
    value: d.total_calories,
  }));

  // Weight: use current_weight_kg as a flat baseline (no daily history yet)
  const currentWeight = profile?.current_weight_kg ?? 0;
  const chartDataWeight: ChartDataPoint[] = week.length > 0
    ? week.map((d) => ({
        label: new Date(d.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" }),
        value: currentWeight,
      }))
    : [];

  const macroBarData: MacroBarDay[] = week.map((d) => ({
    label:   new Date(d.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" }),
    protein: Math.round(d.total_protein_g),
    carbs:   Math.round(d.total_carbs_g),
    fat:     Math.round(d.total_fat_g),
  }));

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={styles.headerRow}>
            <Text style={styles.eyebrow}>7-DAY OVERVIEW</Text>
            <Text style={styles.heading}>Your Progress</Text>
          </View>

          {isLoadingAnalytics && !weeklySummary ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginTop: spacing.xxl }}
            />
          ) : (
            <>
              {/* ── 4 stat cards (2×2) ── */}
              <View style={styles.statGrid}>
                <StatCard
                  label="Avg Daily Calories"
                  value={avgCalories > 0 ? avgCalories.toLocaleString() : "—"}
                  unit={avgCalories > 0 ? "kcal" : undefined}
                  trend={avgCalories > 0 ? `Goal: ${calorieGoal.toLocaleString()} kcal` : undefined}
                  icon="flame-outline"
                />
                <StatCard
                  label="Weight Change"
                  value={currentWeight > 0 ? currentWeight.toFixed(1) : "—"}
                  unit={currentWeight > 0 ? "kg" : undefined}
                  trend="Current weight"
                  icon="trending-up-outline"
                />
                <StatCard
                  label="Avg Protein"
                  value={avgProtein > 0 ? avgProtein : "—"}
                  unit={avgProtein > 0 ? "g" : undefined}
                  trend={avgProtein > 0 ? `Target: ${Math.round(targets.protein_g)}g` : undefined}
                  icon="barbell-outline"
                />
                <StatCard
                  label="Days On Track"
                  value={daysOnTrack}
                  unit="/ 7"
                  trend={daysOnTrack >= 5 ? "Great week!" : daysOnTrack >= 3 ? "Good progress" : "Keep going!"}
                  icon="checkmark-circle-outline"
                />
              </View>

              {/* ── Chart card ── */}
              {week.length > 0 && (
                <View style={styles.chartCard}>
                  <SegmentedControl value={segment} onChange={setSegment} />

                  <View style={{ marginTop: spacing.md }}>
                    {/* ── Calories chart ── */}
                    {segment === "Calories" && (
                      <>
                        <Text style={styles.chartTitle}>Calories this week (kcal)</Text>
                        <LineChart
                          data={chartDataCalories}
                          goal={calorieGoal}
                          width={CHART_WIDTH}
                        />
                      </>
                    )}

                    {/* ── Weight chart ── */}
                    {segment === "Weight" && (
                      <>
                        <Text style={styles.chartTitle}>Weight this week (kg)</Text>
                        {currentWeight > 0 ? (
                          <LineChart
                            data={chartDataWeight}
                            goal={profile?.goal_weight_kg ?? currentWeight}
                            width={CHART_WIDTH}
                          />
                        ) : (
                          <View style={styles.emptyChart}>
                            <Ionicons name="scale-outline" size={28} color={colors.textLight} />
                            <Text style={styles.emptyChartText}>
                              Add your weight in the You tab to start tracking
                            </Text>
                          </View>
                        )}
                      </>
                    )}

                    {/* ── Macros bar chart ── */}
                    {segment === "Macros" && (
                      <>
                        <Text style={styles.chartTitle}>Macro breakdown (g)</Text>
                        {/* Legend */}
                        <View style={styles.macroLegend}>
                          {[
                            { label: "Protein", color: MACRO_COLORS.protein },
                            { label: "Carbs",   color: MACRO_COLORS.carbs   },
                            { label: "Fat",     color: MACRO_COLORS.fat      },
                          ].map(({ label, color }) => (
                            <View key={label} style={styles.macroLegendItem}>
                              <View style={[styles.macroLegendDot, { backgroundColor: color }]} />
                              <Text style={styles.macroLegendText}>{label}</Text>
                            </View>
                          ))}
                        </View>
                        <MacroBarChart data={macroBarData} width={CHART_WIDTH} />
                      </>
                    )}
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </PaperBackground>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:          { flex: 1 },
  scroll:        { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.lg,
    paddingBottom:     120,
    gap:               spacing.md,
  },

  // ── Header ──
  headerRow: {
    marginBottom: spacing.sm,
  },
  eyebrow: {
    fontFamily:    fonts.body600,
    fontSize:      11,
    color:         colors.primary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom:  2,
  },
  heading: {
    fontFamily: fonts.heading700,
    fontSize:   28,
    color:      colors.text,
    fontStyle:  "italic",
  },

  // ── 2×2 stat grid ──
  statGrid: {
    flexDirection: "row",
    flexWrap:      "wrap",
    gap:           spacing.sm,
  },
  statCard: {
    width:           "48%",
    backgroundColor: colors.bgCard,
    borderRadius:    radius.md,
    borderWidth:     1,
    borderColor:     colors.border,
    padding:         spacing.md,
    gap:             4,
    ...Platform.select({
      ios: {
        shadowColor:   colors.accentBorder,
        shadowOffset:  { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius:  6,
      },
      android: { elevation: 2 },
    }),
  },
  statIconWrap: {
    width:           30,
    height:          30,
    borderRadius:    15,
    backgroundColor: colors.primaryLight,
    alignItems:      "center",
    justifyContent:  "center",
    marginBottom:    4,
  },
  statLabel: {
    fontFamily:    fonts.body400,
    fontSize:      11,
    color:         colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  statValueRow: {
    flexDirection: "row",
    alignItems:    "baseline",
    gap:           3,
  },
  statValue: {
    fontFamily: fonts.body700,
    fontSize:   22,
    color:      colors.text,
  },
  statUnit: {
    fontFamily: fonts.body400,
    fontSize:   12,
    color:      colors.textMuted,
  },
  statTrend: {
    fontFamily: fonts.body400,
    fontSize:   11,
    color:      colors.textMuted,
  },

  // ── Segmented control ──
  segmentedControl: {
    flexDirection:   "row",
    backgroundColor: colors.bg,
    borderRadius:    radius.pill,
    borderWidth:     1,
    borderColor:     colors.border,
    padding:         3,
  },
  segment: {
    flex:            1,
    paddingVertical: 7,
    borderRadius:    radius.pill,
    alignItems:      "center",
  },
  segmentActive: {
    backgroundColor: colors.bgCard,
    ...Platform.select({
      ios: {
        shadowColor:   colors.accentBorder,
        shadowOffset:  { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius:  4,
      },
      android: { elevation: 2 },
    }),
  },
  segmentText: {
    fontFamily: fonts.body500,
    fontSize:   13,
    color:      colors.textMuted,
  },
  segmentTextActive: {
    color:      colors.text,
    fontFamily: fonts.body700,
  },

  // ── Chart card ──
  chartCard: {
    backgroundColor: colors.bgCard,
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderColor:     colors.border,
    padding:         spacing.md,
  },
  chartTitle: {
    fontFamily:  fonts.heading600,
    fontSize:    15,
    color:       colors.text,
    fontStyle:   "italic",
    marginBottom: spacing.sm,
  },

  // ── Macro legend ──
  macroLegend: {
    flexDirection: "row",
    gap:           spacing.md,
    marginBottom:  spacing.sm,
  },
  macroLegendItem: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           5,
  },
  macroLegendDot: {
    width:        10,
    height:       10,
    borderRadius: 5,
  },
  macroLegendText: {
    fontFamily: fonts.body500,
    fontSize:   12,
    color:      colors.textMuted,
  },

  // ── Empty chart state ──
  emptyChart: {
    height:         140,
    alignItems:     "center",
    justifyContent: "center",
    gap:            spacing.sm,
  },
  emptyChartText: {
    fontFamily: fonts.body400,
    fontSize:   13,
    color:      colors.textLight,
    textAlign:  "center",
    maxWidth:   220,
  },
});
