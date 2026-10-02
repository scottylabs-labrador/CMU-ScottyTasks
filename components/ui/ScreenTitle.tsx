import React from 'react';
import { StyleSheet, View, Text, StyleProp, ViewStyle } from 'react-native';
import { UI_COLORS } from '@/constants/gamification';
import { fontSize, fontWeight, spacing } from '@/constants/tokens';

export interface ScreenTitleProps {
  /** Screen name / title text */
  title: string;
  /** Optional right-side content (e.g., avatar button, action icons) */
  rightSlot?: React.ReactNode;
  /** Optional container style overrides */
  style?: StyleProp<ViewStyle>;
}

/**
 * ScreenTitle
 *
 * Lightweight header displaying the screen name with an optional right-aligned action slot.
 * Replaces heavy header implementations across screens.
 */
export default function ScreenTitle({
  title,
  rightSlot,
  style,
}: ScreenTitleProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.titleText} numberOfLines={1}>
        {title}
      </Text>
      {rightSlot ? <View style={styles.rightSlot}>{rightSlot}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: UI_COLORS.bgWarm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: UI_COLORS.border,
  },
  titleText: {
    flex: 1,
    fontSize: fontSize.title,
    fontWeight: fontWeight.black,
    color: UI_COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  rightSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
});
