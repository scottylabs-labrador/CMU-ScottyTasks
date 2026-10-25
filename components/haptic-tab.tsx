import React from "react";
import { StyleSheet } from "react-native";
import { BottomTabBarButtonProps } from "expo-router/js-tabs";
import { PlatformPressable } from "expo-router/react-navigation";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { MOTION_DURATION, MOTION_EASING, MOTION_SPRING } from "@/constants/motion";

export function HapticTab(props: BottomTabBarButtonProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        if (!reducedMotion) {
          scale.set(
            withTiming(0.92, {
              duration: MOTION_DURATION.pressIn,
              easing: MOTION_EASING.outCubic,
            })
          );
        }
        if (process.env.EXPO_OS === "ios") {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
      onPressOut={(ev) => {
        scale.set(reducedMotion ? 1 : withSpring(1, MOTION_SPRING.press));
        props.onPressOut?.(ev);
      }}
    >
      <Animated.View style={[styles.inner, animStyle]}>
        {props.children}
      </Animated.View>
    </PlatformPressable>
  );
}

const styles = StyleSheet.create({
  inner: {
    alignItems: "center",
    justifyContent: "center",
  },
});
