/**
 * Diary Tab — Today's journal page.
 *
 * Layout:
 *   - Faint ruled lines running across the whole page
 *   - Date (top-left, Caveat) + flame streak (top-right)
 *   - Large total calorie count in Caveat
 *   - "Meals" heading + dot-leader rows per meal
 *   - Sub-items per meal (food photo names)
 *   - Floating "+" FAB → opens MealLogModal
 */
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
  ActionSheetIOS,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { PaperBackground } from "../../components/PaperBackground";
import { MealLogModal } from "../../components/MealLogModal";
import {
  useDiaryStore,
  todayKey,
  type MealEntry,
} from "../../stores/diaryStore";
import { useOnboardingStore } from "../../stores/onboardingStore";
import { colors, fonts, spacing, radius } from "../../constants/theme";

// ─── Constants ────────────────────────────────────────────────

const { height: SCREEN_H } = Dimensions.get("window");
const LINE_SPACING = 38;
const HEADER_OFFSET = 220; // ruled lines start below the header area
const NUM_LINES = Math.ceil((SCREEN_H - HEADER_OFFSET) / LINE_SPACING) + 4;
const CALORIE_GOAL = 2000; // TODO: pull from user profile

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning!";
  if (h < 17) return "Good afternoon!";
  if (h < 21) return "Good evening!";
  return "Good night!";
}
const DOT_LEADER = ". . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .";

/** Stable empty array — avoids creating a new reference on every render when
 *  there are no meals, which would cause an infinite Zustand re-render loop. */
const EMPTY_MEALS: MealEntry[] = [];

// ─── Ruled lines ─────────────────────────────────────────────

function RuledLines() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {Array.from({ length: NUM_LINES }).map((_, i) => (
        <View
          key={i}
          style={[styles.ruledLine, { top: HEADER_OFFSET + i * LINE_SPACING }]}
        />
      ))}
    </View>
  );
}

// ─── Meal row ─────────────────────────────────────────────────

