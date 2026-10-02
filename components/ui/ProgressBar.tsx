import React, { memo } from 'react';
import { StyleSheet, View, StyleProp, ViewStyle, DimensionValue } from 'react-native';
import { UI_COLORS } from '@/constants/gamification';

export interface ProgressBarProps {
  /** Progress percentage between 0 and 100 */
  progress: number;
  /** Fill color of the progress bar (default: UI_COLORS.cmuRed) */
  color?: string;
  /** Background color of the track (default: UI_COLORS.bgElevated) */
  trackColor?: string;
  /** Height of the progress bar in px (default: 6) */
  height?: number;
  /** Border radius of the track and fill in px (default: 3) */
  borderRadius?: number;
  /** Optional container style overrides */
  style?: StyleProp<ViewStyle>;
}

/**
 * ProgressBar
 *
 * Reusable horizontal progress indicator with configurable fill, track, height, and radius.
 */
function ProgressBarComponent({
  progress,
  color = UI_COLORS.cmuRed,
  trackColor = UI_COLORS.bgElevated,
  height = 6,
  borderRadius = 3,
  style,
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, isNaN(progress) ? 0 : progress));
  const widthPercent: DimensionValue = `${clampedProgress}%`;

  return (
    <View
      style={[
        styles.track,
        {
          height,
          borderRadius,
          backgroundColor: trackColor,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: widthPercent,
            backgroundColor: color,
            borderRadius,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});

export default memo(ProgressBarComponent);
