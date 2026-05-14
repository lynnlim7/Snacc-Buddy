import { useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFoodStore } from "../../stores/foodStore";
import { FoodCard } from "../../components/FoodCard";
import { NutritionSummary } from "../../components/NutritionSummary";

export default function HomeScreen() {
  const { logs, isLoadingLogs, dailySummary, fetchLogs, fetchDailySummary, fetchMoreLogs } =
    useFoodStore();

  useEffect(() => {
    fetchLogs();
    fetchDailySummary();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Today</Text>

      {dailySummary && <NutritionSummary summary={dailySummary} />}

      <Text style={styles.subheading}>Meals</Text>

      {isLoadingLogs && logs.length === 0 ? (
        <ActivityIndicator style={styles.loader} color="#16a34a" />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <FoodCard log={item} />}
          onEndReached={fetchMoreLogs}
          onEndReachedThreshold={0.3}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No meals logged yet. Tap "Log Food" to start!</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  heading: { fontSize: 28, fontWeight: "700", color: "#111827", margin: 16 },
  subheading: { fontSize: 18, fontWeight: "600", color: "#374151", marginHorizontal: 16, marginTop: 8 },
  loader: { marginTop: 32 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { textAlign: "center", color: "#6b7280", marginTop: 32, fontSize: 15 },
});
