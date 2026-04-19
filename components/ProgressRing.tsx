import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";

interface ProgressRingProps {
  value: number;
  goal: number;
  onPress: () => void;
  color: string;
  icon: string;
  label: string;
  size?: number;
  unit?: string;
}

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
) {
  const start = polarToCartesian(cx, cy, r, endDeg);
  const end = polarToCartesian(cx, cy, r, startDeg);
  const largeArc = endDeg - startDeg <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export default function ProgressRing({
  value,
  unit,
  goal,
  onPress,
  color,
  icon,
  label,
  size = 160,
}: ProgressRingProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;
  const strokeWidth = size * 0.12;
  const progress = Math.min(value / goal, 1);

  // Arc goes from 220° to 320° (opens at bottom-right, like the screenshot)
  const START = -220;
  const TOTAL = 280;
  const endDeg = START + TOTAL * progress;

  const trackPath = arcPath(cx, cy, radius, START, START + TOTAL);
  const fillPath = progress > 0 ? arcPath(cx, cy, radius, START, endDeg) : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.container}
    >
      <Svg width={size} height={size}>
        {/* Track */}
        <Path
          d={trackPath}
          stroke="#E0E0E0"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
        {/* Fill */}
        {fillPath && (
          <Path
            d={fillPath}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
          />
        )}
      </Svg>

      {/* Center content */}
      <View style={[styles.center, { width: size, height: size }]}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.value}>
          {value}
          <Text style={styles.goal}>/{goal}</Text>
          {unit && <Text style={styles.unit}> {unit}</Text>}
        </Text>
      </View>

      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", marginVertical: 12 },
  center: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  icon: { fontSize: 28 },
  value: { fontSize: 18, fontWeight: "700", color: "#222" },
  unit: { fontSize: 11, fontWeight: "400", color: "#999" },
  goal: { fontSize: 13, fontWeight: "400", color: "#999" },
  label: { marginTop: 6, fontSize: 14, fontWeight: "600", color: "#444" },
});
