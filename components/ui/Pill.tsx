import React, { memo } from "react";
import {
  StyleSheet,
  View,
  Text,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import { PressableScale } from "@/components/ui/Motion";
import { UI_COLORS } from "@/constants/gamification";
import { fontSize, fontWeight, radii } from "@/constants/tokens";

export type PillSize = "sm" | "md";

export interface PillProps {
  /** Text label displayed inside the pill */
  label: string;
  /** Optional emoji or icon string prefix */
  icon?: string;
  /** Whether the pill is currently active/selected */
  active?: boolean;
  /** Active background and border color (default: UI_COLORS.cmuRed) */
  activeColor?: string;
  /** Optional press handler; if provided, renders with tactile PressableScale */
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
 * Reusable tag and filter pill component with active/inactive styling and smooth press physics.
 */
function PillComponent({
  label,
  icon,
  active = false,
  activeColor = UI_COLORS.cmuRed,
  onPress,
  size = "md",
  style,
  textStyle,
}: PillProps) {
  const containerStyles = [
    styles.base,
    size === "sm" ? styles.sizeSm : styles.sizeMd,
    active
      ? [
          styles.activeContainer,
          { backgroundColor: activeColor, borderColor: activeColor },
        ]
      : styles.inactiveContainer,
    style,
  ];

  const labelStyles = [
    styles.baseText,
    size === "sm" ? styles.textSm : styles.textMd,
    active ? styles.activeText : styles.inactiveText,
    textStyle,
  ];

  const content = (
    <>
      {icon ? (
        <Text
          style={[
            styles.iconText,
            size === "sm" ? styles.iconSm : styles.iconMd,
          ]}
        >
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
      <PressableScale
        style={containerStyles}
        scaleTo={0.95}
        haptic="selection"
        onPress={onPress}
      >
        {content}
      </PressableScale>
    );
  }

  return <View style={containerStyles}>{content}</View>;
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  sizeSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  sizeMd: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 6,
  },
  activeContainer: {},
  inactiveContainer: {
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.border,
  },
  baseText: {
    fontWeight: fontWeight.bold,
  },
  textSm: {
    fontSize: fontSize.xs,
    letterSpacing: 0.3,
  },
  textMd: {
    fontSize: fontSize.md,
    letterSpacing: 0.4,
  },
  activeText: {
    color: UI_COLORS.textOnAccent,
    fontWeight: fontWeight.extrabold,
  },
  inactiveText: {
    color: UI_COLORS.textSecondary,
  },
  iconText: {},
  iconSm: {
    fontSize: fontSize.xs,
  },
  iconMd: {
    fontSize: fontSize.md,
  },
});

export default memo(PillComponent);
