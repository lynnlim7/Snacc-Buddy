/**
 * Home Tab — Today's diary page.
 * Lists today's meals with the warm journal aesthetic.
 */
import { useEffect } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFoodStore } from "../../stores/foodStore";
import { FoodCard } from "../../components/FoodCard";
import { NutritionSummary } from "../../components/NutritionSummary";
import { PaperBackground } from "../../components/PaperBackground";
import { colors, fonts, spacing, microcopy } from "../../constants/theme";

function TodayHeader() {
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.dateStr}>{dateStr}</Text>
        <Text style={styles.journalEmoji}>📖</Text>
      </View>
      <Text style={styles.heading}>Today</Text>
      <View style={styles.divider} />
    </View>
  );
}

export default function HomeScreen() {
  const { logs, isLoadingLogs, dailySummary, fetchLogs, fetchDailySummary, fetchMoreLogs } =
    useFoodStore();

  useEffect(() => {
    fetchLogs();
    fetchDailySummary();
  }, []);

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <FoodCard log={item} />}
          onEndReached={fetchMoreLogs}
          onEndReachedThreshold={0.3}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <>
              <TodayHeader />
              {dailySummary && (
                <View style={styles.summaryWrap}>
                  <NutritionSummary summary={dailySummary} />
                </View>
              )}
              <Text style={styles.sectionLabel}>Meals</Text>
            </>
          }
          ListEmptyComponent={
            isLoadingLogs ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={colors.accent} />
                <Text style={styles.loadingText}>{microcopy.loading}</Text>
              </View>
            ) : (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyEmoji}>🌿</Text>
                <Text style={styles.emptyText}>
                  Your diary is empty today.{"\n"}Tap Log Food to start writing your story!
                </Text>
              </View>
            )
          }
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: { paddingBottom: 40 },

  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateStr: {
    fontFamily: fonts.body400,
    fontSize: 13,
    color: colors.textMuted,
    letterSpacing: 0.4,
  },
  journalEmoji: { fontSize: 22 },
  heading: {
    fontFamily: fonts.heading700,
    fontSize: 52,
    color: colors.text,
    lineHeight: 54,
  },
  divider: {
    height: 1.5,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
  },

  summaryWrap: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  sectionLabel: {
    fontFamily: fonts.heading600,
    fontSize: 20,
    color: colors.textMuted,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },

  loadingWrap: {
    paddingTop: spacing.xxl,
    alignItems: "center",
    gap: spacing.md,
  },
  loadingText: {
    fontFamily: fonts.body400,
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: "italic",
  },

  emptyWrap: {
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
  },
  emptyEmoji: { fontSize: 48 },
  emptyText: {
    fontFamily: fonts.heading400,
    fontSize: 18,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 26,
  },
});
