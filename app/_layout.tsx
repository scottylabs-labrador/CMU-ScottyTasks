import { useEffect, useState, useRef } from 'react';
import { Platform, AppState } from 'react-native'; // 1. Add Platform
import * as NavigationBar from 'expo-navigation-bar'; // 2. Add NavigationBar
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { auth, onAuthStateChanged } from '@/config/firebase';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // --- NEW: Global Navigation Bar Control ---
  useEffect(() => {
    if (Platform.OS === 'android') {
      const hideNavBar = async () => {
        await NavigationBar.setBehaviorAsync('inset-swipe');
        await NavigationBar.setVisibilityAsync('hidden');
      };

      // 1. Initial hide on mount
      hideNavBar();

      // 2. Hide when switching back from another app
      const appStateSubscription = AppState.addEventListener('change', nextAppState => {
        if (nextAppState === 'active') {
          hideNavBar();
        }
      });

      // 3. Keep visibility listener as a backup for keyboard/system events
      const visibilitySubscription = NavigationBar.addVisibilityListener(({ visibility }) => {
        if (visibility === 'visible') {
          hideNavBar();
        }
      });

      return () => {
        appStateSubscription.remove();
        visibilitySubscription.remove();
      };
    }
  }, []);
  // ------------------------------------------

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isAuthenticated === null) return;
    const inAuthGroup = segments[0] === '(tabs)';
    const inAuthPages = segments[0] === 'login' || segments[0] === 'signup';

    if (!isAuthenticated && !inAuthPages) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthPages) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      {/* Set status bar to 'light' or 'dark' to match your background */}
      <StatusBar style="light" /> 
    </ThemeProvider>
  );
}