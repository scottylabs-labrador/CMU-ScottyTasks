import { Text } from "@/components/ScottyText";
import React, { memo, useMemo } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { PressableScale, WaveItem } from "@/components/ui/Motion";
import type { HabitItem } from "@/constants/habits";
import { UI_COLORS } from "@/constants/gamification";
import { fontSize, fontWeight, shadows, spacing } from "@/constants/tokens";
import { localDateKey } from "@/utils/taskDates";
import {
  calculateCompletionRate,
  calculateStreak,
  formatFrequencyLabel,
  getDayNumericValue,
  getDayProgressRatio,
  isDayCompleted,
} from "@/utils/habitLogic";

export interface HabitCardProps {
  habit: HabitItem;
  today: Date;
  selectedDate: Date;
  onPressDay: (habit: HabitItem, dateKey: string) => void;
  onOpenCalendar: (habit: HabitItem) => void;
  onOpenStats: (habit: HabitItem) => void;
  onOpenActions: (habit: HabitItem) => void;
  compact?: boolean;
  index?: number;
  waveKey?: string | number;
}

/**
 * HabitCard
 *
 * Shows the selected day’s progress, streak, completion rate, and quick actions.
 */
function HabitCardComponent({
  habit,
  today,
  selectedDate,
  onPressDay,
  onOpenCalendar,
  onOpenStats,
  onOpenActions,
  compact = false,
  index = 0,
  waveKey = "habits",
}: HabitCardProps) {
  const selectedKey = localDateKey(selectedDate);
  const isToday = selectedKey === localDateKey(today);
  const isFuture = selectedKey > localDateKey(today);
  const progressLabel = isToday ? "Today’s progress" : selectedDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const frequencyText = useMemo(
    () => formatFrequencyLabel(habit.frequency),
    [habit.frequency]
  );
  const streak = useMemo(() => calculateStreak(habit, selectedDate), [habit, selectedDate]);
  const completionRate = useMemo(
    () => calculateCompletionRate(habit, selectedDate),
    [habit, selectedDate]
  );

  const dayValue =
    habit.evaluationType === "numeric"
      ? getDayNumericValue(habit, selectedKey)
      : undefined;

  const dayCompleted = isDayCompleted(habit, selectedKey);
  const dayProgress = getDayProgressRatio(habit, selectedKey);
  const dayPercent = dayCompleted ? 100 : Math.min(99, Math.round(dayProgress * 100));
  const dayGoal = habit.history[selectedKey]?.goal === null
    ? null : habit.history[selectedKey]?.goal ?? habit.goal;
  const progressSummary = habit.evaluationType === "numeric"
    ? dayGoal === null
      ? `${dayValue ?? 0} ${habit.unit} logged`
      : `${dayValue ?? 0} / ${dayGoal} ${habit.unit}`
    : dayCompleted ? "Completed" : "Not yet completed";
  const progressAction = isFuture ? "Available on this date"
    : habit.evaluationType === "numeric"
    ? isToday ? `Tap to add ${habit.step} ${habit.unit}` : "Tap to edit this day"
    : dayCompleted ? "Tap to undo check-in" : "Tap to check in";

  const progressDog = (
        <View style={[styles.scottyProgress, compact && styles.compactDog]} pointerEvents="none">
          <View style={styles.scottyCanvas}>
            <Image
              source={require("@/assets/images/scotty-logo-main.png")}
              style={[styles.scottyImage, { tintColor: "#D8D8D8" }]}
              resizeMode="contain"
              accessible={false}
            />
            <Image
              source={require("@/assets/images/scotty-logo-main.png")}
              style={[styles.scottyImage, { opacity: 0.25 }]}
              resizeMode="contain"
              accessible={false}
            />
            <View style={[styles.scottyFill, { height: `${dayProgress * 100}%` }]}>
              <Image
                source={require("@/assets/images/scotty-logo-main.png")}
                style={[styles.scottyImage, { tintColor: habit.color }]}
                resizeMode="contain"
                accessible={false}
              />
              {/* Keep Scotty's face and linework visible over the color. */}
              <Image
                source={require("@/assets/images/scotty-logo-main.png")}
                style={[styles.scottyImage, { opacity: 0.55 }]}
                resizeMode="contain"
                accessible={false}
              />
            </View>
          </View>
          {compact && <Text variant="heading" style={styles.compactTitle} numberOfLines={2}>{habit.title}</Text>}
          <Text variant="body" style={styles.scottyTotal}>
            {habit.evaluationType === "numeric" ? progressSummary : dayCompleted ? "Done!" : "Not yet"}
          </Text>
        </View>
  );

  if (compact) {
    return (
      <View style={[styles.compactHabit, habit.archived && { opacity: 0.65 }]}>
        <PressableScale style={styles.compactMenu} onPress={() => onOpenActions(habit)} accessibilityRole="button" accessibilityLabel={`More options for ${habit.title}`}>
          <Ionicons name="ellipsis-horizontal" size={19} color={UI_COLORS.textSecondary} />
        </PressableScale>
        <PressableScale style={styles.compactProgress} scaleTo={0.97} haptic="light"
          onPress={() => onPressDay(habit, selectedKey)} disabled={habit.archived || isFuture}
          accessibilityRole="button" accessibilityState={{ disabled: habit.archived || isFuture }}
          accessibilityLabel={`${habit.title}, ${progressSummary}. ${dayPercent}% complete. ${habit.archived ? "Archived" : progressAction}`}>
          {progressDog}
          <Text style={styles.compactHint}>{habit.archived ? "Archived" : progressAction}</Text>
        </PressableScale>
      </View>
    );
  }

  return (
    <WaveItem index={index} waveKey={waveKey}>
      <View style={[styles.card, habit.archived && styles.cardArchived]}>
      {/* Top Row: Title + Frequency Pill + Category Icon Square */}
      <View style={styles.headerRow}>
        <PressableScale
          style={styles.headerTextCol}
          scaleTo={0.985}
          disabled={habit.archived || isFuture}
          onPress={() => onPressDay(habit, selectedKey)}
        >
          <Text variant="heading" style={styles.habitTitle} numberOfLines={1}>
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


            {habit.archived && (
              <View style={styles.archivedBadge}>
                <Text style={styles.archivedBadgeText}>Archived</Text>
              </View>
            )}
          </View>
        </PressableScale>

        <PressableScale
          style={[styles.categoryIconBox, { backgroundColor: habit.color }]}
          scaleTo={0.92}
          haptic="selection"
          onPress={() => onOpenStats(habit)}
          accessibilityRole="button"
          accessibilityLabel={`${habit.title} statistics`}
        >
          <Ionicons
            name={habit.icon as keyof typeof Ionicons.glyphMap}
            size={20}
            color={UI_COLORS.textOnAccent}
          />
        </PressableScale>
      </View>

      <PressableScale
        style={styles.dailyProgress}
        scaleTo={0.97}
        haptic="light"
        onPress={() => onPressDay(habit, selectedKey)}
        disabled={habit.archived || isFuture}
        accessibilityRole="button"
        accessibilityState={{ disabled: habit.archived || isFuture }}
        accessibilityLabel={`${habit.title}, ${progressLabel}: ${progressSummary}. ${dayPercent}% complete. ${habit.archived ? "Archived" : progressAction}`}
      >
        {progressDog}
        <View style={styles.progressDetails}>
          <Text variant="heading" style={styles.progressTitle}>{progressLabel}</Text>
          <Text style={styles.progressSummary}>{dayCompleted ? "Goal reached!" : "Help color in Scotty"}</Text>
          {habit.evaluationType === "numeric" && dayGoal !== null && habit.goalCondition !== "at_least" && (
            <Text style={styles.progressHint}>
              Goal: {habit.goalCondition === "less_than" ? "under" : "exactly"} {dayGoal} {habit.unit}
            </Text>
          )}
          <Text style={[styles.progressHint, { color: habit.color }]}>
            {habit.archived ? "Archived" : progressAction}
          </Text>
        </View>
      </PressableScale>

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
          <PressableScale
            style={styles.footerIconBtn}
            scaleTo={0.88}
            haptic="selection"
            onPress={() => onOpenCalendar(habit)}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel={`Open calendar for ${habit.title}`}
          >
            <Ionicons
              name="calendar-outline"
              size={19}
              color={UI_COLORS.textMuted}
            />
          </PressableScale>

          <PressableScale
            style={styles.footerIconBtn}
            scaleTo={0.88}
            haptic="selection"
            onPress={() => onOpenStats(habit)}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel={`Open statistics for ${habit.title}`}
          >
            <Ionicons
              name="bar-chart-outline"
              size={18}
              color={UI_COLORS.textMuted}
            />
          </PressableScale>

          <PressableScale
            style={styles.footerIconBtn}
            scaleTo={0.88}
            haptic="selection"
            onPress={() => onOpenActions(habit)}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel={`More options for ${habit.title}`}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={18}
              color={UI_COLORS.textMuted}
            />
          </PressableScale>
        </View>
      </View>
      </View>
    </WaveItem>
  );
}

