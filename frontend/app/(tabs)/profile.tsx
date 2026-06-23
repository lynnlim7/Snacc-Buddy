/**
 * You Tab — profile + nutrition settings screen.
 * Figma design: profile header, weight/BMI card, calorie goal card
 * with goal-mode buttons, body stats section, save/logout.
 */
import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PaperBackground } from "../../components/PaperBackground";
import { useUserStore } from "../../stores/userStore";
import { useAuthStore } from "../../stores/authStore";
import { authApi } from "../../services/api";
import { computeBMI, computeNutritionTargets } from "../../utils/nutrition";
import { colors, fonts, spacing, radius } from "../../constants/theme";

// ─── Option maps ──────────────────────────────────────────────

const GENDERS = [
  { value: "male",              label: "Male" },
  { value: "female",            label: "Female" },
  { value: "non-binary",        label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];
const GOALS = [
  { value: "lose_weight",   label: "Lose weight" },
  { value: "lose_fat",      label: "Lose body fat" },
  { value: "gain_muscle",   label: "Gain muscle" },
  { value: "eat_healthier", label: "Eat healthier" },
];
const LIFESTYLES = [
  { value: "wfh",       label: "Work from home" },
  { value: "retired",   label: "Retired" },
  { value: "full_time", label: "Full-time office" },
  { value: "part_time", label: "Part-time work" },
  { value: "student",   label: "Student" },
  { value: "homemaker", label: "Homemaker" },
];

// BMI category badge — wine brand colour across all categories (monochrome, per Figma)
function bmiColor(_category: string): string {
  return "#7C0116";
}

// ─── Sub-components ───────────────────────────────────────────

function Chip({
  label, selected, onPress,
}: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.chipText, selected && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Field({
  label, value, onChangeText, keyboardType = "default",
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "default" | "numeric" | "decimal-pad";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor={colors.textLight}
        autoCapitalize="none"
      />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────

export default function ProfileScreen() {
  const router     = useRouter();
  const profile    = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);
  const clearAuth  = useAuthStore((s) => s.clear);
  const clearUser  = useUserStore((s) => s.clear);

  const [name,       setName]       = useState(profile?.name ?? "");
  const [age,        setAge]        = useState(profile?.age != null ? String(profile.age) : "");
  const [height,     setHeight]     = useState(profile?.height_cm != null ? String(profile.height_cm) : "");
  const [weight,     setWeight]     = useState(profile?.current_weight_kg != null ? String(profile.current_weight_kg) : "");
  const [goalWeight, setGoalWeight] = useState(profile?.goal_weight_kg != null ? String(profile.goal_weight_kg) : "");
  const [gender,     setGender]     = useState<string | null>(profile?.gender ?? null);
  const [goal,       setGoal]       = useState<string | null>(profile?.goal ?? null);
  const [lifestyle,  setLifestyle]  = useState<string | null>(profile?.lifestyle ?? null);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);

  // Sync form if profile loads after mount
  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? "");
    setAge(profile.age != null ? String(profile.age) : "");
    setHeight(profile.height_cm != null ? String(profile.height_cm) : "");
    setWeight(profile.current_weight_kg != null ? String(profile.current_weight_kg) : "");
    setGoalWeight(profile.goal_weight_kg != null ? String(profile.goal_weight_kg) : "");
    setGender(profile.gender);
    setGoal(profile.goal);
    setLifestyle(profile.lifestyle);
  }, [profile?.id]);

  const initial  = ((profile?.name?.trim()[0] ?? profile?.email?.[0] ?? "?")).toUpperCase();
  const targets  = computeNutritionTargets(profile);
  const bmi      = profile?.current_weight_kg && profile?.height_cm
    ? computeBMI(profile.current_weight_kg, profile.height_cm)
    : null;

  // BMI scale bar position (BMI 15–40 range → 0–100%)
  const bmiBarPct = bmi
    ? Math.max(0, Math.min(100, ((bmi.value - 15) / 25) * 100))
    : 0;


  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const updated = await authApi.updateProfile({
        name:              name.trim() || null,
        age:               age ? parseInt(age, 10) : null,
        height_cm:         height ? parseFloat(height) : null,
        current_weight_kg: weight ? parseFloat(weight) : null,
        goal_weight_kg:    goalWeight ? parseFloat(goalWeight) : null,
        gender,
        goal,
        lifestyle,
      });
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      Alert.alert("Couldn't save", "Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    clearAuth();
    clearUser();
    router.replace("/login");
  }

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Profile header ── */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile?.name ?? "Your Profile"}</Text>
              <Text style={styles.profileEmail}>{profile?.email}</Text>
            </View>
          </View>

          {/* ── Weight + BMI card ── */}
          {bmi && (
            <View style={styles.card}>
              <View>
                <Text style={styles.cardEyebrow}>BODY METRICS</Text>
                <Text style={styles.cardTitle}>Weight & BMI</Text>
              </View>

              <View style={styles.weightRow}>
                <View>
                  <Text style={styles.weightValue}>
                    {profile?.current_weight_kg?.toFixed(1)}
                    <Text style={styles.weightUnit}> kg</Text>
                  </Text>
                  <Text style={styles.weightLabel}>Current weight</Text>
                </View>
                {profile?.goal_weight_kg && (
                  <View style={styles.goalWeightPill}>
                    <Text style={styles.goalWeightText}>
                      Goal: {profile.goal_weight_kg}kg
                    </Text>
                  </View>
                )}
              </View>

              {/* BMI scale bar */}
              <View style={styles.bmiSection}>
                <View style={styles.bmiRow}>
                  <Text style={styles.bmiValue}>{bmi.value}</Text>
                  <View style={[styles.bmiCategoryBadge, { backgroundColor: bmiColor(bmi.category) + "33", borderColor: bmiColor(bmi.category) }]}>
                    <Text style={[styles.bmiCategoryText, { color: bmiColor(bmi.category) }]}>{bmi.category}</Text>
                  </View>
                </View>

                {/* Scale bar — light→dark wine gradient zones */}
                <View style={styles.bmiScaleTrack}>
                  <View style={[styles.bmiZone, { flex: 23, backgroundColor: "#F7D8E1" }]} />
                  <View style={[styles.bmiZone, { flex: 25, backgroundColor: "#E0A4B0" }]} />
                  <View style={[styles.bmiZone, { flex: 25, backgroundColor: "#C16B7C" }]} />
                  <View style={[styles.bmiZone, { flex: 27, backgroundColor: "#7C0116" }]} />
                  {/* Thumb */}
                  <View style={[styles.bmiThumb, { left: `${bmiBarPct}%` as any }]} />
                </View>
                <View style={styles.bmiScaleLabels}>
                  <Text style={styles.bmiScaleLabel}>15</Text>
                  <Text style={styles.bmiScaleLabel}>18.5</Text>
                  <Text style={styles.bmiScaleLabel}>25</Text>
                  <Text style={styles.bmiScaleLabel}>30</Text>
                  <Text style={styles.bmiScaleLabel}>40</Text>
                </View>
              </View>
            </View>
          )}

          {/* ── Calorie goal card ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Text style={styles.cardEyebrow}>NUTRITION TARGET</Text>
                <Text style={styles.cardTitle}>Daily Goal</Text>
              </View>
            </View>

            <View style={styles.calorieGoalRow}>
              <Text style={styles.calorieGoalValue}>{targets.calories.toLocaleString()}</Text>
              <Text style={styles.calorieGoalUnit}>kcal / day</Text>
            </View>

            {/* Macro breakdown */}
            <View style={styles.macroBreakdown}>
              {[
                { label: "Protein", value: Math.round(targets.protein_g), color: "#7C0116" },
                { label: "Carbs",   value: Math.round(targets.carbs_g),   color: "#E0A4B0" },
                { label: "Fat",     value: Math.round(targets.fat_g),      color: "#B85C6E" },
              ].map(({ label, value, color }) => (
                <View key={label} style={styles.macroBreakdownItem}>
                  <View style={[styles.macroBreakdownDot, { backgroundColor: color }]} />
                  <Text style={styles.macroBreakdownValue}>{value}g</Text>
                  <Text style={styles.macroBreakdownLabel}>{label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Body stats section ── */}
          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>BODY STATS</Text>
            <Text style={styles.cardTitle}>Measurements</Text>

            <View style={styles.statsGrid}>
              <Field label="height (cm)"         value={height}     onChangeText={setHeight}     keyboardType="decimal-pad" />
              <Field label="current weight (kg)" value={weight}     onChangeText={setWeight}     keyboardType="decimal-pad" />
              <Field label="goal weight (kg)"    value={goalWeight} onChangeText={setGoalWeight} keyboardType="decimal-pad" />
              <Field label="age"                 value={age}        onChangeText={setAge}         keyboardType="numeric"    />
            </View>
          </View>

          {/* ── Personal section ── */}
          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>PERSONAL</Text>
            <Text style={styles.cardTitle}>Profile Details</Text>

            <Field label="display name" value={name} onChangeText={setName} />

            <Text style={styles.subsectionLabel}>Gender</Text>
            <View style={styles.chipWrap}>
              {GENDERS.map((g) => (
                <Chip key={g.value} label={g.label} selected={gender === g.value} onPress={() => setGender(g.value)} />
              ))}
            </View>

            <Text style={styles.subsectionLabel}>Goal</Text>
            <View style={styles.chipWrap}>
              {GOALS.map((g) => (
                <Chip key={g.value} label={g.label} selected={goal === g.value} onPress={() => setGoal(g.value)} />
              ))}
            </View>

            <Text style={styles.subsectionLabel}>Lifestyle</Text>
            <View style={styles.chipWrap}>
              {LIFESTYLES.map((l) => (
                <Chip key={l.value} label={l.label} selected={lifestyle === l.value} onPress={() => setLifestyle(l.value)} />
              ))}
            </View>
          </View>

          {/* ── Save button ── */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button"
          >
            {saving
              ? <ActivityIndicator color="#FFFFFF" />
              : (
                <View style={styles.saveBtnInner}>
                  <Ionicons name="checkmark-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>{saved ? "Saved!" : "Save changes"}</Text>
                </View>
              )
            }
          </TouchableOpacity>

          {/* ── Logout ── */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} accessibilityRole="button">
            <Ionicons name="log-out-outline" size={16} color={colors.error} />
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </PaperBackground>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.lg,
    paddingBottom:     spacing.xxl,
    gap:               spacing.md,
  },

  // ── Profile header ──
  profileHeader: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           spacing.md,
    marginBottom:  spacing.sm,
  },
  avatarWrap: {
    width:           72,
    height:          72,
    borderRadius:    36,
    backgroundColor: colors.softPink,
    borderWidth:     2,
    borderColor:     colors.softPinkBorder,
    alignItems:      "center",
    justifyContent:  "center",
    flexShrink:      0,
    ...Platform.select({
      ios: {
        shadowColor:   colors.softPinkBorder,
        shadowOffset:  { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius:  6,
      },
      android: { elevation: 3 },
    }),
  },
  avatarText: {
    fontFamily: fonts.heading700,
    fontSize:   30,
    color:      colors.text,
  },
  profileInfo: {
    flex: 1,
    gap:  2,
  },
  profileName: {
    fontFamily: fonts.heading700,
    fontSize:   22,
    color:      colors.text,
    fontStyle:  "italic",
  },
  profileSubtitle: {
    fontFamily:    fonts.body600,
    fontSize:      11,
    color:         colors.primary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  profileEmail: {
    fontFamily: fonts.body400,
    fontSize:   12,
    color:      colors.textMuted,
    marginTop:  2,
  },

  // ── Card ──
  card: {
    backgroundColor: colors.bgCard,
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderColor:     colors.border,
    padding:         spacing.md,
    gap:             spacing.sm,
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
  cardHeader: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "flex-start",
  },
  cardHeaderLeft: { gap: 1 },
  cardEyebrow: {
    fontFamily:    fonts.body600,
    fontSize:      10,
    color:         colors.primary,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  cardTitle: {
    fontFamily: fonts.body700,
    fontSize:   16,
    color:      colors.text,
  },
  editIconBtn: {
    width:           30,
    height:          30,
    borderRadius:    15,
    backgroundColor: colors.primaryLight,
    alignItems:      "center",
    justifyContent:  "center",
    borderWidth:     1,
    borderColor:     colors.primaryBorder,
  },

  // ── Weight row ──
  weightRow: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "flex-end",
    marginTop:      spacing.xs,
  },
  weightValue: {
    fontFamily: fonts.body700,
    fontSize:   32,
    color:      colors.text,
  },
  weightUnit: {
    fontFamily: fonts.body400,
    fontSize:   16,
    color:      colors.textMuted,
  },
  weightLabel: {
    fontFamily: fonts.body400,
    fontSize:   11,
    color:      colors.textMuted,
  },
  goalWeightPill: {
    backgroundColor:  colors.primaryLight,
    borderRadius:     radius.pill,
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderWidth:      1,
    borderColor:      colors.primaryBorder,
  },
  goalWeightText: {
    fontFamily: fonts.body600,
    fontSize:   12,
    color:      colors.primary,
  },

  // ── BMI scale ──
  bmiSection: { gap: 6 },
  bmiRow: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           spacing.sm,
  },
  bmiValue: {
    fontFamily: fonts.body700,
    fontSize:   26,
    color:      colors.text,
  },
  bmiCategoryBadge: {
    borderRadius:      radius.pill,
    paddingHorizontal: 10,
    paddingVertical:   3,
    borderWidth:       1,
  },
  bmiCategoryText: {
    fontFamily: fonts.body600,
    fontSize:   12,
  },
  bmiScaleTrack: {
    flexDirection: "row",
    height:        10,
    borderRadius:  5,
    overflow:      "visible",
    position:      "relative",
  },
  bmiZone: {
    height: "100%",
  },
  bmiThumb: {
    position:        "absolute",
    top:             -3,
    width:           16,
    height:          16,
    borderRadius:    8,
    backgroundColor: colors.primary,
    marginLeft:      -8,
    borderWidth:     2,
    borderColor:     "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor:   colors.primary,
        shadowOffset:  { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius:  4,
      },
      android: { elevation: 4 },
    }),
  },
  bmiScaleLabels: {
    flexDirection:  "row",
    justifyContent: "space-between",
  },
  bmiScaleLabel: {
    fontFamily: fonts.body400,
    fontSize:   9,
    color:      colors.textMuted,
  },

  // ── Calorie goal ──
  calorieGoalRow: {
    flexDirection: "row",
    alignItems:    "baseline",
    gap:           spacing.xs,
    marginTop:     spacing.xs,
  },
  calorieGoalValue: {
    fontFamily: fonts.body700,
    fontSize:   40,
    color:      colors.text,
  },
  calorieGoalUnit: {
    fontFamily: fonts.body400,
    fontSize:   14,
    color:      colors.textMuted,
  },
  aiSuggestedBadge: {
    flexDirection:    "row",
    alignItems:       "center",
    gap:              4,
    backgroundColor:  colors.primaryLight,
    borderRadius:     radius.pill,
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderWidth:      1,
    borderColor:      colors.primaryBorder,
  },
  aiSuggestedText: {
    fontFamily: fonts.body600,
    fontSize:   10,
    color:      colors.primary,
  },

  // ── Macro breakdown ──
  macroBreakdown: {
    flexDirection: "row",
    gap:           spacing.md,
  },
  macroBreakdownItem: {
    alignItems: "center",
    gap:        3,
  },
  macroBreakdownDot: {
    width:        10,
    height:       10,
    borderRadius: 5,
  },
  macroBreakdownValue: {
    fontFamily: fonts.body700,
    fontSize:   15,
    color:      colors.text,
  },
  macroBreakdownLabel: {
    fontFamily: fonts.body400,
    fontSize:   10,
    color:      colors.textMuted,
  },

  // ── Stats grid ──
  statsGrid: {
    gap: spacing.sm,
  },

  // ── Subsection labels ──
  subsectionLabel: {
    fontFamily:    fonts.body600,
    fontSize:      11,
    color:         colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop:     spacing.xs,
  },

  // ── Fields ──
  field: {
    backgroundColor: colors.bg,
    borderRadius:    radius.md,
    borderWidth:     1,
    borderColor:     colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    gap:             4,
  },
  fieldLabel: {
    fontFamily:    fonts.body500,
    fontSize:      10,
    color:         colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldInput: {
    fontFamily: fonts.body600,
    fontSize:   16,
    color:      colors.text,
    padding:    0,
  },

  // ── Chips ──
  chipWrap: {
    flexDirection: "row",
    flexWrap:      "wrap",
    gap:           spacing.sm,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical:   8,
    borderRadius:      radius.pill,
    borderWidth:       1,
    borderColor:       colors.border,
    backgroundColor:   colors.bg,
  },
  chipActive: {
    backgroundColor: colors.primaryLight,
    borderColor:     colors.primaryBorder,
  },
  chipText: {
    fontFamily: fonts.body500,
    fontSize:   13,
    color:      colors.textMuted,
  },
  chipTextActive: {
    color:      colors.primary,
    fontFamily: fonts.body600,
  },

  // ── Save button ──
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius:    radius.pill,
    paddingVertical: 16,
    alignItems:      "center",
    justifyContent:  "center",
    marginTop:       spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor:   colors.primary,
        shadowOffset:  { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius:  8,
      },
      android: { elevation: 4 },
    }),
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnInner: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           spacing.sm,
  },
  saveBtnText: {
    fontFamily: fonts.body700,
    fontSize:   16,
    color:      "#FFFFFF",
  },

  // ── Logout ──
  logoutBtn: {
    flexDirection:   "row",
    alignItems:      "center",
    justifyContent:  "center",
    gap:             spacing.xs,
    paddingVertical: 14,
    borderRadius:    radius.pill,
    borderWidth:     1,
    borderColor:     colors.border,
    backgroundColor: colors.bgCard,
  },
  logoutText: {
    fontFamily: fonts.body600,
    fontSize:   14,
    color:      colors.error,
  },
});
