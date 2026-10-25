import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type Insets,
  type AccessibilityRole,
  type AccessibilityState,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeOutUp,
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { UI_COLORS } from "@/constants/gamification";
import {
  MOTION_DURATION,
  MOTION_EASING,
  MOTION_SPRING,
  MOTION_STAGGER,
} from "@/constants/motion";

/* -------------------------------------------------------------------------- */
/* 1. PressableScale — Tactile button, chip, checkbox, and FAB micro-motion   */
/* -------------------------------------------------------------------------- */

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps {
  children: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  onPressIn?: (event: GestureResponderEvent) => void;
  onPressOut?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  /** Target scale while pressed down (default: 0.96) */
  scaleTo?: number;
  /** Optional subtle haptic on press-in (native iOS/Android) */
  haptic?: "none" | "selection" | "light";
  style?: StyleProp<ViewStyle>;
  hitSlop?: Insets | number;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityState?: AccessibilityState;
}

export function PressableScale({
  children,
  onPress,
  onPressIn,
  onPressOut,
  disabled = false,
  scaleTo = 0.96,
  haptic = "none",
  style,
  hitSlop,
  accessibilityRole = "button",
  accessibilityLabel,
  accessibilityState,
}: PressableScaleProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      if (!disabled) {
        if (!reducedMotion) {
          scale.set(
            withTiming(scaleTo, {
              duration: MOTION_DURATION.pressIn,
              easing: MOTION_EASING.outCubic,
            })
          );
        }
        opacity.set(
          withTiming(0.88, {
            duration: MOTION_DURATION.pressIn,
            easing: MOTION_EASING.outCubic,
          })
        );
        if (Platform.OS !== "web" && haptic !== "none") {
          if (haptic === "light") {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } else {
            void Haptics.selectionAsync();
          }
        }
      }
      onPressIn?.(e);
    },
    [disabled, haptic, onPressIn, opacity, reducedMotion, scale, scaleTo]
  );

  const handlePressOut = useCallback(
    (e: GestureResponderEvent) => {
      scale.set(reducedMotion ? 1 : withSpring(1, MOTION_SPRING.press));
      opacity.set(
        withTiming(1, {
          duration: MOTION_DURATION.fast,
          easing: MOTION_EASING.outCubic,
        })
      );
      onPressOut?.(e);
    },
    [onPressOut, opacity, reducedMotion, scale]
  );

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={hitSlop}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. AnimatedModal — Smooth enter + exit transitions for popups & sheets     */
/* -------------------------------------------------------------------------- */

export type ModalMotionVariant = "dialog" | "sheet" | "fullscreen";

export interface AnimatedModalProps {
  visible: boolean;
  onClose?: () => void;
  variant?: ModalMotionVariant;
  dismissOnBackdropPress?: boolean;
  overlayStyle?: StyleProp<ViewStyle>;
  cardStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function AnimatedModal({
  visible,
  onClose,
  variant = "dialog",
  dismissOnBackdropPress = false,
  overlayStyle,
  cardStyle,
  children,
}: AnimatedModalProps) {
  const reducedMotion = useReducedMotion();
  const [rendered, setRendered] = useState(visible);

  if (visible && !rendered) {
    setRendered(true);
  }

  const backdropOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentScale = useSharedValue(variant === "dialog" ? 0.92 : 0.98);
  const contentTranslateY = useSharedValue(
    variant === "sheet" ? 48 : variant === "fullscreen" ? 52 : 18
  );

  const finishUnmount = useCallback(() => {
    setRendered(false);
  }, []);

  useEffect(() => {
    if (!rendered) return;

    if (visible) {
      if (reducedMotion) {
        backdropOpacity.value = withTiming(1, { duration: 120 });
        contentOpacity.value = withTiming(1, { duration: 120 });
        contentScale.value = 1;
        contentTranslateY.value = 0;
        return;
      }

      backdropOpacity.value = 0;
      contentOpacity.value = 0;
      contentScale.value = variant === "dialog" ? 0.92 : 0.98;
      contentTranslateY.value =
        variant === "sheet" ? 48 : variant === "fullscreen" ? 52 : 18;

      backdropOpacity.value = withTiming(1, {
        duration: MOTION_DURATION.normal,
        easing: MOTION_EASING.outCubic,
      });
      contentOpacity.value = withTiming(1, {
        duration: MOTION_DURATION.normal,
        easing: MOTION_EASING.outCubic,
      });
      contentScale.value = withSpring(
        1,
        variant === "dialog" ? MOTION_SPRING.dialog : MOTION_SPRING.sheet
      );
      contentTranslateY.value = withSpring(
        0,
        variant === "dialog" ? MOTION_SPRING.dialog : MOTION_SPRING.sheet
      );
    } else {
      const exitDuration = reducedMotion ? 100 : MOTION_DURATION.fast;
      backdropOpacity.value = withTiming(0, {
        duration: exitDuration,
        easing: MOTION_EASING.inCubic,
      });
      contentScale.value = withTiming(variant === "dialog" ? 0.95 : 0.985, {
        duration: exitDuration,
        easing: MOTION_EASING.inCubic,
      });
      contentTranslateY.value = withTiming(
        variant === "sheet" ? 36 : variant === "fullscreen" ? 40 : 12,
        {
          duration: exitDuration,
          easing: MOTION_EASING.inCubic,
        }
      );
      contentOpacity.value = withTiming(
        0,
        {
          duration: exitDuration,
          easing: MOTION_EASING.inCubic,
        },
        (finished) => {
          if (finished) {
            runOnJS(finishUnmount)();
          }
        }
      );
    }
  }, [
    backdropOpacity,
    contentOpacity,
    contentScale,
    contentTranslateY,
    finishUnmount,
    reducedMotion,
    rendered,
    variant,
    visible,
  ]);

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [
      { translateY: contentTranslateY.value },
      { scale: contentScale.value },
    ],
  }));

  if (!rendered) return null;

  return (
    <Modal
      visible={rendered}
      transparent
      animationType="none"
      statusBarTranslucent={variant === "fullscreen"}
      onRequestClose={onClose}
    >
      <View
        style={[
          variant === "fullscreen"
            ? styles.fullscreenContainer
            : variant === "sheet"
            ? styles.sheetContainer
            : styles.dialogContainer,
          overlayStyle,
        ]}
      >
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.backdrop, backdropAnimStyle]}
        />

        {dismissOnBackdropPress && onClose ? (
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close modal backdrop"
          />
        ) : null}

        <Animated.View
          style={[
            variant === "fullscreen" && styles.fullscreenCard,
            cardStyle,
            cardAnimStyle,
          ]}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. AnimatedCollapsible — Smooth toolbar & section expand/collapse          */
