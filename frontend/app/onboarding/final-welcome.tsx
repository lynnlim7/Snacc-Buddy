/**
 * Final Welcome Screen — "Your diary is ready"
 * The celebratory end of onboarding.
 */
import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { PaperBackground } from "../../components/PaperBackground";
import { PillowButton } from "../../components/PillowButton";
import { colors, fonts, spacing } from "../../constants/theme";

const CONFETTI_ITEMS = ["🌿", "🍎", "🌸", "✨", "🥑", "🍋", "💛", "🌱"];

export default function FinalWelcomeScreen() {
  const router = useRouter();

  // Staggered entrance animations
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(20);
  const subOpacity = useSharedValue(0);
  const bookScale = useSharedValue(0.5);
  const bookOpacity = useSharedValue(0);

  useEffect(() => {
    bookScale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 200 }));
    bookOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    titleOpacity.value = withDelay(500, withTiming(1, { duration: 500 }));
    titleY.value = withDelay(500, withSpring(0, { damping: 20, stiffness: 200 }));
    subOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));
  }, []);

  const bookStyle = useAnimatedStyle(() => ({
    opacity: bookOpacity.value,
    transform: [{ scale: bookScale.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));
  const subStyle = useAnimatedStyle(() => ({
    opacity: subOpacity.value,
  }));

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        {/* Scattered confetti-like items */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {CONFETTI_ITEMS.map((item, i) => (
            <Text
              key={i}
              style={[
                styles.confetti,
                {
                  top: `${10 + (i * 11) % 75}%` as any,
                  left: i % 2 === 0
                    ? `${5 + (i * 13) % 25}%` as any
                    : undefined,
                  right: i % 2 !== 0
                    ? `${5 + (i * 13) % 25}%` as any
                    : undefined,
                  fontSize: 18 + (i % 3) * 6,
                  opacity: 0.25 + (i % 3) * 0.1,
                },
              ]}
            >
              {item}
            </Text>
          ))}
        </View>

        <View style={styles.content}>
          <Animated.Text style={[styles.bookEmoji, bookStyle]}>📖</Animated.Text>

          <Animated.Text style={[styles.header, titleStyle]}>
            Your diary{"\n"}is ready
          </Animated.Text>

          <Animated.Text style={[styles.sub, subStyle]}>
            Let's start building healthier habits together, one meal at a time
          </Animated.Text>

          <View style={styles.decoration}>
            <View style={styles.decorLine} />
            <Text style={styles.decorText}>your story starts here</Text>
            <View style={styles.decorLine} />
          </View>
        </View>

        <View style={styles.footer}>
          <PillowButton
            label="Open my diary"
            onPress={() => router.replace("/(tabs)")}
            variant="accent"
          />
        </View>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  confetti: { position: "absolute" },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  bookEmoji: { fontSize: 80 },
  header: {
    fontFamily: fonts.heading700,
    fontSize: 52,
    color: colors.text,
    lineHeight: 56,
    textAlign: "center",
  },
  sub: {
    fontFamily: fonts.heading400,
    fontSize: 20,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 30,
  },
  decoration: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  decorLine: { flex: 1, height: 1, backgroundColor: colors.border },
  decorText: { fontFamily: fonts.heading400, fontSize: 14, color: colors.textMuted },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
});
