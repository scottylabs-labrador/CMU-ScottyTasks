import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { UI_COLORS } from "@/constants/gamification";
import { MOTION_EASING } from "@/constants/motion";
import { shadows } from "@/constants/tokens";

interface XPFloatProps {
  amount: number;
  coins?: number;
  onDone?: () => void;
}

export default function XPFloat({ amount, coins = 0, onDone }: XPFloatProps) {
  const animY = useSharedValue(0);
  const animOpacity = useSharedValue(0);
  const animScale = useSharedValue(0.72);

  useEffect(() => {
    animOpacity.value = withSequence(
      withTiming(1, { duration: 240, easing: MOTION_EASING.outCubic }),
      withDelay(
        980,
        withTiming(
          0,
          { duration: 360, easing: MOTION_EASING.inCubic },
          (finished) => {
            if (finished && onDone) {
              runOnJS(onDone)();
            }
          }
        )
      )
    );
    animScale.value = withSpring(1.08, {
      damping: 12,
      stiffness: 200,
    });
    animY.value = withTiming(-72, {
      duration: 1350,
      easing: MOTION_EASING.outCubic,
    });
  }, [animOpacity, animScale, animY, onDone]);

  const badgeAnimStyle = useAnimatedStyle(() => ({
    opacity: animOpacity.value,
    transform: [{ translateY: animY.value }, { scale: animScale.value }],
  }));

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.badge, badgeAnimStyle]}>
        <Text style={styles.xpText}>+{amount} XP ⚡</Text>
        {coins > 0 && <Text style={styles.coinText}>+{coins} 🪙</Text>}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    pointerEvents: "none",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.cmuGold,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    ...shadows.glow(UI_COLORS.cmuGold),
  },
  xpText: {
    fontSize: 18,
    fontWeight: "900",
    color: UI_COLORS.cmuGold,
  },
  coinText: {
    fontSize: 16,
    fontWeight: "800",
    color: UI_COLORS.cmuGold,
  },
});
