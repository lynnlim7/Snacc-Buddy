/**
 * Setup Step 6 — "What pace feels right for you?"
 * Custom horizontal snap-slider — three labelled positions.
 * Matches the landing-page colour palette.
 */
import React, { useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, Dimensions,
  PanResponder, Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { PaperBackground } from "../../components/PaperBackground";
import { PillowButton } from "../../components/PillowButton";
import { OnboardingHeader } from "../../components/OnboardingHeader";
import { useOnboardingStore } from "../../stores/onboardingStore";
import { colors, fonts, spacing } from "../../constants/theme";

const { width: SCREEN_W } = Dimensions.get("window");
const TRACK_H_PADDING = spacing.xl;  // horizontal padding each side
const TRACK_W = SCREEN_W - TRACK_H_PADDING * 2;
const THUMB_SIZE = 28;
const TRACK_HEIGHT = 10;

const PACES = [
  { id: "slow",     label: "Slowly but surely"      },
  { id: "moderate", label: "Somewhere in the middle" },
  { id: "fast",     label: "As fast as possible"     },
] as const;

type PaceId = typeof PACES[number]["id"];

/** Convert pace id → fraction (0, 0.5, 1) */
function paceToFraction(id: PaceId): number {
  return id === "slow" ? 0 : id === "moderate" ? 0.5 : 1;
}

/** Convert x-position → nearest pace id */
function xToPace(x: number): PaceId {
  const frac = x / (TRACK_W - THUMB_SIZE);
  if (frac < 0.33) return "slow";
  if (frac < 0.67) return "moderate";
  return "fast";
}

/** Snap x to one of the three positions */
function snapX(pace: PaceId): number {
  return paceToFraction(pace) * (TRACK_W - THUMB_SIZE);
}

export default function PaceScreen() {
  const router = useRouter();
  const { pace, set } = useOnboardingStore();
  const currentPace = (["slow", "moderate", "fast"].includes(pace) ? pace : "moderate") as PaceId;

  // Animated value for thumb x position
  const translateX = useRef(new Animated.Value(snapX(currentPace))).current;
  // Track live pace id during drag (non-state, no re-render on every px)
  const liveRef = useRef<PaceId>(currentPace);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Stop any in-progress spring
        translateX.stopAnimation();
      },
      onPanResponderMove: (_, { dx }) => {
        const base = snapX(liveRef.current);
        const next = Math.max(0, Math.min(TRACK_W - THUMB_SIZE, base + dx));
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, { dx }) => {
        const base = snapX(liveRef.current);
        const raw  = Math.max(0, Math.min(TRACK_W - THUMB_SIZE, base + dx));
        const snapped = xToPace(raw);
        liveRef.current = snapped;
        set({ pace: snapped });
        Animated.spring(translateX, {
          toValue: snapX(snapped),
          useNativeDriver: true,
          tension: 120,
          friction: 10,
        }).start();
      },
    })
  ).current;

  function handleNext() {
    router.push("/onboarding/lifestyle" as any);
  }

  // Derive fill width from thumb position
  const fillWidth = Animated.add(translateX, THUMB_SIZE / 2);

  return (
    <PaperBackground>
      <SafeAreaView style={styles.safe}>
        <OnboardingHeader step={8} total={16} />

        <View style={styles.content}>
          <Text style={styles.title}>What pace feels{"\n"}right for you?</Text>
          <Text style={styles.sub}>There's no rush — choose what feels sustainable</Text>

          {/* ── Slider ── */}
          <View style={styles.sliderSection}>
            {/* Track */}
            <View style={styles.trackContainer}>
              {/* Background track */}
              <View style={styles.trackBg} />

              {/* Fill */}
              <Animated.View
                style={[
                  styles.trackFill,
                  { width: fillWidth },
                ]}
              />

              {/* Thumb — draggable */}
              <Animated.View
                style={[
                  styles.thumb,
                  { transform: [{ translateX }] },
                ]}
                {...panResponder.panHandlers}
              />
            </View>

            {/* Tick marks */}
            <View style={styles.ticks}>
              {PACES.map((p) => (
                <View
                  key={p.id}
                  style={[
                    styles.tick,
                    { left: snapX(p.id) + THUMB_SIZE / 2 - 1 },
                  ]}
                />
              ))}
            </View>

            {/* Current label */}
            <CurrentLabel translateX={translateX} />
          </View>
        </View>

        <View style={styles.footer}>
          <PillowButton label="Next" onPress={handleNext} variant="pink" />
        </View>
      </SafeAreaView>
    </PaperBackground>
  );
}

/** Shows the label of whichever snap position the thumb is nearest to. */
function CurrentLabel({ translateX }: { translateX: Animated.Value }) {
  // We derive the label string by listening to the animated value
  const [label, setLabel] = React.useState<string>(
    PACES.find((p) => p.id === "moderate")!.label
  );

  React.useEffect(() => {
    const id = translateX.addListener(({ value }) => {
      const pace = xToPace(value);
      setLabel(PACES.find((p) => p.id === pace)!.label);
    });
    return () => translateX.removeListener(id);
  }, [translateX]);

  return <Text style={styles.paceLabel}>{label}</Text>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: TRACK_H_PADDING,
    paddingTop: spacing.lg,
    gap: spacing.xl,
  },
  title: {
    fontFamily: fonts.heading700,
    fontSize: 38,
    color: colors.text,
    lineHeight: 44,
  },
  sub: {
    fontFamily: fonts.heading400,
    fontSize: 18,
    color: colors.textMuted,
    marginTop: -spacing.md,
  },

  sliderSection: {
    gap: spacing.lg,
    paddingTop: spacing.xl,
  },

  trackContainer: {
    height: THUMB_SIZE,
    justifyContent: "center",
  },
  trackBg: {
    position: "absolute",
    left: THUMB_SIZE / 2,
    right: THUMB_SIZE / 2,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: colors.border,
  },
  trackFill: {
    position: "absolute",
    left: THUMB_SIZE / 2,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: colors.softPink,
    // fillWidth is absolute, so cap it
    maxWidth: TRACK_W - THUMB_SIZE / 2,
  },
  thumb: {
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.softPink,
    borderWidth: 2.5,
    borderColor: colors.softPinkBorder,
    // iOS shadow
    shadowColor: colors.softPinkBorder,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },

  ticks: {
    position: "relative",
    height: 6,
    marginTop: -spacing.xs,
  },
  tick: {
    position: "absolute",
    width: 2,
    height: 6,
    borderRadius: 1,
    backgroundColor: colors.border,
    top: 0,
  },

  paceLabel: {
    fontFamily: fonts.heading600,
    fontSize: 22,
    color: colors.text,
    textAlign: "center",
    marginTop: spacing.sm,
  },

  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
});
