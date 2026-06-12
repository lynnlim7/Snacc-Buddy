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
import { foodApi } from "../../services/api";
import {
  useDiaryStore,
  todayKey,
  type MealEntry,
  type MealType,
} from "../../stores/diaryStore";
import { useOnboardingStore } from "../../stores/onboardingStore";
import { useUserStore, type UserProfile } from "../../stores/userStore";
import { colors, fonts, spacing, radius } from "../../constants/theme";

// ─── Constants ────────────────────────────────────────────────

const { height: SCREEN_H } = Dimensions.get("window");
const LINE_SPACING = 38;
const HEADER_OFFSET = 220; // ruled lines start below the header area
const NUM_LINES = Math.ceil((SCREEN_H - HEADER_OFFSET) / LINE_SPACING) + 4;
function computeCalorieGoal(profile: UserProfile | null): number {
  if (!profile) return 2000;
  const { gender, age, height_cm, current_weight_kg, goal, lifestyle } = profile;
  if (!age || !height_cm || !current_weight_kg) return 2000;

  // Mifflin-St Jeor BMR
  const genderOffset = gender === "male" ? 5 : gender === "female" ? -161 : -78;
  const bmr = 10 * current_weight_kg + 6.25 * height_cm - 5 * age + genderOffset;

  const activityMultiplier: Record<string, number> = {
    wfh:       1.2,
    retired:   1.2,
    full_time: 1.375,
    part_time: 1.375,
    student:   1.55,
    homemaker: 1.55,
  };
  const tdee = Math.round(bmr * (activityMultiplier[lifestyle ?? ""] ?? 1.375));

  const goalAdjustment: Record<string, number> = {
    lose_weight:   -500,
    lose_fat:      -300,
    gain_muscle:   +300,
    eat_healthier: 0,
  };
  return Math.max(1200, tdee + (goalAdjustment[goal ?? ""] ?? 0));
}

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

