import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { UI_COLORS } from "@/constants/gamification";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: UI_COLORS.cmuRed,
        tabBarInactiveTintColor: UI_COLORS.textMuted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: "rgba(19, 17, 31, 0.96)",
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
      initialRouteName="tasks"
    >
      {/* 1. TASKS */}
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkbox-outline" size={size || 24} color={color} />
          ),
        }}
      />

      {/* 2. HABITS */}
      <Tabs.Screen
        name="habits"
        options={{
          title: "Habits",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sync-outline" size={size || 24} color={color} />
          ),
        }}
      />

      {/* 3. QUESTS */}
      <Tabs.Screen
        name="quests"
        options={{
          title: "Quests",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="sword-cross" size={size || 24} color={color} />
          ),
        }}
      />

      {/* 4. LEADERBOARD */}
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "Ranks",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="podium-gold" size={size || 25} color={color} />
          ),
        }}
      />

      {/* 5. PROFILE & SCOTTY */}
      <Tabs.Screen
        name="scotty"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="dog-side" size={size || 26} color={color} />
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
