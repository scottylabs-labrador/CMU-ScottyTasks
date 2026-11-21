import React, { useLayoutEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { useOptionalSettings } from "@/hooks/useSettings";

/** Keep both calendars measured so the surrounding list follows the changing height. */
export default function CalendarTransition({ expanded, week, month }: {
  expanded: boolean;
  week: React.ReactNode;
  month: React.ReactNode;
}) {
  const [weekHeight, setWeekHeight] = useState(0);
  const [monthHeight, setMonthHeight] = useState(0);
  const initialized = useRef(false);
  const osReducedMotion = useReducedMotion();
  const { settings } = useOptionalSettings();
  const reducedMotion = osReducedMotion || settings.reduceMotion;
  const height = useSharedValue(64);
  const progress = useSharedValue(expanded ? 1 : 0);

  useLayoutEffect(() => {
    const targetHeight = expanded ? monthHeight : weekHeight;
    if (!targetHeight) return;
    if (!initialized.current || reducedMotion) {
      height.value = targetHeight;
      progress.value = expanded ? 1 : 0;
      initialized.current = true;
      return;
    }
    const config = { duration: 110, easing: Easing.out(Easing.quad) };
    height.value = withTiming(targetHeight, config);
    progress.value = withTiming(expanded ? 1 : 0, config);
  }, [expanded, height, monthHeight, progress, reducedMotion, weekHeight]);

  const containerStyle = useAnimatedStyle(() => ({ height: height.value }));
  const weekStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));
  const monthStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Animated.View style={[styles.layer, weekStyle]} pointerEvents={expanded ? "none" : "auto"} accessibilityElementsHidden={expanded} importantForAccessibility={expanded ? "no-hide-descendants" : "auto"}>
        <View onLayout={(event) => setWeekHeight(event.nativeEvent.layout.height)}>{week}</View>
      </Animated.View>
      <Animated.View style={[styles.layer, monthStyle]} pointerEvents={expanded ? "auto" : "none"} accessibilityElementsHidden={!expanded} importantForAccessibility={expanded ? "auto" : "no-hide-descendants"}>
        <View onLayout={(event) => setMonthHeight(event.nativeEvent.layout.height)}>{month}</View>
      </Animated.View>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  container: { overflow: "hidden" },
  layer: { position: "absolute", top: 0, left: 0, right: 0 },
});
