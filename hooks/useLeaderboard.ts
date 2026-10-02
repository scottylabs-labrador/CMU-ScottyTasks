import { useState, useMemo } from "react";

import {
  INITIAL_LEADERBOARD,
  LeaderboardEntry,
  calculateLevel,
} from "@/constants/gamification";
import { useUserShopProfile } from "@/hooks/useUserShopProfile";

export type LeaderboardTab = "all" | "15-112" | "10-601";

export interface UseLeaderboardReturn {
  leaderboardData: LeaderboardEntry[];
  filteredList: LeaderboardEntry[];
  myEntry: LeaderboardEntry;
  top3: [LeaderboardEntry, LeaderboardEntry, LeaderboardEntry];
  tab: LeaderboardTab;
  setTab: (t: LeaderboardTab) => void;
}

/**
 * Custom hook for computing leaderboard rankings, course filtering, and user standing.
 */
export function useLeaderboard(): UseLeaderboardReturn {
  const [tab, setTab] = useState<LeaderboardTab>("all");
  const { profile } = useUserShopProfile();

  const leaderboardData: LeaderboardEntry[] = useMemo(() => {
    const myLevel = calculateLevel(profile.xp);

    return INITIAL_LEADERBOARD.map((entry) => {
      if (entry.isMe) {
        return {
          ...entry,
          xp: profile.xp,
          level: myLevel,
        };
      }
      return entry;
    })
      .sort((a, b) => b.xp - a.xp)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
  }, [profile.xp]);

  const myEntry: LeaderboardEntry = useMemo(
    () => leaderboardData.find((e) => e.isMe) || leaderboardData[0],
    [leaderboardData]
  );

  const top3: [LeaderboardEntry, LeaderboardEntry, LeaderboardEntry] = useMemo(() => {
    const top1 = leaderboardData[0] || INITIAL_LEADERBOARD[0];
    const top2 = leaderboardData[1] || leaderboardData[0] || INITIAL_LEADERBOARD[1];
    const top3Entry = leaderboardData[2] || leaderboardData[1] || INITIAL_LEADERBOARD[2];
    return [top1, top2, top3Entry];
  }, [leaderboardData]);

  const filteredList: LeaderboardEntry[] = useMemo(() => {
    if (tab === "all") {
      return leaderboardData;
    }
    const lowerTab = tab.toLowerCase();
    return leaderboardData.filter(
      (e) => e.course.toLowerCase().includes(lowerTab) || e.isMe
    );
  }, [leaderboardData, tab]);

  return {
    leaderboardData,
    filteredList,
    myEntry,
    top3,
    tab,
    setTab,
  };
}
