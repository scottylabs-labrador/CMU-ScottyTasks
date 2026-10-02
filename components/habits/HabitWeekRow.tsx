import React, { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HabitItem } from "@/components/AddHabitModal";
import { UI_COLORS } from "@/constants/gamification";
import { fontSize, fontWeight, radii, spacing } from "@/constants/tokens";

export interface HabitWeekRowProps {
  habit: HabitItem;
  onToggleToday: (habit: HabitItem) => void;
  onEdit: (habit: HabitItem) => void;
  onDelete: (id: string) => void;
}

const DAYS_LABEL = ["M", "T", "W", "T", "F", "S", "S"] as const;

/**
 * HabitWeekRow
 *
 * Habit row displaying name, streak, edit/delete actions, and a 7-day completion matrix.
 */
function HabitWeekRowComponent({
  habit,
  onToggleToday,
  onEdit,
  onDelete,
}: HabitWeekRowProps) {
  return (
    <View style={styles.card}>
      {/* Top Header */}
      <View style={styles.cardTop}>
        <View style={styles.habitTitleRow}>
          <Text style={styles.habitEmoji}>{habit.emoji}</Text>
          <Text style={styles.habitTitle} numberOfLines={1}>
            {habit.title}
          </Text>
        </View>

        <View style={styles.cardActions}>
          <Text style={[styles.cardStreak, { color: habit.color }]}>
            🔥 {habit.streak}d
          </Text>
          <TouchableOpacity
            onPress={() => onEdit(habit)}
            style={styles.iconBtn}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil" size={14} color={UI_COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(habit.id)}
            style={styles.iconBtn}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={14} color={UI_COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 7 Days Matrix */}
      <View style={styles.daysRow}>
        {DAYS_LABEL.map((day, idx) => {
          const isDone = Boolean(habit.weekProgress?.[idx]);
          const isToday = idx === DAYS_LABEL.length - 1;

          return (
            <TouchableOpacity
              key={idx}
              style={styles.dayCol}
              onPress={() => {
                if (isToday) onToggleToday(habit);
              }}
              disabled={!isToday}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayLabel,
                  isToday && styles.dayLabelToday,
                ]}
              >
                {day}
              </Text>
              <View
                style={[
                  styles.dayDot,
                  isDone && { backgroundColor: habit.color },
                  isToday && !isDone && [
                    styles.todayEmptyDot,
                    { borderColor: habit.color },
                  ],
                ]}
              >
                {isDone && (
                  <Ionicons name="checkmark" size={10} color={UI_COLORS.textOnAccent} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "transparent",
    borderColor: UI_COLORS.border,
    padding: spacing.lg + 2, // 14px
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: UI_COLORS.border,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  habitTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: spacing.md,
  },
  habitEmoji: {
    fontSize: fontSize.xl, // 15px
    marginRight: spacing.md,
  },
  habitTitle: {
    fontSize: fontSize.lg, // 14px
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textPrimary,
    flex: 1,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  cardStreak: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.extrabold,
  },
  iconBtn: {
    padding: spacing.xs,
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayCol: {
    alignItems: "center",
    gap: spacing.sm,
  },
  dayLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textMuted,
  },
  dayLabelToday: {
    color: UI_COLORS.textPrimary,
    fontWeight: fontWeight.extrabold,
  },
  dayDot: {
    width: 24,
    height: 24,
    borderRadius: radii.md,
    backgroundColor: UI_COLORS.bgSubtle,
    justifyContent: "center",
    alignItems: "center",
  },
  todayEmptyDot: {
    borderWidth: 1.5,
    backgroundColor: "transparent",
  },
});

export default memo(HabitWeekRowComponent);
