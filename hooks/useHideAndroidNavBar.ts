import { useEffect } from "react";
import { Platform } from "react-native";
import { NavigationBar } from "expo-navigation-bar";

export function useHideAndroidNavBar() {
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setHidden(true);
    }
  }, []);
}