function PolaroidStrip({ photos }: { photos: MealEntry["photos"] }) {
  if (photos.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.polaroidScroll}
    >
      {photos.map((photo, i) => (
        <View
          key={photo.id}
          style={[
            styles.polaroid,
            { transform: [{ rotate: POLAROID_ROTATIONS[i % POLAROID_ROTATIONS.length] }] },
          ]}
        >
          {photo.uri ? (
            <Image source={{ uri: photo.uri }} style={styles.polaroidImg} resizeMode="cover" />
          ) : (
            <View style={[styles.polaroidImg, styles.polaroidPlaceholder]}>
              <Ionicons name="restaurant-outline" size={28} color={colors.textLight} />
            </View>
          )}
          <Text style={styles.polaroidCaption} numberOfLines={1}>{photo.name}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// ─── Mood stickers ────────────────────────────────────────────

function MoodSection({
  moods,
  onToggle,
}: {
  moods: string[];
  onToggle: (mood: string) => void;
}) {
  return (
    <View style={styles.moodSection}>
      <Text style={styles.moodLabel}>mood</Text>
      <View style={styles.moodGrid}>
        {MOODS.map((mood) => {
          const active = moods.includes(mood);
          return (
            <TouchableOpacity
              key={mood}
              style={[styles.moodSticker, active && styles.moodStickerActive]}
              onPress={() => onToggle(mood)}
              activeOpacity={0.75}
            >
              <Text style={[styles.moodStickerText, active && styles.moodStickerTextActive]}>
                {mood}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Notes patch ──────────────────────────────────────────────

function NotesPatch({
  note,
  onSave,
}: {
  note: string;
  onSave: (text: string) => void;
}) {
  const [text, setText] = useState(note);
  const dirty = text.trim() !== note.trim();

  // Sync if note was externally reset (e.g. backend refresh)
  useEffect(() => { setText(note); }, [note]);

  const handleSave = useCallback(() => { if (dirty) onSave(text); }, [dirty, onSave, text]);

  return (
    <View style={styles.notesPatch}>
      <View style={styles.tapeLeft} />
      <View style={styles.tapeRight} />

      <View style={styles.notesHeader}>
        <Text style={styles.notesLabel}>note</Text>
        {dirty && (
          <TouchableOpacity onPress={handleSave} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Text style={styles.notesSave}>save</Text>
          </TouchableOpacity>
        )}
      </View>
      <TextInput
        style={styles.notesInput}
        value={text}
        onChangeText={setText}
        onBlur={handleSave}
        placeholder="how was this meal?.."
        placeholderTextColor={colors.textLight}
        multiline
        maxLength={200}
      />
    </View>
  );
}

// ─── Meal row ─────────────────────────────────────────────────

function MealRow({
  meal,
  date,
  onEditPhoto,
  onDeletePhoto,
}: {
  meal: MealEntry;
  date: string;
  onEditPhoto: (photoId: string) => void;
  onDeletePhoto: (photoId: string) => void;
}) {
  const updateMealMood  = useDiaryStore((s) => s.updateMealMood);
  const updateMealNote  = useDiaryStore((s) => s.updateMealNote);
  const [expanded, setExpanded] = useState(false);

  const liftAnim = useRef(new Animated.Value(1)).current;

  function onPressIn() {
    Animated.spring(liftAnim, {
      toValue: 1.015, speed: 30, bounciness: 0, useNativeDriver: true,
    }).start();
  }
  function onPressOut() {
    Animated.spring(liftAnim, {
      toValue: 1, speed: 20, bounciness: 0, useNativeDriver: true,
    }).start();
  }

  function toggleMood(mood: string) {
    const next = meal.mood.includes(mood)
      ? meal.mood.filter((m) => m !== mood)
      : [...meal.mood, mood];
    updateMealMood(date, meal.id, next);
    foodApi.patchLog(meal.id, { mood: next }).catch(() => {});
  }

  return (
    <Animated.View
      style={[
        styles.mealBlock,
        expanded && styles.mealBlockExpanded,
        { transform: [{ scale: liftAnim }] },
      ]}
    >
      {/* ── Header row — full row is the expand toggle ── */}
      <TouchableOpacity
        style={styles.mealHeaderRow}
        onPress={() => setExpanded((v) => !v)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`${meal.type}, ${meal.totalCalories} calories`}
      >
        <Text style={styles.mealTypeText}>{meal.type}</Text>
        <Text style={styles.dotLeader} numberOfLines={1}>{DOT_LEADER}</Text>
        <Text style={styles.mealCalText}>{meal.totalCalories} kcal</Text>
      </TouchableOpacity>

      {/* ── Expanded content ── */}
      {expanded && (
        <View style={styles.expandedContent}>
          {/* Food items with individual edit + delete */}
          {meal.photos.map((photo) => (
            <View key={photo.id} style={styles.photoRow}>
              <View style={styles.photoBullet} />
              <Text style={styles.photoName} numberOfLines={1}>{photo.name}</Text>
              <View style={styles.photoItemActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => onEditPhoto(photo.id)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  accessibilityLabel={`Edit ${photo.name}`}
                >
                  <Ionicons name="pencil-outline" size={13} color={colors.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => onDeletePhoto(photo.id)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  accessibilityLabel={`Delete ${photo.name}`}
                >
                  <Ionicons name="trash-outline" size={13} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Polaroid thumbnails */}
          <PolaroidStrip photos={meal.photos} />

          {/* Mood stickers */}
          <MoodSection moods={meal.mood} onToggle={toggleMood} />

          {/* Notes sticky patch */}
          <NotesPatch
            note={meal.note}
            onSave={(text) => {
              updateMealNote(date, meal.id, text);
              foodApi.patchLog(meal.id, { notes: text }).catch(() => {});
            }}
          />
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

// ─── Calorie card ─────────────────────────────────────────────

function CalorieCard({ total, goal, isToday }: { total: number; goal: number; isToday: boolean }) {
  const pct     = goal > 0 ? Math.min(1, total / goal) : 0;
  const reached = Math.round(pct * 100);
  const fillPct = total > 0 ? Math.max(3, reached) : 0;

  return (
    <View style={styles.calorieCard}>
      <Text style={styles.calCardLabel}>{isToday ? "Today's calories" : "Day's calories"}</Text>
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
  const [selectedDate,    setSelectedDate]    = useState(todayKey);
  const [modalVisible,    setModalVisible]    = useState(false);
  const [editPrefill,     setEditPrefill]     = useState<MealType | undefined>(undefined);
  const [editingPhoto,    setEditingPhoto]    = useState<{ mealId: string; photoId: string } | null>(null);
  const [dailyCalories,   setDailyCalories]   = useState(0);

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
      .then((s) => setDailyCalories(s.total_calories))
      .catch(() => {});
  }, [selectedDate]);

  const isToday     = selectedDate === todayKey();
  const greeting    = getGreeting();
  const displayName = userName.trim() || "My";
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
      .then((s) => setDailyCalories(s.total_calories))
      .catch(() => {});
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
        .then((s) => setDailyCalories(s.total_calories))
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
          <View style={styles.dateNav}>
            <TouchableOpacity onPress={goToPrevDay} style={styles.dateNavBtn} accessibilityLabel="Previous day">
              <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
            </TouchableOpacity>
            <Text style={styles.dateText}>{dateDisplay}</Text>
            <TouchableOpacity
              onPress={goToNextDay}
              style={styles.dateNavBtn}
              disabled={isToday}
              accessibilityLabel="Next day"
            >
              <Ionicons name="chevron-forward" size={20} color={isToday ? colors.border : colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* ── Calorie card ── */}
          <CalorieCard total={dailyCalories} goal={calorieGoal} isToday={isToday} />

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
                  onEditPhoto={(photoId) =>
                    handleEditPhoto(meal.id, photoId, meal.type)
                  }
                  onDeletePhoto={(photoId) =>
                    handleDeletePhoto(meal.id, photoId)
                  }
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
            <Ionicons name="add" size={30} color={colors.text} />
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
  dateNav: {
    flexDirection: "row",
    alignItems:    "center",
    marginBottom:  spacing.md,
    gap:           4,
  },
  dateNavBtn: {
    padding: 4,
  },
  dateText: {
    fontFamily: fonts.heading600,
    fontSize:   26,
    color:      colors.text,
    flexShrink: 1,
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
  mealBlockExpanded: {
    backgroundColor: colors.bgSecondary,
    borderRadius:    radius.md,
    borderWidth:     1.5,
    borderColor:     colors.border,
    padding:         spacing.md,
    marginHorizontal: -spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor:   colors.accentBorder,
        shadowOffset:  { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius:  10,
      },
      android: { elevation: 4 },
    }),
  },
  // Full row is the expand toggle — no nested buttons
  mealHeaderRow: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           5,
  },
  mealTypeText: {
    fontFamily: fonts.heading600,
    fontSize:   18,
    color:      colors.text,
    flexShrink: 0,
  },
  dotLeader: {
    flex:          1,
    fontFamily:    fonts.body400,
    fontSize:      13,
    color:         colors.textLight,
    overflow:      "hidden",
    letterSpacing: 1,
  },
  mealCalText: {
    fontFamily: fonts.heading600,
    fontSize:   16,
    color:      colors.textMuted,
    flexShrink: 0,
  },
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

  // ── Expanded content wrapper ──
  expandedContent: {
    gap:       spacing.md,
    marginTop: spacing.sm,
  },

  // ── Food item rows (individual edit + delete) ──
  photoRow: {
    flexDirection: "row",
    alignItems:    "center",
    paddingLeft:   spacing.sm,
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
  photoItemActions: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           4,
    flexShrink:    0,
  },

  // ── Polaroid strip ──
  polaroidScroll: {
    paddingVertical: spacing.md,
    gap:             spacing.md,
    paddingHorizontal: 4, // room for shadow bleed
  },
  polaroid: {
    backgroundColor: "#FFFDF8",
    padding:         5,
    paddingBottom:   22,
    borderWidth:     1,
    borderColor:     colors.border,
    borderRadius:    2,
    ...Platform.select({
      ios: {
        shadowColor:   "#4A4036",
        shadowOffset:  { width: 1, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius:  3,
      },
      android: { elevation: 3 },
    }),
  },
  polaroidImg: {
    width:  90,
    height: 90,
    borderRadius: 1,
  },
  polaroidPlaceholder: {
    backgroundColor: colors.bgSecondary,
    alignItems:      "center",
    justifyContent:  "center",
  },
  polaroidCaption: {
    position:   "absolute",
    bottom:     4,
    left:       4,
    right:      4,
    textAlign:  "center",
    fontFamily: fonts.heading400,
    fontSize:   10,
    color:      colors.textMuted,
  },

  // ── Mood stickers ──
  moodSection: {
    gap: spacing.sm,
  },
  moodLabel: {
    fontFamily:    fonts.body600,
    fontSize:      12,
    color:         colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  moodGrid: {
    flexDirection: "row",
    flexWrap:      "wrap",
    gap:           spacing.sm,
  },
  moodSticker: {
    paddingHorizontal: 14,
    paddingVertical:   7,
    borderRadius:      radius.pill,
    borderWidth:       1.5,
    borderColor:       colors.border,
    backgroundColor:   colors.bg,
  },
  moodStickerActive: {
    backgroundColor: colors.pastelBlue,
    borderColor:     colors.pastelBlueBorder,
    ...Platform.select({
      ios: {
        shadowColor:   colors.pastelBlueBorder,
        shadowOffset:  { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius:  0,
      },
      android: { elevation: 2 },
    }),
  },
  moodStickerText: {
    fontFamily: fonts.body500,
    fontSize:   13,
    color:      colors.textMuted,
  },
  moodStickerTextActive: {
    color:      colors.text,
    fontFamily: fonts.body600,
  },

  // ── Notes patch ──
  notesPatch: {
    backgroundColor: "#EDE5D8",
    borderRadius:    radius.sm,
    borderWidth:     1,
    borderColor:     "#CFC4B0",
    padding:         spacing.md,
    paddingTop:      spacing.lg,  // extra room for tape
    marginTop:       spacing.sm,
    gap:             spacing.sm,
    position:        "relative",
    overflow:        "visible",
  },
  // Tape strips — absolutely positioned at the top
  tapeLeft: {
    position:        "absolute",
    top:             -8,
    left:            20,
    width:           38,
    height:          16,
    borderRadius:    2,
    backgroundColor: "rgba(255, 253, 248, 0.78)",
    borderWidth:     0.5,
    borderColor:     "rgba(200, 185, 165, 0.45)",
    transform:       [{ rotate: "-4deg" }],
  },
  tapeRight: {
    position:        "absolute",
    top:             -7,
    right:           24,
    width:           38,
    height:          16,
    borderRadius:    2,
    backgroundColor: "rgba(255, 253, 248, 0.78)",
    borderWidth:     0.5,
    borderColor:     "rgba(200, 185, 165, 0.45)",
    transform:       [{ rotate: "3deg" }],
  },
  notesHeader: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
  },
  notesLabel: {
    fontFamily:    fonts.body600,
    fontSize:      12,
    color:         "#8C7B6A",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  notesSave: {
    fontFamily: fonts.body600,
    fontSize:   12,
    color:      colors.accentDark,
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
