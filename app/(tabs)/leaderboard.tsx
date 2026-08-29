import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  UI_COLORS,
  INITIAL_LEADERBOARD,
  LeaderboardEntry,
  calculateLevel,
} from "@/constants/gamification";
import { useUserShopProfile } from "@/hooks/useUserShopProfile";
import ScottyHeader from "@/components/ScottyHeader";

export default function LeaderboardScreen() {
  const [tab, setTab] = useState<"all" | "15-112" | "10-601">("all");
  const { profile } = useUserShopProfile();
  const myLevel = calculateLevel(profile.xp);

  // Dynamic user entry integrated with actual profile XP
  const leaderboardData: LeaderboardEntry[] = INITIAL_LEADERBOARD.map((entry) => {
    if (entry.isMe) {
      return {
        ...entry,
        xp: profile.xp,
        level: myLevel,
      };
    }
    return entry;
  }).sort((a, b) => b.xp - a.xp).map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));

  const me = leaderboardData.find((e) => e.isMe) || leaderboardData[3];

  const top1 = leaderboardData[0] || leaderboardData[0];
  const top2 = leaderboardData[1] || leaderboardData[1];
  const top3 = leaderboardData[2] || leaderboardData[2];

  const filteredList =
    tab === "all"
      ? leaderboardData
      : leaderboardData.filter((e) =>
          e.course.toLowerCase().includes(tab.toLowerCase()) || e.isMe
        );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScottyHeader title="Leaderboard" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Leaderboard Summary Banner */}
        <View style={styles.heroBanner}>
          <Text style={styles.heroTrophy}>🏆</Text>
          <Text style={styles.heroTitle}>Class Leaderboard</Text>
          <Text style={styles.heroSubtitle}>CMU Fall Semester · Campus Rankings</Text>

          <View style={styles.userRankChip}>
            <Text style={styles.userRankText}>You're #{me.rank}</Text>
            <Text style={styles.userTotalText}>of {leaderboardData.length} students</Text>
          </View>
        </View>

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          {[
            { id: "all", label: "All Students" },
            { id: "15-112", label: "15-112" },
            { id: "10-601", label: "10-601" },
          ].map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.filterTab, tab === t.id && styles.filterTabActive]}
              onPress={() => setTab(t.id as any)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  tab === t.id && styles.filterTabTextActive,
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Top 3 Podium */}
        <View style={styles.podiumContainer}>
          {/* #2 Silver */}
          <View style={styles.podiumCol}>
            <Text style={styles.podiumAvatar}>{top2?.avatar || "🐺"}</Text>
            <Text style={styles.podiumName} numberOfLines={1}>
              {top2?.name.split(" ")[0]}
            </Text>
            <View style={[styles.podiumBlock, styles.podiumSilver]}>
              <Text style={styles.podiumMedal}>🥈</Text>
            </View>
            <Text style={styles.podiumXp}>
              {top2?.xp.toLocaleString()} XP
            </Text>
          </View>

          {/* #1 Gold */}
          <View style={[styles.podiumCol, { marginTop: -16 }]}>
            <Text style={styles.podiumAvatar}>{top1?.avatar || "🦊"}</Text>
            <Text style={styles.podiumName} numberOfLines={1}>
              {top1?.name.split(" ")[0]}
            </Text>
            <View style={[styles.podiumBlock, styles.podiumGold]}>
              <Text style={styles.podiumMedal}>🥇</Text>
            </View>
            <Text style={styles.podiumXp}>
              {top1?.xp.toLocaleString()} XP
            </Text>
          </View>

          {/* #3 Bronze */}
          <View style={styles.podiumCol}>
            <Text style={styles.podiumAvatar}>{top3?.avatar || "🦁"}</Text>
            <Text style={styles.podiumName} numberOfLines={1}>
              {top3?.name.split(" ")[0]}
            </Text>
            <View style={[styles.podiumBlock, styles.podiumBronze]}>
              <Text style={styles.podiumMedal}>🥉</Text>
            </View>
            <Text style={styles.podiumXp}>
              {top3?.xp.toLocaleString()} XP
            </Text>
          </View>
        </View>

        {/* Full Rankings List */}
        <View style={styles.rankingList}>
          {filteredList.map((entry) => {
            const isMe = entry.isMe;

            return (
              <View
                key={entry.name + entry.rank}
                style={[
                  styles.rankRow,
                  isMe && styles.rankRowMe,
                ]}
              >
                {/* Rank # */}
                <View style={styles.rankNumCol}>
                  {entry.rank <= 3 ? (
                    <Text style={styles.medalEmoji}>
                      {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}
                    </Text>
                  ) : (
                    <Text style={styles.rankNumText}>#{entry.rank}</Text>
                  )}
                </View>

                {/* Avatar */}
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{entry.avatar}</Text>
                </View>

                {/* Name & Course */}
                <View style={styles.studentInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.studentName}>{entry.name}</Text>
                    {isMe && <Text style={styles.youBadge}>(You)</Text>}
                  </View>
                  <Text style={styles.studentCourse}>
                    {entry.course} · Lv.{entry.level}
                  </Text>
                </View>

                {/* XP & Rank Delta */}
                <View style={styles.scoreCol}>
                  <Text style={styles.scoreXp}>
                    {entry.xp.toLocaleString()}
                  </Text>
                  <Text
                    style={[
                      styles.deltaText,
                      entry.delta > 0
                        ? { color: UI_COLORS.xpGreen }
                        : entry.delta < 0
                        ? { color: "#F87171" }
                        : { color: UI_COLORS.textMuted },
                    ]}
                  >
                    {entry.delta > 0
                      ? `▲ ${entry.delta}`
                      : entry.delta < 0
                      ? `▼ ${Math.abs(entry.delta)}`
                      : "—"}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
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
    alignItems: "center",
    backgroundColor: UI_COLORS.bgCard,
    borderColor: "rgba(74, 222, 128, 0.3)",
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  heroTrophy: {
    fontSize: 36,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: UI_COLORS.textPrimary,
  },
  heroSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: UI_COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 12,
  },
  userRankChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(196, 18, 48, 0.15)",
    borderColor: UI_COLORS.cmuRed,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  userRankText: {
    fontSize: 13,
    fontWeight: "900",
    color: UI_COLORS.cmuRed,
  },
  userTotalText: {
    fontSize: 11,
    fontWeight: "600",
    color: UI_COLORS.textSecondary,
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: "center",
  },
  filterTabActive: {
    backgroundColor: "rgba(74, 222, 128, 0.15)",
    borderColor: UI_COLORS.xpGreen,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: UI_COLORS.textMuted,
  },
  filterTabTextActive: {
    color: UI_COLORS.xpGreen,
    fontWeight: "800",
  },
  podiumContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  podiumCol: {
    flex: 1,
    alignItems: "center",
  },
  podiumAvatar: {
    fontSize: 26,
    marginBottom: 2,
  },
  podiumName: {
    fontSize: 11,
    fontWeight: "800",
    color: UI_COLORS.textPrimary,
    marginBottom: 6,
  },
  podiumBlock: {
    width: "100%",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  podiumGold: {
    height: 80,
    backgroundColor: "rgba(255, 184, 0, 0.2)",
    borderColor: UI_COLORS.cmuGold,
  },
  podiumSilver: {
    height: 60,
    backgroundColor: "rgba(192, 192, 192, 0.2)",
    borderColor: "#C0C0C0",
  },
  podiumBronze: {
    height: 48,
    backgroundColor: "rgba(205, 127, 50, 0.2)",
    borderColor: "#CD7F32",
  },
  podiumMedal: {
    fontSize: 20,
  },
  podiumXp: {
    fontSize: 10,
    fontWeight: "800",
    color: UI_COLORS.cmuGold,
    marginTop: 4,
  },
  rankingList: {
    gap: 10,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    gap: 12,
  },
  rankRowMe: {
    borderColor: UI_COLORS.cmuRed,
    backgroundColor: "rgba(196, 18, 48, 0.12)",
  },
  rankNumCol: {
    width: 28,
    alignItems: "center",
  },
  medalEmoji: {
    fontSize: 18,
  },
  rankNumText: {
    fontSize: 13,
    fontWeight: "800",
    color: UI_COLORS.textMuted,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: UI_COLORS.bgWarm,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
  },
  studentInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  studentName: {
    fontSize: 14,
    fontWeight: "800",
    color: UI_COLORS.textPrimary,
  },
  youBadge: {
    fontSize: 11,
    fontWeight: "800",
    color: UI_COLORS.cmuRed,
  },
  studentCourse: {
    fontSize: 11,
    fontWeight: "600",
    color: UI_COLORS.textMuted,
    marginTop: 2,
  },
  scoreCol: {
    alignItems: "flex-end",
  },
  scoreXp: {
    fontSize: 13,
    fontWeight: "800",
    color: UI_COLORS.cmuGold,
  },
  deltaText: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
});
