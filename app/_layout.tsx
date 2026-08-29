import { useEffect, useState } from "react";
import { Platform, AppState } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import {
  DarkTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { auth, onAuthStateChanged } from "@/config/firebase";
import { UI_COLORS } from "@/constants/gamification";

export const unstable_settings = {
  anchor: "(tabs)/tasks",
};

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: UI_COLORS.bgWarm,
    card: UI_COLORS.bgCard,
    text: UI_COLORS.textPrimary,
    border: UI_COLORS.border,
    primary: UI_COLORS.cmuRed,
  },
};

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Android navigation bar appearance
  useEffect(() => {
    if (Platform.OS === "android") {
      const hideNavBar = async () => {
        try {
          await NavigationBar.setBehaviorAsync("inset-swipe");
          await NavigationBar.setVisibilityAsync("hidden");
        } catch {
          // ignore on web/unsupported
        }
      };
      hideNavBar();
      const appStateSubscription = AppState.addEventListener(
        "change",
        (nextAppState) => {
          if (nextAppState === "active") hideNavBar();
        }
      );
      return () => {
        appStateSubscription.remove();
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
      router.replace("/(tabs)/tasks");
    }
  }, [isAuthenticated, router, segments]);

  return (
    <ThemeProvider value={CustomDarkTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: UI_COLORS.bgWarm },
        }}
      >
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>

      <StatusBar style="light" />
    </ThemeProvider>
  );
}
