import { useEffect } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFoodStore } from "../../stores/foodStore";
import { DailySummary } from "../../types/food";

function DayBar({ summary, maxCalories }: { summary: DailySummary; maxCalories: number }) {
  const pct = maxCalories > 0 ? (summary.total_calories / maxCalories) * 100 : 0;
  const dayLabel = new Date(summary.date).toLocaleDateString("en-US", { weekday: "short" });

  return (
    <View style={styles.barWrapper}>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { height: `${pct}%` }]} />
      </View>
      <Text style={styles.barLabel}>{dayLabel}</Text>
      <Text style={styles.barCal}>{summary.total_calories}</Text>
    </View>
  );
}

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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Analytics</Text>

        {isLoadingAnalytics && <ActivityIndicator color="#16a34a" style={styles.loader} />}

        {dailySummary && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Today</Text>
            <Text style={styles.calorieBig}>{dailySummary.total_calories} kcal</Text>
            <View style={styles.macroRow}>
              <MacroChip label="Protein" value={dailySummary.total_protein_g} unit="g" />
              <MacroChip label="Carbs" value={dailySummary.total_carbs_g} unit="g" />
              <MacroChip label="Fat" value={dailySummary.total_fat_g} unit="g" />
            </View>
          </View>
        )}

        {weeklySummary && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Past 7 days</Text>
            <View style={styles.chartRow}>
              {weeklySummary.week.map((d) => (
                <DayBar key={d.date} summary={d} maxCalories={maxCalories} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MacroChip({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipValue}>{Math.round(value)}{unit}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  scroll: { padding: 16, paddingBottom: 32 },
  heading: { fontSize: 28, fontWeight: "700", color: "#111827", marginBottom: 16 },
  loader: { marginTop: 32 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 14, fontWeight: "600", color: "#6b7280", marginBottom: 8 },
  calorieBig: { fontSize: 36, fontWeight: "800", color: "#16a34a" },
  macroRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  chip: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  chipValue: { fontSize: 18, fontWeight: "700", color: "#111827" },
  chipLabel: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  chartRow: { flexDirection: "row", alignItems: "flex-end", height: 120, gap: 8, marginTop: 8 },
  barWrapper: { flex: 1, alignItems: "center" },
  barTrack: {
    flex: 1,
    width: "100%",
    backgroundColor: "#e5e7eb",
    borderRadius: 6,
    justifyContent: "flex-end",
  },
  barFill: { backgroundColor: "#16a34a", borderRadius: 6, minHeight: 4 },
  barLabel: { fontSize: 11, color: "#6b7280", marginTop: 4 },
  barCal: { fontSize: 10, color: "#9ca3af" },
});
