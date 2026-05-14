import { StyleSheet, Text, View } from "react-native";
import { FoodLog } from "../types/food";

interface Props {
  log: FoodLog;
}

export function FoodCard({ log }: Props) {
  const time = new Date(log.created_at).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {log.food_name}
          </Text>
          {log.origin && <Text style={styles.meta}>{log.origin}</Text>}
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
            <Text style={styles.macro}>P {Math.round(log.protein_g)}g</Text>
          )}
          {log.carbs_g != null && (
            <Text style={styles.macro}>C {Math.round(log.carbs_g)}g</Text>
          )}
          {log.fat_g != null && (
            <Text style={styles.macro}>F {Math.round(log.fat_g)}g</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  row: { flexDirection: "row", alignItems: "flex-start" },
  info: { flex: 1, paddingRight: 8 },
  name: { fontSize: 16, fontWeight: "600", color: "#111827" },
  meta: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  right: { alignItems: "flex-end" },
  calories: { fontSize: 22, fontWeight: "700", color: "#16a34a" },
  unit: { fontSize: 12, color: "#6b7280" },
  time: { fontSize: 12, color: "#9ca3af", marginTop: 4 },
  macros: { flexDirection: "row", gap: 12, marginTop: 8 },
  macro: { fontSize: 12, color: "#6b7280" },
});
