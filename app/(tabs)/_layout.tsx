import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

// Import your SVG assets as components
import ScottyLogoSvg from "@/assets/images/scotty.svg"; 
import TasksSvg from "@/assets/images/tasks.svg";
import HabitsIcon from "@/assets/images/habits.svg";

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
            <HabitsIcon width={28} height={28} fill={color} />
          ),
        }}
      />

      {/* 2. SCOTTY (MIDDLE) */}
      <Tabs.Screen
        name="scotty"
        options={{
          title: "Scotty",
          tabBarIcon: ({ color }) => (
            <ScottyLogoSvg width={32} height={32} fill={color} />
          ),
        }}
      />

      {/* 3. TASKS (RIGHT) */}
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          tabBarIcon: ({ color }) => (
            <TasksSvg width={28} height={28} fill={color} />
          ),
        }}
      />
    </Tabs>
  );
}