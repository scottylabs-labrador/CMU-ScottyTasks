import React, { useEffect } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Image as ExpoImage } from "expo-image";
import { useOptionalSettings } from "@/hooks/useSettings";

interface ScottyDogProps {
  size?: number;
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function ScottyDog({
  size = 64,
  animated = true,
  style,
}: ScottyDogProps) {
  const osReducedMotion = useReducedMotion();
  const { settings } = useOptionalSettings();
  const reducedMotion = osReducedMotion || settings.reduceMotion;
  const angleDeg = useSharedValue(0);

  useEffect(() => {
    if (!animated || reducedMotion) {
      cancelAnimation(angleDeg);
      angleDeg.value = 0;
      return;
    }

    angleDeg.value = withRepeat(
      // Drive a complete sine wave, with no extra stop at upright.
      withTiming(Math.PI * 2, { duration: 1400, easing: Easing.linear }),
      -1,
      false,
    );

    return () => {
      cancelAnimation(angleDeg);
    };
  }, [angleDeg, animated, reducedMotion]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${Math.sin(angleDeg.value) * 4}deg` }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          justifyContent: "center",
          alignItems: "center",
        },
        animStyle,
        style,
      ]}
    >
      <ExpoImage
        source={require("@/assets/images/scotty-logo-main.png")}
        style={{ width: size, height: size }}
        contentFit="contain"
        cachePolicy="memory-disk"
      />
    </Animated.View>
  );
}
