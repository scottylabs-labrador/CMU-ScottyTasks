import { useEffect, useState } from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Text, StyleSheet } from "react-native"; // Add View, Text, StyleSheet imports
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { auth, onAuthStateChanged } from "@/config/firebase";
import { Colors } from "@/constants/theme"; // Import theme colors

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isAuthenticated === null) return; // Still checking auth state

    const inAuthGroup = segments[0] === "(tabs)";
    const inAuthPages = segments[0] === "login" || segments[0] === "signup";

    if (!isAuthenticated && !inAuthPages) {
      // Not authenticated - redirect to login
      router.replace("/login");
    } else if (isAuthenticated && inAuthPages) {
      // Authenticated but on login/signup - redirect to app
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, segments]);

  const inAuthPages = segments[0] === "login" || segments[0] === "signup";
  const showBackground = !inAuthPages;

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      {showBackground ? (
        <View style={styles.container}>
          {/* Top section with color and label */}
          <View style={[styles.section, styles.topSection]}>
            <Text style={styles.label}>CMU ScottyTasks</Text>
          </View>
          {/* Bottom section with different color */}
          <View style={[styles.section, styles.bottomSection]} />
          {/* Navigation Stack overlaid on top */}
          <View style={styles.stackContainer}>
            <Stack>
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="signup" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="modal"
                options={{ presentation: "modal", title: "Modal" }}
              />
            </Stack>
          </View>
          <StatusBar style="auto" />
        </View>
      ) : (
        <>
          <Stack>
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="signup" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal"
              options={{ presentation: "modal", title: "Modal" }}
            />
          </Stack>
          <StatusBar style="auto" />
        </>
      )}
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    flex: 1, // Each section takes half the screen height
  },
  topSection: {
    backgroundColor: Colors.light.background, // Example: light background color
    justifyContent: "center",
    alignItems: "center",
  },
  bottomSection: {
    backgroundColor: "#0a7ea4", // Example: tint color from theme (adjust as needed)
  },
  label: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.light.text, // Text color from theme
  },
  stackContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
