/**
 * MealLogModal — bottom-sheet-style modal for logging a meal.
 *
 * Flow:
 *   Step 1 "type"      → pick meal type + see camera placeholder + Library/Camera
 *   Step 2 "analyzing" → loading animation while AI processes photo
 *   Step 3 "results"   → nutrition breakdown + confirm
 */
import React, { useState } from "react";
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, TextInput,
  KeyboardAvoidingView, Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import {
  colors, fonts, spacing, radius,
  optionChip, optionChipText,
} from "../constants/theme";
import {
  MealEntry, MealType, FoodPhoto, NutritionInfo,
  calcDots, DAILY_TARGETS,
} from "../stores/diaryStore";

// ─── Types ────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (meal: MealEntry) => void;
  /** Pre-selected type when adding a photo to an existing meal */
  prefillType?: MealType;
}

type Step = "type" | "analyzing" | "results";

const MEAL_TYPES: MealType[] = [
  "Breakfast", "Lunch", "Dinner", "Snack", "Dessert", "Supper",
];

// ─── Mock AI analyser (swap for real API call) ───────────────

async function analyseImage(_uri: string): Promise<{
  name: string;
  nutrition: NutritionInfo;
}> {
  // TODO: POST to /api/food/analyse with the image URI
  await new Promise((r) => setTimeout(r, 1800)); // simulate network
  const calories = 300 + Math.floor(Math.random() * 300);
  const protein_g = 8 + Math.floor(Math.random() * 30);
  const carbs_g   = 20 + Math.floor(Math.random() * 60);
  const fat_g     = 5 + Math.floor(Math.random() * 20);
  const fiber_g   = 1 + Math.floor(Math.random() * 10);
  return {
    name: "Food item",
    nutrition: {
      calories,
      protein_g,
      carbs_g,
      fat_g,
      fiber_g,
      proteinDots: calcDots(protein_g, DAILY_TARGETS.protein_g),
      carbsDots:   calcDots(carbs_g,   DAILY_TARGETS.carbs_g),
      fatDots:     calcDots(fat_g,     DAILY_TARGETS.fat_g),
      fiberDots:   calcDots(fiber_g,   DAILY_TARGETS.fiber_g),
    },
  };
}

// ─── Component ────────────────────────────────────────────────

export function MealLogModal({ visible, onClose, onSave, prefillType }: Props) {
  const [step, setStep]             = useState<Step>("type");
  const [mealType, setMealType]     = useState<MealType | null>(prefillType ?? null);
  const [imageUri, setImageUri]     = useState<string | null>(null);
  const [result, setResult]         = useState<{ name: string; nutrition: NutritionInfo } | null>(null);
  const [editName, setEditName]     = useState("");

  function reset() {
    setStep("type");
    setMealType(prefillType ?? null);
    setImageUri(null);
    setResult(null);
    setEditName("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handlePickImage(source: "library" | "camera") {
    if (!mealType) {
      Alert.alert("Choose a meal type first");
      return;
    }

    const result =
      source === "library"
        ? await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
          })
        : await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.8,
          });

    if (result.canceled) return;
    const uri = result.assets[0].uri;
    setImageUri(uri);
    setStep("analyzing");

    try {
      const analysis = await analyseImage(uri);
      setResult(analysis);
      setEditName(analysis.name);
      setStep("results");
    } catch {
      Alert.alert("Analysis failed", "Oops, please try again");
      setStep("type");
    }
  }

  function handleConfirm() {
    if (!mealType || !result || !imageUri) return;
    const photo: FoodPhoto = {
      id: Date.now().toString(),
      uri: imageUri,
      name: editName || result.name,
      nutrition: result.nutrition,
    };
    const meal: MealEntry = {
      id: Date.now().toString(),
      type: mealType,
      photos: [photo],
      totalCalories: result.nutrition.calories,
    };
    onSave(meal);
    reset();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.kavWrap}
        >
          <View style={styles.sheet}>
            {/* Handle bar */}
            <View style={styles.handle} />

            {/* ── Close button ── */}
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            {step === "type" && (
              <TypeStep
                mealType={mealType}
                onSelectType={setMealType}
                onPickImage={handlePickImage}
              />
            )}

            {step === "analyzing" && <AnalyzingStep />}

            {step === "results" && result && (
              <ResultsStep
                mealType={mealType!}
                result={result}
                imageUri={imageUri!}
                editName={editName}
                onEditName={setEditName}
                onConfirm={handleConfirm}
                onBack={() => setStep("type")}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Step: Type Selection ─────────────────────────────────────

function TypeStep({
  mealType,
  onSelectType,
  onPickImage,
}: {
  mealType: MealType | null;
  onSelectType: (t: MealType) => void;
  onPickImage: (s: "library" | "camera") => void;
}) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
      <Text style={styles.stepTitle}>What are we having today?</Text>

      {/* Meal type sticker buttons */}
      <View style={styles.typeGrid}>
        {MEAL_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.typeSticker, mealType === type && styles.typeStickerActive]}
            onPress={() => onSelectType(type)}
            accessibilityRole="button"
            accessibilityState={{ selected: mealType === type }}
          >
            <Text style={[styles.typeStickerText, mealType === type && styles.typeStickerTextActive]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Camera illustration */}
      <CameraIllustration />


      {/* Library / Camera buttons */}
      <View style={styles.captureRow}>
        <TouchableOpacity
          style={[styles.captureBtn, mealType && styles.captureBtnAccent, !mealType && styles.captureBtnDisabled]}
          onPress={() => onPickImage("library")}
          disabled={!mealType}
          accessibilityLabel="Choose from library"
        >
          <Ionicons name="images-outline" size={18} color={mealType ? colors.text : colors.textLight} />
          <Text style={[styles.captureBtnText, !mealType && { color: colors.textLight }]}>
            Library
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.captureBtn, mealType && styles.captureBtnAccent, !mealType && styles.captureBtnDisabled]}
          onPress={() => onPickImage("camera")}
          disabled={!mealType}
          accessibilityLabel="Take a photo"
        >
          <Ionicons name="camera-outline" size={18} color={mealType ? colors.text : colors.textLight} />
          <Text style={[styles.captureBtnText, !mealType && { color: colors.textLight }]}>
            Camera
          </Text>
        </TouchableOpacity>
      </View>

      {!mealType && (
        <Text style={styles.hint}>Select a meal type first</Text>
      )}
    </ScrollView>
  );
}

