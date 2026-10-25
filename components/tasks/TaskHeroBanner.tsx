import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScottyDog from "@/components/ScottyDog";
import { PressableScale } from "@/components/ui/Motion";
import type { TaskViewMode } from "@/hooks/useTasks";
import { UI_COLORS } from "@/constants/gamification";
import { fontSize, fontWeight, radii, shadows, spacing } from "@/constants/tokens";

export interface TaskHeroBannerProps {
  pendingCount: number;
  dueTodayCount?: number;
  overdueCount?: number;
  totalXpToday: number;
  viewMode?: TaskViewMode;
  onChangeViewMode?: (mode: TaskViewMode) => void;
  onAddTask?: () => void;
}

/**
 * TaskHeroBanner
 *
 * Compact Scotty & Daily XP summary bar with an integrated Day / Agenda view switcher
 * so the calendar fits comfortably above the fold.
 */
function TaskHeroBannerComponent({
  pendingCount,
  dueTodayCount = 0,
  overdueCount = 0,
  totalXpToday,
  viewMode = "day",
  onChangeViewMode,
}: TaskHeroBannerProps) {
  return (
    <View style={styles.bannerCard}>
      <View style={styles.scottyBadge}>
        <ScottyDog size={36} animated />
      </View>

      <View style={styles.infoCol}>
        <View style={styles.headlineRow}>
          <Text style={styles.headlineText} numberOfLines={1}>
            {dueTodayCount > 0
              ? `${dueTodayCount} due today`
              : pendingCount === 0
              ? "All caught up!"
              : `${pendingCount} ${pendingCount === 1 ? "task" : "tasks"} queued`}
          </Text>
          {overdueCount > 0 && (
            <View style={styles.overdueBadge}>
              <Text style={styles.overdueBadgeText}>{overdueCount} overdue</Text>
            </View>
          )}
        </View>

        <View style={styles.subRow}>
          <Text style={styles.xpText} numberOfLines={1}>
            ⚡ {totalXpToday} XP today
          </Text>
          {dueTodayCount > 0 && pendingCount > dueTodayCount && (
            <Text style={styles.totalMuted} numberOfLines={1}>
              · {pendingCount} total
            </Text>
          )}
        </View>
      </View>

      {onChangeViewMode ? (
        <View style={styles.segmentedControl}>
          <PressableScale
            style={[
              styles.segmentBtn,
              viewMode === "day" && styles.segmentBtnActive,
            ]}
            scaleTo={0.94}
            haptic="selection"
            onPress={() => onChangeViewMode("day")}
            accessibilityRole="button"
            accessibilityLabel="Calendar day view"
          >
            <Ionicons
              name="calendar-outline"
              size={14}
              color={viewMode === "day" ? UI_COLORS.textOnAccent : UI_COLORS.textSecondary}
            />
            <Text
              style={[
                styles.segmentText,
                viewMode === "day" && styles.segmentTextActive,
              ]}
            >
              Day
            </Text>
          </PressableScale>

          <PressableScale
            style={[
              styles.segmentBtn,
              viewMode === "agenda" && styles.segmentBtnActive,
            ]}
            scaleTo={0.94}
            haptic="selection"
            onPress={() => onChangeViewMode("agenda")}
            accessibilityRole="button"
            accessibilityLabel="Chronological agenda view"
          >
            <Ionicons
              name="list-outline"
              size={15}
              color={viewMode === "agenda" ? UI_COLORS.textOnAccent : UI_COLORS.textSecondary}
            />
            <Text
              style={[
                styles.segmentText,
                viewMode === "agenda" && styles.segmentTextActive,
              ]}
            >
              Agenda
            </Text>
          </PressableScale>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bannerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: UI_COLORS.bgCard,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    gap: spacing.md,
    ...shadows.card,
  },
  scottyBadge: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: UI_COLORS.bgWarm,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
  },
  headlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  headlineText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    color: UI_COLORS.textPrimary,
  },
  overdueBadge: {
    backgroundColor: UI_COLORS.redTint,
    borderWidth: 1,
    borderColor: "rgba(166, 25, 46, 0.25)",
    borderRadius: radii.pill,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  overdueBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.cmuRed,
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  xpText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.cmuGold,
  },
  totalMuted: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: UI_COLORS.textMuted,
  },
  segmentedControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: UI_COLORS.bgWarm,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    borderRadius: 9,
    padding: 2,
  },
  segmentBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
  },
  segmentBtnActive: {
    backgroundColor: UI_COLORS.cmuRed,
  },
  segmentText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textSecondary,
  },
  segmentTextActive: {
    color: UI_COLORS.textOnAccent,
  },
});

export default memo(TaskHeroBannerComponent);
