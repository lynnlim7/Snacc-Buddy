import React from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "../constants/theme";

interface PaperBackgroundProps {
  children: React.ReactNode;
  style?: object;
  secondary?: boolean;
}

/**
 * PaperBackground — warm parchment-feel base for every screen.
 *
 * Simulates paper texture through:
 *   • Warm parchment base colour (#F8F3EA)
 *   • A very subtle noise overlay built from staggered micro-marks
 *     (for a true high-res grain, swap `GrainOverlay` for an
 *      ImageBackground with a repeating PNG/SVG texture asset)
 */
export function PaperBackground({
  children,
  style,
  secondary = false,
}: PaperBackgroundProps) {
  return (
    <View
      style={[
        styles.root,
        { backgroundColor: secondary ? colors.bgSecondary : colors.bg },
        style,
      ]}
    >
      {/* Grain overlay — approximates paper texture without an image asset */}
      <GrainOverlay />
      {children}
    </View>
  );
}

/**
 * Grain overlay: a 6×10 grid of tiny dots at varied opacity and position.
 * Subtle enough to feel like paper grain without being distracting.
 */
function GrainOverlay() {
  const dots = React.useMemo(() => {
    const items: { key: string; top: string; left: string; opacity: number; size: number }[] = [];
    const seed = [
      [8, 12, 0.04, 1.5], [23, 45, 0.03, 1],  [37, 78, 0.05, 1.5],
      [52, 20, 0.03, 1],  [61, 60, 0.04, 2],  [75, 33, 0.03, 1],
      [14, 88, 0.05, 1.5],[29, 5,  0.04, 1],  [43, 55, 0.03, 1.5],
      [58, 92, 0.04, 1],  [70, 40, 0.05, 2],  [85, 15, 0.03, 1],
      [6,  70, 0.04, 1],  [18, 30, 0.05, 1.5],[32, 65, 0.03, 1],
      [47, 10, 0.04, 1],  [63, 85, 0.03, 1.5],[79, 50, 0.04, 2],
      [11, 95, 0.05, 1],  [25, 38, 0.04, 1.5],[39, 72, 0.03, 1],
      [54, 25, 0.04, 1.5],[68, 58, 0.05, 1],  [82, 80, 0.03, 2],
      [16, 48, 0.04, 1],  [30, 18, 0.03, 1.5],[44, 90, 0.05, 1],
      [59, 35, 0.04, 2],  [73, 68, 0.03, 1],  [88, 5,  0.04, 1.5],
    ];
    seed.forEach(([top, left, opacity, size], i) => {
      items.push({
        key: `g${i}`,
        top: `${top}%`,
        left: `${left}%`,
        opacity: opacity as number,
        size: size as number,
      });
    });
    return items;
  }, []);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {dots.map((d) => (
        <View
          key={d.key}
          style={{
            position: "absolute",
            top: d.top as any,
            left: d.left as any,
            width: d.size,
            height: d.size,
            borderRadius: d.size,
            backgroundColor: "#4A4036",
            opacity: d.opacity,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
