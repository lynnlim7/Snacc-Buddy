/**
 * Onboarding — "Getting everything ready" transition screen.
 * Auto-advances to intro after a brief animated delay.
 */
import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, {
  useAnimatedStyle, useSharedValue,
  withRepeat, withTiming, withDelay, Easing,
} from "react-native-reanimated";
import { PaperBackground } from "../../components/PaperBackground";
import { colors, fonts, spacing } from "../../constants/theme";

export default function GettingReadyScreen() {
  const router = useRouter();

  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const cfg = { duration: 600, easing: Easing.inOut(Easing.ease) };
    dot1.value = withRepeat(withTiming(1, cfg), -1, true);
    dot2.value = withDelay(200, withRepeat(withTiming(1, cfg), -1, true));
    dot3.value = withDelay(400, withRepeat(withTiming(1, cfg), -1, true));

    const timer = setTimeout(() => {
      router.replace("/onboarding/intro" as any);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const d1 = useAnimatedStyle(() => ({ opacity: 0.3 + dot1.value * 0.7, transform: [{ translateY: -dot1.value * 4 }] }));
  const d2 = useAnimatedStyle(() => ({ opacity: 0.3 + dot2.value * 0.7, transform: [{ translateY: -dot2.value * 4 }] }));
  const d3 = useAnimatedStyle(() => ({ opacity: 0.3 + dot3.value * 0.7, transform: [{ translateY: -dot3.value * 4 }] }));

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.header}>Getting everything ready</Text>
          <Text style={styles.sub}>
            Tell me a little about yourself so that I can support you better
          </Text>
          <View style={styles.dots}>
            <Animated.View style={[styles.dot, d1]} />
            <Animated.View style={[styles.dot, d2]} />
            <Animated.View style={[styles.dot, d3]} />
          </View>
          <Text style={styles.loading}>Flipping through your diary..</Text>
        </View>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl, gap: spacing.lg },
  header: { fontFamily: fonts.heading700, fontSize: 36, color: colors.text, textAlign: "center", lineHeight: 40 },
  sub: { fontFamily: fonts.heading400, fontSize: 18, color: colors.textMuted, textAlign: "center", lineHeight: 26 },
  dots: { flexDirection: "row", gap: 10, marginTop: spacing.md },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.softPink },
  loading: { fontFamily: fonts.body400, fontSize: 14, color: colors.textMuted, fontStyle: "italic" },
});