/* -------------------------------------------------------------------------- */

export interface AnimatedCollapsibleProps {
  visible: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function AnimatedCollapsible({
  visible,
  style,
  children,
}: AnimatedCollapsibleProps) {
  if (!visible) return null;
  return (
    <Animated.View
      entering={FadeInDown.duration(260)}
      exiting={FadeOutUp.duration(190)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. FadeSwitchView — Smooth cross-fade + settle when switching sub-views    */
/* -------------------------------------------------------------------------- */

export interface FadeSwitchViewProps {
  viewKey: string | number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function FadeSwitchView({
  viewKey,
  style,
  children,
}: FadeSwitchViewProps) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    opacity.value = 0.25;
    translateY.value = 8;
    opacity.value = withTiming(1, {
      duration: MOTION_DURATION.normal,
      easing: MOTION_EASING.outCubic,
    });
    translateY.value = withTiming(0, {
      duration: MOTION_DURATION.normal,
      easing: MOTION_EASING.outCubic,
    });
  }, [opacity, reducedMotion, translateY, viewKey]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
}

/* -------------------------------------------------------------------------- */
/* 5. WaveItem — Staggered one-by-one float-up cascade for item lists         */
/* -------------------------------------------------------------------------- */

export interface WaveItemProps {
  /** 0-based position in the list — determines stagger delay (`index * stepMs`) */
  index: number;
  /** Optional key that replays the wave when active tab/filter/date/step changes */
  waveKey?: string | number;
  /** Initial downward offset in px before floating up (default: 18) */
  distance?: number;
  /** Delay step between consecutive items in ms (default: 55ms) */
  stepMs?: number;
  /** Animate vertical position smoothly when sibling items are removed/reordered */
  layoutTransition?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function WaveItem({
  index,
  waveKey = "default",
  distance = 18,
  stepMs = MOTION_STAGGER.stepMs,
  layoutTransition = false,
  style,
  children,
}: WaveItemProps) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const translateY = useSharedValue(reducedMotion ? 0 : distance);

  const waveParamsRef = useRef({ index, distance, stepMs });
  useLayoutEffect(() => {
    waveParamsRef.current = { index, distance, stepMs };
  });

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }

    const { index: curIndex, distance: curDistance, stepMs: curStep } =
      waveParamsRef.current;
    const clampedIndex = Math.max(
      0,
      Math.min(curIndex, MOTION_STAGGER.maxIndex)
    );
    const delayMs = clampedIndex * curStep;

    opacity.value = 0;
    translateY.value = curDistance;

    opacity.value = withDelay(
      delayMs,
      withTiming(1, {
        duration: MOTION_DURATION.waveItem,
        easing: MOTION_EASING.outCubic,
      })
    );
    translateY.value = withDelay(
      delayMs,
      withTiming(0, {
        duration: MOTION_DURATION.waveItem,
        easing: MOTION_EASING.outCubic,
      })
    );
  }, [opacity, reducedMotion, translateY, waveKey]);

  const waveStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (layoutTransition) {
    return (
      <Animated.View layout={SMOOTH_LIST_LAYOUT} style={style}>
        <Animated.View style={waveStyle}>{children}</Animated.View>
      </Animated.View>
    );
  }

  return <Animated.View style={[style, waveStyle]}>{children}</Animated.View>;
}

/* -------------------------------------------------------------------------- */
/* 6. AnimatedTabIcon — Gentle spring lift on active bottom-tab icon          */
/* -------------------------------------------------------------------------- */

export function AnimatedTabIcon({
  focused,
  children,
}: {
  focused: boolean;
  children: React.ReactNode;
}) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(focused ? 1.1 : 1);
  const translateY = useSharedValue(focused ? -1.5 : 0);

  useEffect(() => {
    if (reducedMotion) {
      scale.value = 1;
      translateY.value = 0;
      return;
    }
    scale.value = withSpring(focused ? 1.1 : 1, MOTION_SPRING.pop);
    translateY.value = withSpring(focused ? -1.5 : 0, MOTION_SPRING.pop);
  }, [focused, reducedMotion, scale, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return <Animated.View style={animStyle}>{children}</Animated.View>;
}

export const SMOOTH_LIST_LAYOUT = LinearTransition.springify()
  .damping(22)
  .stiffness(200);

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: UI_COLORS.overlay,
    pointerEvents: "none",
  },
  dialogContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  sheetContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  fullscreenContainer: {
    flex: 1,
  },
  fullscreenCard: {
    flex: 1,
    width: "100%",
  },
});
