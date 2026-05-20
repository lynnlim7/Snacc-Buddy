import { StyleSheet, Text, View } from "react-native";
import { DailySummary } from "../types/food";
import { clayCard, colors, fonts } from "../constants/theme";

interface Props {
  summary: DailySummary;
  compact?: boolean;
}

export function NutritionSummary({ summary, compact = false }: Props) {
  return (
    <View style={[styles.card, compact && styles.compact]}>
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
            <Text style={styles.mealBadgeLabel}>meal{summary.meal_count !== 1 ? "s" : ""}</Text>
          </View>
        )}
      </View>

      {/* Macro chips */}
      <View style={styles.macroRow}>
        <MacroChip label="Protein" value={Math.round(summary.total_protein_g)} unit="g" bg={colors.mint}     border={colors.mintBorder}     compact={compact} />
        <MacroChip label="Carbs"   value={Math.round(summary.total_carbs_g)}   unit="g" bg={colors.lavender} border={colors.lavenderBorder} compact={compact} />
        <MacroChip label="Fat"     value={Math.round(summary.total_fat_g)}     unit="g" bg={colors.peach}    border={colors.peachBorder}    compact={compact} />
      </View>
    </View>
  );
}

function MacroChip({
  label, value, unit, bg, border, compact,
}: {
  label: string; value: number; unit: string;
  bg: string; border: string; compact: boolean;
}) {
  return (
    <View style={[styles.chip, { backgroundColor: bg, borderColor: border }, compact && styles.chipCompact]}>
      <Text style={styles.chipValue}>{value}<Text style={styles.chipUnit}>{unit}</Text></Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...clayCard("pink"),
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  compact: { marginHorizontal: 0, padding: 12 },

  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  calLabel: { fontFamily: fonts.body600, fontSize: 12, color: colors.textMuted, marginBottom: 2 },
  calValue: { fontFamily: fonts.heading800, fontSize: 40, color: colors.pink400, lineHeight: 44 },
  calUnit:  { fontFamily: fonts.body400,   fontSize: 13, color: colors.textMuted },

  mealBadge: {
    backgroundColor: colors.pink100,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.pink200,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
  },
  mealBadgeText:  { fontFamily: fonts.heading700, fontSize: 22, color: colors.pink500 },
  mealBadgeLabel: { fontFamily: fonts.body400,    fontSize: 11, color: colors.textMuted },

  macroRow: { flexDirection: "row", gap: 10 },
  chip: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 2,
    padding: 10,
    alignItems: "center",
  },
  chipCompact: { padding: 8 },
  chipValue: { fontFamily: fonts.heading700, fontSize: 17, color: colors.textDark },
  chipUnit:  { fontFamily: fonts.body400,    fontSize: 11, color: colors.textMid },
  chipLabel: { fontFamily: fonts.body400,    fontSize: 11, color: colors.textMid, marginTop: 2 },
});