// ─── Camera illustration ──────────────────────────────────────

function CameraIllustration() {
  return (
    <View style={styles.cameraWrap}>
      {/* Camera body */}
      <View style={styles.cameraBody}>
        {/* Top controls bar */}
        <View style={styles.cameraTop}>
          <View style={styles.cameraCtrlSmall} />
          <View style={styles.cameraCtrlRect} />
          <View style={[styles.cameraCtrlSmall, { marginLeft: "auto" }]} />
        </View>
        {/* Viewfinder — shows a food placeholder */}
        <View style={styles.viewfinder}>
          <Text style={styles.viewfinderText}>Your food here</Text>
          <View style={styles.viewfinderCorner1} />
          <View style={styles.viewfinderCorner2} />
          <View style={styles.viewfinderCorner3} />
          <View style={styles.viewfinderCorner4} />
        </View>
      </View>
    </View>
  );
}

// ─── Step: Analyzing ─────────────────────────────────────────

function AnalyzingStep() {
  return (
    <View style={styles.analyzingWrap}>
      <ActivityIndicator color={colors.accent} size="large" />
      <Text style={styles.analyzingText}>Checking what's on your plate..</Text>
      <Text style={styles.analyzingHint}>This takes just a moment</Text>
    </View>
  );
}

// ─── Step: Results ────────────────────────────────────────────

