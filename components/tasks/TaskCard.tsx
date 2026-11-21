import { Text } from "@/components/ScottyText";
import React, { memo, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { TaskItem } from "@/components/AddTaskModal";
import { formatTaskDate } from "@/utils/taskDates";
import { PressableScale, WaveItem } from "@/components/ui/Motion";
import { useOptionalSettings } from "@/hooks/useSettings";
import { UI_COLORS } from "@/constants/gamification";
import { fontSize, fontWeight, radii, shadows, spacing } from "@/constants/tokens";

export interface TaskCardProps {
  task: TaskItem;
  onToggleComplete: (task: TaskItem) => void;
  onPress: (task: TaskItem) => void;
  onDelete: (id: string) => void;
  isOverdue?: boolean;
  onRescheduleToday?: (task: TaskItem) => void;
  now?: Date;
  showDueDate?: boolean;
  index?: number;
  waveKey?: string | number;
  completing?: boolean;
  enteringSlow?: boolean;
}

/**
 * TaskCard
 *
 * Elevated campus-notebook card displaying task status, title, course,
 * due date/time, XP reward, staggered wave entrance, and a 1-tap "Move to Today" action.
 */
function TaskCardComponent({
  task,
  onToggleComplete,
  onPress,
  onDelete,
  isOverdue = false,
  onRescheduleToday,
  now,
  showDueDate = true,
  index = 0,
  waveKey = "tasks",
  completing = false,
  enteringSlow = false,
}: TaskCardProps) {
  const osReducedMotion = useReducedMotion();
  const { settings } = useOptionalSettings();
  const reducedMotion = osReducedMotion || settings.reduceMotion;

  const cardHeight = useSharedValue(0);
  const isCollapsing = useSharedValue(0);
  const collapseProgress = useSharedValue(1);
  const enterProgress = useSharedValue(enteringSlow && !reducedMotion ? 0 : 1);

  useEffect(() => {
    if (reducedMotion) {
      isCollapsing.value = 0;
      collapseProgress.value = 1;
      enterProgress.value = 1;
      return;
    }

    if (completing) {
      isCollapsing.value = 1;
      collapseProgress.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) });
      return;
    }

    if (enteringSlow) {
      isCollapsing.value = 0;
      collapseProgress.value = 1;
      enterProgress.value = 0;
      enterProgress.value = withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      });
      return;
    }

    isCollapsing.value = 0;
    collapseProgress.value = withTiming(1, { duration: 160, easing: Easing.out(Easing.cubic) });
    enterProgress.value = 1;
  }, [collapseProgress, completing, enterProgress, enteringSlow, isCollapsing, reducedMotion]);

  const collapseWrapperStyle = useAnimatedStyle(() => {
    if (isCollapsing.value === 1) {
      const measured = cardHeight.value > 0 ? cardHeight.value : 132;
      return {
        maxHeight: measured * collapseProgress.value,
        overflow: "hidden" as const,
      };
    }
    return {};
  });

  const cardTransitionStyle = useAnimatedStyle(() => {
    const collapseShift = (1 - collapseProgress.value) * 20;
    const collapseScale = 0.98 + 0.02 * collapseProgress.value;
    const enterShift = (1 - enterProgress.value) * -6;
    const enterScale = 0.98 + 0.02 * enterProgress.value;
    return {
      transform: [
        { translateY: collapseShift + enterShift },
        { scale: collapseScale * enterScale },
      ],
    };
  });

  const effectiveDone = task.done || completing;

  const priorityColor =
    task.priority === "high"
      ? UI_COLORS.priorityHigh
      : task.priority === "medium"
      ? UI_COLORS.priorityMedium
      : UI_COLORS.priorityLow;

  const formattedDate = formatTaskDate(task.dueDate, now);

  const cardContent = (
    <Animated.View
      style={collapseWrapperStyle}
      onLayout={(event) => {
        if (!completing) {
          const nextHeight = event.nativeEvent.layout.height;
          if (nextHeight > 0) cardHeight.value = nextHeight;
        }
      }}
    >
      <Animated.View style={cardTransitionStyle}>
      <View
        style={[
          styles.card,
          { borderLeftColor: effectiveDone ? UI_COLORS.xpGreen : priorityColor },
          isOverdue && !effectiveDone && styles.cardOverdue,
          effectiveDone && styles.cardDone,
        ]}
      >
      <View style={styles.cardHeader}>
        {/* Checkbox with tactile pop */}
        <PressableScale
          onPress={() => onToggleComplete(task)}
          disabled={completing}
          scaleTo={0.85}
          haptic="light"
          style={[
            styles.checkbox,
            effectiveDone && styles.checkboxDone,
            { borderColor: effectiveDone ? UI_COLORS.xpGreen : priorityColor },
          ]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: effectiveDone }}
        >
          {effectiveDone && (
            <Ionicons
              name="checkmark"
              size={15}
              color={UI_COLORS.textOnAccent}
            />
          )}
        </PressableScale>

        {/* Task Info */}
        <PressableScale
          style={styles.taskInfo}
          scaleTo={0.985}
          onPress={() => onPress(task)}
        >
          <View style={styles.titleRow}>
            <Text
              variant="heading"
              style={[styles.taskTitle, effectiveDone && styles.taskTitleDone]}
              numberOfLines={2}
            >
              {task.text}
            </Text>
          </View>

          {task.description ? (
            <Text style={styles.description} numberOfLines={2}>{task.description}</Text>
          ) : null}

          {(task.course || showDueDate || task.dueTime) ? <View style={styles.metaRow}>
            {task.course ? (
              <View style={styles.courseBadge}>
                <Text style={styles.courseText}>{task.course}</Text>
              </View>
            ) : null}

            {(showDueDate || task.dueTime) ? <View style={styles.dueGroup}>
              <Ionicons
                name={isOverdue && !effectiveDone ? "alert-circle" : "time-outline"}
                size={13}
                color={
                  isOverdue && !effectiveDone
                    ? UI_COLORS.cmuRed
                    : UI_COLORS.textMuted
                }
              />
              <Text
                style={[
                  styles.dueText,
                  isOverdue && !effectiveDone && styles.dueTextOverdue,
                ]}
              >
                {showDueDate ? formattedDate : ""}
                {task.dueTime ? `${showDueDate ? " · " : ""}${task.dueTime}` : ""}
              </Text>
            </View> : null}
          </View> : null}
        </PressableScale>

        {/* Delete Button */}
        <PressableScale
          onPress={() => onDelete(task.id)}
          scaleTo={0.88}
          style={styles.deleteBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Delete task"
        >
          <Ionicons name="trash-outline" size={17} color={UI_COLORS.textMuted} />
        </PressableScale>
      </View>

      {/* Footer with Priority, 1-Tap Reschedule (if overdue), & XP Reward */}
      <View style={styles.cardFooter}>
        <View style={styles.priorityIndicator}>
          <View
            style={[styles.priorityDot, { backgroundColor: priorityColor }]}
          />
          <Text style={styles.priorityLabel}>
            {task.priority.toUpperCase()}
          </Text>
        </View>

        <View style={styles.footerRight}>
          {isOverdue && !effectiveDone && onRescheduleToday ? (
            <PressableScale
              style={styles.rescheduleBtn}
              scaleTo={0.94}
              haptic="selection"
              onPress={() => onRescheduleToday(task)}
              accessibilityRole="button"
              accessibilityLabel="Reschedule task to today"
            >
              <Ionicons
                name="arrow-forward-circle-outline"
                size={14}
                color={UI_COLORS.cmuRed}
              />
              <Text style={styles.rescheduleBtnText}>Move to Today</Text>
            </PressableScale>
          ) : null}

          <View style={styles.xpBadge}>
            <Text style={styles.xpText}>⚡ +{task.xp} XP</Text>
          </View>
        </View>
      </View>
      </View>
      </Animated.View>
    </Animated.View>
  );

  if (enteringSlow) {
    return cardContent;
  }

  return (
    <WaveItem index={index} waveKey={waveKey}>
      {cardContent}
    </WaveItem>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: UI_COLORS.bgCard,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    borderLeftWidth: 3.5,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 4,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  cardOverdue: {
    borderColor: "rgba(166, 25, 46, 0.32)",
    backgroundColor: "#FFF9F7",
  },
  cardDone: {
    backgroundColor: UI_COLORS.bgSubtle,
    ...shadows.subtle,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  checkboxDone: {
    backgroundColor: UI_COLORS.xpGreen,
  },
  taskInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  taskTitle: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textPrimary,
    lineHeight: 20,
  },
  taskTitleDone: {
    textDecorationLine: "line-through",
    color: UI_COLORS.textMuted,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 5,
  },
  description: {
    fontSize: 13,
    color: UI_COLORS.textSecondary,
    marginTop: 4,
  },
  courseBadge: {
    backgroundColor: UI_COLORS.bgWarm,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.sm,
  },
  courseText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textSecondary,
  },
  dueGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dueText: {
    fontSize: fontSize.md,
    color: UI_COLORS.textSecondary,
    fontWeight: fontWeight.semibold,
  },
  dueTextOverdue: {
    color: UI_COLORS.cmuRed,
    fontWeight: fontWeight.extrabold,
  },
  deleteBtn: {
    padding: 3,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: UI_COLORS.border,
  },
  priorityIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  priorityDot: {
    width: 7,
    height: 7,
    borderRadius: radii.round,
  },
  priorityLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textMuted,
    letterSpacing: 0.5,
  },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rescheduleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: UI_COLORS.redTint,
    borderWidth: 1,
    borderColor: "rgba(166, 25, 46, 0.28)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.md,
  },
  rescheduleBtnText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.cmuRed,
  },
  xpBadge: {
    backgroundColor: UI_COLORS.goldTint,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radii.md,
  },
  xpText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.cmuGold,
  },
});

export default memo(TaskCardComponent);
