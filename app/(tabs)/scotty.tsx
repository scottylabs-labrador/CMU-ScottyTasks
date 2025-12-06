import React from "react";
import { View, ScrollView, Image, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Platform } from "firebase.ts";

const { width, height } = Dimensions.get("window");

const Colors = {
  sky: "#B8D4E8",
  grass: "#6C9264",
  dogHouseBg: "#EAD9C6",
};

export default function Index() {
  return (
    <SafeAreaView style={styles.container}>
      <Image source={require("@/assets/images/scottyScreen.png")} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  overlayContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  moneyIcon: {
    position: "absolute",
    top: 12,
    right: 16,
    zIndex: 10,
  },
  logo: {
    position: "absolute",
    top: 52,
    left: 16,
    zIndex: 10,
  },
  pathway1: {
    position: "absolute",
    top: 510,
    zIndex: 10,
  },
  pathway2: {
    position: "absolute",
    top: 372,
    zIndex: 10,
  },
  contentInner: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flex: 1,
    paddingBottom: 16,
    zIndex: 10,
  },
  scottyContainer: { alignItems: "center", bottom: 161 },
  scottyGradient: {
    position: "absolute",
    bottom: 0,
    left: -10,
    right: -10,
    height: 96,
    zIndex: -1,
  },
  scottyImage: { width: 128, height: 128 },
  dogHouseContainer: {
    flex: 1,
    alignItems: "flex-end",
    marginRight: -48,
    bottom: 250,
  },
  dogHouseImage: { width: 128, height: 128 },
});
