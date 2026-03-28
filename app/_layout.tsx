// app/_layout.tsx
import { useEffect, useState } from "react";
import {
  Platform,
  AppState,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { auth, onAuthStateChanged } from "@/config/firebase";

import TasksIcon from "@/assets/images/tasks.svg";
import HabitsIcon from "@/assets/images/habits.svg";

export const unstable_settings = {
  anchor: "(tabs)/scotty",
};

function BottomTabBar() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom + 8 }]}>
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.push("/(tabs)/tasks")}
        accessibilityLabel="Tasks"
      >
        {/* <TasksIcon width={28} height={28} /> */}
        <Text style={styles.tabLabel}>Tasks</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.push("/(tabs)/habits")}
        accessibilityLabel="Habits"
      >
        {/* <HabitsIcon width={28} height={28} /> */}
        <Text style={styles.tabLabel}>Habits</Text>
      </TouchableOpacity>
    </View>
  );
}

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
  }, [isAuthenticated, segments]);

  const inAuthPages = segments[0] === "login" || segments[0] === "signup";

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>

      {/* Tab bar overlays all authenticated screens */}
      {!inAuthPages && <BottomTabBar />}

      <StatusBar style="light" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.75)", // swap for your design color
    paddingTop: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  tabLabel: {
    color: "#fff",
    fontSize: 12,
  },
});
