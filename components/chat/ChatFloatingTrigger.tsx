import React, { useEffect, useState } from "react";
import { Animated, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ScottyText";
import { UI_COLORS } from "@/constants/gamification";
import { fontSize, fontWeight, layout, radii, shadows, spacing } from "@/constants/tokens";
import { useScottyChat } from "@/hooks/useScottyChat";

/**
 * Placeholder right-edge trigger docked across all tabs.
 *
 * Design handoff hook: replace the inner placeholder pill with the custom Scotty
 * character illustration and adjust `PEEK_OFFSET_X` to half the character width
 * so Scotty rests half-hidden behind the right edge and pops out when tapped.
 */
const PEEK_OFFSET_X = 14;

export default function ChatFloatingTrigger() {
  const insets = useSafeAreaInsets();
  const { isOpen, openChat, activeTab } = useScottyChat();
  const [slideX] = useState(() => new Animated.Value(PEEK_OFFSET_X));

  useEffect(() => {
    Animated.spring(slideX, {
      toValue: isOpen ? 0 : PEEK_OFFSET_X,
      useNativeDriver: true,
      friction: 7,
      tension: 80,
    }).start();
  }, [isOpen, slideX]);

  if (isOpen) return null;

  const baseTabHeight = Platform.OS === "ios" ? layout.tabBarHeightIOS : layout.tabBarHeightAndroid;
  // Clear the bottom-right '+' FAB on screens that render one (`tasks` and `habits`).
  const fabClearance = activeTab === "tasks" || activeTab === "habits" ? 76 : 0;
  const bottomOffset = baseTabHeight + Math.max(0, insets.bottom) + spacing.md + fabClearance;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        {
          bottom: bottomOffset,
          transform: [{ translateX: slideX }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={openChat}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Open Scotty Companion chat"
      >
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="paw" size={18} color={UI_COLORS.textOnAccent} />
        </View>
        <Text style={styles.label}>Ask Scotty</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    right: 0,
    zIndex: 40,
  },
  triggerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: UI_COLORS.cmuRed,
    borderTopLeftRadius: radii.round,
    borderBottomLeftRadius: radii.round,
    paddingLeft: spacing.sm + 2,
    paddingRight: spacing.xl,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: UI_COLORS.cmuRedDark,
    ...shadows.elevated,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: UI_COLORS.cmuRedDark,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textOnAccent,
  },
});
