import { useEffect, useMemo } from "react";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { NavigationBar } from "expo-navigation-bar";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "expo-router/react-navigation";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import ChatOverlay from "@/components/chat/ChatOverlay";
import { FontReadyContext } from "@/components/ScottyText";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { HabitsProvider } from "@/contexts/HabitsContext";
import { ScottyChatProvider } from "@/contexts/ScottyChatContext";
import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";
import { TasksProvider } from "@/contexts/TasksContext";
import { UserShopProfileProvider } from "@/contexts/UserShopProfileContext";
import { HOME_COLORS } from "@/constants/home";
import { SCOTTY_FONTS } from "@/constants/typography";

export const unstable_settings = {
  anchor: "(tabs)",
};

void SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { user, guest, loading } = useAuth();
  const { settings, theme } = useSettings();
  const isAuthenticated = !!user || guest;

  const navTheme = useMemo(
    () => ({
      ...(theme.isDark ? DarkTheme : DefaultTheme),
      colors: {
        ...(theme.isDark ? DarkTheme.colors : DefaultTheme.colors),
        background: theme.bg,
        card: theme.card,
        text: theme.textPrimary,
        border: theme.border,
        primary: theme.accent,
      },
    }),
    [theme],
  );

  useEffect(() => {
    if (loading) return;
    const inAuthPages = segments[0] === "login" || segments[0] === "signup";

    if (!isAuthenticated && !inAuthPages) {
      router.replace("/login");
    } else if (isAuthenticated && inAuthPages) {
      const target =
        settings.defaultTab === "tasks"
          ? "/(tabs)/tasks"
          : settings.defaultTab === "habits"
            ? "/(tabs)/habits"
            : "/(tabs)/scotty";
      router.replace(target);
    }
  }, [isAuthenticated, loading, router, segments, settings.defaultTab]);

  return (
    <ThemeProvider value={navTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: settings.reduceMotion ? "none" : "fade",
          animationDuration: 280,
          contentStyle: { backgroundColor: theme.bg },
        }}
      >
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false, contentStyle: { backgroundColor: HOME_COLORS.sky } }} />
        <Stack.Screen name="index" options={{ contentStyle: { backgroundColor: HOME_COLORS.sky } }} />
        <Stack.Screen name="shop" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
      </Stack>
      <ChatOverlay />

      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <NavigationBar hidden style={theme.isDark ? "light" : "dark"} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    [SCOTTY_FONTS.regular]: require("../assets/fonts/ScottyTasks-Regular.ttf"),
    [SCOTTY_FONTS.bold]: require("../assets/fonts/ScottyTasksBold-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <FontReadyContext.Provider value={fontsLoaded}>
      <SettingsProvider>
        <AuthProvider>
          <UserShopProfileProvider>
            <TasksProvider>
              <HabitsProvider>
                <ScottyChatProvider>
                  <RootNavigator />
                </ScottyChatProvider>
              </HabitsProvider>
            </TasksProvider>
          </UserShopProfileProvider>
        </AuthProvider>
      </SettingsProvider>
    </FontReadyContext.Provider>
  );
}
