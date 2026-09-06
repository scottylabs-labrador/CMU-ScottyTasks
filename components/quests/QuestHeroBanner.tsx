import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { UI_COLORS } from "@/constants/gamification";
import { fontSize, fontWeight, spacing } from "@/constants/tokens";

export interface QuestHeroBannerProps {
  totalActive: number;
  totalXpAvailable: number;
  totalCoinsAvailable: number;
}

/**
 * QuestHeroBanner
 *
 * Header banner displaying active quests count and total obtainable XP and coin rewards.
 */
function QuestHeroBannerComponent({
  totalActive,
  totalXpAvailable,
  totalCoinsAvailable,
}: QuestHeroBannerProps) {
  return (
    <View style={styles.heroBanner}>
      <Text style={styles.heroIcon}>⚔️</Text>
      <View style={styles.heroInfo}>
        <Text style={styles.heroTitle}>Active Quests</Text>
        <Text style={styles.heroSub}>{totalActive} quests in progress</Text>
        <View style={styles.heroRewardsRow}>
          <Text style={styles.heroXp}>⚡ {totalXpAvailable} XP total</Text>
          <Text style={styles.heroCoins}>🪙 {totalCoinsAvailable} coins</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(121, 80, 242, 0.15)",
    borderColor: UI_COLORS.questPurple,
    borderWidth: 1,
    borderRadius: 22,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    gap: spacing.lg + 2, // 14px
  },
  heroIcon: {
    fontSize: 34,
  },
  heroInfo: {
    flex: 1,
  },
  heroTitle: {
    fontSize: fontSize.xxl, // 18px
    fontWeight: fontWeight.black,
    color: UI_COLORS.textPrimary,
  },
  heroSub: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: UI_COLORS.textSecondary,
    marginTop: 2,
  },
  heroRewardsRow: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  heroXp: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.cmuGold,
  },
  heroCoins: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.extrabold,
    color: "#FBBF24",
  },
});

export default memo(QuestHeroBannerComponent);
