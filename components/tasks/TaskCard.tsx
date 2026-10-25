import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TaskItem } from "@/components/AddTaskModal";
import { formatTaskDate } from "@/utils/taskDates";
import Pill from "@/components/ui/Pill";
import { PressableScale, WaveItem } from "@/components/ui/Motion";
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
  index?: number;
  waveKey?: string | number;
}

/**
 * TaskCard
 *
 * Elevated campus-notebook card displaying task status, title, course/tag,
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
  index = 0,
  waveKey = "tasks",
}: TaskCardProps) {
  const priorityColor =
    task.priority === "high"
      ? UI_COLORS.priorityHigh
      : task.priority === "medium"
      ? UI_COLORS.priorityMedium
      : UI_COLORS.priorityLow;

  const formattedDate = formatTaskDate(task.dueDate, now);

  return (
    <WaveItem index={index} waveKey={waveKey} layoutTransition>
      <View
        style={[
          styles.card,
          { borderLeftColor: task.done ? UI_COLORS.xpGreen : priorityColor },
          isOverdue && !task.done && styles.cardOverdue,
          task.done && styles.cardDone,
        ]}
      >
      <View style={styles.cardHeader}>
        {/* Checkbox with tactile pop */}
        <PressableScale
          onPress={() => onToggleComplete(task)}
          scaleTo={0.85}
          haptic="light"
          style={[
            styles.checkbox,
            task.done && styles.checkboxDone,
            { borderColor: task.done ? UI_COLORS.xpGreen : priorityColor },
          ]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: task.done }}
        >
          {task.done && (
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
              style={[styles.taskTitle, task.done && styles.taskTitleDone]}
              numberOfLines={2}
            >
              {task.text}
            </Text>
            {task.tag ? (
              <Pill
                label={task.tag}
                size="sm"
                active
                activeColor={UI_COLORS.blueTint}
                textStyle={styles.tagPillText}
              />
            ) : null}
          </View>

          <View style={styles.metaRow}>
            {task.course ? (
              <View style={styles.courseBadge}>
                <Text style={styles.courseText}>{task.course}</Text>
              </View>
            ) : null}

            <View style={styles.dueGroup}>
              <Ionicons
                name={isOverdue && !task.done ? "alert-circle" : "time-outline"}
                size={13}
                color={
                  isOverdue && !task.done
                    ? UI_COLORS.cmuRed
                    : UI_COLORS.textMuted
                }
              />
              <Text
                style={[
                  styles.dueText,
                  isOverdue && !task.done && styles.dueTextOverdue,
                ]}
              >
                {formattedDate}
                {task.dueTime ? ` · ${task.dueTime}` : ""}
              </Text>
            </View>
          </View>
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
          {isOverdue && !task.done && onRescheduleToday ? (
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
  tagPillText: {
    color: UI_COLORS.cyan,
    fontWeight: fontWeight.extrabold,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 5,
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
