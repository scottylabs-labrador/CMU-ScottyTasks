import { Tabs, useSegments } from "expo-router";
import React, { useEffect } from "react";
import { Easing, Platform, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ScottyText";
import ChatOverlay from "@/components/chat/ChatOverlay";
import { HapticTab } from "@/components/haptic-tab";
import { AnimatedTabIcon } from "@/components/ui/Motion";
import { useScottyChat } from "@/hooks/useScottyChat";
import { useOptionalSettings } from "@/hooks/useSettings";

export const unstable_settings = {
  anchor: "scotty",
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const { setActiveTab } = useScottyChat();
  const { theme } = useOptionalSettings();

  useEffect(() => {
    const currentTab = segments[1];
    if (typeof currentTab === "string") {
      setActiveTab(currentTab);
    }
  }, [segments, setActiveTab]);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        backBehavior="initialRoute"
        screenOptions={{
          tabBarLabel: ({ children, color }) => (
            <Text style={{ color, fontSize: 11, fontWeight: "700" }}>{children}</Text>
          ),
          tabBarActiveTintColor: theme.accent,
          tabBarInactiveTintColor: theme.textMuted,
          headerShown: false,
          tabBarButton: HapticTab,
          sceneStyle: {
            backgroundColor: theme.bg,
          },
          transitionSpec: {
            animation: "timing",
            config: {
              duration: 300,
              easing: Easing.out(Easing.cubic),
            },
          },
          sceneStyleInterpolator: ({ current }) => ({
            sceneStyle: {
              opacity: current.progress.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [0, 1, 0],
              }),
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [-18, 0, 18],
                  }),
                },
              ],
            },
          }),
          tabBarStyle: {
            backgroundColor: theme.bg,
            borderTopColor: theme.border,
            borderTopWidth: 1,
            height: Platform.OS === "ios" ? 88 : 68,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "700",
          },
        }}
      >
        {/* 1. TASKS */}
        <Tabs.Screen
          name="tasks"
          options={{
            title: "Tasks",
            tabBarIcon: ({ focused, color, size }) => (
              <AnimatedTabIcon focused={focused}>
                <Ionicons
                  name={focused ? "checkbox" : "checkbox-outline"}
                  size={size || 24}
                  color={String(color)}
                />
              </AnimatedTabIcon>
            ),
          }}
        />

        {/* 2. HABITS */}
        <Tabs.Screen
          name="habits"
          options={{
            title: "Habits",
            tabBarIcon: ({ focused, color, size }) => (
              <AnimatedTabIcon focused={focused}>
                <Ionicons
                  name="sync-outline"
                  size={size || 24}
                  color={String(color)}
                />
              </AnimatedTabIcon>
            ),
          }}
        />

        {/* 3. SCOTTY (CENTER HUB) */}
        <Tabs.Screen
          name="scotty"
          options={{
            title: "Home",
            tabBarIcon: ({ focused, color, size }) => (
              <AnimatedTabIcon focused={focused}>
                <MaterialCommunityIcons
                  name="paw"
                  size={size || 26}
                  color={String(color)}
                />
              </AnimatedTabIcon>
            ),
          }}
        />

        {/* 4. QUESTS */}
        <Tabs.Screen
          name="quests"
          options={{
            title: "Quests",
            tabBarIcon: ({ focused, color, size }) => (
              <AnimatedTabIcon focused={focused}>
                <MaterialCommunityIcons
                  name="sword-cross"
                  size={size || 24}
                  color={String(color)}
                />
              </AnimatedTabIcon>
            ),
          }}
        />

        {/* 5. LEADERBOARD */}
        <Tabs.Screen
          name="leaderboard"
          options={{
            title: "Ranks",
            tabBarIcon: ({ focused, color, size }) => (
              <AnimatedTabIcon focused={focused}>
                <MaterialCommunityIcons
                  name="podium-gold"
                  size={size || 25}
                  color={String(color)}
                />
              </AnimatedTabIcon>
            ),
          }}
        />
      </Tabs>
      <ChatOverlay />
    </View>
  );
}
