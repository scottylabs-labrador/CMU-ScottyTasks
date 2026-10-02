import React, { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ProgressBar from "@/components/ui/ProgressBar";
import { Quest, UI_COLORS } from "@/constants/gamification";
import { fontSize, fontWeight, radii, spacing } from "@/constants/tokens";

export interface QuestCardProps {
  quest: Quest;
  onClaim: (quest: Quest) => void;
}

interface RarityStyle {
  bg: string;
  border: string;
  tagBg: string;
  tagText: string;
  label: string;
}

function getRarityStyle(rarity: Quest["rarity"]): RarityStyle {
  switch (rarity) {
    case "legendary":
      return {
        bg: UI_COLORS.redTint,
        border: UI_COLORS.cmuRed,
        tagBg: UI_COLORS.redTint,
        tagText: UI_COLORS.cmuRed,
        label: "Legendary",
      };
    case "epic":
      return {
        bg: UI_COLORS.purpleTint,
        border: UI_COLORS.questPurple,
        tagBg: UI_COLORS.purpleTint,
        tagText: UI_COLORS.questPurple,
        label: "Epic",
      };
    case "rare":
      return {
        bg: UI_COLORS.blueTint,
        border: UI_COLORS.cyan,
        tagBg: UI_COLORS.blueTint,
        tagText: UI_COLORS.cyan,
        label: "Rare",
      };
    case "common":
    default:
      return {
        bg: UI_COLORS.bgCard,
        border: UI_COLORS.border,
        tagBg: UI_COLORS.bgSubtle,
        tagText: UI_COLORS.textSecondary,
        label: "Common",
      };
  }
}

function getCategoryEmoji(category: Quest["category"]): string {
  switch (category) {
    case "cmu":
      return "🏫";
    case "academic":
      return "📚";
    case "social":
      return "👥";
    case "wellness":
      return "💚";
    default:
      return "🎯";
  }
}

/**
 * QuestCard
 *
 * Card displaying quest details, category emoji, rarity badge, progress bar, and claim action.
 */
function QuestCardComponent({ quest, onClaim }: QuestCardProps) {
  const rarityStyle = getRarityStyle(quest.rarity);
  const progressPercent = Math.min(
    100,
    Math.round((quest.progress / Math.max(1, quest.total)) * 100)
  );

  return (
    <View style={styles.card}>
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
                { backgroundColor: rarityStyle.tagBg },
              ]}
            >
              <Text
                style={[
                  styles.rarityBadgeText,
                  { color: rarityStyle.tagText },
                ]}
              >
                {rarityStyle.label}
              </Text>
            </View>
          </View>
          <Text style={styles.questDesc}>{quest.description}</Text>
        </View>
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabelText}>Progress</Text>
          <Text style={styles.progressCountText}>
            {quest.progress} / {quest.total}
          </Text>
        </View>
        <ProgressBar
          progress={progressPercent}
          color={rarityStyle.border}
          trackColor={UI_COLORS.bgDeep}
          height={6}
        />
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
            onPress={() => onClaim(quest)}
            activeOpacity={0.8}
          >
            <Text style={styles.claimBtnText}>Claim</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.claimBtnOutline}
            onPress={() => onClaim(quest)}
            activeOpacity={0.8}
          >
            <Text style={styles.claimBtnOutlineText}>Complete Quest</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: UI_COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  catIconBox: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: UI_COLORS.bgSubtle,
    justifyContent: "center",
    alignItems: "center",
  },
  catIconText: {
    fontSize: fontSize.title, // 22px
  },
  cardHeaderInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  questTitle: {
    fontSize: fontSize.xl, // 15px
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  rarityBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    borderRadius: radii.sm + 2, // 10px
  },
  rarityBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.extrabold,
  },
  questDesc: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: UI_COLORS.textSecondary,
    lineHeight: 16,
  },
  progressSection: {
    marginTop: spacing.lg + 2, // 14px
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  progressLabelText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: UI_COLORS.textMuted,
  },
  progressCountText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textSecondary,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.lg + 2, // 14px
    paddingTop: spacing.md + 2, // 10px
    borderTopWidth: 1,
    borderTopColor: UI_COLORS.border,
  },
  rewardsGroup: {
    flexDirection: "row",
    gap: spacing.md + 2, // 10px
  },
  xpReward: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.cmuGold,
  },
  coinReward: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.cmuGold,
  },
  completedBadge: {
    backgroundColor: UI_COLORS.greenTint,
    paddingHorizontal: spacing.md + 2, // 10px
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
  },
  completedText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.xpGreen,
  },
  claimBtn: {
    backgroundColor: UI_COLORS.cmuRed,
    paddingHorizontal: spacing.lg + 2, // 14px
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
  },
  claimBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textOnAccent,
  },
  claimBtnOutline: {
    backgroundColor: UI_COLORS.bgSubtle,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
  },
  claimBtnOutlineText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textSecondary,
  },
});

export default memo(QuestCardComponent);
