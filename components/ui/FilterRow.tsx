import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { UI_COLORS } from '@/constants/gamification';
import { spacing } from '@/constants/tokens';
import type { PillSize } from './Pill';

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
  /** Underline and text color for selected tab (default: UI_COLORS.cmuRed) */
  activeColor?: string;
  /** Whether the row should be horizontally scrollable (default: false) */
  scrollable?: boolean;
  /** Size preset for the tab labels (default: 'md') */
  size?: PillSize;
  /** Optional container style overrides */
  style?: StyleProp<ViewStyle>;
  /** Optional inner content container style overrides (used when scrollable is true) */
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * FilterRow
 *
 * Horizontal filter tabs with an underline marking the selection.
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
  const tabs = options.map((option) => {
    const isSelected = selected === option.id;
    return (
      <TouchableOpacity
        key={option.id}
        accessibilityRole="tab"
        accessibilityState={{ selected: isSelected }}
        onPress={() => onSelect(option.id)}
        style={[styles.tab, { borderBottomColor: isSelected ? activeColor : 'transparent' }]}
      >
        <Text style={{
          color: isSelected ? activeColor : UI_COLORS.textSecondary,
          fontSize: size === 'sm' ? 12 : 13,
          fontWeight: isSelected ? '700' : '500',
        }}>
          {option.icon ? `${option.icon} ` : ''}{option.label}
        </Text>
      </TouchableOpacity>
    );
  });

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.scrollContainer, style]}
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      >
        {tabs}
      </ScrollView>
    );
  }

  return <View style={[styles.row, style]}>{tabs}</View>;
}

const styles = StyleSheet.create({
  tab: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    borderBottomWidth: 2,
  },
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
