import { StyleSheet, Text, View } from "react-native";
import { FoodLog } from "../types/food";
import { clayCard, colors, fonts } from "../constants/theme";

interface Props {
  log: FoodLog;
}

// Cycles through accent colours so consecutive cards feel colourful like the diary.
const ACCENT_VARIANTS = ["mint", "lavender", "peach", "lemon"] as const;
const ACCENT_COLORS: Record<string, { bg: string; border: string }> = {
  mint:     { bg: colors.mint,     border: colors.mintBorder },
  lavender: { bg: colors.lavender, border: colors.lavenderBorder },
  peach:    { bg: colors.peach,    border: colors.peachBorder },
  lemon:    { bg: colors.lemon,    border: colors.lemonBorder },
};

let cardIndex = 0;

export function FoodCard({ log }: Props) {
  // Stable colour per card based on id hash so it doesn't re-randomise on re-render.
  const hash = log.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const variant = ACCENT_VARIANTS[hash % ACCENT_VARIANTS.length];
  const accent = ACCENT_COLORS[variant];

  const time = new Date(log.created_at).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View style={styles.card}>
      {/* Coloured dot strip on the left */}
      <View style={[styles.strip, { backgroundColor: accent.bg, borderColor: accent.border }]} />

      <View style={styles.inner}>
        <View style={styles.row}>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{log.food_name}</Text>
            {log.origin     && <Text style={styles.meta}>{log.origin}</Text>}
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
            {log.protein_g != null && <MacroPill label="P" value={log.protein_g} color={colors.mint} border={colors.mintBorder} />}
            {log.carbs_g   != null && <MacroPill label="C" value={log.carbs_g}   color={colors.lavender} border={colors.lavenderBorder} />}
            {log.fat_g     != null && <MacroPill label="F" value={log.fat_g}     color={colors.peach} border={colors.peachBorder} />}
          </View>
        )}
      </View>
    </View>
  );
}

function MacroPill({
  label, value, color, border,
}: { label: string; value: number; color: string; border: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: color, borderColor: border }]}>
      <Text style={styles.pillText}>{label} {Math.round(value)}g</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...clayCard("pink"),
    flexDirection: "row",
    marginBottom: 12,
    overflow: "hidden",
  },
  strip: {
    width: 6,
    borderRightWidth: 1.5,
  },
  inner: {
    flex: 1,
    padding: 14,
  },
  row: { flexDirection: "row", alignItems: "flex-start" },
  info: { flex: 1, paddingRight: 8 },
  name: {
    fontFamily: fonts.heading700,
    fontSize: 16,
    color: colors.textDark,
  },
  meta: {
    fontFamily: fonts.body400,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  right: { alignItems: "flex-end" },
  calories: {
    fontFamily: fonts.heading800,
    fontSize: 22,
    color: colors.pink400,
  },
  unit: {
    fontFamily: fonts.body400,
    fontSize: 11,
    color: colors.textMuted,
  },
  time: {
    fontFamily: fonts.body400,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  macros: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  pillText: {
    fontFamily: fonts.body600,
    fontSize: 11,
    color: colors.textDark,
  },
});
