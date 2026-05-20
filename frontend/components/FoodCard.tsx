import { Platform, StyleSheet, Text, View } from "react-native";
import { FoodLog } from "../types/food";
import { colors, fonts, journalCard, spacing } from "../constants/theme";

interface Props {
  log: FoodLog;
}

// Journal-palette accent strips — cycles through warm hues
const STRIP_VARIANTS = [
  { bg: colors.matcha,    border: colors.matchaBorder },
  { bg: colors.softPink,  border: colors.softPinkBorder },
  { bg: colors.accent,    border: colors.accentBorder },
  { bg: colors.lightBrown, border: colors.accentBorder },
];

// Macro pill colours
const MACRO_COLORS = {
  protein: { bg: colors.matcha,   border: colors.matchaBorder },
  carbs:   { bg: colors.softPink, border: colors.softPinkBorder },
  fat:     { bg: colors.accent,   border: colors.accentBorder },
};

export function FoodCard({ log }: Props) {
  const hash = log.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const strip = STRIP_VARIANTS[hash % STRIP_VARIANTS.length];

  const time = new Date(log.created_at).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View style={styles.card}>
      {/* Coloured journal tab on left */}
      <View style={[styles.strip, { backgroundColor: strip.bg, borderColor: strip.border }]} />

      <View style={styles.inner}>
        <View style={styles.row}>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={2}>{log.food_name}</Text>
            {log.origin      && <Text style={styles.meta}>{log.origin}</Text>}
            {log.serving_size && <Text style={styles.meta}>{log.serving_size}</Text>}
          </View>
          <View style={styles.right}>
            <Text style={styles.calories}>{log.calories}</Text>
            <Text style={styles.unit}>kcal</Text>
            <Text style={styles.time}>{time}</Text>
          </View>
        </View>

        {(log.protein_g || log.carbs_g || log.fat_g) && (
          <View style={styles.macros}>
            {log.protein_g != null && (
              <MacroPill label="P" value={log.protein_g} {...MACRO_COLORS.protein} />
            )}
            {log.carbs_g != null && (
              <MacroPill label="C" value={log.carbs_g} {...MACRO_COLORS.carbs} />
            )}
            {log.fat_g != null && (
              <MacroPill label="F" value={log.fat_g} {...MACRO_COLORS.fat} />
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function MacroPill({
  label,
  value,
  bg,
  border,
}: {
  label: string;
  value: number;
  bg: string;
  border: string;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: bg, borderColor: border }]}>
      <Text style={styles.pillText}>
        {label} {Math.round(value)}g
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...journalCard(),
    flexDirection: "row",
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    overflow: "hidden",
  },
  strip: {
    width: 5,
    borderRightWidth: 1.5,
  },
  inner: {
    flex: 1,
    padding: 14,
  },
  row: { flexDirection: "row", alignItems: "flex-start" },
  info: { flex: 1, paddingRight: spacing.sm },
  name: {
    fontFamily: fonts.heading600,
    fontSize: 18,
    color: colors.text,
    lineHeight: 22,
  },
  meta: {
    fontFamily: fonts.body400,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  right: { alignItems: "flex-end" },
  calories: {
    fontFamily: fonts.heading700,
    fontSize: 26,
    color: colors.accent,
    lineHeight: 28,
  },
  unit: {
    fontFamily: fonts.body400,
    fontSize: 10,
    color: colors.textMuted,
  },
  time: {
    fontFamily: fonts.body400,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  macros: {
    flexDirection: "row",
    gap: 6,
    marginTop: spacing.sm,
    flexWrap: "wrap",
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1.5,
  },
  pillText: {
    fontFamily: fonts.body600,
    fontSize: 11,
    color: colors.text,
  },
});
