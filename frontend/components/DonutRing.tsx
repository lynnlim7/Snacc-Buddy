/**
 * DonutRing — circular progress ring.
 *
 * Uses inline SVG on web (React Native Web lets React.createElement
 * pass SVG tags straight through to the DOM). Falls back to a thick
 * border ring on native.
 */
import React from "react";
import { Platform, View } from "react-native";

interface DonutRingProps {
  size?: number;
  strokeWidth?: number;
  /** 0.0 – 1.0 fill fraction */
  progress?: number;
  color?: string;
  bgColor?: string;
  children?: React.ReactNode;
}

export function DonutRing({
  size = 96,
  strokeWidth = 10,
  progress = 0,
  color = "#7C0116",
  bgColor = "#FCE2EA",
  children,
}: DonutRingProps) {
  const r             = (size - strokeWidth) / 2;
  const cx            = size / 2;
  const cy            = size / 2;
  const circumference = 2 * Math.PI * r;
  const clamped       = Math.min(1, Math.max(0, progress));
  const dashOffset    = circumference * (1 - clamped);

  return (
    <View
      style={{
        width:          size,
        height:         size,
        alignItems:     "center",
        justifyContent: "center",
      }}
    >
      {Platform.OS === "web" ? (
        // ── Web: true SVG arc ───────────────────────────────────
        <View
          style={{
            position: "absolute",
            width:    size,
            height:   size,
          }}
        >
          {(React as any).createElement(
            "svg",
            {
              width:   size,
              height:  size,
              viewBox: `0 0 ${size} ${size}`,
              style:   { position: "absolute", top: 0, left: 0 },
            },
            // Background ring
            (React as any).createElement("circle", {
              cx, cy, r,
              fill:        "none",
              stroke:      bgColor,
              strokeWidth,
            }),
            // Progress arc
            (React as any).createElement("circle", {
              cx, cy, r,
              fill:             "none",
              stroke:           color,
              strokeWidth,
              strokeDasharray:  circumference,
              strokeDashoffset: dashOffset,
              strokeLinecap:    "round",
              transform:        `rotate(-90 ${cx} ${cy})`,
            })
          )}
        </View>
      ) : (
        // ── Native: two-semicircle ring approximation ───────────
        <>
          {/* Full background ring */}
          <View
            style={{
              position:    "absolute",
              width:        size,
              height:       size,
              borderRadius: size / 2,
              borderWidth:  strokeWidth,
              borderColor:  bgColor,
            }}
          />
          {/* Filled half — approximation for native */}
          {clamped > 0 && (
            <View
              style={{
                position:    "absolute",
                width:        size,
                height:       size,
                borderRadius: size / 2,
                borderWidth:  strokeWidth,
                borderColor:  color,
                borderTopColor:   clamped < 0.25 ? "transparent" : color,
                borderRightColor: clamped < 0.5  ? "transparent" : color,
                borderBottomColor:clamped < 0.75 ? "transparent" : color,
              }}
            />
          )}
        </>
      )}

      {/* Centre content (calories label etc.) */}
      {children}
    </View>
  );
}
