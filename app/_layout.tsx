import { useEffect, useState } from "react";
import { Platform, AppState } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { auth, onAuthStateChanged } from "@/config/firebase";

export const unstable_settings = {
  anchor: "(tabs)/scotty",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Android nav bar hiding
  useEffect(() => {
    if (Platform.OS === "android") {
      const hideNavBar = async () => {
        await NavigationBar.setBehaviorAsync("inset-swipe");
        await NavigationBar.setVisibilityAsync("hidden");
      };
      hideNavBar();
      const appStateSubscription = AppState.addEventListener(
        "change",
        (nextAppState) => {
          if (nextAppState === "active") hideNavBar();
        },
      );
      const visibilitySubscription = NavigationBar.addVisibilityListener(
        ({ visibility }) => {
          if (visibility === "visible") hideNavBar();
        },
      );
      return () => {
        appStateSubscription.remove();
        visibilitySubscription.remove();
      };
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isAuthenticated === null) return;
    const inAuthPages = segments[0] === "login" || segments[0] === "signup";

    if (!isAuthenticated && !inAuthPages) {
      router.replace("/login");
    } else if (isAuthenticated && inAuthPages) {
      router.replace("/(tabs)/scotty");
    }
  }, [isAuthenticated, router, segments]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
