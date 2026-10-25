import React, { useEffect } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Image as ExpoImage } from "expo-image";

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
  const reducedMotion = useReducedMotion();
  const angleDeg = useSharedValue(0);

  useEffect(() => {
    if (!animated || reducedMotion) {
      cancelAnimation(angleDeg);
      angleDeg.value = 0;
      return;
    }

    angleDeg.value = withRepeat(
      withSequence(
        withTiming(4, { duration: 480 }),
        withTiming(-4, { duration: 480 }),
        withTiming(0, { duration: 480 })
      ),
      -1,
      false
    );

    return () => {
      cancelAnimation(angleDeg);
    };
  }, [angleDeg, animated, reducedMotion]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${angleDeg.value}deg` }],
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
        source={require("@/assets/images/scotty.svg")}
        style={{ width: size, height: size }}
        contentFit="contain"
        cachePolicy="memory-disk"
      />
    </Animated.View>
  );
}
