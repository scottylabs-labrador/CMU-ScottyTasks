import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { UI_COLORS } from '@/constants/gamification';
import { spacing } from '@/constants/tokens';
import Pill, { PillSize } from './Pill';

export interface FilterOption<T extends string = string> {
  id: T;
  label: string;
  icon?: string;
}

export interface FilterRowProps<T extends string = string> {
  /** Array of selectable filter options */
  options: FilterOption<T>[];
  /** Currently selected option id */
  selected: T;
  /** Callback fired when an option is selected */
  onSelect: (id: T) => void;
  /** Active background/border color for selected pill (default: UI_COLORS.cmuRed) */
  activeColor?: string;
  /** Whether the row should be horizontally scrollable (default: false) */
  scrollable?: boolean;
  /** Size preset for the rendered pills (default: 'md') */
  size?: PillSize;
  /** Optional container style overrides */
  style?: StyleProp<ViewStyle>;
  /** Optional inner content container style overrides (used when scrollable is true) */
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * FilterRow
 *
 * Generic horizontal filter row composed of interactive Pill components.
 */
export default function FilterRow<T extends string = string>({
  options,
  selected,
  onSelect,
  activeColor = UI_COLORS.cmuRed,
  scrollable = false,
  size = 'md',
  style,
  contentContainerStyle,
}: FilterRowProps<T>) {
  const pills = options.map((option) => (
    <Pill
      key={option.id}
      label={option.label}
      icon={option.icon}
      active={selected === option.id}
      activeColor={activeColor}
      size={size}
      onPress={() => onSelect(option.id)}
    />
  ));

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.scrollContainer, style]}
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      >
        {pills}
      </ScrollView>
    );
  }

  return <View style={[styles.row, style]}>{pills}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  scrollContainer: {
    flexGrow: 0,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
});