const styles = StyleSheet.create({
  compactHabit: { width: "100%", alignItems: "center", paddingTop: 12, paddingBottom: 12 },
  compactMenu: { position: "absolute", top: 0, right: 0, width: 32, height: 32, alignItems: "center", justifyContent: "center", zIndex: 1 },
  compactProgress: { alignItems: "center", width: "100%", gap: 4 },
  compactDog: { width: "100%", gap: 5 },
  compactTitle: { fontSize: 17, fontWeight: "700", color: UI_COLORS.textPrimary, textAlign: "center" },
  compactHint: { fontSize: 11, color: UI_COLORS.textMuted, textAlign: "center" },
  card: {
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingTop: 14,
    paddingHorizontal: spacing.lg,
    paddingBottom: 10,
    marginBottom: spacing.md,
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
    fontSize: 18,
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
    width: 36,
    height: 36,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  dailyProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  scottyProgress: { width: 106, alignItems: "center", gap: 4 },
  scottyCanvas: { width: 86, height: 119, overflow: "hidden" },
  scottyImage: { position: "absolute", width: 136, height: 136, left: -25, bottom: -15 },
  scottyFill: { position: "absolute", bottom: 0, left: 0, right: 0, overflow: "hidden" },
  scottyTotal: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: UI_COLORS.textPrimary, textAlign: "center" },
  progressDetails: { flex: 1, gap: 4 },
  progressTitle: { fontSize: 18, fontWeight: fontWeight.bold, color: UI_COLORS.textPrimary },
  progressSummary: { fontSize: fontSize.base, color: UI_COLORS.textSecondary },
  progressHint: { fontSize: fontSize.sm, color: UI_COLORS.textMuted },
  divider: {
    height: 1,
    backgroundColor: UI_COLORS.border,
    marginHorizontal: -spacing.lg,
    marginBottom: 7,
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
