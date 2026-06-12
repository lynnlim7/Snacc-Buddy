import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { PaperBackground } from "../../components/PaperBackground";
import { useUserStore } from "../../stores/userStore";
import { useAuthStore } from "../../stores/authStore";
import { authApi } from "../../services/api";
import { colors, fonts, spacing, radius } from "../../constants/theme";

// ─── Option maps ──────────────────────────────────────────────

const GENDERS = [
  { value: "male",            label: "Male" },
  { value: "female",          label: "Female" },
  { value: "non-binary",      label: "Non-binary" },
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

  const initial = (
    (profile?.name?.trim()[0] ?? profile?.email?.[0] ?? "?")
  ).toUpperCase();

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
          <Text style={styles.heading}>You</Text>

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.bigAvatar}>
              <Text style={styles.bigAvatarText}>{initial}</Text>
            </View>
            <Text style={styles.emailText}>{profile?.email}</Text>
          </View>

          {/* Personal */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Personal</Text>
            <Field label="name"  value={name} onChangeText={setName} />
            <Field label="age"   value={age}  onChangeText={setAge}  keyboardType="numeric" />
          </View>

          {/* Body */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Body</Text>
            <Field label="height (cm)"          value={height}     onChangeText={setHeight}     keyboardType="decimal-pad" />
            <Field label="current weight (kg)"  value={weight}     onChangeText={setWeight}     keyboardType="decimal-pad" />
            <Field label="goal weight (kg)"     value={goalWeight} onChangeText={setGoalWeight} keyboardType="decimal-pad" />
          </View>

          {/* Gender */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Gender</Text>
            <View style={styles.chipWrap}>
              {GENDERS.map((g) => (
                <Chip
                  key={g.value}
                  label={g.label}
                  selected={gender === g.value}
                  onPress={() => setGender(g.value)}
                />
              ))}
            </View>
          </View>

          {/* Goal */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Goal</Text>
            <View style={styles.chipWrap}>
              {GOALS.map((g) => (
                <Chip
                  key={g.value}
                  label={g.label}
                  selected={goal === g.value}
                  onPress={() => setGoal(g.value)}
                />
              ))}
            </View>
          </View>

          {/* Lifestyle */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Lifestyle</Text>
            <View style={styles.chipWrap}>
              {LIFESTYLES.map((l) => (
                <Chip
                  key={l.value}
                  label={l.label}
                  selected={lifestyle === l.value}
                  onPress={() => setLifestyle(l.value)}
                />
              ))}
            </View>
          </View>

          {/* Save */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button"
          >
            {saving
              ? <ActivityIndicator color={colors.text} />
              : <Text style={styles.saveBtnText}>{saved ? "Saved!" : "Save changes"}</Text>
            }
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} accessibilityRole="button">
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

  // ── Avatar section ──
  avatarSection: {
    alignItems: "center",
    gap:        spacing.sm,
  },
  bigAvatar: {
    width:           80,
    height:          80,
    borderRadius:    40,
    backgroundColor: colors.softPink,
    borderWidth:     2,
    borderColor:     colors.softPinkBorder,
    alignItems:      "center",
    justifyContent:  "center",
  },
  bigAvatarText: {
    fontFamily: fonts.heading700,
    fontSize:   36,
    color:      colors.text,
  },
  emailText: {
    fontFamily: fonts.body400,
    fontSize:   14,
    color:      colors.textMuted,
  },

  // ── Sections ──
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    fontFamily:    fonts.body600,
    fontSize:      12,
    color:         colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // ── Fields ──
  field: {
    backgroundColor: colors.bgSecondary,
    borderRadius:    radius.md,
    borderWidth:     1.5,
    borderColor:     colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical:   12,
    gap:             4,
  },
  fieldLabel: {
    fontFamily: fonts.body500,
    fontSize:   11,
    color:      colors.textMuted,
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
    paddingHorizontal: 18,
    paddingVertical:   10,
    borderRadius:      radius.pill,
    borderWidth:       2,
    borderColor:       colors.border,
    backgroundColor:   colors.bgSecondary,
  },
  chipActive: {
    backgroundColor: colors.pastelBlue,
    borderColor:     colors.pastelBlueBorder,
  },
  chipText: {
    fontFamily: fonts.body600,
    fontSize:   14,
    color:      colors.textMuted,
  },
  chipTextActive: { color: colors.text },

  // ── Save button ──
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius:    radius.pill,
    borderWidth:     2,
    borderColor:     colors.accentBorder,
    paddingVertical: 16,
    alignItems:      "center",
    marginTop:       spacing.sm,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: {
    fontFamily: fonts.heading700,
    fontSize:   20,
    color:      colors.text,
  },

  // ── Logout ──
  logoutBtn: {
    alignItems:      "center",
    paddingVertical: 14,
    borderRadius:    radius.pill,
    borderWidth:     1.5,
    borderColor:     colors.border,
    backgroundColor: colors.bgSecondary,
  },
  logoutText: {
    fontFamily: fonts.body600,
    fontSize:   15,
    color:      colors.error,
  },
});
