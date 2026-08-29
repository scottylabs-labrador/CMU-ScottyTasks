import React from "react";
import { View, Text, useWindowDimensions } from "react-native";
import { Image as ExpoImage } from "expo-image";

interface ScottyLogoProps {
  scale?: number; // default 0.1, pass smaller/larger to adjust
}

export default function ScottyLogo({ scale = 0.1 }: ScottyLogoProps) {
  const { width } = useWindowDimensions();
  const fontSize = width * scale;

  return (
    <View style={{ flexDirection: "column" }}>
      <Text
        style={{
          fontSize,
          fontWeight: "800",
          color: "#cc6e47",
          lineHeight: fontSize,
        }}
      >
        CMU
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          flexWrap: "nowrap",
        }}
      >
        <Text
          style={{
            fontSize,
            fontWeight: "800",
            color: "#cc6e47",
            lineHeight: fontSize,
          }}
        >
          Sc
        </Text>
        <ExpoImage
          source={require("@/assets/images/scotty.svg")}
          style={{ width: fontSize, height: fontSize, marginHorizontal: -4 }}
          contentFit="contain"
        />
        <Text
          style={{
            fontSize,
            fontWeight: "800",
            color: "#cc6e47",
            lineHeight: fontSize,
          }}
        >
          tty Tasks
        </Text>
      </View>
    </View>
  );
}
