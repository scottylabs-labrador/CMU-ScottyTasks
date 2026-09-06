import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LeaderboardEntry, UI_COLORS } from '@/constants/gamification';
import { fontSize, fontWeight, radii, spacing } from '@/constants/tokens';
import Avatar from '@/components/ui/Avatar';

export interface RankRowProps {
  /** The leaderboard entry data to display */
  entry: LeaderboardEntry;
}

const RED_ERROR = '#F87171';

/**
 * RankRow
 *
 * Renders a single row in the leaderboard list with rank medals / numbers,
 * user avatar, name & course, `(You)` badge, highlight for current user,
 * and XP score with delta indicator.
 */
function RankRowComponent({ entry }: RankRowProps) {
  const isMe = entry.isMe;

  const renderRank = () => {
    if (entry.rank === 1) return <Text style={styles.medalEmoji}>🥇</Text>;
    if (entry.rank === 2) return <Text style={styles.medalEmoji}>🥈</Text>;
    if (entry.rank === 3) return <Text style={styles.medalEmoji}>🥉</Text>;
    return <Text style={styles.rankNumText}>#{entry.rank}</Text>;
  };

  const getDeltaInfo = () => {
    if (entry.delta > 0) {
      return { text: `▲ ${entry.delta}`, color: UI_COLORS.xpGreen };
    }
    if (entry.delta < 0) {
      return { text: `▼ ${Math.abs(entry.delta)}`, color: RED_ERROR };
    }
    return { text: '—', color: UI_COLORS.textMuted };
  };

  const delta = getDeltaInfo();

  return (
    <View style={[styles.container, isMe && styles.containerMe]}>
      {/* Rank column */}
      <View style={styles.rankColumn}>{renderRank()}</View>

      {/* Circular Avatar with emoji */}
      <Avatar
        emoji={entry.avatar}
        size={38}
        showBorder={isMe}
        borderColor={isMe ? UI_COLORS.cmuRed : 'transparent'}
      />

      {/* Name & Course */}
      <View style={styles.infoColumn}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {entry.name}
          </Text>
          {isMe && <Text style={styles.youBadge}>(You)</Text>}
        </View>
        <Text style={styles.courseText} numberOfLines={1}>
          {entry.course} · Lv.{entry.level}
        </Text>
      </View>

      {/* XP score & delta indicator */}
      <View style={styles.scoreColumn}>
        <Text style={styles.scoreXp}>{entry.xp.toLocaleString()}</Text>
        <Text style={[styles.deltaText, { color: delta.color }]}>
          {delta.text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    borderRadius: radii.xxl,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  containerMe: {
    borderColor: UI_COLORS.cmuRed,
    backgroundColor: 'rgba(196, 18, 48, 0.12)',
  },
  rankColumn: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalEmoji: {
    fontSize: fontSize.xxl,
  },
  rankNumText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textMuted,
  },
  infoColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textPrimary,
  },
  youBadge: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.black,
    color: UI_COLORS.cmuRed,
    backgroundColor: 'rgba(196, 18, 48, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: radii.sm,
  },
  courseText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: UI_COLORS.textSecondary,
    marginTop: 2,
  },
  scoreColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  scoreXp: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.black,
    color: UI_COLORS.cmuGold,
  },
  deltaText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    marginTop: 2,
  },
});

export default memo(RankRowComponent);
