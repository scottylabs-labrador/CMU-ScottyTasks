import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { UI_COLORS, INITIAL_QUESTS, Quest } from "@/constants/gamification";
import { useUserShopProfile } from "@/hooks/useUserShopProfile";
import ScottyHeader from "@/components/ScottyHeader";
import XPFloat from "@/components/XPFloat";

export default function QuestsScreen() {
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [filter, setFilter] = useState<"all" | "cmu" | "academic" | "social" | "wellness">("all");
  const [activeFloat, setActiveFloat] = useState<{ xp: number; coins: number } | null>(null);

  const { addXPAndCoins } = useUserShopProfile();

  const handleClaim = (quest: Quest) => {
    if (quest.completed) return;

    setQuests((prev) =>
      prev.map((q) =>
        q.id === quest.id ? { ...q, progress: q.total, completed: true } : q
      )
    );

    setActiveFloat({ xp: quest.xp, coins: quest.coins });
    addXPAndCoins(quest.xp, quest.coins, false);
  };

  const filteredQuests =
    filter === "all" ? quests : quests.filter((q) => q.category === filter);

  const totalActive = quests.filter((q) => !q.completed).length;
  const totalXpAvailable = quests.reduce((sum, q) => sum + q.xp, 0);
  const totalCoinsAvailable = quests.reduce((sum, q) => sum + q.coins, 0);

  const getRarityStyle = (rarity: Quest["rarity"]) => {
    switch (rarity) {
      case "legendary":
        return {
          bg: "#2A1414",
          border: UI_COLORS.cmuRed,
          tagBg: "rgba(196, 18, 48, 0.25)",
          tagText: "#FFA4A4",
          label: "Legendary",
        };
      case "epic":
        return {
          bg: "#201433",
          border: UI_COLORS.questPurple,
          tagBg: "rgba(121, 80, 242, 0.25)",
          tagText: "#C4B5FD",
          label: "Epic",
        };
      case "rare":
        return {
          bg: "#132138",
          border: "#3B82F6",
          tagBg: "rgba(59, 130, 246, 0.25)",
          tagText: "#93C5FD",
          label: "Rare",
        };
      default:
        return {
          bg: UI_COLORS.bgCard,
          border: UI_COLORS.border,
          tagBg: "rgba(255, 255, 255, 0.08)",
          tagText: UI_COLORS.textSecondary,
          label: "Common",
        };
    }
  };

  const getCategoryEmoji = (cat: Quest["category"]) => {
    switch (cat) {
      case "cmu":
        return "🏫";
      case "academic":
        return "📚";
      case "social":
        return "👥";
      case "wellness":
        return "💚";
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScottyHeader title="Campus Quests" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Quests Hero Banner */}
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

        {/* Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {[
            { id: "all", label: "All" },
            { id: "cmu", label: "🏫 CMU" },
            { id: "academic", label: "📚 Academic" },
            { id: "social", label: "👥 Social" },
            { id: "wellness", label: "💚 Wellness" },
          ].map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.filterPill,
                filter === item.id && styles.filterPillActive,
              ]}
              onPress={() => setFilter(item.id as any)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  filter === item.id && styles.filterPillTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Quests List */}
        <View style={styles.questList}>
          {filteredQuests.map((quest) => {
            const rStyle = getRarityStyle(quest.rarity);
            const progressPct = Math.min(
              100,
              Math.round((quest.progress / quest.total) * 100)
            );

            return (
              <View
                key={quest.id}
                style={[
                  styles.questCard,
                  { backgroundColor: rStyle.bg, borderColor: rStyle.border },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.catIconBox}>
                    <Text style={styles.catIconText}>
                      {getCategoryEmoji(quest.category)}
                    </Text>
                  </View>

                  <View style={styles.cardHeaderInfo}>
                    <View style={styles.titleRow}>
                      <Text style={styles.questTitle}>{quest.title}</Text>
                      <View
                        style={[
                          styles.rarityBadge,
                          { backgroundColor: rStyle.tagBg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.rarityBadgeText,
                            { color: rStyle.tagText },
                          ]}
                        >
                          {rStyle.label}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.questDesc}>{quest.description}</Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.progressSection}>
                  <View style={styles.progressLabelRow}>
                    <Text style={styles.progressLabelText}>Progress</Text>
                    <Text style={styles.progressCountText}>
                      {quest.progress} / {quest.total}
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${progressPct}%`,
                          backgroundColor: rStyle.border,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Reward Footer & Claim Button */}
                <View style={styles.cardFooter}>
                  <View style={styles.rewardsGroup}>
                    <Text style={styles.xpReward}>⚡ +{quest.xp} XP</Text>
                    <Text style={styles.coinReward}>🪙 +{quest.coins}</Text>
                  </View>

                  {quest.completed ? (
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedText}>✓ Completed</Text>
                    </View>
                  ) : quest.progress >= quest.total ? (
                    <TouchableOpacity
                      style={styles.claimBtn}
                      onPress={() => handleClaim(quest)}
                    >
                      <Text style={styles.claimBtnText}>Claim</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.claimBtnOutline}
                      onPress={() => handleClaim(quest)}
                    >
                      <Text style={styles.claimBtnOutlineText}>
                        Complete Quest
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {activeFloat && (
        <XPFloat
          amount={activeFloat.xp}
          coins={activeFloat.coins}
          onDone={() => setActiveFloat(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_COLORS.bgWarm,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  heroBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(121, 80, 242, 0.15)",
    borderColor: UI_COLORS.questPurple,
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    gap: 14,
  },
  heroIcon: {
    fontSize: 34,
  },
  heroInfo: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: UI_COLORS.textPrimary,
  },
  heroSub: {
    fontSize: 12,
    fontWeight: "600",
    color: UI_COLORS.textSecondary,
    marginTop: 2,
  },
  heroRewardsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  heroXp: {
    fontSize: 12,
    fontWeight: "800",
    color: UI_COLORS.cmuGold,
  },
  heroCoins: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FBBF24",
  },
  filterRow: {
    gap: 8,
    paddingBottom: 14,
  },
  filterPill: {
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  filterPillActive: {
    backgroundColor: UI_COLORS.questPurple,
    borderColor: UI_COLORS.questPurple,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: UI_COLORS.textSecondary,
  },
  filterPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  questList: {
    gap: 14,
  },
  questCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    gap: 12,
  },
  catIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  catIconText: {
    fontSize: 22,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  questTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: UI_COLORS.textPrimary,
    flex: 1,
    marginRight: 6,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  rarityBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  questDesc: {
    fontSize: 12,
    fontWeight: "500",
    color: UI_COLORS.textSecondary,
    lineHeight: 16,
  },
  progressSection: {
    marginTop: 14,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  progressLabelText: {
    fontSize: 11,
    fontWeight: "600",
    color: UI_COLORS.textMuted,
  },
  progressCountText: {
    fontSize: 11,
    fontWeight: "700",
    color: UI_COLORS.textSecondary,
  },
  progressTrack: {
    height: 6,
    backgroundColor: UI_COLORS.bgDeep,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  rewardsGroup: {
    flexDirection: "row",
    gap: 10,
  },
  xpReward: {
    fontSize: 12,
    fontWeight: "800",
    color: UI_COLORS.cmuGold,
  },
  coinReward: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FBBF24",
  },
  completedBadge: {
    backgroundColor: "rgba(74, 222, 128, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 11,
    fontWeight: "800",
    color: UI_COLORS.xpGreen,
  },
  claimBtn: {
    backgroundColor: UI_COLORS.cmuRed,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  claimBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  claimBtnOutline: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  claimBtnOutlineText: {
    fontSize: 11,
    fontWeight: "700",
    color: UI_COLORS.textSecondary,
  },
});
