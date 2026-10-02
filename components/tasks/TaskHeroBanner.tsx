import React, { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScottyDog from "@/components/ScottyDog";
import { UI_COLORS } from "@/constants/gamification";
import { fontSize, fontWeight, spacing } from "@/constants/tokens";

export interface TaskHeroBannerProps {
  pendingCount: number;
  totalXpToday: number;
  onAddTask: () => void;
}

/**
 * TaskHeroBanner
 *
 * Prominent top banner summarizing pending tasks, daily XP, and quick-add button.
 */
function TaskHeroBannerComponent({
  pendingCount,
  totalXpToday,
  onAddTask,
}: TaskHeroBannerProps) {
  return (
    <View style={styles.heroBanner}>
      <ScottyDog size={48} animated />

      <View style={styles.heroTextWrapper}>
        <Text style={styles.heroSub}>Outstanding</Text>
        <Text style={styles.heroMain}>
          {pendingCount} {pendingCount === 1 ? "task" : "tasks"}
        </Text>
        <Text style={styles.heroXp}>
          ⚡ {totalXpToday} XP available today
        </Text>
      </View>

      <TouchableOpacity
        style={styles.addBtn}
        onPress={onAddTask}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Add task"
      >
        <Ionicons name="add" size={26} color={UI_COLORS.textOnAccent} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  heroBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: UI_COLORS.borderLight,
    paddingVertical: spacing.xl,
    paddingHorizontal: 0,
    marginBottom: spacing.xl,
    gap: spacing.lg + 2, // 14px
    borderBottomWidth: 1,
    borderBottomColor: UI_COLORS.border,
  },
  heroTextWrapper: {
    flex: 1,
  },
  heroSub: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroMain: {
    fontSize: fontSize.title, // 22px
    fontWeight: fontWeight.black,
    color: UI_COLORS.textPrimary,
  },
  heroXp: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.cmuGold,
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: UI_COLORS.cmuRed,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default memo(TaskHeroBannerComponent);
