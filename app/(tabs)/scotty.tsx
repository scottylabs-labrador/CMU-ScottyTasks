import React from "react";
import { View, ImageBackground, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as NavigationBar from "expo-navigation-bar";
import { useEffect } from "react";
import ScottyBackground from "@/assets/images/scottyBackground.svg";

const BACKGROUND = require("@/assets/images/scottyBackground.png");

const Colors = {
  sky: "#B8D4E8",
  grass: "#6C9264",
  dogHouseBg: "#EAD9C6",
};

export default function Index() {
  useEffect(() => {
    if (Platform.OS === "android") {
      // Hides the bottom bar
      NavigationBar.setVisibilityAsync("hidden");

      // Makes it so a swipe from the edge shows the bar temporarily (Sticky Immersive)
      NavigationBar.setBehaviorAsync("inset-swipe");
    }
  }, []);
  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ImageBackground
        source={BACKGROUND}
        style={styles.background}
        resizeMode="contain"
      >
        {/* Foreground content */}
        <View style={styles.scene}>{/* Scotty, House, UI go here */}</View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, width: "100%", height: "100%" },
  scene: { flex: 1, justifyContent: "flex-end", alignItems: "center" },
});
