import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFoodStore } from "../../stores/foodStore";
import { NutritionSummary } from "../../components/NutritionSummary";
import { DailySummary } from "../../types/food";

export default function CameraScreen() {
  const { isAnalyzing, lastAnalyzed, analyzeImage } = useFoodStore();
  const [pickedUri, setPickedUri] = useState<string | null>(null);

  const pickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      setPickedUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Camera access is required to take food photos.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      setPickedUri(result.assets[0].uri);
    }
  };

  const handleAnalyze = async () => {
    if (!pickedUri) return;
    const log = await analyzeImage(pickedUri);
    if (!log) Alert.alert("Error", "Could not analyse the image. Please try again.");
  };

  const previewSummary: DailySummary | null = lastAnalyzed
    ? {
        date: new Date().toISOString().slice(0, 10),
        total_calories: lastAnalyzed.analysis.estimated_total_calories,
        total_protein_g: lastAnalyzed.analysis.macros.protein_g ?? 0,
        total_carbs_g: lastAnalyzed.analysis.macros.carbs_g ?? 0,
        total_fat_g: lastAnalyzed.analysis.macros.fat_g ?? 0,
        meal_count: 1,
      }
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Log Food</Text>

      <View style={styles.imageBox}>
        {pickedUri ? (
          <Image source={{ uri: pickedUri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <Text style={styles.placeholder}>No image selected</Text>
        )}
      </View>

      <View style={styles.row}>
        <Pressable style={[styles.btn, styles.secondary]} onPress={pickFromLibrary}>
          <Text style={styles.btnTextSecondary}>Library</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.secondary]} onPress={takePhoto}>
          <Text style={styles.btnTextSecondary}>Camera</Text>
        </Pressable>
      </View>

      {pickedUri && !isAnalyzing && (
        <Pressable style={[styles.btn, styles.primary]} onPress={handleAnalyze}>
          <Text style={styles.btnTextPrimary}>Analyse</Text>
        </Pressable>
      )}

      {isAnalyzing && <ActivityIndicator style={{ marginTop: 16 }} color="#16a34a" />}

      {lastAnalyzed && !isAnalyzing && (
        <View style={styles.result}>
          <Text style={styles.resultTitle}>{lastAnalyzed.analysis.food_name}</Text>
          {previewSummary && <NutritionSummary summary={previewSummary} compact />}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", padding: 16 },
  heading: { fontSize: 28, fontWeight: "700", color: "#111827", marginBottom: 16 },
  imageBox: {
    height: 240,
    borderRadius: 16,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 16,
  },
  preview: { width: "100%", height: "100%" },
  placeholder: { color: "#9ca3af", fontSize: 15 },
  row: { flexDirection: "row", gap: 12, marginBottom: 12 },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primary: { backgroundColor: "#16a34a" },
  secondary: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#d1d5db" },
  btnTextPrimary: { color: "#fff", fontWeight: "600", fontSize: 16 },
  btnTextSecondary: { color: "#374151", fontWeight: "600", fontSize: 16 },
  result: { marginTop: 16 },
  resultTitle: { fontSize: 20, fontWeight: "700", color: "#111827" },
  resultMeta: { fontSize: 14, color: "#6b7280", marginBottom: 8 },
});
