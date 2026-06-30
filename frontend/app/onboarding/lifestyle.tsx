/**
 * Setup Step 7 — "What does your everyday life look like?"
 */
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { PaperBackground } from "../../components/PaperBackground";
import { PillowButton } from "../../components/PillowButton";
import { OnboardingHeader } from "../../components/OnboardingHeader";
import { useOnboardingStore } from "../../stores/onboardingStore";
import { colors, fonts, spacing, optionChip, optionChipText } from "../../constants/theme";

const LIFESTYLES = [
  { id: "student",   label: "Student"             },
  { id: "part_time", label: "Working part-time"   },
  { id: "full_time", label: "Working full-time"   },
  { id: "homemaker", label: "Stay-at-home parent" },
  { id: "retired",   label: "Retired"             },
];

export default function LifestyleScreen() {
  const router = useRouter();
  const { lifestyle, set } = useOnboardingStore();

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <OnboardingHeader step={9} total={16} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.header}>What does your everyday life look like?</Text>
          <Text style={styles.microcopy}>Your routine helps shape your recommendations</Text>

          <View style={styles.options}>
            {LIFESTYLES.map((l) => (
              <View key={l.id} style={[optionChip(lifestyle === l.id), styles.option]}>
                <Text
                  style={[optionChipText(lifestyle === l.id), styles.optionText]}
                  onPress={() => set({ lifestyle: l.id })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: lifestyle === l.id }}
                >
                  {l.label}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PillowButton
            label="Next"
            onPress={() => router.push("/onboarding/dietary" as any)}
            disabled={!lifestyle}
            variant="pink"
          />
        </View>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xl, gap: spacing.lg },
  header: { fontFamily: fonts.heading700, fontSize: 38, color: colors.text, lineHeight: 44 },
  microcopy: { fontFamily: fonts.body400, fontSize: 13, color: colors.textMuted, marginTop: -spacing.md },
  options: { gap: spacing.sm },
  option: { alignItems: "flex-start", paddingHorizontal: 20, paddingVertical: 16 },
  optionText: { fontSize: 16 },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
});
