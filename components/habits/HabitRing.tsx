import React, { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { HabitItem } from "@/components/AddHabitModal";
import { UI_COLORS } from "@/constants/gamification";
import { fontSize, fontWeight, radii, spacing } from "@/constants/tokens";

export interface HabitRingProps {
  habit: HabitItem;
  onToggle: (habit: HabitItem) => void;
}

/**
 * HabitRing
 *
 * Tap-to-complete habit ring displaying habit emoji, title, and current streak.
 */
function HabitRingComponent({ habit, onToggle }: HabitRingProps) {
  return (
    <TouchableOpacity
      style={styles.ringItem}
      onPress={() => onToggle(habit)}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.ringCircle,
          { borderColor: habit.color },
          habit.completedToday && {
            backgroundColor: `${habit.color}30`,
            borderColor: UI_COLORS.xpGreen,
          },
        ]}
      >
        <Text style={styles.ringEmoji}>
          {habit.completedToday ? "✅" : habit.emoji}
        </Text>
      </View>

      <Text style={styles.ringTitle} numberOfLines={1}>
        {habit.title}
      </Text>

      <View
        style={[
          styles.ringStreakBadge,
          { backgroundColor: `${habit.color}25` },
        ]}
      >
        <Text style={[styles.ringStreakText, { color: habit.color }]}>
          🔥 {habit.streak}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  ringItem: {
    alignItems: "center",
    width: 72,
    marginRight: spacing.md + 2, // 10px
  },
  ringCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2.5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: UI_COLORS.bgCard,
    marginBottom: spacing.sm,
  },
  ringEmoji: {
    fontSize: fontSize.title, // 22px
  },
  ringTitle: {
    fontSize: fontSize.sm, // 11px
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textPrimary,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  ringStreakBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  ringStreakText: {
    fontSize: fontSize.xs, // 10px
    fontWeight: fontWeight.extrabold,
  },
});

export default memo(HabitRingComponent);
