import {
  View,
  ImageBackground,
  StyleSheet,
} from "react-native";
import {
  SafeAreaView,
} from "react-native-safe-area-context";
import ScottyLogoSvg from "@/assets/images/scottyLogo.svg"; 
import { useHideAndroidNavBar } from "@/hooks/useHideAndroidNavBar";
import { useBackgroundScale } from "@/hooks/useBackgroundScale";

const BACKGROUND = require("@/assets/images/scottyBackground.png");

export default function ScottyScreen() {
  useHideAndroidNavBar();
  const bgScale = useBackgroundScale(390);

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ImageBackground
        source={BACKGROUND}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Logo sits at the top, separate from the background */}
        <View style={styles.logoContainer}>
          <ScottyLogoSvg
            width={Math.round(200 * bgScale)}
            height={Math.round(60 * bgScale)}
          />
        </View>

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
  scene: { flex: 1, justifyContent: "flex-end", alignItems: "center" },
});