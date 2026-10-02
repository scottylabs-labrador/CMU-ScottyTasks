import { useEffect } from "react";
import { NavigationBar } from "expo-navigation-bar";
import {
  DefaultTheme,
  ThemeProvider,
} from "expo-router/react-navigation";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { UserShopProfileProvider } from "@/contexts/UserShopProfileContext";
import { UI_COLORS } from "@/constants/gamification";

export const unstable_settings = {
  anchor: "(tabs)/scotty",
};

const CampusNotebookTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: UI_COLORS.bgWarm,
    card: UI_COLORS.bgCard,
    text: UI_COLORS.textPrimary,
    border: UI_COLORS.border,
    primary: UI_COLORS.cmuRed,
  },
};

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { user, guest, loading } = useAuth();
  const isAuthenticated = !!user || guest;

  useEffect(() => {
    if (loading) return;
    const inAuthPages = segments[0] === "login" || segments[0] === "signup";

    if (!isAuthenticated && !inAuthPages) {
      router.replace("/login");
    } else if (isAuthenticated && inAuthPages) {
      router.replace("/(tabs)/scotty");
    }
  }, [isAuthenticated, loading, router, segments]);

  return (
    <ThemeProvider value={CampusNotebookTheme}>
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

      <StatusBar style="dark" />
      <NavigationBar hidden style="dark" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return <AuthProvider><UserShopProfileProvider><RootNavigator /></UserShopProfileProvider></AuthProvider>;
}
