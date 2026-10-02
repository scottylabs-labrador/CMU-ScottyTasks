import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import ScreenContainer from "@/components/ui/ScreenContainer";
import ScreenTitle from "@/components/ui/ScreenTitle";
import FilterRow from "@/components/ui/FilterRow";
import Podium from "@/components/leaderboard/Podium";
import RankRow from "@/components/leaderboard/RankRow";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { UI_COLORS } from "@/constants/gamification";
import { fontSize, fontWeight, radii, spacing } from "@/constants/tokens";

const TAB_OPTIONS = [
  { id: "all" as const, label: "All Students" },
  { id: "15-112" as const, label: "15-112" },
  { id: "10-601" as const, label: "10-601" },
];

export default function LeaderboardScreen() {
  const { leaderboardData, filteredList, myEntry, top3, tab, setTab } =
    useLeaderboard();

  return (
    <ScreenContainer>
      <ScreenTitle title="Leaderboard" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Leaderboard Summary Banner */}
        <View style={styles.heroBanner}>
          <Text style={styles.heroTrophy}>🏆</Text>
          <Text style={styles.heroTitle}>Class Leaderboard</Text>
          <Text style={styles.heroSubtitle}>
            CMU Fall Semester · Campus Rankings
          </Text>

          <View style={styles.userRankChip}>
            <Text style={styles.userRankText}>You're #{myEntry.rank}</Text>
            <Text style={styles.userTotalText}>
              of {leaderboardData.length} students
            </Text>
          </View>
        </View>

        {/* Course Filter Tabs */}
        <FilterRow
          options={TAB_OPTIONS}
          selected={tab}
          onSelect={setTab}
          activeColor={UI_COLORS.xpGreen}
          style={styles.filterRow}
        />

        {/* Top 3 Podium */}
        <Podium top3={top3} />

        {/* Full Rankings List */}
        <View style={styles.rankingList}>
          {filteredList.map((entry) => (
            <RankRow key={`${entry.name}-${entry.rank}`} entry={entry} />
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 100,
  },
  heroBanner: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: UI_COLORS.greenTint,
    padding: spacing.xxl,
    marginBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: UI_COLORS.border,
  },
  heroTrophy: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.black,
    color: UI_COLORS.textPrimary,
  },
  heroSubtitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: UI_COLORS.textSecondary,
    marginTop: 2,
    marginBottom: spacing.lg,
  },
  userRankChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: UI_COLORS.redTint,
    borderColor: UI_COLORS.cmuRed,
    borderWidth: 1,
    paddingHorizontal: spacing.lg + 2,
    paddingVertical: spacing.sm,
    borderRadius: radii.xl,
  },
  userRankText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.black,
    color: UI_COLORS.cmuRed,
  },
  userTotalText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: UI_COLORS.textSecondary,
  },
  filterRow: {
    marginBottom: spacing.xl,
  },
  rankingList: {
    gap: spacing.md + 2,
  },
});
