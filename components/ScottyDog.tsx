import React, { useEffect, useRef } from "react";
import { Animated, StyleProp, ViewStyle } from "react-native";
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
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: -1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();

    return () => loop.stop();
  }, [animated, rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-4deg", "0deg", "4deg"],
  });

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          transform: animated ? [{ rotate: rotation }] : [],
          justifyContent: "center",
          alignItems: "center",
        },
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
