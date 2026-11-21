import React from 'react';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { useOptionalSettings } from '@/hooks/useSettings';

export interface ScreenContainerProps {
  /** Screen content elements */
  children: React.ReactNode;
  /** Safe area edges to inset (default: ['top']) */
  edges?: Edge[];
  /** Optional custom container style overrides */
  style?: StyleProp<ViewStyle>;
}

/**
 * ScreenContainer
 *
 * Consistent root wrapper that replaces repetitive SafeAreaView boilerplate.
 * Applies the active appearance theme background and safe area handling.
 */
export default function ScreenContainer({
  children,
  edges = ['top'],
  style,
}: ScreenContainerProps) {
  const { theme } = useOptionalSettings();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
