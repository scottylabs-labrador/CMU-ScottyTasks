import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Badge, INITIAL_BADGES, UI_COLORS } from '@/constants/gamification';
import { fontSize, fontWeight, radii, spacing } from '@/constants/tokens';

export interface BadgesGridProps {
  /** List of badges to display (defaults to INITIAL_BADGES) */
  badges?: Badge[];
}

/**
 * BadgesGrid
 *
 * Renders a 3-column grid of achievement badge cards with emoji,
 * title, and Unlocked/Locked status with active highlight styling.
 */
function BadgesGridComponent({ badges = INITIAL_BADGES }: BadgesGridProps) {
  return (
    <View style={styles.container}>
      {badges.map((badge) => {
        const isEarned = badge.earned;

        return (
          <View
            key={badge.id}
            style={[styles.badgeCard, isEarned && styles.badgeCardEarned]}
          >
            <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
            <Text style={styles.badgeTitle} numberOfLines={2}>
              {badge.label}
            </Text>
            <Text
              style={[
                styles.badgeStatus,
                isEarned ? styles.statusEarned : styles.statusLocked,
              ]}
            >
              {isEarned ? 'Unlocked' : 'Locked'}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  badgeCard: {
    width: '31%',
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: UI_COLORS.bgSubtle,
  },
  badgeCardEarned: {
    opacity: 1,
    borderColor: UI_COLORS.borderLight,
    backgroundColor: UI_COLORS.goldTint,
  },
  badgeEmoji: {
    fontSize: fontSize.hero,
    marginBottom: spacing.xs,
  },
  badgeTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
    minHeight: 28,
  },
  badgeStatus: {
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.bold,
  },
  statusEarned: {
    color: UI_COLORS.cmuGold,
  },
  statusLocked: {
    color: UI_COLORS.textMuted,
  },
});

export default memo(BadgesGridComponent);
