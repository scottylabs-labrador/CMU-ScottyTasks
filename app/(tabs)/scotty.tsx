import {
  View,
  ImageBackground,
  StyleSheet,
  Pressable,
  Text,
  useWindowDimensions,
  Platform,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
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

export default function ScottyScreen() {
  useHideAndroidNavBar();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useUserShopProfile();
  const backgroundSource =
    backgroundSceneSources[profile?.equippedBackgroundId ?? DEFAULT_BACKGROUND_ID] ??
    backgroundSceneSources[DEFAULT_BACKGROUND_ID];
  const dogHouseSource =
    dogHouseSources[profile?.equippedDogHouseId ?? DEFAULT_DOG_HOUSE_ID] ??
    dogHouseSources[DEFAULT_DOG_HOUSE_ID];
  const toySource =
    toySources[profile?.equippedToyId ?? DEFAULT_TOY_ID] ??
    toySources[DEFAULT_TOY_ID];
  const dogSize = Math.min(width * 0.33, 174);
  const houseWidth = Math.min(width * 0.34, 176);
  const houseHeight = houseWidth * 1.02;
  const toySize = Math.min(width * 0.18, 92);
  const bottomInset = Math.max(insets.bottom, 14);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ImageBackground
        source={backgroundSource}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.header}>
          <View style={styles.logoBlock}>
            <ExpoImage
              source={require("@/assets/images/ScottyLogo.png")}
              style={styles.headerLogo}
              contentFit="contain"
            />
          </View>
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
          <ExpoImage
            source={require("@/assets/images/Scotty.png")}
            style={[
              styles.dog,
              {
                width: dogSize,
                height: dogSize,
                left: width * 0.18,
                bottom: Math.max(height * 0.22, 150) + bottomInset,
              },
            ]}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
          <ExpoImage
            source={dogHouseSource}
            style={[
              styles.house,
              {
                width: houseWidth,
                height: houseHeight,
                right: width * 0.08,
                bottom: Math.max(height * 0.24, 166) + bottomInset,
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
                left: width * 0.46,
                bottom: Math.max(height * 0.215, 140) + bottomInset,
              },
            ]}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, width: "100%", height: "100%" },
  header: {
    paddingTop: 10,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  logoBlock: {
    maxWidth: "72%",
  },
  headerLogo: {
    width: 220,
    height: 84,
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
    boxShadow: Platform.OS === "web" ? "0px 3px 10px rgba(0, 0, 0, 0.14)" : undefined,
    elevation: 4,
  },
  shopButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#9d5a39",
  },
  scene: {
    flex: 1,
    position: "relative",
  },
  dog: {
    position: "absolute",
    zIndex: 4,
  },
  house: {
    position: "absolute",
    zIndex: 2,
  },
  toy: {
    position: "absolute",
    zIndex: 3,
  },
});
