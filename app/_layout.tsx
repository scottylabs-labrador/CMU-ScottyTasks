import { useEffect } from "react";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { NavigationBar } from "expo-navigation-bar";
import {
  DefaultTheme,
  ThemeProvider,
} from "expo-router/react-navigation";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { FontReadyContext } from "@/components/ScottyText";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { HabitsProvider } from "@/contexts/HabitsContext";
import { ScottyChatProvider } from "@/contexts/ScottyChatContext";
import { TasksProvider } from "@/contexts/TasksContext";
import { UserShopProfileProvider } from "@/contexts/UserShopProfileContext";
import { UI_COLORS } from "@/constants/gamification";
import { SCOTTY_FONTS } from "@/constants/typography";

export const unstable_settings = {
  anchor: "(tabs)",
};

void SplashScreen.preventAutoHideAsync().catch(() => {});

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
          animation: "fade",
          animationDuration: 280,
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
    </FontReadyContext.Provider>
  );
}
