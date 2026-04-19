import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        // HapticTab is used here as the button container
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: insets.bottom + 5,
        },
      }}
      initialRouteName="scotty"
    >
      {/* 1. HABITS (LEFT) */}
      <Tabs.Screen
        name="habits"
        options={{
          title: "Habits",
          tabBarIcon: ({ color }) => (
            <Ionicons name="water-outline" size={28} color={color} />
          ),
        }}
      />

      {/* 2. SCOTTY (MIDDLE) */}
      <Tabs.Screen
        name="scotty"
        options={{
          title: "Scotty",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="dog-side" size={30} color={color} />
          ),
        }}
      />

      {/* 3. TASKS (RIGHT) */}
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          tabBarIcon: ({ color }) => (
            <Ionicons name="checkmark-circle-outline" size={28} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="shop"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
