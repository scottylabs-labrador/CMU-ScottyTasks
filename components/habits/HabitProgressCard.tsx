import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import ScottyDog from "@/components/ScottyDog";
import ProgressBar from "@/components/ui/ProgressBar";
import { UI_COLORS } from "@/constants/gamification";
import { fontSize, fontWeight, radii, spacing } from "@/constants/tokens";

export interface HabitProgressCardProps {
  completedCount: number;
  totalHabits: number;
  totalStreak: number;
}

/**
 * HabitProgressCard
 *
 * Header card summarizing today's habit completion count, progress bar, and total streak.
 */
function HabitProgressCardComponent({
  completedCount,
  totalHabits,
  totalStreak,
}: HabitProgressCardProps) {
  const progressPercent =
    totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0;

  return (
    <View style={styles.progressCard}>
      <ScottyDog size={52} animated />

      <View style={styles.progressInfo}>
        <Text style={styles.progressSub}>Today's Progress</Text>
        <View style={styles.countRow}>
          <Text style={styles.doneCount}>{completedCount}</Text>
          <Text style={styles.totalCount}> / {totalHabits}</Text>
        </View>

        <ProgressBar
          progress={progressPercent}
          color={UI_COLORS.cmuRed}
          trackColor={UI_COLORS.bgDeep}
          height={6}
          style={styles.progressBar}
        />
      </View>

      <View style={styles.streakBox}>
        <Text style={styles.streakNumber}>{totalStreak}</Text>
        <Text style={styles.streakLabel}>🔥 total streak</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    borderRadius: radii.xxxl, // 20px
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    gap: spacing.lg + 2, // 14px
  },
  progressInfo: {
    flex: 1,
  },
  progressSub: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: spacing.xs / 2,
    marginBottom: spacing.sm,
  },
  doneCount: {
    fontSize: fontSize.title, // 22px
    fontWeight: fontWeight.black,
    color: UI_COLORS.textPrimary,
  },
  totalCount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textMuted,
  },
  progressBar: {
    marginTop: 2,
  },
  streakBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  streakNumber: {
    fontSize: fontSize.title, // 22px
    fontWeight: fontWeight.black,
    color: UI_COLORS.streakOrange,
  },
  streakLabel: {
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.streakOrange,
    marginTop: 2,
    textTransform: "uppercase",
  },
});

export default memo(HabitProgressCardComponent);
