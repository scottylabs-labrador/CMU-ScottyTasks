import React, { memo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HappinessMood, UI_COLORS } from "@/constants/gamification";
import { fontSize, fontWeight, radii, spacing } from "@/constants/tokens";

export interface PetHappinessCardProps {
  /** Current effective happiness score (0–100) */
  happiness: number;
  /** Current emotional state, emoji, color, and message */
  mood: HappinessMood;
  /** Callback fired when user pets Scotty */
  onPet: () => void;
}

/**
 * PetHappinessCard
 *
 * A dedicated status section positioned directly below the yard picture.
 * Displays Scotty's emotional happiness score, active 1.25x XP streak buffs,
 * status messages, and an interactive "Pet Scotty ❤️" button.
 */
function PetHappinessCardComponent({
  happiness,
  mood,
  onPet,
}: PetHappinessCardProps) {
  const [justPetted, setJustPetted] = useState(false);

  const handlePetPress = () => {
    setJustPetted(true);
    onPet();
    setTimeout(() => setJustPetted(false), 1200);
  };

  const isEcstatic = happiness >= 85;

  return (
    <View style={styles.card}>
      {/* Top Header: Mood & Buff Badge */}
      <View style={styles.headerRow}>
        <View style={styles.moodLabelWrapper}>
          <Text style={styles.moodEmoji}>{mood.emoji}</Text>
          <View>
            <Text style={styles.sectionOverline}>SCOTTY&apos;S MOOD</Text>
            <Text style={[styles.moodStateText, { color: mood.color }]}>
              {mood.label} · {happiness}%
            </Text>
          </View>
        </View>

        {isEcstatic ? (
          <View style={styles.xpBuffBadge}>
            <Ionicons name="flash" size={12} color={UI_COLORS.cmuGold} />
            <Text style={styles.xpBuffText}>1.25× XP Active</Text>
          </View>
        ) : (
          <View style={styles.feedHintBadge}>
            <Text style={styles.feedHintText}>+15% per task 🦴</Text>
          </View>
        )}
      </View>

      {/* Happiness Progress Bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${happiness}%`, backgroundColor: mood.color },
          ]}
        />
      </View>

      {/* Dialogue Message */}
      <Text style={styles.messageText}>&ldquo;{mood.message}&rdquo;</Text>

      {/* Interaction Controls */}
      <View style={styles.footerRow}>
        <TouchableOpacity
          style={[
            styles.petButton,
            justPetted && styles.petButtonActive,
          ]}
          onPress={handlePetPress}
          activeOpacity={0.8}
        >
          <Ionicons
            name={justPetted ? "heart" : "heart-outline"}
            size={16}
            color={justPetted ? "#FFFFFF" : UI_COLORS.cmuRed}
          />
          <Text
            style={[
              styles.petButtonText,
              justPetted && styles.petButtonTextActive,
            ]}
          >
            {justPetted ? "Loved! ❤️ +2%" : "Pet Scotty ❤️"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.tipText}>
          Finish tasks &amp; habits to feed Scotty treats!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    borderRadius: radii.xxl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    marginTop: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  moodLabelWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  moodEmoji: {
    fontSize: 24,
  },
  sectionOverline: {
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textMuted,
    letterSpacing: 0.8,
  },
  moodStateText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.black,
  },
  xpBuffBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 184, 0, 0.15)",
    borderColor: UI_COLORS.cmuGold,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  xpBuffText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.black,
    color: UI_COLORS.cmuGold,
  },
  feedHintBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  feedHintText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textMuted,
  },
  progressTrack: {
    height: 8,
    backgroundColor: UI_COLORS.bgElevated,
    borderRadius: 4,
    overflow: "hidden",
    marginVertical: spacing.xs,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  messageText: {
    fontSize: fontSize.xs + 1,
    fontWeight: fontWeight.semibold,
    color: UI_COLORS.textSecondary,
    fontStyle: "italic",
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  petButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "rgba(196, 18, 48, 0.12)",
    borderColor: UI_COLORS.cmuRed,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.lg,
  },
  petButtonActive: {
    backgroundColor: UI_COLORS.cmuRed,
  },
  petButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.cmuRed,
  },
  petButtonTextActive: {
    color: "#FFFFFF",
  },
  tipText: {
    flex: 1,
    textAlign: "right",
    fontSize: fontSize.xxs + 1,
    fontWeight: fontWeight.medium,
    color: UI_COLORS.textMuted,
    marginLeft: spacing.sm,
  },
});

export default memo(PetHappinessCardComponent);
