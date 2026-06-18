/**
 * LineChart — lightweight area line chart with a goal dashed line.
 * Uses inline SVG on web. Falls back to the existing bar chart on native.
 */
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { colors, fonts, spacing } from "../constants/theme";

export interface ChartDataPoint {
  label: string;   // e.g. "Mon"
  value: number;
}

interface LineChartProps {
  data:        ChartDataPoint[];
  goal:        number;
  width:       number;
  height?:     number;
  lineColor?:  string;
  goalColor?:  string;
  fillColor?:  string;
}

const PAD_L = 36;   // left  — y-axis labels
const PAD_R = 8;
const PAD_T = 8;
const PAD_B = 28;   // bottom — x-axis labels

export function LineChart({
  data,
  goal,
  width,
  height = 180,
  lineColor  = "#9B5468",
  goalColor  = "#C49AA8",
  fillColor  = "rgba(155, 84, 104, 0.12)",
}: LineChartProps) {
  if (data.length === 0) return null;

  const chartW = width - PAD_L - PAD_R;
  const chartH = height - PAD_T - PAD_B;

  const values    = data.map((d) => d.value);
  const maxVal    = Math.max(...values, goal, 1);
  const minVal    = 0;
  const range     = maxVal - minVal;

  // ── Y-axis grid values ───────────────────────────────────────
  const gridSteps = 4;
  const gridYs: number[] = [];
  for (let i = 0; i <= gridSteps; i++) {
    gridYs.push(Math.round((maxVal / gridSteps) * i));
  }

  // ── Map data to SVG coordinates ──────────────────────────────
  function toX(i: number) {
    return PAD_L + (i / (data.length - 1)) * chartW;
  }
  function toY(val: number) {
    return PAD_T + chartH - ((val - minVal) / range) * chartH;
  }

  const points    = data.map((d, i) => ({ x: toX(i), y: toY(d.value) }));
  const polyline  = points.map((p) => `${p.x},${p.y}`).join(" ");
  const goalY     = toY(goal);

  // Closed area path (line + bottom of chart)
  const areaPath  =
    `M ${points[0].x},${toY(0)} ` +
    points.map((p) => `L ${p.x},${p.y}`).join(" ") +
    ` L ${points[points.length - 1].x},${toY(0)} Z`;

  if (Platform.OS !== "web") {
    // ── Native fallback: simple bar chart ──────────────────────
    return <NativeBarFallback data={data} goal={goal} maxVal={maxVal} height={height} />;
  }

  return (
    <View style={{ width, height }}>
      {(React as any).createElement(
        "svg",
        { width, height, viewBox: `0 0 ${width} ${height}`, style: { display: "block" } },

        // Grid lines + y-axis labels
        ...gridYs.map((gv) =>
          (React as any).createElement(
            "g",
            { key: `grid-${gv}` },
            (React as any).createElement("line", {
              x1: PAD_L, y1: toY(gv), x2: PAD_L + chartW, y2: toY(gv),
              stroke: "#E8DDD2", strokeWidth: 1,
            }),
            (React as any).createElement(
              "text",
              {
                x: PAD_L - 4, y: toY(gv) + 4,
                textAnchor: "end",
                fontSize: 9,
                fill: "#9B8578",
                fontFamily: "sans-serif",
              },
              gv >= 1000 ? `${Math.round(gv / 100) / 10}k` : String(gv)
            )
          )
        ),

        // Goal dashed line
        (React as any).createElement("line", {
          key: "goal",
          x1: PAD_L, y1: goalY, x2: PAD_L + chartW, y2: goalY,
          stroke: goalColor, strokeWidth: 1.5,
          strokeDasharray: "4 3",
        }),

        // Area fill
        (React as any).createElement("path", {
          key: "area",
          d: areaPath,
          fill: fillColor,
        }),

        // Line
        (React as any).createElement("polyline", {
          key: "line",
          points: polyline,
          fill: "none",
          stroke: lineColor,
          strokeWidth: 2,
          strokeLinejoin: "round",
          strokeLinecap: "round",
        }),

        // Dots on each data point
        ...points.map((p, i) =>
          (React as any).createElement("circle", {
            key: `dot-${i}`,
            cx: p.x, cy: p.y, r: 3,
            fill: lineColor,
          })
        ),

        // X-axis labels
        ...data.map((d, i) =>
          (React as any).createElement(
            "text",
            {
              key: `label-${i}`,
              x: toX(i), y: height - 8,
              textAnchor: "middle",
              fontSize: 10,
              fill: "#9B8578",
              fontFamily: "sans-serif",
            },
            d.label
          )
        )
      )}
    </View>
  );
}

// ── Native bar fallback ───────────────────────────────────────

function NativeBarFallback({
  data, goal, maxVal, height,
}: { data: ChartDataPoint[]; goal: number; maxVal: number; height: number }) {
  const TRACK_H   = height - PAD_B - PAD_T;
  const goalPct   = (goal / maxVal) * 100;

  return (
    <View style={{ height, paddingBottom: PAD_B }}>
      <View style={{ position: "relative", flex: 1 }}>
        {/* Goal line */}
        <View
          style={{
            position:        "absolute",
            left:             0, right: 0,
            bottom:           `${goalPct}%` as any,
            height:           1.5,
            borderTopWidth:   1.5,
            borderStyle:      "dashed",
            borderColor:      colors.primaryBorder,
            zIndex:           1,
          }}
        />
        {/* Bars */}
        <View style={{ flexDirection: "row", alignItems: "flex-end", flex: 1, gap: 4 }}>
          {data.map((d, i) => {
            const pct = maxVal > 0 ? (d.value / maxVal) * 100 : 0;
            return (
              <View key={i} style={{ flex: 1, height: "100%", justifyContent: "flex-end" }}>
                <View
                  style={{
                    height:          `${Math.max(pct, 3)}%` as any,
                    backgroundColor: colors.primaryBorder,
                    borderRadius:    6,
                  }}
                />
              </View>
            );
          })}
        </View>
      </View>
      {/* X labels */}
      <View style={{ flexDirection: "row", gap: 4, marginTop: 4 }}>
        {data.map((d, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            <Text style={styles.xLabel}>{d.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  xLabel: {
    fontFamily: fonts.body400,
    fontSize:   10,
    color:      colors.textMuted,
  },
});
