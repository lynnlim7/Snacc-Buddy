import { StyleSheet, Text, View } from "react-native";
import { DailySummary } from "../types/food";

interface Props {
  summary: DailySummary;
  compact?: boolean;
}

export function NutritionSummary({ summary, compact = false }: Props) {
  return (
    <View style={[styles.card, compact && styles.compact]}>
      <View style={styles.row}>
        <StatBlock
          label="Calories"
          value={summary.total_calories}
          unit="kcal"
          highlight
          compact={compact}
        />
        <StatBlock label="Protein" value={Math.round(summary.total_protein_g)} unit="g" compact={compact} />
        <StatBlock label="Carbs" value={Math.round(summary.total_carbs_g)} unit="g" compact={compact} />
        <StatBlock label="Fat" value={Math.round(summary.total_fat_g)} unit="g" compact={compact} />
      </View>
      {!compact && (
        <Text style={styles.meals}>{summary.meal_count} meal{summary.meal_count !== 1 ? "s" : ""} logged</Text>
      )}
    </View>
  );
}

function StatBlock({
  label,
  value,
  unit,
  highlight,
  compact,
}: {
  label: string;
  value: number;
  unit: string;
  highlight?: boolean;
  compact?: boolean;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.value, highlight && styles.highlightValue, compact && styles.compactValue]}>
        {value}
      </Text>
      <Text style={styles.unit}>{unit}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  compact: { marginHorizontal: 0, padding: 12 },
  row: { flexDirection: "row", justifyContent: "space-around" },
  stat: { alignItems: "center" },
  value: { fontSize: 22, fontWeight: "700", color: "#111827" },
  compactValue: { fontSize: 18 },
  highlightValue: { color: "#16a34a" },
  unit: { fontSize: 11, color: "#6b7280" },
  label: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  meals: { textAlign: "center", color: "#6b7280", fontSize: 13, marginTop: 10 },
});
