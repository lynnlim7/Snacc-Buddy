/**
 * Onboarding Step 3 — "What's been on your mind lately?"
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

const MINDSETS = [
  { id: "body_comfort",   label: "I want to feel more comfortable in my body" },
  { id: "feel_healthier", label: "I want to feel healthier overall"            },
  { id: "gain_strength",  label: "I want to gain strength"                     },
  { id: "better_habits",  label: "I want better eating habits"                 },
  { id: "more_energy",    label: "I want more energy throughout the day"       },
  { id: "less_guilt",     label: "I want to eat without guilt"                 },
];

export default function MindsetScreen() {
  const router = useRouter();
  const { mindset, set } = useOnboardingStore();

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <OnboardingHeader step={2} total={16} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.header}>What's been on{"\n"}your mind lately?</Text>
          <Text style={styles.sub}>Pick what resonates most right now</Text>

          <View style={styles.options}>
            {MINDSETS.map((m) => (
              <View key={m.id} style={[optionChip(mindset === m.id), styles.option]}>
                <Text
                  style={[optionChipText(mindset === m.id), styles.optionText]}
                  onPress={() => set({ mindset: m.id })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: mindset === m.id }}
                >
                  {m.label}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PillowButton
            label="Next"
            onPress={() => router.push("/onboarding/getting-ready" as any)}
            disabled={!mindset}
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
  sub: { fontFamily: fonts.heading400, fontSize: 18, color: colors.textMuted, marginTop: -spacing.sm },
  options: { gap: spacing.sm },
  option: { alignItems: "flex-start", paddingHorizontal: 20, paddingVertical: 16 },
  optionText: { fontSize: 15, lineHeight: 22 },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
});