function MealRow({ meal, date }: { meal: MealEntry; date: string }) {
  const deleteMeal = useDiaryStore((s) => s.deleteMeal);
  const [expanded, setExpanded] = useState(true);

  function confirmDelete() {
    Alert.alert(
      `Delete ${meal.type}?`,
      "This will remove the meal entry from your diary.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMeal(date, meal.id),
        },
      ]
    );
  }

  function handleOptions() {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Delete meal"],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 1,
        },
        (idx) => {
          if (idx === 1) confirmDelete();
        }
      );
    } else {
      Alert.alert("Options", "", [
        { text: "Delete meal", style: "destructive", onPress: confirmDelete },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  }

  return (
    <View style={styles.mealBlock}>
      {/* Dot-leader header row */}
      <TouchableOpacity
        style={styles.mealHeaderRow}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={`${meal.type}, ${meal.totalCalories} calories`}
      >
        <Text style={styles.mealTypeText}>{meal.type}</Text>

        <Text style={styles.dotLeader} numberOfLines={1}>
          {DOT_LEADER}
        </Text>

        <Text style={styles.mealCalText}>{meal.totalCalories} kcal</Text>

        <TouchableOpacity
          onPress={handleOptions}
          style={styles.mealMenuBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Meal options"
        >
          <Ionicons name="ellipsis-horizontal" size={15} color={colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Sub-items: food photo names */}
      {expanded &&
        meal.photos.map((photo) => (
          <View key={photo.id} style={styles.photoRow}>
            <View style={styles.photoBullet} />
            <Text style={styles.photoName} numberOfLines={1}>
              {photo.name}
            </Text>
          </View>
        ))}
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────

function EmptyDiary() {
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyText}>
        Nothing here yet..{"\n"}tap + to start writing your story
      </Text>
    </View>
  );
}

// ─── Calorie card ─────────────────────────────────────────────

function CalorieCard({ total, goal }: { total: number; goal: number }) {
  const pct     = goal > 0 ? Math.min(1, total / goal) : 0;
  const reached = Math.round(pct * 100);
  // Keep fill width at least 3% so the pill always shows when non-zero
  const fillPct = total > 0 ? Math.max(3, reached) : 0;

  return (
    <View style={styles.calorieCard}>
      <Text style={styles.calCardLabel}>Today's calories</Text>
      <Text style={styles.calCardValue}>
        {total > 0 ? total.toLocaleString() : "0"}
      </Text>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        {fillPct > 0 && (
          <View style={[styles.progressFill, { width: `${fillPct}%` as any }]} />
        )}
      </View>

      <Text style={styles.calCardGoal}>
        Goal: {goal.toLocaleString()} kcal{"  ·  "}{reached}% reached
      </Text>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────

export default function DiaryScreen() {
  const today = todayKey();
  const [modalVisible, setModalVisible] = useState(false);

  // Reactive store selectors
  const meals        = useDiaryStore((s) => s.mealsByDate[today] ?? EMPTY_MEALS);
  const streak       = useDiaryStore((s) => s.streak);
  const addMeal      = useDiaryStore((s) => s.addMeal);
  const addPhotoToMeal = useDiaryStore((s) => s.addPhotoToMeal);
  const userName     = useOnboardingStore((s) => s.name);

  const totalCalories = meals.reduce((sum, m) => sum + m.totalCalories, 0);

  const greeting    = getGreeting();
  const displayName = userName.trim() || "My";
  const initial     = displayName !== "My" ? displayName[0].toUpperCase() : "?";

  // Format date: "Tuesday, 20 May"
  const dateDisplay = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day:     "numeric",
    month:   "long",
  });

  /** Merge into existing same-type meal (up to 5 photos) or add new */
  function handleSaveMeal(meal: MealEntry) {
    const existing = meals.find((m) => m.type === meal.type);
    if (existing && existing.photos.length < 5) {
      meal.photos.forEach((photo) =>
        addPhotoToMeal(today, existing.id, photo)
      );
    } else {
      addMeal(today, meal);
    }
    setModalVisible(false);
  }

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <RuledLines />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header: greeting + streak + avatar ── */}
          <View style={styles.headerRow}>
            {/* Left: greeting + diary title */}
            <View style={styles.headerLeft}>
              <Text style={styles.greetingText}>{greeting}</Text>
              <Text style={styles.diaryTitle}>
                {displayName === "My" ? "My Diary" : `${displayName}'s Diary`}
              </Text>
            </View>

            {/* Right: streak badge + user avatar */}
            <View style={styles.headerRight}>
              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={16} color="#E8724A" />
                <Text style={styles.streakCount}>{streak}</Text>
              </View>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            </View>
          </View>

          {/* ── Date ── */}
          <Text style={styles.dateText}>{dateDisplay}</Text>

          {/* ── Calorie card ── */}
          <CalorieCard total={totalCalories} goal={CALORIE_GOAL} />

          {/* ── Meals section ── */}
          <Text style={styles.mealsHeader}>Meals</Text>
          <View style={styles.mealsUnderline} />

          <View style={styles.mealsList}>
            {meals.length === 0 ? (
              <EmptyDiary />
            ) : (
              meals.map((meal) => (
                <MealRow key={meal.id} meal={meal} date={today} />
              ))
            )}
          </View>
        </ScrollView>

        {/* ── Floating action button ── */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Log a meal"
        >
          <Ionicons name="add" size={30} color={colors.text} />
        </TouchableOpacity>

        {/* ── Meal log modal ── */}
        <MealLogModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSave={handleSaveMeal}
        />
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
  },

  // ── Ruled lines ──
  ruledLine: {
    position:        "absolute",
    left:            0,
    right:           0,
    height:          1,
    backgroundColor: colors.border,
    opacity:         0.45,
  },

  // ── Header row ──
  headerRow: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "flex-start",
    marginBottom:   spacing.sm,
  },
  headerLeft: {
    gap: 2,
  },
  greetingText: {
    fontFamily: fonts.body400,
    fontSize:   14,
    color:      colors.textMuted,
  },
  diaryTitle: {
    fontFamily: fonts.body700,
    fontSize:   18,
    color:      colors.text,
  },
  headerRight: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           spacing.sm,
  },
  streakBadge: {
    flexDirection:   "row",
    alignItems:      "center",
    gap:             4,
    backgroundColor: colors.bgSecondary,
    borderRadius:    radius.pill,
    paddingHorizontal: 10,
    paddingVertical:   5,
    borderWidth:     1.5,
    borderColor:     colors.border,
  },
  streakCount: {
    fontFamily: fonts.body700,
    fontSize:   13,
    color:      colors.text,
  },
  avatar: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: colors.softPink,
    borderWidth:     1.5,
    borderColor:     colors.softPinkBorder,
    alignItems:      "center",
    justifyContent:  "center",
  },
  avatarText: {
    fontFamily: fonts.body700,
    fontSize:   15,
    color:      colors.text,
  },

  // ── Date ──
  dateText: {
    fontFamily: fonts.heading600,
    fontSize:   28,
    color:      colors.text,
    marginBottom: spacing.md,
  },

  // ── Calorie card ──
  calorieCard: {
    backgroundColor: colors.softPink,
    borderRadius:    radius.lg,
    borderWidth:     1.5,
    borderColor:     colors.softPinkBorder,
    padding:         spacing.md,
    gap:             spacing.sm,
    marginBottom:    spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor:   colors.softPinkBorder,
        shadowOffset:  { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius:  0,
      },
      android: { elevation: 3 },
    }),
  },
  calCardLabel: {
    fontFamily: fonts.body600,
    fontSize:   13,
    color:      colors.text,
    opacity:    0.7,
  },
  calCardValue: {
    fontFamily:   fonts.heading700,
    fontSize:     52,
    color:        colors.text,
    lineHeight:   56,
    letterSpacing: -1,
  },
  progressTrack: {
    height:          10,
    borderRadius:    5,
    backgroundColor: "rgba(74, 64, 54, 0.12)",
    overflow:        "hidden",
  },
  progressFill: {
    height:          "100%",
    borderRadius:    5,
    backgroundColor: colors.softPinkBorder,
  },
  calCardGoal: {
    fontFamily: fonts.body400,
    fontSize:   12,
    color:      colors.text,
    opacity:    0.6,
  },

  // ── Meals section ──
  mealsHeader: {
    fontFamily:  fonts.heading700,
    fontSize:    30,
    color:       colors.text,
    marginTop:   spacing.xl,
  },
  mealsUnderline: {
    height:          1.5,
    backgroundColor: colors.text,
    marginTop:       4,
    marginBottom:    spacing.md,
  },
  mealsList: {
    gap: spacing.md,
  },

  // ── Meal row ──
  mealBlock: {
    gap: 5,
  },
  mealHeaderRow: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           5,
  },
  mealTypeText: {
    fontFamily:   fonts.heading600,
    fontSize:     18,
    color:        colors.text,
    flexShrink:   0,
  },
  dotLeader: {
    flex:       1,
    fontFamily: fonts.body400,
    fontSize:   13,
    color:      colors.textLight,
    overflow:   "hidden",
    letterSpacing: 1,
  },
  mealCalText: {
    fontFamily: fonts.heading600,
    fontSize:   16,
    color:      colors.textMuted,
    flexShrink: 0,
  },
  mealMenuBtn: {
    paddingLeft: 2,
    flexShrink:  0,
  },

  // ── Sub-items ──
  photoRow: {
    flexDirection: "row",
    alignItems:    "center",
    paddingLeft:   spacing.md,
    gap:           8,
  },
  photoBullet: {
    width:           4,
    height:          4,
    borderRadius:    2,
    backgroundColor: colors.textLight,
    flexShrink:      0,
  },
  photoName: {
    fontFamily: fonts.heading400,
    fontSize:   15,
    color:      colors.textMuted,
    flex:       1,
  },

  // ── Empty state ──
  emptyWrap: {
    paddingTop:  spacing.xl,
    alignItems:  "center",
  },
  emptyText: {
    fontFamily:  fonts.heading400,
    fontSize:    18,
    color:       colors.textLight,
    textAlign:   "center",
    lineHeight:  27,
  },

  // ── FAB ──
  fab: {
    position:        "absolute",
    bottom:          Platform.OS === "ios" ? 36 : 20,
    right:           spacing.xl,
    width:           58,
    height:          58,
    borderRadius:    29,
    backgroundColor: colors.softPink,
    borderWidth:     2,
    borderColor:     colors.softPinkBorder,
    alignItems:      "center",
    justifyContent:  "center",
    ...Platform.select({
      ios: {
        shadowColor:   colors.softPinkBorder,
        shadowOffset:  { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius:  0,
      },
      android: { elevation: 6 },
    }),
  },
});
