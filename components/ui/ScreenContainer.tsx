import React from 'react';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { UI_COLORS } from '@/constants/gamification';

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
 * Enforces the global warm background theme and safe area handling.
 */
export default function ScreenContainer({
  children,
  edges = ['top'],
  style,
}: ScreenContainerProps) {
  return (
    <SafeAreaView style={[styles.container, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_COLORS.bgWarm,
  },
});
