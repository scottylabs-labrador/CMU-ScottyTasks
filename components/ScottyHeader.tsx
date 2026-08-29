import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { UI_COLORS, calculateLevel } from "@/constants/gamification";
import { useUserShopProfile } from "@/hooks/useUserShopProfile";
import XPBar from "./XPBar";

interface ScottyHeaderProps {
  title?: string;
  showXPBar?: boolean;
}

export default function ScottyHeader({
  title = "Scotty Tasks",
  showXPBar = true,
}: ScottyHeaderProps) {
  const router = useRouter();
  const { profile } = useUserShopProfile();
  const totalXP = profile.xp;
  const level = calculateLevel(totalXP);

  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <Text style={styles.titleText}>{title}</Text>

        <View style={styles.statsRow}>
          {/* Coins Pill */}
          <TouchableOpacity
            style={styles.coinPill}
            onPress={() => router.push("/(tabs)/shop")}
            activeOpacity={0.8}
          >
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={styles.coinCount}>{profile.coins}</Text>
          </TouchableOpacity>

          {/* Streak Pill */}
          <View style={styles.streakPill}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={styles.streakCount}>{profile.streak}</Text>
          </View>
        </View>
      </View>

      {showXPBar && (
        <View style={styles.xpRow}>
          <XPBar totalXP={totalXP} level={level} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: UI_COLORS.bgWarm,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: UI_COLORS.border,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  titleText: {
    fontSize: 22,
    fontWeight: "900",
    color: UI_COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  coinPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  coinIcon: {
    fontSize: 13,
  },
  coinCount: {
    fontSize: 13,
    fontWeight: "800",
    color: UI_COLORS.cmuGold,
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(251, 146, 60, 0.15)",
    borderColor: UI_COLORS.streakOrange,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  streakIcon: {
    fontSize: 13,
  },
  streakCount: {
    fontSize: 13,
    fontWeight: "800",
    color: UI_COLORS.streakOrange,
  },
  xpRow: {
    marginTop: 2,
  },
});
