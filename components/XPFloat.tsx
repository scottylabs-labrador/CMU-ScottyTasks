import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { UI_COLORS } from "@/constants/gamification";

interface XPFloatProps {
  amount: number;
  coins?: number;
  onDone?: () => void;
}

export default function XPFloat({ amount, coins = 0, onDone }: XPFloatProps) {
  const animY = useRef(new Animated.Value(0)).current;
  const animOpacity = useRef(new Animated.Value(0)).current;
  const animScale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(animScale, {
        toValue: 1.1,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(animY, {
        toValue: -70,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(animOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        if (onDone) onDone();
      });
    });
  }, [animOpacity, animScale, animY, onDone]);

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View
        style={[
          styles.badge,
          {
            opacity: animOpacity,
            transform: [{ translateY: animY }, { scale: animScale }],
          },
        ]}
      >
        <Text style={styles.xpText}>+{amount} XP ⚡</Text>
        {coins > 0 && <Text style={styles.coinText}>+{coins} 🪙</Text>}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(28, 28, 46, 0.95)",
    borderColor: UI_COLORS.cmuGold,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: UI_COLORS.cmuGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  xpText: {
    fontSize: 18,
    fontWeight: "900",
    color: UI_COLORS.cmuGold,
  },
  coinText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FBBF24",
  },
});
