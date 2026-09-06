import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { UI_COLORS } from '@/constants/gamification';
import { fontSize, fontWeight, radii, spacing } from '@/constants/tokens';

export interface StatsGridProps {
  /** User's total accumulated experience points */
  xp: number;
  /** Current consecutive active daily streak count */
  streak: number;
  /** Total number of tasks completed to date */
  tasksCompleted: number;
}

/**
 * StatsGrid
 *
 * 3-column stats card displaying Total XP, Day Streak, and Tasks Done.
 */
function StatsGridComponent({ xp, streak, tasksCompleted }: StatsGridProps) {
  return (
    <View style={styles.container}>
      {/* Column 1: Total XP */}
      <View style={styles.statCard}>
        <Text style={[styles.statValue, styles.xpValue]}>
          {xp.toLocaleString()}
        </Text>
        <Text style={styles.statLabel}>TOTAL XP</Text>
      </View>

      {/* Column 2: Day Streak */}
      <View style={styles.statCard}>
        <Text style={[styles.statValue, styles.streakValue]}>
          {streak} 🔥
        </Text>
        <Text style={styles.statLabel}>DAY STREAK</Text>
      </View>

      {/* Column 3: Tasks Done */}
      <View style={styles.statCard}>
        <Text style={[styles.statValue, styles.tasksValue]}>
          {tasksCompleted}
        </Text>
        <Text style={styles.statLabel}>TASKS DONE</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    borderRadius: radii.xxl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.black,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  xpValue: {
    color: UI_COLORS.cmuGold,
  },
  streakValue: {
    color: UI_COLORS.streakOrange,
  },
  tasksValue: {
    color: UI_COLORS.xpGreen,
  },
  statLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textMuted,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});

export default memo(StatsGridComponent);
