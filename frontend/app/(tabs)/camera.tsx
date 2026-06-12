import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { PaperBackground } from "../../components/PaperBackground";
import { NutritionSummary } from "../../components/NutritionSummary";
import { useFoodStore } from "../../stores/foodStore";
import { useDiaryStore, todayKey, type MealType } from "../../stores/diaryStore";
import { foodApi } from "../../services/api";
import { DailySummary } from "../../types/food";
import { colors, fonts, spacing, radius } from "../../constants/theme";

const MEAL_TYPES: MealType[] = ["Breakfast", "Lunch", "Dinner", "Snack", "Dessert", "Supper"];

export default function CameraScreen() {
  const router = useRouter();
  const { isAnalyzing, lastAnalyzed, analyzeImage } = useFoodStore();
  const addMeal = useDiaryStore((s) => s.addMeal);

  const [pickedUri,   setPickedUri]   = useState<string | null>(null);
  const [mealType,    setMealType]    = useState<MealType | null>(null);
  const [saving,      setSaving]      = useState(false);

  const pickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled) setPickedUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Camera access is required to take food photos.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) setPickedUri(result.assets[0].uri);
  };

  const handleAnalyze = async () => {
    if (!pickedUri) return;
    const log = await analyzeImage(pickedUri);
    if (!log) Alert.alert("Analysis failed", "Couldn't read that image. Please try again.");
  };

  const handleSave = async () => {
    if (!lastAnalyzed || !mealType) return;
    setSaving(true);
    try {
      const saved = await foodApi.confirmLog({
        meal_type: mealType.toLowerCase(),
        image_urls: [],
        analysis: lastAnalyzed.analysis,
        inference_log_id: lastAnalyzed.inference_log_id,
      });
      const today = todayKey();
      addMeal(today, {
        id: String(saved.id),
        type: mealType,
        photos: [{
          id: String(saved.id),
          uri: pickedUri ?? "",
          name: saved.meal_name ?? lastAnalyzed.analysis.food_name,
          nutrition: {
            calories:    saved.estimated_total_calories,
            protein_g:   saved.protein_g   ?? 0,
            carbs_g:     saved.carbs_g     ?? 0,
            fat_g:       saved.fat_g       ?? 0,
            fiber_g:     0,
            proteinDots: 0,
            carbsDots:   0,
            fatDots:     0,
            fiberDots:   0,
          },
        }],
        totalCalories: saved.estimated_total_calories,
        mood: [],
        note: "",
      });
      router.replace("/(tabs)");
    } catch {
      Alert.alert("Couldn't save", "Check your connection and try again.");
      setSaving(false);
    }
  };

  const previewSummary: DailySummary | null = lastAnalyzed
    ? {
        date:            new Date().toISOString().slice(0, 10),
        total_calories:  lastAnalyzed.analysis.estimated_total_calories,
        total_protein_g: lastAnalyzed.analysis.macros.protein_g ?? 0,
        total_carbs_g:   lastAnalyzed.analysis.macros.carbs_g   ?? 0,
        total_fat_g:     lastAnalyzed.analysis.macros.fat_g     ?? 0,
        meal_count:      1,
      }
    : null;

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.heading}>Quick scan</Text>

          {/* Image preview / placeholder */}
          <View style={styles.imageFrame}>
            {pickedUri ? (
              <Image source={{ uri: pickedUri }} style={styles.preview} resizeMode="cover" />
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="camera-outline" size={40} color={colors.textLight} />
                <Text style={styles.placeholderText}>Pick a photo to analyse</Text>
              </View>
            )}
          </View>

          {/* Library / Camera buttons */}
          <View style={styles.pickRow}>
            <TouchableOpacity style={styles.pickBtn} onPress={pickFromLibrary} accessibilityLabel="Choose from library">
              <Ionicons name="images-outline" size={18} color={colors.text} />
              <Text style={styles.pickBtnText}>Library</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickBtn} onPress={takePhoto} accessibilityLabel="Take a photo">
              <Ionicons name="camera-outline" size={18} color={colors.text} />
              <Text style={styles.pickBtnText}>Camera</Text>
            </TouchableOpacity>
          </View>

          {/* Analyse button */}
          {pickedUri && !isAnalyzing && !lastAnalyzed && (
            <TouchableOpacity style={styles.analyseBtn} onPress={handleAnalyze} accessibilityRole="button">
              <Text style={styles.analyseBtnText}>Analyse</Text>
            </TouchableOpacity>
          )}

          {isAnalyzing && (
            <View style={styles.analyzingRow}>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.analyzingText}>Checking what's on your plate…</Text>
            </View>
          )}

          {/* Analysis result */}
          {lastAnalyzed && !isAnalyzing && previewSummary && (
            <View style={styles.resultSection}>
              <Text style={styles.resultName}>{lastAnalyzed.analysis.food_name}</Text>
              <NutritionSummary summary={previewSummary} compact />

              {/* Meal type selector */}
              <Text style={styles.mealTypeLabel}>Save as…</Text>
              <View style={styles.typeGrid}>
                {MEAL_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeChip, mealType === t && styles.typeChipActive]}
                    onPress={() => setMealType(t)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: mealType === t }}
                  >
                    <Text style={[styles.typeChipText, mealType === t && styles.typeChipTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, (!mealType || saving) && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!mealType || saving}
                accessibilityRole="button"
              >
                {saving
                  ? <ActivityIndicator color={colors.text} />
                  : <Text style={styles.saveBtnText}>Add to diary</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.xl,
    paddingBottom:     spacing.xxl,
    gap:               spacing.lg,
  },
  heading: {
    fontFamily: fonts.heading700,
    fontSize:   42,
    color:      colors.text,
    lineHeight: 44,
  },

  // ── Image frame ──
  imageFrame: {
    height:          240,
    borderRadius:    radius.lg,
    borderWidth:     2,
    borderColor:     colors.border,
    backgroundColor: colors.bgSecondary,
    overflow:        "hidden",
    alignItems:      "center",
    justifyContent:  "center",
  },
  preview: { width: "100%", height: "100%" },
  placeholder: {
    alignItems: "center",
    gap:        spacing.sm,
  },
  placeholderText: {
    fontFamily: fonts.body400,
    fontSize:   14,
    color:      colors.textLight,
  },

  // ── Pick buttons ──
  pickRow: {
    flexDirection: "row",
    gap:           spacing.md,
  },
  pickBtn: {
    flex:            1,
    flexDirection:   "row",
    alignItems:      "center",
    justifyContent:  "center",
    gap:             8,
    paddingVertical: 14,
    borderRadius:    radius.pill,
    borderWidth:     2,
    borderColor:     colors.border,
    backgroundColor: colors.bgSecondary,
  },
  pickBtnText: {
    fontFamily: fonts.body600,
    fontSize:   15,
    color:      colors.text,
  },

  // ── Analyse ──
  analyseBtn: {
    backgroundColor: colors.softPink,
    borderRadius:    radius.pill,
    borderWidth:     2,
    borderColor:     colors.softPinkBorder,
    paddingVertical: 16,
    alignItems:      "center",
  },
  analyseBtnText: {
    fontFamily: fonts.heading700,
    fontSize:   20,
    color:      colors.text,
  },
  analyzingRow: {
    flexDirection: "row",
    alignItems:    "center",
    justifyContent: "center",
    gap:           spacing.md,
    paddingVertical: spacing.md,
  },
  analyzingText: {
    fontFamily: fonts.body400,
    fontSize:   14,
    color:      colors.textMuted,
    fontStyle:  "italic",
  },

  // ── Result ──
  resultSection: { gap: spacing.md },
  resultName: {
    fontFamily: fonts.heading700,
    fontSize:   28,
    color:      colors.text,
    lineHeight: 32,
  },
  mealTypeLabel: {
    fontFamily: fonts.body600,
    fontSize:   13,
    color:      colors.textMuted,
    marginTop:  spacing.xs,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap:      "wrap",
    gap:           spacing.sm,
  },
  typeChip: {
    paddingHorizontal: 18,
    paddingVertical:   10,
    borderRadius:      20,
    borderWidth:       2,
    borderColor:       colors.border,
    backgroundColor:   colors.bgSecondary,
  },
  typeChipActive: {
    backgroundColor: colors.pastelBlue,
    borderColor:     colors.pastelBlueBorder,
  },
  typeChipText: {
    fontFamily: fonts.body600,
    fontSize:   14,
    color:      colors.textMuted,
  },
  typeChipTextActive: { color: colors.text },
  saveBtn: {
    backgroundColor: colors.softPink,
    borderRadius:    radius.pill,
    borderWidth:     2,
    borderColor:     colors.softPinkBorder,
    paddingVertical: 16,
    alignItems:      "center",
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: {
    fontFamily: fonts.heading700,
    fontSize:   20,
    color:      colors.text,
  },
});
