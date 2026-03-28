import {
  View,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import TasksSvg from "@/assets/images/tasks.svg";
import ScottyLogoSvg from "@/assets/images/scottyLogo.svg"; // ← add your logo SVG
import { useHideAndroidNavBar } from "@/hooks/useHideAndroidNavBar";
import { useBackgroundScale } from "@/hooks/useBackgroundScale";

const BACKGROUND = require("@/assets/images/scottyBackground.png");

export default function ScottyScreen() {
  useHideAndroidNavBar();
  const router = useRouter();
  const bgScale = useBackgroundScale(390);
  const insets = useSafeAreaInsets();

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
        <View style={styles.scene}>{/* Scotty, House, UI go here */}</View>

        {/* Tasks button pinned to bottom-right */}
        <TouchableOpacity
          style={[
            styles.tasksButton,
            { bottom: insets.bottom + 20, right: 20 },
          ]}
          onPress={() => router.push("/(tabs)/tasks")}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Open Tasks"
        >
          <TasksSvg
            width={Math.round(80 * bgScale)}
            height={Math.round(63 * bgScale)}
          />
        </TouchableOpacity>
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
  tasksButton: {
    position: "absolute",
  },
});
