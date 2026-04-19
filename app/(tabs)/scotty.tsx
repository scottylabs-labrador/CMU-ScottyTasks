import {
  View,
  ImageBackground,
  StyleSheet,
  Pressable,
  Text,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Image as ExpoImage } from "expo-image";
import { StatusBar } from "expo-status-bar";
import {
  backgroundSceneSources,
  DEFAULT_BACKGROUND_ID,
  DEFAULT_DOG_HOUSE_ID,
  DEFAULT_TOY_ID,
  dogHouseSources,
  toySources,
} from "@/constants/shop";
import { useUserShopProfile } from "@/hooks/useUserShopProfile";
import { useHideAndroidNavBar } from "@/hooks/useHideAndroidNavBar";
import ScottyLogo from "@/components/ScottyLogo";

export default function ScottyScreen() {
  useHideAndroidNavBar();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useUserShopProfile();

  const backgroundSource =
    backgroundSceneSources[
      profile?.equippedBackgroundId ?? DEFAULT_BACKGROUND_ID
    ] ?? backgroundSceneSources[DEFAULT_BACKGROUND_ID];
  const dogHouseSource =
    dogHouseSources[profile?.equippedDogHouseId ?? DEFAULT_DOG_HOUSE_ID] ??
    dogHouseSources[DEFAULT_DOG_HOUSE_ID];
  const toySource =
    toySources[profile?.equippedToyId ?? DEFAULT_TOY_ID] ??
    toySources[DEFAULT_TOY_ID];

  // Dog Positioning (Foreground - Stay Put)
  const dogSize = Math.min(width * 0.42, 214);
  const dogLeft = (width - dogSize) / 2 - 40; 
  const dogBottom = Math.max(height * 0.28, 210) + Math.max(insets.bottom, 14);

  // Dog House Positioning (Background - Pushed Further)
  const houseWidth = Math.min(width * 0.45, 240);
  const houseHeight = houseWidth * 1.02;
  
  // RIGHT: Decreased right offset from 0.02 to 0.0 (flush to edge) or negative to peek off-screen
  const houseRight = width * 0.0; 
  // UP: Increased bottom multiplier from 0.32 to 0.38
  const houseBottom = Math.max(height * 0.38, 270) + Math.max(insets.bottom, 14);

  const toySize = Math.min(width * 0.16, 84);
  const bottomInset = Math.max(insets.bottom, 14);

  return (
    <ImageBackground
      source={backgroundSource}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar hidden />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <ScottyLogo />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open shop"
            onPress={() => router.push("/(tabs)/shop")}
            style={styles.shopButton}
          >
            <Ionicons name="bag-handle-outline" size={20} color="#9d5a39" />
            <Text style={styles.shopButtonText}>{profile?.coins ?? 0}</Text>
          </Pressable>
        </View>

        <View style={styles.scene}>
          {/* Scotty in Foreground */}
          <ExpoImage
            source={require("@/assets/images/scotty.svg")}
            style={[
              styles.dog,
              {
                width: dogSize,
                height: dogSize,
                left: dogLeft,
                bottom: dogBottom,
              },
            ]}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
          
          {/* House in Background */}
          <ExpoImage
            source={dogHouseSource}
            style={[
              styles.house,
              {
                width: houseWidth,
                height: houseHeight,
                right: houseRight,
                bottom: houseBottom,
              },
            ]}
            contentFit="contain"
            cachePolicy="memory-disk"
          />

          <ExpoImage
            source={toySource}
            style={[
              styles.toy,
              {
                width: toySize,
                height: toySize,
                left: Math.max(width * 0.26, 84),
                bottom: Math.max(height * 0.23, 170) + bottomInset,
              },
            ]}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  header: {
    paddingTop: 10,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  shopButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 68,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.92)",
    elevation: 4,
  },
  shopButtonText: { fontSize: 15, fontWeight: "800", color: "#9d5a39" },
  scene: { flex: 1, position: "relative" },
  dog: { position: "absolute", zIndex: 4 },
  house: { position: "absolute", zIndex: 2 },
  toy: { position: "absolute", zIndex: 3 },
});