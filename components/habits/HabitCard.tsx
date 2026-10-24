import React, { memo, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { HabitItem } from "@/constants/habits";
import { UI_COLORS } from "@/constants/gamification";
import { fontSize, fontWeight, shadows, spacing } from "@/constants/tokens";
import { localDateKey } from "@/utils/taskDates";
import {
  DAY_LABELS_SHORT,
  calculateCompletionRate,
  calculateStreak,
  formatFrequencyLabel,
  getDayNumericValue,
  getDayProgressRatio,
  getLast7Days,
  isDateScheduled,
  isDayCompleted,
} from "@/utils/habitLogic";

export interface HabitCardProps {
  habit: HabitItem;
  today: Date;
  onPressDay: (habit: HabitItem, dateKey: string) => void;
  onOpenCalendar: (habit: HabitItem) => void;
  onOpenStats: (habit: HabitItem) => void;
  onOpenActions: (habit: HabitItem) => void;
}

/**
 * HabitCard
 *
 * Displays a habit's title, frequency badge, category icon badge, interactive 7-day
 * rolling calendar strip, current streak, completion percentage, and quick action icons.
 */
function HabitCardComponent({
  habit,
  today,
  onPressDay,
  onOpenCalendar,
  onOpenStats,
  onOpenActions,
}: HabitCardProps) {
  const last7Days = useMemo(() => getLast7Days(today), [today]);
  const todayKey = useMemo(() => localDateKey(today), [today]);
  const frequencyText = useMemo(
    () => formatFrequencyLabel(habit.frequency),
    [habit.frequency]
  );
  const streak = useMemo(() => calculateStreak(habit, today), [habit, today]);
  const completionRate = useMemo(
    () => calculateCompletionRate(habit, today),
    [habit, today]
  );

  const todayNumericVal =
    habit.evaluationType === "numeric"
      ? getDayNumericValue(habit, todayKey)
      : undefined;

  return (
    <View style={[styles.card, habit.archived && styles.cardArchived]}>
      {/* Top Row: Title + Frequency Pill + Category Icon Square */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.headerTextCol}
          activeOpacity={0.75}
          onPress={() => onPressDay(habit, todayKey)}
        >
          <Text style={styles.habitTitle} numberOfLines={1}>
            {habit.title}
          </Text>

          <View style={styles.badgeRow}>
            <View
              style={[
                styles.freqBadge,
                { backgroundColor: `${habit.color}1E` },
              ]}
            >
              <Text style={[styles.freqBadgeText, { color: habit.color }]}>
                {frequencyText}
              </Text>
            </View>

            {habit.evaluationType === "numeric" && (
              <View style={styles.goalBadge}>
                <Text style={styles.goalBadgeText}>
                  {todayNumericVal ?? 0}/{habit.goal} {habit.unit}
                </Text>
              </View>
            )}

            {habit.archived && (
              <View style={styles.archivedBadge}>
                <Text style={styles.archivedBadgeText}>Archived</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.categoryIconBox, { backgroundColor: habit.color }]}
          activeOpacity={0.8}
          onPress={() => onOpenStats(habit)}
          accessibilityRole="button"
          accessibilityLabel={`${habit.title} statistics`}
        >
          <Ionicons
            name={habit.icon as keyof typeof Ionicons.glyphMap}
            size={20}
            color={UI_COLORS.textOnAccent}
          />
        </TouchableOpacity>
      </View>

      {/* Middle Row: 7-Day Rolling Calendar Strip */}
      <View style={styles.weekStrip}>
        {last7Days.map((date, idx) => {
          const dateKey = localDateKey(date);
          const isToday = idx === last7Days.length - 1;
          const completed = isDayCompleted(habit, dateKey);
          const progressRatio = getDayProgressRatio(habit, dateKey);
          const hasPartial = !completed && progressRatio > 0;
          const scheduled = isDateScheduled(habit, date);

          return (
            <TouchableOpacity
              key={dateKey}
              style={styles.dayColumn}
              activeOpacity={0.7}
              onPress={() => onPressDay(habit, dateKey)}
              accessibilityRole="button"
              accessibilityLabel={`${DAY_LABELS_SHORT[date.getDay()]} ${date.getDate()}, ${
                completed ? "completed" : "not completed"
              }`}
            >
              <Text
                style={[
                  styles.dayOfWeekText,
                  isToday && styles.dayOfWeekToday,
                ]}
              >
                {DAY_LABELS_SHORT[date.getDay()]}
              </Text>

              <View
                style={[
                  styles.dateCapsule,
                  !scheduled && !completed && styles.dateCapsuleUnscheduled,
                  scheduled && !completed && !isToday && styles.dateCapsuleScheduled,
                  hasPartial && {
                    backgroundColor: `${habit.color}14`,
                    borderWidth: 1.5,
                    borderColor: `${habit.color}88`,
                  },
                  isToday && !completed && [
                    styles.dateCapsuleTodayPending,
                    hasPartial && { borderColor: habit.color },
                  ],
                  completed && !isToday && {
                    backgroundColor: `${habit.color}22`,
                    borderWidth: 2,
                    borderColor: habit.color,
                  },
                  completed && isToday && {
                    backgroundColor: habit.color,
                    borderWidth: 2,
                    borderColor: habit.color,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dateNumText,
                    !scheduled && !completed && styles.dateNumUnscheduled,
                    isToday && !completed && styles.dateNumTodayPending,
                    completed && !isToday && {
                      color: habit.color,
                      fontWeight: fontWeight.extrabold,
                    },
                    completed && isToday && {
                      color: UI_COLORS.textOnAccent,
                      fontWeight: fontWeight.extrabold,
                    },
                  ]}
                >
                  {date.getDate()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Full-Width Card Divider */}
      <View style={styles.divider} />

      {/* Bottom Row: Streak & Completion % on Left, Calendar / Stats / Menu on Right */}
      <View style={styles.footerRow}>
        <View style={styles.metricsGroup}>
          <View style={styles.metricItem}>
            <Ionicons name="link-outline" size={16} color={habit.color} />
            <Text style={styles.metricValue}>{streak}</Text>
          </View>

          <View style={styles.metricItem}>
            <Ionicons
              name="checkmark-circle-outline"
              size={16}
              color={habit.color}
            />
            <Text style={styles.metricValue}>
              {completionRate === null ? "-" : `${completionRate}%`}
            </Text>
          </View>
        </View>

        <View style={styles.actionsGroup}>
          <TouchableOpacity
            style={styles.footerIconBtn}
            onPress={() => onOpenCalendar(habit)}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Open calendar for ${habit.title}`}
          >
            <Ionicons
              name="calendar-outline"
              size={19}
              color={UI_COLORS.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.footerIconBtn}
            onPress={() => onOpenStats(habit)}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Open statistics for ${habit.title}`}
          >
            <Ionicons
              name="bar-chart-outline"
              size={18}
              color={UI_COLORS.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.footerIconBtn}
            onPress={() => onOpenActions(habit)}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`More options for ${habit.title}`}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={18}
              color={UI_COLORS.textMuted}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingTop: 15,
    paddingHorizontal: spacing.xl,
    paddingBottom: 11,
    marginBottom: spacing.lg + 2,
    ...shadows.card,
  },
  cardArchived: {
    opacity: 0.85,
    backgroundColor: UI_COLORS.bgSubtle,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTextCol: {
    flex: 1,
    paddingRight: spacing.md,
  },
  habitTitle: {
    fontSize: 17,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: 5,
  },
  freqBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  freqBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  goalBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: UI_COLORS.bgSubtle,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
  },
  goalBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textSecondary,
  },
  archivedBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: UI_COLORS.bgElevated,
  },
  archivedBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textMuted,
  },
  categoryIconBox: {
    width: 40,
    height: 40,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  weekStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 15,
  },
  dayColumn: {
    alignItems: "center",
    gap: 6,
  },
  dayOfWeekText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: UI_COLORS.textMuted,
  },
  dayOfWeekToday: {
    color: UI_COLORS.textPrimary,
    fontWeight: fontWeight.extrabold,
  },
  dateCapsule: {
    width: 38,
    height: 40,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: UI_COLORS.bgSubtle,
  },
  dateCapsuleUnscheduled: {
    backgroundColor: UI_COLORS.bgWarm,
  },
  dateCapsuleScheduled: {
    backgroundColor: UI_COLORS.bgSubtle,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
  },
  dateCapsuleTodayPending: {
    backgroundColor: UI_COLORS.bgCard,
    borderWidth: 2,
    borderColor: UI_COLORS.textPrimary,
  },
  dateNumText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: UI_COLORS.textSecondary,
  },
  dateNumUnscheduled: {
    color: UI_COLORS.borderLight,
  },
  dateNumTodayPending: {
    color: UI_COLORS.textPrimary,
    fontWeight: fontWeight.extrabold,
  },
  divider: {
    height: 1,
    backgroundColor: UI_COLORS.border,
    marginHorizontal: -spacing.xl,
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metricValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textPrimary,
  },
  actionsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  footerIconBtn: {
    padding: 3,
  },
});

export default memo(HabitCardComponent);
