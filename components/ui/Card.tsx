import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { UI_COLORS } from '@/constants/gamification';
import { radii, shadows } from '@/constants/tokens';

export type CardVariant = 'default' | 'elevated' | 'outlined';

export interface CardProps {
  /** Card body content */
  children: React.ReactNode;
  /** Visual surface variant (default: 'default') */
  variant?: CardVariant;
  /** Optional colored vertical left-edge accent border */
  accentColor?: string;
  /** Optional press handler; if provided, renders as an interactive TouchableOpacity */
  onPress?: () => void;
  /** Active opacity when pressed (default: 0.7) */
  activeOpacity?: number;
  /** Optional container style overrides */
  style?: StyleProp<ViewStyle>;
}

/**
 * Card
 *
 * Versatile container component standardizing surfaces, borders, radii,
 * and elevation across cards and widgets.
 */
export default function Card({
  children,
  variant = 'default',
  accentColor,
  onPress,
  activeOpacity = 0.7,
  style,
}: CardProps) {
  const cardStyle = [
    styles.base,
    styles[variant],
    accentColor
      ? { borderLeftWidth: 4, borderLeftColor: accentColor }
      : undefined,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={activeOpacity}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.xxl,
    padding: 14,
    borderWidth: 1,
  },
  default: {
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.border,
  },
  elevated: {
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.border,
    ...shadows.elevated,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderColor: UI_COLORS.border,
  },
});
