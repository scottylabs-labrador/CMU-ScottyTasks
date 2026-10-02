import React, { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TaskItem } from "@/components/AddTaskModal";
import { formatTaskDate } from "@/utils/taskDates";
import Pill from "@/components/ui/Pill";
import { UI_COLORS } from "@/constants/gamification";
import { fontSize, fontWeight, radii, spacing } from "@/constants/tokens";

export interface TaskCardProps {
  task: TaskItem;
  onToggleComplete: (task: TaskItem) => void;
  onPress: (task: TaskItem) => void;
  onDelete: (id: string) => void;
}

/**
 * TaskCard
 *
 * Card displaying task status, title, tags, course, due date, and XP reward.
 */
function TaskCardComponent({
  task,
  onToggleComplete,
  onPress,
  onDelete,
}: TaskCardProps) {
  const priorityColor =
    task.priority === "high"
      ? UI_COLORS.priorityHigh
      : task.priority === "medium"
      ? UI_COLORS.priorityMedium
      : UI_COLORS.priorityLow;

  return (
    <View
      style={[
        styles.card,
        task.done && styles.cardDone,
      ]}
    >
      <View style={styles.cardHeader}>
        {/* Checkbox */}
        <TouchableOpacity
          onPress={() => onToggleComplete(task)}
          style={[
            styles.checkbox,
            task.done && styles.checkboxDone,
            { borderColor: task.done ? UI_COLORS.xpGreen : priorityColor },
          ]}
          activeOpacity={0.7}
        >
          {task.done && <Ionicons name="checkmark" size={16} color={UI_COLORS.textOnAccent} />}
        </TouchableOpacity>

        {/* Task Info */}
        <TouchableOpacity
          style={styles.taskInfo}
          onPress={() => onPress(task)}
          activeOpacity={0.7}
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
              <Text style={styles.courseText}>{task.course} · </Text>
            ) : null}
            <Text style={styles.dueText}>
              {formatTaskDate(task.dueDate)}
              {task.dueTime ? ` @ ${task.dueTime}` : ""}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Delete Button */}
        <TouchableOpacity
          onPress={() => onDelete(task.id)}
          style={styles.deleteBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={18} color={UI_COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Footer with Priority & XP Reward */}
      <View style={styles.cardFooter}>
        <View style={styles.priorityIndicator}>
          <View
            style={[styles.priorityDot, { backgroundColor: priorityColor }]}
          />
          <Text style={styles.priorityLabel}>{task.priority.toUpperCase()}</Text>
        </View>

        <View style={styles.xpBadge}>
          <Text style={styles.xpText}>⚡ +{task.xp} XP</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "transparent",
    borderColor: UI_COLORS.border,
    paddingVertical: spacing.xl,
    paddingHorizontal: 0,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: UI_COLORS.border,
  },
  cardDone: {
    opacity: 1,
    backgroundColor: UI_COLORS.bgSubtle,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: radii.sm,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
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
    gap: spacing.md,
  },
  taskTitle: {
    flex: 1,
    fontSize: fontSize.xl, // 15px
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
    marginTop: spacing.xs,
  },
  courseText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textMuted,
  },
  dueText: {
    fontSize: fontSize.md,
    color: UI_COLORS.textSecondary,
    fontWeight: fontWeight.medium,
  },
  deleteBtn: {
    padding: spacing.xs,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: UI_COLORS.border,
  },
  priorityIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: radii.round,
  },
  priorityLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textMuted,
    letterSpacing: 0.5,
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
