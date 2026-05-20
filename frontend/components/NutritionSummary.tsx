import { StyleSheet, Text, View } from "react-native";
import { DailySummary } from "../types/food";
import { colors, fonts, journalCard, spacing } from "../constants/theme";

interface Props {
  summary: DailySummary;
  compact?: boolean;
}

export function NutritionSummary({ summary, compact = false }: Props) {
  return (
    <View style={[journalCard(true), styles.card, compact && styles.compact]}>
      {/* Calorie hero row */}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.calLabel}>Calories today</Text>
          <Text style={styles.calValue}>{summary.total_calories}</Text>
          <Text style={styles.calUnit}>kcal</Text>
        </View>
        {!compact && (
          <View style={styles.mealBadge}>
            <Text style={styles.mealBadgeText}>{summary.meal_count}</Text>
            <Text style={styles.mealBadgeLabel}>
              meal{summary.meal_count !== 1 ? "s" : ""}
            </Text>
          </View>
        )}
      </View>

      {/* Macro chips */}
      <View style={styles.macroRow}>
        <MacroChip
          label="Protein"
          value={Math.round(summary.total_protein_g)}
          unit="g"
          bg={colors.matcha}
          border={colors.matchaBorder}
          compact={compact}
        />
        <MacroChip
          label="Carbs"
          value={Math.round(summary.total_carbs_g)}
          unit="g"
          bg={colors.softPink}
          border={colors.softPinkBorder}
          compact={compact}
        />
        <MacroChip
          label="Fat"
          value={Math.round(summary.total_fat_g)}
          unit="g"
          bg={colors.accent}
          border={colors.accentBorder}
          compact={compact}
        />
      </View>
    </View>
  );
}

function MacroChip({
  label,
  value,
  unit,
  bg,
  border,
  compact,
}: {
  label: string;
  value: number;
  unit: string;
  bg: string;
  border: string;
  compact: boolean;
}) {
  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: bg, borderColor: border },
        compact && styles.chipCompact,
      ]}
    >
      <Text style={styles.chipValue}>
        {value}
        <Text style={styles.chipUnit}>{unit}</Text>
      </Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  compact: { padding: 12 },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  calLabel: {
    fontFamily: fonts.body600,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  calValue: {
    fontFamily: fonts.heading700,
    fontSize: 44,
    color: colors.accent,
    lineHeight: 46,
  },
  calUnit: {
    fontFamily: fonts.body400,
    fontSize: 13,
    color: colors.textMuted,
  },

  mealBadge: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
  },
  mealBadgeText: {
    fontFamily: fonts.heading700,
    fontSize: 22,
    color: colors.text,
  },
  mealBadgeLabel: {
    fontFamily: fonts.body400,
    fontSize: 11,
    color: colors.textMuted,
  },

  macroRow: { flexDirection: "row", gap: 10 },
  chip: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 10,
    alignItems: "center",
  },
  chipCompact: { padding: 8 },
  chipValue: {
    fontFamily: fonts.heading700,
    fontSize: 18,
    color: colors.text,
  },
  chipUnit: {
    fontFamily: fonts.body400,
    fontSize: 11,
    color: colors.textMuted,
  },
  chipLabel: {
    fontFamily: fonts.body400,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
});
