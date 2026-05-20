/**
 * Onboarding — "Getting everything ready" transition screen.
 * Auto-advances after a short delay with encouraging animation.
 */
import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { PaperBackground } from "../../components/PaperBackground";
import { colors, fonts, spacing } from "../../constants/theme";

const ENCOURAGING = [
  "Flipping through your diary..",
  "Finding the right pages..",
  "Sharpening the pencil..",
  "Getting things cosy..",
];

export default function GettingReadyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    dot1.value = withRepeat(
      withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    dot2.value = withDelay(
      200,
      withRepeat(withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }), -1, true)
    );
    dot3.value = withDelay(
      400,
      withRepeat(withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }), -1, true)
    );

    const timer = setTimeout(() => {
      router.replace({ pathname: "/onboarding/intro" as any, params });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const d1Style = useAnimatedStyle(() => ({ opacity: 0.3 + dot1.value * 0.7, transform: [{ translateY: -dot1.value * 4 }] }));
  const d2Style = useAnimatedStyle(() => ({ opacity: 0.3 + dot2.value * 0.7, transform: [{ translateY: -dot2.value * 4 }] }));
  const d3Style = useAnimatedStyle(() => ({ opacity: 0.3 + dot3.value * 0.7, transform: [{ translateY: -dot3.value * 4 }] }));

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.book}>📖</Text>
          <Text style={styles.header}>Getting everything ready</Text>
          <Text style={styles.sub}>
            Tell me a little about yourself so that I can support you better
          </Text>

          {/* Bouncing dots */}
          <View style={styles.dots}>
            <Animated.View style={[styles.dot, d1Style]} />
            <Animated.View style={[styles.dot, d2Style]} />
            <Animated.View style={[styles.dot, d3Style]} />
          </View>

          <Text style={styles.loading}>{ENCOURAGING[1]}</Text>
        </View>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  book: { fontSize: 64 },
  header: {
    fontFamily: fonts.heading700,
    fontSize: 36,
    color: colors.text,
    textAlign: "center",
    lineHeight: 40,
  },
  sub: {
    fontFamily: fonts.heading400,
    fontSize: 18,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 26,
  },
  dots: {
    flexDirection: "row",
    gap: 10,
    marginTop: spacing.md,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  loading: {
    fontFamily: fonts.body400,
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: "italic",
  },
});
