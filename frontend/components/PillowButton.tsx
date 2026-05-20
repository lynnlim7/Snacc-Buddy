import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { colors, fonts, pillowButton, pillowButtonText, microcopy } from "../constants/theme";

type Variant = "accent" | "pink" | "matcha" | "outline";

interface PillowButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

/**
 * PillowButton — soft, rounded CTA button with a press-in spring animation.
 * Uses a hard offset shadow to give a physical "stamp" feel.
 */
export function PillowButton({
  label,
  onPress,
  variant = "accent",
  loading = false,
  disabled = false,
  fullWidth = true,
  icon,
}: PillowButtonProps) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  function handlePressIn() {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
    translateY.value = withSpring(2, { damping: 15, stiffness: 400 });
  }

  function handlePressOut() {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
    translateY.value = withSpring(0, { damping: 12, stiffness: 300 });
  }

  const isDisabled = disabled || loading;
  const btnStyle = pillowButton(variant);

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      activeOpacity={1}
      style={[
        animatedStyle,
        btnStyle,
        fullWidth && { alignSelf: "stretch" },
        isDisabled && styles.disabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <View style={styles.row}>
          <ActivityIndicator
            size="small"
            color={variant === "outline" ? colors.accent : colors.text}
          />
          <Text style={[pillowButtonText, styles.loadingText]}>
            {microcopy.loading}
          </Text>
        </View>
      ) : (
        <View style={styles.row}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text
            style={[
              pillowButtonText,
              variant === "outline" && { color: colors.textMuted },
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.5 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconWrap: { marginRight: 4 },
  loadingText: { fontSize: 14, color: colors.textMuted },
});
