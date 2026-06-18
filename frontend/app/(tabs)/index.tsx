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
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Platform,
  Image,
  TextInput,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { PaperBackground } from "../../components/PaperBackground";
import { MealLogModal } from "../../components/MealLogModal";
import { DonutRing } from "../../components/DonutRing";
import { foodApi } from "../../services/api";
import {
  useDiaryStore,
  todayKey,
  type MealEntry,
  type MealType,
} from "../../stores/diaryStore";
import { useOnboardingStore } from "../../stores/onboardingStore";
import { useUserStore } from "../../stores/userStore";
import { computeCalorieGoal, computeNutritionTargets } from "../../utils/nutrition";
import { colors, fonts, spacing, radius } from "../../constants/theme";

// ─── Constants ────────────────────────────────────────────────

const { height: SCREEN_H } = Dimensions.get("window");
const LINE_SPACING = 38;
const HEADER_OFFSET = 220; // ruled lines start below the header area
const NUM_LINES = Math.ceil((SCREEN_H - HEADER_OFFSET) / LINE_SPACING) + 4;

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

const MOODS = [
  "comfort food", "busy day", "fresh", "calm",
  "treating myself", "tired", "energetic",
] as const;

/** Scrapbook-style tilt per photo index */
const POLAROID_ROTATIONS = ["-2deg", "1deg", "-1deg", "2deg", "0deg"];

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

// ─── Polaroid strip ───────────────────────────────────────────

// ─── Meal row ─────────────────────────────────────────────────

