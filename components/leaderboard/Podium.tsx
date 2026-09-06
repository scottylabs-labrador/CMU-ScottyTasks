import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LeaderboardEntry, UI_COLORS } from '@/constants/gamification';
import { fontSize, fontWeight, radii, spacing } from '@/constants/tokens';
import Avatar from '@/components/ui/Avatar';

export interface PodiumProps {
  /** The top 3 ranked entries: [1st Gold, 2nd Silver, 3rd Bronze] */
  top3: [LeaderboardEntry, LeaderboardEntry, LeaderboardEntry];
}

const SILVER_COLOR = '#C0C0C0';
const BRONZE_COLOR = '#CD7F32';

/**
 * Podium
 *
 * 3-column podium displaying 2nd place (Silver) on the left,
 * 1st place (Gold) elevated in the center, and 3rd place (Bronze) on the right.
 */
function PodiumComponent({ top3 }: PodiumProps) {
  const [gold, silver, bronze] = top3;

  return (
    <View style={styles.container}>
      {/* #2 Silver (Left) */}
      <View style={styles.column}>
        <Avatar
          emoji={silver.avatar}
          size={42}
          showBorder
          borderColor={SILVER_COLOR}
          style={styles.avatar}
        />
        <Text style={styles.name} numberOfLines={1}>
          {silver.name.split(' ')[0]}
        </Text>
        <View style={[styles.block, styles.silverBlock]}>
          <Text style={styles.medalEmoji}>🥈</Text>
        </View>
        <Text style={styles.xpText}>{silver.xp.toLocaleString()} XP</Text>
      </View>

      {/* #1 Gold (Center, elevated) */}
      <View style={[styles.column, styles.goldColumn]}>
        <Avatar
          emoji={gold.avatar}
          size={48}
          showBorder
          borderColor={UI_COLORS.cmuGold}
          style={styles.avatar}
        />
        <Text style={[styles.name, styles.goldName]} numberOfLines={1}>
          {gold.name.split(' ')[0]}
        </Text>
        <View style={[styles.block, styles.goldBlock]}>
          <Text style={styles.medalEmoji}>🥇</Text>
        </View>
        <Text style={[styles.xpText, styles.goldXpText]}>
          {gold.xp.toLocaleString()} XP
        </Text>
      </View>

      {/* #3 Bronze (Right) */}
      <View style={styles.column}>
        <Avatar
          emoji={bronze.avatar}
          size={42}
          showBorder
          borderColor={BRONZE_COLOR}
          style={styles.avatar}
        />
        <Text style={styles.name} numberOfLines={1}>
          {bronze.name.split(' ')[0]}
        </Text>
        <View style={[styles.block, styles.bronzeBlock]}>
          <Text style={styles.medalEmoji}>🥉</Text>
        </View>
        <Text style={styles.xpText}>{bronze.xp.toLocaleString()} XP</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xxl,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  goldColumn: {
    marginTop: -spacing.xl,
  },
  avatar: {
    marginBottom: spacing.xs,
  },
  name: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  goldName: {
    fontSize: fontSize.md,
  },
  block: {
    width: '100%',
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  goldBlock: {
    height: 80,
    backgroundColor: 'rgba(255, 184, 0, 0.2)',
    borderColor: UI_COLORS.cmuGold,
  },
  silverBlock: {
    height: 60,
    backgroundColor: 'rgba(192, 192, 192, 0.2)',
    borderColor: SILVER_COLOR,
  },
  bronzeBlock: {
    height: 48,
    backgroundColor: 'rgba(205, 127, 50, 0.2)',
    borderColor: BRONZE_COLOR,
  },
  medalEmoji: {
    fontSize: fontSize.xxl,
  },
  xpText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.cmuGold,
    marginTop: spacing.xs,
  },
  goldXpText: {
    fontSize: fontSize.sm,
  },
});

export default memo(PodiumComponent);
