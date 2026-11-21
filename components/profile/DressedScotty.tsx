import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { shopItemsById, type ShopItem } from "@/constants/shop";
import { useUserShopProfile } from "@/hooks/useUserShopProfile";
import DraggableToy from "./DraggableToy";
import { type ToyPosition } from "@/utils/toyPosition";

/** All accessories share the dog's square image coordinates, even in a tall viewport. */
export default function DressedScotty({
  preview,
  placingToy = false,
  onToyPositionChange,
  hideToy = false,
  toyOnly = false,
}: {
  preview?: ShopItem;
  placingToy?: boolean;
  onToyPositionChange?: (position: ToyPosition) => void;
  hideToy?: boolean;
  toyOnly?: boolean;
}) {
  const { profile } = useUserShopProfile();
  const [size, setSize] = useState(0);
  const [width, setWidth] = useState(0);
  const hat =
    preview?.category === "hats"
      ? preview
      : shopItemsById[profile.equippedHatId ?? ""];
  const glasses =
    preview?.category === "glasses"
      ? preview
      : shopItemsById[profile.equippedGlassesId ?? ""];
  const toy =
    preview?.category === "toys"
      ? preview
      : shopItemsById[profile.equippedToyId];
  return (
    <View
      style={styles.container}
      pointerEvents={toyOnly ? "none" : "box-none"}
      onLayout={({ nativeEvent: { layout } }) => {
        setSize(Math.min(layout.width, layout.height));
        setWidth(layout.width);
      }}
    >
      {!toyOnly && (
        <View style={{ width: size, height: size }}>
          <Image
            source={require("@/assets/images/scotty-logo-main.png")}
            style={styles.dog}
            contentFit="contain"
            accessibilityLabel="Scotty"
          />
          {hat && (
            <Image
              source={hat.image}
              style={[
                styles.hat,
                hat.id === "hat-graduation"
                  ? styles.graduationCap
                  : styles.baseballCap,
              ]}
              contentFit="contain"
              accessibilityLabel={hat.label}
            />
          )}
          {glasses && (
            <Image
              source={glasses.image}
              style={styles.glasses}
              contentFit="contain"
              accessibilityLabel={glasses.label}
            />
          )}
        </View>
      )}
      {!hideToy && toy && (
        <View
          pointerEvents="box-none"
          style={[styles.toyLayer, { width, height: size }]}
        >
          <DraggableToy
            key={`${toy.id}:${placingToy}`}
            item={toy}
            sceneSize={size}
            sceneWidth={width}
            editable={placingToy}
            initialPosition={profile.toyPositions?.[toy.id]}
            onPositionChange={onToyPositionChange}
          />
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  toyLayer: { position: "absolute" },
  dog: { width: "100%", height: "100%" },
  hat: { position: "absolute" },
  // The graduation PNG has large transparent margins; the baseball PNG is tightly cropped.
  // Fit each canvas separately so the visible hat sits across the top of Scotty's head.
  graduationCap: { left: "27%", top: "-6%", width: "40%", height: "40%" },
  baseballCap: { left: "33%", top: "3%", width: "24%", height: "18%" },
  glasses: {
    position: "absolute",
    left: "34%",
    top: "16%",
    width: "30%",
    height: "30%",
  },
});