function MealRow({
  meal,
  date,
  onDeleteMeal,
}: {
  meal: MealEntry;
  date: string;
  onDeleteMeal: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const liftAnim = useRef(new Animated.Value(1)).current;

  function onPressIn() {
    Animated.spring(liftAnim, { toValue: 1.015, speed: 30, bounciness: 0, useNativeDriver: true }).start();
  }
  function onPressOut() {
    Animated.spring(liftAnim, { toValue: 1, speed: 20, bounciness: 0, useNativeDriver: true }).start();
  }

  // Aggregate macros across all photos in the meal
  const totals = meal.photos.reduce(
    (acc, p) => ({
      carbs:   acc.carbs   + (p.nutrition.carbs_g   ?? 0),
      protein: acc.protein + (p.nutrition.protein_g ?? 0),
      fat:     acc.fat     + (p.nutrition.fat_g     ?? 0),
      fiber:   acc.fiber   + (p.nutrition.fiber_g   ?? 0),
    }),
    { carbs: 0, protein: 0, fat: 0, fiber: 0 }
  );
  const maxMacro = Math.max(totals.carbs, totals.protein, totals.fat, totals.fiber, 1);

  // Format logged time from createdAt
  const loggedTime = meal.createdAt
    ? new Date(meal.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
    : null;

  // Food name: join all photo names
  const foodName = meal.photos.length > 0
    ? meal.photos.map((p) => p.name).join(", ")
    : meal.type;

  return (
    <Animated.View
      style={[
        styles.mealBlock,
        expanded && styles.mealBlockExpanded,
        { transform: [{ scale: liftAnim }] },
      ]}
    >
      {/* ── Header row ── */}
      <TouchableOpacity
        style={styles.mealHeaderRow}
        onPress={() => setExpanded((v) => !v)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel={`${meal.type}, ${meal.totalCalories} calories`}
      >
        {/* Thumbnail */}
        {meal.photos[0]?.uri ? (
          <Image source={{ uri: meal.photos[0].uri }} style={styles.mealThumb} resizeMode="cover" />
        ) : (
          <View style={[styles.mealThumb, styles.mealThumbPlaceholder]}>
            <Ionicons name="restaurant-outline" size={22} color={colors.textLight} />
          </View>
        )}

        {/* Centre info */}
        <View style={styles.mealHeaderInfo}>
          {/* Type tag + time */}
          <View style={styles.mealMetaRow}>
            <View style={styles.mealTypeTag}>
              <Text style={styles.mealTypeTagText}>{meal.type}</Text>
            </View>
            {loggedTime && (
              <View style={styles.mealTimeRow}>
                <Ionicons name="time-outline" size={11} color={colors.textMuted} />
                <Text style={styles.mealTimeText}>{loggedTime}</Text>
              </View>
            )}
          </View>
          {/* Food name */}
          <Text style={styles.mealNameText} numberOfLines={1}>{foodName}</Text>
        </View>

        {/* Calories + chevron */}
        <View style={styles.mealCalWrapper}>
          <View style={styles.mealCalRow}>
            <Text style={styles.mealCalValue}>{meal.totalCalories}</Text>
            <Text style={styles.mealCalUnit}>kcal</Text>
          </View>
          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.textMuted} />
        </View>
      </TouchableOpacity>

      {/* ── Expanded content ── */}
      {expanded && (
        <View style={styles.expandedContent}>
          {/* Divider */}
          <View style={styles.expandedDivider} />

          {/* Macro bars */}
          <View style={styles.macroBarsSection}>
            {[
              { label: "Carbs",   value: Math.round(totals.carbs),   color: "#A8C5DA" },
              { label: "Protein", value: Math.round(totals.protein), color: "#9B5468" },
              { label: "Fat",     value: Math.round(totals.fat),     color: "#C5B8E8" },
              { label: "Fiber",   value: Math.round(totals.fiber),   color: "#C8D5B9" },
            ].map(({ label, value, color }) => (
              <View key={label} style={styles.macroBarRow}>
                <Text style={styles.macroBarLabel}>{label}</Text>
                <View style={styles.macroBarTrack}>
                  <View
                    style={[
                      styles.macroBarFill,
                      {
                        width: `${Math.max((value / maxMacro) * 100, value > 0 ? 3 : 0)}%` as any,
                        backgroundColor: color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.macroBarValue}>{value}g</Text>
              </View>
            ))}
          </View>

          {/* AI insight card */}
          {meal.note ? (
            <View style={styles.insightCard}>
              <Ionicons name="sparkles-outline" size={14} color={colors.primary} style={{ marginTop: 1 }} />
              <Text style={styles.insightText}>{meal.note}</Text>
            </View>
          ) : null}

          {/* Remove entry */}
          <TouchableOpacity
            style={styles.removeEntryBtn}
            onPress={onDeleteMeal}
            accessibilityLabel="Remove this meal entry"
          >
            <Ionicons name="trash-outline" size={13} color={colors.error} />
            <Text style={styles.removeEntryText}>Remove entry</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
}

// ─── Empty state ──────────────────────────────────────────────

function EmptyDiary({ isToday }: { isToday: boolean }) {
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyText}>
        {isToday
          ? "Nothing here yet..\ntap + to start writing your story"
          : "No meals logged on this day"}
      </Text>
    </View>
  );
}

// ─── Summary card (donut + macros) ───────────────────────────

function SummaryCard({
  total, goal,
  protein, carbs, fat,
  proteinTarget, carbsTarget, fatTarget,
}: {
  total: number; goal: number;
  protein: number; carbs: number; fat: number;
  proteinTarget: number; carbsTarget: number; fatTarget: number;
}) {
  const progress  = goal > 0 ? Math.min(1, total / goal) : 0;
  const remaining = Math.max(0, goal - total);

  return (
    <View style={styles.summaryCard}>
      {/* ── Left: donut ring ── */}
      <DonutRing
        size={100}
        strokeWidth={10}
        progress={progress}
        color={colors.primary}
        bgColor={colors.primaryLight}
      >
        <View style={styles.donutCenter}>
          <Text style={styles.donutCalories}>{total > 0 ? Math.round(total).toLocaleString() : "0"}</Text>
          <Text style={styles.donutUnit}>kcal</Text>
        </View>
      </DonutRing>

      {/* ── Right: goal info + macro chips ── */}
      <View style={styles.summaryRight}>
        <View style={styles.summaryGoalRow}>
          <View>
            <Text style={styles.summaryDailyGoalLabel}>Daily goal</Text>
            <Text style={styles.summaryRemaining}>
              {remaining.toLocaleString()} remaining
            </Text>
          </View>
          <Text style={styles.summaryGoalKcal}>{goal.toLocaleString()} kcal</Text>
        </View>

        {/* Macro chips */}
        <View style={styles.macroChipRow}>
          <View style={styles.macroChipPill}>
            <Text style={styles.macroChipValue}>{Math.round(carbs)}g</Text>
            <Text style={styles.macroChipLabel}>Carbs</Text>
          </View>
          <View style={styles.macroChipPill}>
            <Text style={styles.macroChipValue}>{Math.round(protein)}g</Text>
            <Text style={styles.macroChipLabel}>Protein</Text>
          </View>
          <View style={styles.macroChipPill}>
            <Text style={styles.macroChipValue}>{Math.round(fat)}g</Text>
            <Text style={styles.macroChipLabel}>Fat</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────

export default function DiaryScreen() {
  const [selectedDate,    setSelectedDate]    = useState(todayKey);
  const [modalVisible,    setModalVisible]    = useState(false);
  const [editPrefill,     setEditPrefill]     = useState<MealType | undefined>(undefined);
  const [editingPhoto,    setEditingPhoto]    = useState<{ mealId: string; photoId: string } | null>(null);
  const [dailyCalories,   setDailyCalories]   = useState(0);
  const [dailyMacros,     setDailyMacros]     = useState({ protein: 0, carbs: 0, fat: 0 });
  const [refreshing,      setRefreshing]      = useState(false);

  // Reactive store selectors
  const meals                = useDiaryStore((s) => s.mealsByDate[selectedDate] ?? EMPTY_MEALS);
  const streak               = useDiaryStore((s) => s.streak);
  const setStreak            = useDiaryStore((s) => s.setStreak);
  const addMeal              = useDiaryStore((s) => s.addMeal);
  const deleteMeal           = useDiaryStore((s) => s.deleteMeal);
  const addPhotoToMeal       = useDiaryStore((s) => s.addPhotoToMeal);
  const deletePhotoFromMeal  = useDiaryStore((s) => s.deletePhotoFromMeal);
  const loadLogsFromBackend  = useDiaryStore((s) => s.loadLogsFromBackend);
  const userName             = useOnboardingStore((s) => s.name);
  const profile              = useUserStore((s) => s.profile);
  const calorieGoal          = computeCalorieGoal(profile);

  useEffect(() => {
    foodApi.getStreak().then(setStreak).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadLogsFromBackend(selectedDate);
    foodApi.getDailySummary(selectedDate)
      .then((s) => {
        setDailyCalories(s.total_calories);
        setDailyMacros({ protein: s.total_protein_g, carbs: s.total_carbs_g, fat: s.total_fat_g });
      })
      .catch(() => {});
  }, [selectedDate]);

  const isToday        = selectedDate === todayKey();
  const greeting       = getGreeting();
  const targets        = computeNutritionTargets(profile);
  const displayName = (profile?.name ?? userName).trim() || "My";
  const initial     = displayName !== "My" ? displayName[0].toUpperCase() : "?";

  const dateDisplay = new Date(selectedDate + "T12:00:00").toLocaleDateString("en-GB", {
    weekday: "long",
    day:     "numeric",
    month:   "long",
  });

  function goToPrevDay() {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  }

  function goToNextDay() {
    if (isToday) return;
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  }

  function handleModalClose() {
    setModalVisible(false);
    setEditPrefill(undefined);
    setEditingPhoto(null);
  }

  /**
   * Photo-edit mode → swap out just the one photo that was re-uploaded.
   * Add mode        → merge into existing same-type meal (up to 5) or create new.
   */
  function handleSaveMeal(incoming: MealEntry) {
    if (editingPhoto) {
      deletePhotoFromMeal(selectedDate, editingPhoto.mealId, editingPhoto.photoId);
      addPhotoToMeal(selectedDate, editingPhoto.mealId, incoming.photos[0]);
    } else {
      const existing = meals.find((m) => m.type === incoming.type);
      if (existing && existing.photos.length < 5) {
        incoming.photos.forEach((photo) =>
          addPhotoToMeal(selectedDate, existing.id, photo)
        );
      } else {
        addMeal(selectedDate, incoming);
      }
    }
    handleModalClose();
    foodApi.getDailySummary(selectedDate)
      .then((s) => {
        setDailyCalories(s.total_calories);
        setDailyMacros({ protein: s.total_protein_g, carbs: s.total_carbs_g, fat: s.total_fat_g });
      })
      .catch(() => {});
  }

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.allSettled([
      loadLogsFromBackend(selectedDate),
      foodApi.getDailySummary(selectedDate).then((s) => {
        setDailyCalories(s.total_calories);
        setDailyMacros({ protein: s.total_protein_g, carbs: s.total_carbs_g, fat: s.total_fat_g });
      }),
      foodApi.getStreak().then(setStreak),
    ]);
    setRefreshing(false);
  }

  /** Deletes the entire meal entry (all photos) */
  async function handleDeleteMeal(mealId: string) {
    try {
      await foodApi.deleteLog(mealId);
      deleteMeal(selectedDate, mealId);
      foodApi.getDailySummary(selectedDate)
        .then((s) => {
          setDailyCalories(s.total_calories);
          setDailyMacros({ protein: s.total_protein_g, carbs: s.total_carbs_g, fat: s.total_fat_g });
        })
        .catch(() => {});
    } catch {
      Alert.alert("Couldn't delete", "Check your connection and try again.");
    }
  }

  /** Opens the modal to re-upload a specific photo */
  function handleEditPhoto(mealId: string, photoId: string, mealType: MealType) {
    setEditingPhoto({ mealId, photoId });
    setEditPrefill(mealType);
    setModalVisible(true);
  }

  /** Deletes one photo and its backend log; removes the whole meal if it was the last item */
  async function handleDeletePhoto(mealId: string, photoId: string) {
    const meal = meals.find((m) => m.id === mealId);
    if (!meal) return;
    const logId = meal.photos.length === 1 ? mealId : photoId;
    try {
      await foodApi.deleteLog(logId);
      if (meal.photos.length === 1) {
        deleteMeal(selectedDate, mealId);
      } else {
        deletePhotoFromMeal(selectedDate, mealId, photoId);
      }
      foodApi.getDailySummary(selectedDate)
        .then((s) => {
          setDailyCalories(s.total_calories);
          setDailyMacros({ protein: s.total_protein_g, carbs: s.total_carbs_g, fat: s.total_fat_g });
        })
        .catch(() => {});
    } catch {
      Alert.alert("Couldn't delete", "Check your connection and try again.");
    }
  }

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <RuledLines />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* ── Header ── */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.eyebrow}>SNACC BUDDY</Text>
              <Text style={styles.diaryTitle}>
                {displayName === "My" ? "My Food Diary" : `${displayName}'s Food Diary`}
              </Text>
            </View>
            <View style={styles.headerRight}>
              {/* Streak badge */}
              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={13} color="#E8724A" />
                <Text style={styles.streakCount}>{streak}</Text>
              </View>
              {/* Avatar */}
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            </View>
          </View>

          {/* ── Date row ── */}
          <View style={styles.dateRow}>
            <Text style={styles.dateSubheading}>Today's Food Diary</Text>
            <View style={styles.dateNav}>
              <TouchableOpacity onPress={goToPrevDay} style={styles.dateNavBtn} accessibilityLabel="Previous day">
                <Ionicons name="chevron-back" size={18} color={colors.textMuted} />
              </TouchableOpacity>
              <Text style={styles.dateText}>{dateDisplay}</Text>
              <TouchableOpacity
                onPress={goToNextDay}
                style={styles.dateNavBtn}
                disabled={isToday}
                accessibilityLabel="Next day"
              >
                <Ionicons name="chevron-forward" size={18} color={isToday ? colors.border : colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Summary card (donut + macros) ── */}
          <SummaryCard
            total={dailyCalories}
            goal={calorieGoal}
            protein={dailyMacros.protein}
            carbs={dailyMacros.carbs}
            fat={dailyMacros.fat}
            proteinTarget={targets.protein_g}
            carbsTarget={targets.carbs_g}
            fatTarget={targets.fat_g}
          />

          {/* ── Meals section ── */}
          <Text style={styles.mealsHeader}>Meals</Text>
          <View style={styles.mealsUnderline} />

          <View style={styles.mealsList}>
            {meals.length === 0 ? (
              <EmptyDiary isToday={isToday} />
            ) : (
              meals.map((meal) => (
                <MealRow
                  key={meal.id}
                  meal={meal}
                  date={selectedDate}
                  onDeleteMeal={() => handleDeleteMeal(meal.id)}
                />
              ))
            )}
          </View>
        </ScrollView>

        {/* ── Floating action button (today only) ── */}
        {isToday && (
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Log a meal"
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* ── Meal log modal ── */}
        <MealLogModal
          visible={modalVisible}
          onClose={handleModalClose}
          onSave={handleSaveMeal}
          prefillType={editPrefill}
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
    marginBottom:   spacing.md,
  },
  eyebrow: {
    fontFamily:    fonts.body600,
    fontSize:      11,
    color:         colors.primary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom:  2,
  },
  diaryTitle: {
    fontFamily:  fonts.heading700,
    fontSize:    28,
    color:       colors.text,
    fontStyle:   "italic",
  },
  headerRight: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           spacing.sm,
    marginTop:     2,
  },
  calPill: {
    flexDirection:   "row",
    alignItems:      "center",
    gap:             4,
    backgroundColor: colors.primaryLight,
    borderRadius:    radius.pill,
    paddingHorizontal: 10,
    paddingVertical:   5,
    borderWidth:     1,
    borderColor:     colors.primaryBorder,
  },
  calPillText: {
    fontFamily: fonts.body600,
    fontSize:   12,
    color:      colors.primary,
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

  // ── Date row ──
  dateRow: {
    gap:          2,
    marginBottom: spacing.md,
  },
  dateSubheading: {
    fontFamily: fonts.body400,
    fontSize:   12,
    color:      colors.textMuted,
    letterSpacing: 0.3,
  },
  dateNav: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           2,
  },
  dateNavBtn: {
    padding: 4,
  },
  dateText: {
    fontFamily: fonts.heading600,
    fontSize:   20,
    color:      colors.text,
  },

  // ── Summary card (donut + macros) ──
  summaryCard: {
    backgroundColor: colors.bgCard,
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderColor:     colors.border,
    padding:         spacing.md,
    flexDirection:   "row",
    alignItems:      "center",
    gap:             spacing.md,
    marginBottom:    spacing.md,
    ...Platform.select({
      ios: {
        shadowColor:   colors.accentBorder,
        shadowOffset:  { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius:  8,
      },
      android: { elevation: 2 },
    }),
  },
  donutCenter: {
    alignItems:     "center",
    justifyContent: "center",
  },
  donutCalories: {
    fontFamily:    fonts.body700,
    fontSize:      18,
    color:         colors.text,
    lineHeight:    20,
  },
  donutUnit: {
    fontFamily: fonts.body400,
    fontSize:   10,
    color:      colors.textMuted,
  },
  summaryRight: {
    flex: 1,
    gap:  spacing.sm,
  },
  summaryGoalRow: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "flex-start",
  },
  summaryDailyGoalLabel: {
    fontFamily:    fonts.body400,
    fontSize:      11,
    color:         colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryRemaining: {
    fontFamily: fonts.body700,
    fontSize:   14,
    color:      colors.text,
  },
  summaryGoalKcal: {
    fontFamily: fonts.body600,
    fontSize:   12,
    color:      colors.textMuted,
  },
  macroChipRow: {
    flexDirection: "row",
    gap:           spacing.xs,
  },
  macroChipPill: {
    flex:            1,
    backgroundColor: colors.primaryLight,
    borderRadius:    radius.sm,
    paddingVertical: 6,
    alignItems:      "center",
  },
  macroChipValue: {
    fontFamily: fonts.body700,
    fontSize:   13,
    color:      colors.text,
  },
  macroChipLabel: {
    fontFamily: fonts.body400,
    fontSize:   10,
    color:      colors.textMuted,
  },

  // ── Streak badge ──
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

  // ── Meals section ──
  mealsHeader: {
    fontFamily: fonts.heading700,
    fontSize:   28,
    color:      colors.text,
    marginTop:  spacing.lg,
  },
  mealsUnderline: {
    height:          1.5,
    backgroundColor: colors.border,
    marginTop:       4,
    marginBottom:    spacing.md,
  },
  mealsList: {
    gap: spacing.md,
  },

  // ── Meal row ──
  mealBlock: {
    backgroundColor: colors.bgCard,
    borderRadius:    radius.md,
    borderWidth:     1,
    borderColor:     colors.border,
    overflow:        "hidden",
    ...Platform.select({
      ios: {
        shadowColor:   colors.accentBorder,
        shadowOffset:  { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius:  6,
      },
      android: { elevation: 2 },
    }),
  },
  mealBlockExpanded: {
    borderColor: colors.primaryBorder,
  },
  mealHeaderRow: {
    flexDirection: "row",
    alignItems:    "center",
    padding:       spacing.sm,
    gap:           spacing.sm,
  },
  mealThumb: {
    width:        60,
    height:       60,
    borderRadius: 10,
    flexShrink:   0,
  },
  mealThumbPlaceholder: {
    backgroundColor: colors.primaryLight,
    alignItems:      "center",
    justifyContent:  "center",
  },
  mealHeaderInfo: {
    flex: 1,
    gap:  4,
  },
  mealMetaRow: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           spacing.xs,
    flexWrap:      "wrap",
  },
  mealTypeTag: {
    backgroundColor:  colors.primaryLight,
    borderRadius:     radius.pill,
    paddingHorizontal: 8,
    paddingVertical:   2,
    alignSelf:        "flex-start",
  },
  mealTypeTagText: {
    fontFamily:    fonts.body600,
    fontSize:      10,
    color:         colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  mealTimeRow: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           2,
  },
  mealTimeText: {
    fontFamily: fonts.body400,
    fontSize:   11,
    color:      colors.textMuted,
  },
  mealNameText: {
    fontFamily: fonts.body500,
    fontSize:   13,
    color:      colors.text,
    fontStyle:  "italic",
  },
  mealCalWrapper: {
    alignItems:  "flex-end",
    gap:         4,
    flexShrink:  0,
    marginLeft:  spacing.sm,
  },
  mealCalRow: {
    flexDirection: "row",
    alignItems:    "baseline",
    gap:           3,
  },
  mealCalValue: {
    fontFamily: fonts.body700,
    fontSize:   18,
    color:      colors.text,
  },
  mealCalUnit: {
    fontFamily: fonts.body400,
    fontSize:   11,
    color:      colors.textMuted,
  },

  // ── Expanded content ──
  expandedContent: {
    paddingHorizontal: spacing.md,
    paddingBottom:     spacing.md,
    gap:               spacing.md,
  },
  expandedDivider: {
    height:          1,
    backgroundColor: colors.border,
    marginBottom:    spacing.xs,
  },

  // ── Macro bars ──
  macroBarsSection: {
    gap: 10,
  },
  macroBarRow: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           spacing.sm,
  },
  macroBarLabel: {
    fontFamily: fonts.body500,
    fontSize:   13,
    color:      colors.text,
    width:      56,
    flexShrink: 0,
  },
  macroBarTrack: {
    flex:            1,
    height:          8,
    borderRadius:    4,
    backgroundColor: colors.primaryLight,
    overflow:        "hidden",
  },
  macroBarFill: {
    height:       "100%",
    borderRadius: 4,
  },
  macroBarValue: {
    fontFamily: fonts.body600,
    fontSize:   13,
    color:      colors.text,
    width:      32,
    textAlign:  "right",
    flexShrink: 0,
  },

  // ── AI insight card ──
  insightCard: {
    flexDirection:   "row",
    alignItems:      "flex-start",
    gap:             spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius:    radius.md,
    borderWidth:     1,
    borderColor:     colors.primaryBorder,
    padding:         spacing.md,
  },
  insightText: {
    flex:       1,
    fontFamily: fonts.body400,
    fontSize:   13,
    color:      colors.text,
    fontStyle:  "italic",
    lineHeight: 20,
  },

  // ── Remove entry ──
  removeEntryBtn: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "flex-end",
    gap:            5,
    paddingTop:     spacing.xs,
  },
  removeEntryText: {
    fontFamily: fonts.body500,
    fontSize:   13,
    color:      colors.error,
  },

  // ── (kept for potential future use) ──
  actionBtn: {
    width:           30,
    height:          30,
    borderRadius:    15,
    backgroundColor: colors.bgSecondary,
    borderWidth:     1.5,
    borderColor:     colors.border,
    alignItems:      "center",
    justifyContent:  "center",
  },
  notesInput: {
    fontFamily: fonts.heading400,
    fontSize:   16,
    color:      colors.text,
    minHeight:  56,
    textAlignVertical: "top",
    lineHeight: 22,
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
    width:           56,
    height:          56,
    borderRadius:    28,
    backgroundColor: colors.primary,
    alignItems:      "center",
    justifyContent:  "center",
    ...Platform.select({
      ios: {
        shadowColor:   colors.primary,
        shadowOffset:  { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius:  8,
      },
      android: { elevation: 6 },
    }),
  },
});
