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
import { colors, fonts, spacing, radius } from "../../constants/theme";

// ─── Constants ────────────────────────────────────────────────

const { height: SCREEN_H } = Dimensions.get("window");
const LINE_SPACING = 38;
const HEADER_OFFSET = 170; // ruled lines start below the header area
const NUM_LINES = Math.ceil((SCREEN_H - HEADER_OFFSET) / LINE_SPACING) + 4;
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

// ─── Main screen ─────────────────────────────────────────────

export default function DiaryScreen() {
  const today = todayKey();
  const [modalVisible, setModalVisible] = useState(false);

  // Reactive store selectors
  const meals   = useDiaryStore((s) => s.mealsByDate[today] ?? EMPTY_MEALS);
  const streak  = useDiaryStore((s) => s.streak);
  const addMeal        = useDiaryStore((s) => s.addMeal);
  const addPhotoToMeal = useDiaryStore((s) => s.addPhotoToMeal);

  const totalCalories = meals.reduce((sum, m) => sum + m.totalCalories, 0);

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
          {/* ── Header: date + streak ── */}
          <View style={styles.headerRow}>
            <Text style={styles.dateText}>{dateDisplay}</Text>

            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={17} color="#E8724A" />
              <Text style={styles.streakCount}>{streak}</Text>
            </View>
          </View>

          {/* ── Total calories ── */}
          <Text style={styles.totalCalLabel}>Total Calories Today</Text>
          <Text style={styles.totalCalValue} adjustsFontSizeToFit numberOfLines={1}>
            {totalCalories > 0 ? totalCalories.toLocaleString() : "—"}
            <Text style={styles.kcalText}>kcal</Text>
          </Text>

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
    alignItems:     "center",
    marginBottom:   spacing.md,
  },
  dateText: {
    fontFamily: fonts.heading600,
    fontSize:   17,
    color:      colors.text,
  },
  streakBadge: {
    flexDirection:   "row",
    alignItems:      "center",
    gap:             4,
    backgroundColor: colors.bgSecondary,
    borderRadius:    radius.pill,
    paddingHorizontal: 12,
    paddingVertical:   5,
    borderWidth:     1.5,
    borderColor:     colors.border,
  },
  streakCount: {
    fontFamily: fonts.body700,
    fontSize:   14,
    color:      colors.text,
  },

  // ── Total calories ──
  totalCalLabel: {
    fontFamily: fonts.heading400,
    fontSize:   20,
    color:      colors.textMuted,
    letterSpacing: 0.3,
  },
  totalCalValue: {
    fontFamily:  fonts.heading700,
    fontSize:    48,
    color:       colors.text,
    lineHeight:  52,
    letterSpacing: -1,
    marginTop:   2,
  },
  kcalText: {
    fontFamily: fonts.heading400,
    fontSize:   16,
    color:      colors.textLight,
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
    backgroundColor: colors.accent,
    borderWidth:     2,
    borderColor:     colors.accentBorder,
    alignItems:      "center",
    justifyContent:  "center",
    ...Platform.select({
      ios: {
        shadowColor:   colors.accentBorder,
        shadowOffset:  { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius:  0,
      },
      android: { elevation: 6 },
    }),
  },
});
