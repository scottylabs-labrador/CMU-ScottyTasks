import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { UI_COLORS, calculateLevelProgress } from "@/constants/gamification";

interface XPBarProps {
  totalXP: number;
  level: number;
  compact?: boolean;
}

export default function XPBar({ totalXP, level, compact = false }: XPBarProps) {
  const { current, max, pct } = calculateLevelProgress(totalXP);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactBadge}>
          <Text style={styles.compactLevelText}>{level}</Text>
        </View>
        <View style={styles.compactBarBg}>
          <View style={[styles.compactBarFill, { width: `${pct}%` }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.levelNumber}>{level}</Text>
      </View>

      <View style={styles.infoWrapper}>
        <View style={styles.labelRow}>
          <Text style={styles.levelLabel}>Level {level}</Text>
          <Text style={styles.xpLabel}>
            {current.toLocaleString()} / {max.toLocaleString()} XP
          </Text>
        </View>

        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${pct}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: UI_COLORS.cmuRed,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
    elevation: 3,
  },
  levelNumber: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  infoWrapper: {
    flex: 1,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  levelLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: UI_COLORS.textSecondary,
  },
  xpLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: UI_COLORS.cmuGold,
  },
  barBg: {
    height: 8,
    backgroundColor: UI_COLORS.bgElevated,
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: UI_COLORS.cmuRed,
    borderRadius: 4,
  },
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 100,
  },
  compactBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: UI_COLORS.cmuRed,
    justifyContent: "center",
    alignItems: "center",
  },
  compactLevelText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  compactBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: UI_COLORS.bgElevated,
    borderRadius: 3,
    overflow: "hidden",
  },
  compactBarFill: {
    height: "100%",
    backgroundColor: UI_COLORS.cmuRed,
    borderRadius: 3,
  },
});
