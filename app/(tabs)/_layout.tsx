import { Tabs } from "expo-router";
import { Text } from "@/components/ScottyText";
import React from "react";
import { Platform } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { AnimatedTabIcon } from "@/components/ui/Motion";
import { UI_COLORS } from "@/constants/gamification";
import { HOME_COLORS } from "@/constants/home";

export const unstable_settings = {
  anchor: "scotty",
  initialRouteName: "scotty",
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      initialRouteName="scotty"
      screenOptions={{
        tabBarLabel: ({ children, color }) => (
          <Text style={{ color, fontSize: 11, fontWeight: "700" }}>{children}</Text>
        ),
        tabBarActiveTintColor: UI_COLORS.cmuRed,
        tabBarInactiveTintColor: UI_COLORS.textMuted,
        headerShown: false,
        tabBarButton: HapticTab,
        sceneStyle: {
          backgroundColor: UI_COLORS.bgWarm,
        },
        // Keep screen visibility independent of interrupted tab animations.
        animation: "none",
        tabBarStyle: {
          backgroundColor: UI_COLORS.bgWarm,
          borderTopColor: UI_COLORS.border,
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
          sceneStyle: { backgroundColor: HOME_COLORS.sky },
          tabBarStyle: { display: "none" },
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

      {/* HIDDEN SHOP ROUTE */}
      <Tabs.Screen
        name="shop"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
