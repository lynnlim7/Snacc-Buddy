/**
 * Final Welcome Screen — "Your diary is ready"
 */
import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, {
  useAnimatedStyle, useSharedValue,
  withDelay, withSpring, withTiming,
} from "react-native-reanimated";
import { PaperBackground } from "../../components/PaperBackground";
import { PillowButton } from "../../components/PillowButton";
import { useOnboardingStore } from "../../stores/onboardingStore";
import { colors, fonts, spacing } from "../../constants/theme";

export default function FinalWelcomeScreen() {
  const router = useRouter();
  const { name } = useOnboardingStore();

  const titleOpacity  = useSharedValue(0);
  const titleY        = useSharedValue(20);
  const subOpacity    = useSharedValue(0);
  const btnOpacity    = useSharedValue(0);

  useEffect(() => {
    titleOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    titleY.value       = withDelay(300, withSpring(0,  { damping: 20, stiffness: 200 }));
    subOpacity.value   = withDelay(600, withTiming(1,  { duration: 500 }));
    btnOpacity.value   = withDelay(900, withTiming(1,  { duration: 400 }));
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));
  const subStyle  = useAnimatedStyle(() => ({ opacity: subOpacity.value  }));
  const btnStyle  = useAnimatedStyle(() => ({ opacity: btnOpacity.value  }));

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Animated.Text style={[styles.header, titleStyle]}>
            {name ? `${name},\nyour diary is ready` : "Your diary\nis ready"}
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

        <Animated.View style={[styles.footer, btnStyle]}>
          <PillowButton
            label="Open my diary"
            onPress={() => router.replace("/(tabs)" as any)}
            variant="pink"
          />
        </Animated.View>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
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
  decoration: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  decorLine: { flex: 1, height: 1, backgroundColor: colors.border },
  decorText: { fontFamily: fonts.heading400, fontSize: 14, color: colors.textMuted },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
});
