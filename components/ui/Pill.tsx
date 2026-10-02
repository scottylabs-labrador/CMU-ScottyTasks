import React, { memo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { UI_COLORS } from '@/constants/gamification';
import { fontSize, fontWeight, radii } from '@/constants/tokens';

export type PillSize = 'sm' | 'md';

export interface PillProps {
  /** Text label displayed inside the pill */
  label: string;
  /** Optional emoji or icon string prefix */
  icon?: string;
  /** Whether the pill is currently active/selected */
  active?: boolean;
  /** Active background and border color (default: UI_COLORS.cmuRed) */
  activeColor?: string;
  /** Optional press handler; if provided, renders as TouchableOpacity */
  onPress?: () => void;
  /** Size preset for padding and typography (default: 'md') */
  size?: PillSize;
  /** Optional container style overrides */
  style?: StyleProp<ViewStyle>;
  /** Optional text style overrides */
  textStyle?: StyleProp<TextStyle>;
}

/**
 * Pill
 *
 * Reusable tag and filter pill component with active and inactive styling states.
 */
function PillComponent({
  label,
  icon,
  active = false,
  activeColor = UI_COLORS.cmuRed,
  onPress,
  size = 'md',
  style,
  textStyle,
}: PillProps) {
  const containerStyles = [
    styles.base,
    size === 'sm' ? styles.sizeSm : styles.sizeMd,
    active
      ? [styles.activeContainer, { backgroundColor: activeColor, borderColor: activeColor }]
      : styles.inactiveContainer,
    style,
  ];

  const labelStyles = [
    styles.baseText,
    size === 'sm' ? styles.textSm : styles.textMd,
    active ? styles.activeText : styles.inactiveText,
    textStyle,
  ];

  const content = (
    <>
      {icon ? (
        <Text style={[styles.iconText, size === 'sm' ? styles.iconSm : styles.iconMd]}>
          {icon}
        </Text>
      ) : null}
      <Text style={labelStyles} numberOfLines={1}>
        {label}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyles}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyles}>{content}</View>;
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    gap: 4,
  },
  sizeSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sizeMd: {
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  inactiveContainer: {
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.border,
  },
  activeContainer: {
    // Background and border color set dynamically with activeColor
  },
  baseText: {
    fontWeight: fontWeight.semibold,
  },
  textSm: {
    fontSize: fontSize.xs, // 10px
  },
  textMd: {
    fontSize: fontSize.md, // 12px
  },
  inactiveText: {
    color: UI_COLORS.textSecondary,
  },
  activeText: {
    color: UI_COLORS.textOnAccent,
  },
  iconText: {
    marginRight: 2,
  },
  iconSm: {
    fontSize: fontSize.xs,
  },
  iconMd: {
    fontSize: fontSize.md,
  },
});

export default memo(PillComponent);
