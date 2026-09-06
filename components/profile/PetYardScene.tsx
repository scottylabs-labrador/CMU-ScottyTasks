import React, { memo } from 'react';
import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import {
  backgroundSceneSources,
  DEFAULT_BACKGROUND_ID,
  DEFAULT_DOG_HOUSE_ID,
  DEFAULT_TOY_ID,
  dogHouseSources,
  toySources,
  UserShopProfile,
} from '@/constants/shop';
import { UI_COLORS } from '@/constants/gamification';
import { fontSize, fontWeight, radii, spacing } from '@/constants/tokens';

export interface PetYardSceneProps {
  /** The user's shop & inventory profile containing equipped IDs and coins */
  profile: UserShopProfile;
  /** Callback fired when user taps on the yard scene or shop button */
  onOpenShop: () => void;
  /** Optional custom container height in pixels (default: 180) */
  height?: number;
}

/**
 * PetYardScene
 *
 * Renders an interactive virtual pet yard displaying Scotty's equipped
 * background, dog house, toy, and Scotty himself. Tapping opens the Shop.
 */
function PetYardSceneComponent({
  profile,
  onOpenShop,
  height = 180,
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
    <TouchableOpacity
      style={[styles.container, { height }]}
      onPress={onOpenShop}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={`Scotty's Yard. Customize yard, ${profile.coins} coins.`}
    >
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
            source={require('@/assets/images/scotty.svg')}
            style={styles.sceneDog}
            contentFit="contain"
          />

          {/* Equipped Toy */}
          <ExpoImage
            source={toySource}
            style={styles.sceneToy}
            contentFit="contain"
          />

          {/* Shop button badge */}
          <View style={styles.sceneBadge}>
            <Ionicons name="bag-handle" size={14} color={UI_COLORS.textPrimary} />
            <Text style={styles.sceneBadgeText}>
              Customize Yard ({profile.coins} 🪙)
            </Text>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.xxxl,
    overflow: 'hidden',
    borderColor: UI_COLORS.border,
    borderWidth: 1,
  },
  sceneBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundImage: {
    borderRadius: radii.xxxl,
  },
  sceneOverlay: {
    flex: 1,
    position: 'relative',
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  sceneHouse: {
    position: 'absolute',
    right: spacing.md,
    bottom: 28,
    width: 110,
    height: 110,
  },
  sceneDog: {
    position: 'absolute',
    left: spacing.xxl,
    bottom: spacing.lg,
    width: 80,
    height: 80,
  },
  sceneToy: {
    position: 'absolute',
    left: 100,
    bottom: spacing.md,
    width: 36,
    height: 36,
  },
  sceneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  sceneBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textPrimary,
  },
});

export default memo(PetYardSceneComponent);
