import React, { memo } from "react";
import {
  ImageBackground,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import {
  backgroundSceneSources,
  DEFAULT_BACKGROUND_ID,
  DEFAULT_DOG_HOUSE_ID,
  DEFAULT_TOY_ID,
  dogHouseSources,
  toySources,
  UserShopProfile,
} from "@/constants/shop";
import { UI_COLORS } from "@/constants/gamification";
import { fontSize, fontWeight, radii, spacing } from "@/constants/tokens";

export interface PetYardSceneProps {
  /** The user's shop & inventory profile containing equipped IDs and coins */
  profile: UserShopProfile;
  /** Callback fired when user taps on the shop button or coin chip */
  onOpenShop: () => void;
  /** Optional custom container height in pixels */
  height?: number;
  /** Optional container style override */
  style?: StyleProp<ViewStyle>;
}

/**
 * PetYardScene
 *
 * Renders an interactive virtual pet yard displaying Scotty's equipped
 * background, dog house, toy, and Scotty himself.
 * Includes a coin balance chip and a circular Shop button.
 */
function PetYardSceneComponent({
  profile,
  onOpenShop,
  height,
  style,
}: PetYardSceneProps) {
  const backgroundSource =
    backgroundSceneSources[
      profile.equippedBackgroundId ?? DEFAULT_BACKGROUND_ID
    ] ?? backgroundSceneSources[DEFAULT_BACKGROUND_ID];

  const dogHouseSource =
    dogHouseSources[profile.equippedDogHouseId ?? DEFAULT_DOG_HOUSE_ID] ??
    dogHouseSources[DEFAULT_DOG_HOUSE_ID];

  const toySource =
    toySources[profile.equippedToyId ?? DEFAULT_TOY_ID] ??
    toySources[DEFAULT_TOY_ID];

  return (
    <View style={[styles.container, height ? { height } : styles.flexFill, style]}>
      <ImageBackground
        source={backgroundSource}
        style={styles.sceneBackground}
        imageStyle={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.sceneOverlay}>
          {/* Equipped Dog House in background */}
          <ExpoImage
            source={dogHouseSource}
            style={styles.sceneHouse}
            contentFit="contain"
          />

          {/* Scotty dog in foreground */}
          <ExpoImage
            source={require("@/assets/images/scotty.svg")}
            style={styles.sceneDog}
            contentFit="contain"
          />

          {/* Equipped Toy */}
          <ExpoImage
            source={toySource}
            style={styles.sceneToy}
            contentFit="contain"
          />

          {/* Bottom Controls: Coin Chip & Circular Shop Button */}
          <View style={styles.sceneControlsRow}>
            <TouchableOpacity
              style={styles.coinBadge}
              onPress={onOpenShop}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`You have ${profile.coins} coins. Tap to open shop.`}
            >
              <Text style={styles.coinBadgeIcon}>🪙</Text>
              <Text style={styles.coinBadgeText}>{profile.coins}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.circularShopBtn}
              onPress={onOpenShop}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Open Scotty Shop"
            >
              <Ionicons name="bag-handle" size={22} color={UI_COLORS.textOnAccent} />
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.xxxl,
    overflow: "hidden",
    borderColor: UI_COLORS.border,
    borderWidth: 1,
  },
  flexFill: {
    flex: 1,
  },
  sceneBackground: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  backgroundImage: {
    borderRadius: radii.xxxl,
  },
  sceneOverlay: {
    flex: 1,
    position: "relative",
    justifyContent: "flex-end",
    padding: spacing.lg,
  },
  sceneHouse: {
    position: "absolute",
    right: spacing.md,
    bottom: 28,
    width: 120,
    height: 120,
  },
  sceneDog: {
    position: "absolute",
    left: spacing.xxl,
    bottom: spacing.lg,
    width: 90,
    height: 90,
  },
  sceneToy: {
    position: "absolute",
    left: 115,
    bottom: spacing.md,
    width: 40,
    height: 40,
  },
  sceneControlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    zIndex: 10,
  },
  coinBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    backgroundColor: UI_COLORS.bgCard,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
  },
  coinBadgeIcon: {
    fontSize: fontSize.base,
  },
  coinBadgeText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.cmuGold,
  },
  circularShopBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: UI_COLORS.cmuRed,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: UI_COLORS.border,
  },
});

export default memo(PetYardSceneComponent);