function ResultsStep({
  mealType, result, imageUri,
  editName, onEditName, onConfirm, onBack,
}: {
  mealType: MealType;
  result: { name: string; nutrition: NutritionInfo };
  imageUri: string;
  editName: string;
  onEditName: (s: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const n = result.nutrition;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
      <TouchableOpacity onPress={onBack} style={styles.backRow}>
        <Ionicons name="arrow-back" size={16} color={colors.textMuted} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.stepTitle}>Here's what I found</Text>
      <Text style={styles.resultMealTag}>{mealType}</Text>

      {/* Editable food name */}
      <TextInput
        style={styles.nameInput}
        value={editName}
        onChangeText={onEditName}
        placeholder="Food name…"
        placeholderTextColor={colors.textLight}
        accessibilityLabel="Edit food name"
      />

      {/* Nutrition card */}
      <View style={styles.nutritionCard}>
        {/* Calorie hero */}
        <View style={styles.calorieRow}>
          <Text style={styles.calorieLabel}>Calories</Text>
          <Text style={styles.calorieValue}>{n.calories} kcal</Text>
        </View>

        <View style={styles.divider} />

        {/* Macro dot rows */}
        <MacroRow label="Protein" dots={n.proteinDots} grams={n.protein_g} unit="g" />
        <MacroRow label="Carbs"   dots={n.carbsDots}   grams={n.carbs_g}   unit="g" />
        <MacroRow label="Fat"     dots={n.fatDots}     grams={n.fat_g}     unit="g" />
        <MacroRow label="Fiber"   dots={n.fiberDots}   grams={n.fiber_g}   unit="g" />
      </View>

      {/* Confirm button */}
      <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm} accessibilityRole="button">
        <Text style={styles.confirmBtnText}>Add to diary</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── MacroRow with dots ───────────────────────────────────────

function MacroRow({
  label, dots, grams, unit,
}: {
  label: string; dots: number; grams: number; unit: string;
}) {
  return (
    <View style={styles.macroRow}>
      <Text style={styles.macroLabel}>{label}</Text>
      <View style={styles.macroDots}>
        {Array.from({ length: 5 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < dots ? styles.dotFilled : styles.dotEmpty,
            ]}
          />
        ))}
      </View>
      <Text style={styles.macroGrams}>{Math.round(grams)}{unit}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(74, 64, 54, 0.4)",
    justifyContent: "flex-end",
  },
  kavWrap: { justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    maxHeight: "92%",
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  closeBtn: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    padding: spacing.sm,
    zIndex: 10,
  },

  stepContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  stepTitle: {
    fontFamily: fonts.heading700,
    fontSize: 28,
    color: colors.text,
    lineHeight: 32,
  },

  // ── Meal type grid ──
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  typeSticker: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.bgSecondary,
  },
  typeStickerActive: {
    backgroundColor: colors.pastelBlue,
    borderColor: colors.pastelBlueBorder,
  },
  typeStickerText: {
    fontFamily: fonts.body600,
    fontSize: 14,
    color: colors.textMuted,
  },
  typeStickerTextActive: {
    color: colors.text,
  },

  // ── Camera illustration ──
  cameraWrap: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  cameraBody: {
    width: 240,
    borderWidth: 2.5,
    borderColor: colors.text,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.bgCard,
  },
  cameraTop: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
  },
  cameraCtrlSmall: {
    width: 14, height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.text,
  },
  cameraCtrlRect: {
    width: 32, height: 10,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: colors.text,
  },
  viewfinder: {
    height: 130,
    margin: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    backgroundColor: colors.bg,
  },
  viewfinderText: {
    fontFamily: fonts.heading400,
    fontSize: 14,
    color: colors.textLight,
  },
  // Corner brackets
  viewfinderCorner1: { position: "absolute", top: 4, left: 4, width: 12, height: 12, borderTopWidth: 2, borderLeftWidth: 2, borderColor: colors.textMuted },
  viewfinderCorner2: { position: "absolute", top: 4, right: 4, width: 12, height: 12, borderTopWidth: 2, borderRightWidth: 2, borderColor: colors.textMuted },
  viewfinderCorner3: { position: "absolute", bottom: 4, left: 4, width: 12, height: 12, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: colors.textMuted },
  viewfinderCorner4: { position: "absolute", bottom: 4, right: 4, width: 12, height: 12, borderBottomWidth: 2, borderRightWidth: 2, borderColor: colors.textMuted },

  // ── Capture buttons ──
  captureRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  captureBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "#ffffff",
  },
  captureBtnAccent: {
    backgroundColor: colors.softPink,
    borderColor: colors.softPinkBorder,
  },
  captureBtnDisabled: { opacity: 0.4 },
  captureBtnText: {
    fontFamily: fonts.body600,
    fontSize: 15,
    color: colors.text,
  },
  hint: {
    fontFamily: fonts.body400,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
  },

  // ── Analyzing ──
  analyzingWrap: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  analyzingText: {
    fontFamily: fonts.heading600,
    fontSize: 22,
    color: colors.text,
    textAlign: "center",
  },
  analyzingHint: {
    fontFamily: fonts.body400,
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: "italic",
  },

  // ── Results ──
  backRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: -spacing.sm },
  backText: { fontFamily: fonts.body400, fontSize: 13, color: colors.textMuted },
  resultMealTag: {
    fontFamily: fonts.body600,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: -spacing.sm,
  },
  nameInput: {
    fontFamily: fonts.heading600,
    fontSize: 20,
    color: colors.text,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  nutritionCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  calorieRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  calorieLabel: {
    fontFamily: fonts.heading700,
    fontSize: 20,
    color: colors.text,
  },
  calorieValue: {
    fontFamily: fonts.heading700,
    fontSize: 24,
    color: colors.accent,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  macroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  macroLabel: {
    fontFamily: fonts.body500,
    fontSize: 14,
    color: colors.text,
    width: 60,
  },
  macroDots: {
    flex: 1,
    flexDirection: "row",
    gap: 5,
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  dotFilled: {
    backgroundColor: colors.accent,
    borderColor: colors.accentBorder,
  },
  dotEmpty: {
    backgroundColor: "transparent",
    borderColor: colors.border,
  },
  macroGrams: {
    fontFamily: fonts.body400,
    fontSize: 12,
    color: colors.textMuted,
    width: 36,
    textAlign: "right",
  },

  confirmBtn: {
    backgroundColor: colors.softPink,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.softPinkBorder,
    paddingVertical: 16,
    alignItems: "center",
  },
  confirmBtnText: {
    fontFamily: fonts.heading700,
    fontSize: 20,
    color: colors.text,
  },
});
