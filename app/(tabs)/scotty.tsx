import {
  View,
  ImageBackground,
  StyleSheet,
  Pressable,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
} from "react-native-safe-area-context";
import { backgroundSources, DEFAULT_BACKGROUND_ID } from "@/constants/shop";
import { useUserShopProfile } from "@/hooks/useUserShopProfile";
import { useHideAndroidNavBar } from "@/hooks/useHideAndroidNavBar";
import { useBackgroundScale } from "@/hooks/useBackgroundScale";

export default function ScottyScreen() {
  useHideAndroidNavBar();
  const bgScale = useBackgroundScale(390);
  const router = useRouter();
  const { profile } = useUserShopProfile();
  const backgroundSource =
    backgroundSources[profile?.equippedBackgroundId ?? DEFAULT_BACKGROUND_ID] ??
    backgroundSources[DEFAULT_BACKGROUND_ID];

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ImageBackground
        source={backgroundSource}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Logo sits at the top, separate from the background */}
        <View style={styles.logoContainer}>
          <ExpoImage
            source={require("@/assets/images/ScottyLogo.png")}
            style={{
              width: Math.round(200 * bgScale),
              height: Math.round(60 * bgScale),
            }}
            contentFit="contain"
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open shop"
          onPress={() => router.push("/(tabs)/shop")}
          style={styles.shopButton}
        >
          <Ionicons name="storefront-outline" size={30} color="#9d5a39" />
        </Pressable>

        {/* Scene area for Scotty, House, etc. */}
        <View style={styles.scene}>
          {/* Scotty, House, UI go here */}
        </View>

      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, width: "100%", height: "100%" },
  logoContainer: {
    position: "absolute",
    top: 20,
    alignSelf: "center",
    zIndex: 10,
  },
  shopButton: {
    position: "absolute",
    top: 24,
    right: 16,
    zIndex: 11,
    padding: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.92)",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  scene: { flex: 1, justifyContent: "flex-end", alignItems: "center" },
});
