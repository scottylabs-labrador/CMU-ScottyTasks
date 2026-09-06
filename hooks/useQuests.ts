import { useState, useMemo, useCallback } from "react";

import { INITIAL_QUESTS, Quest } from "@/constants/gamification";
import { useUserShopProfile } from "@/hooks/useUserShopProfile";

export type QuestFilter = "all" | "cmu" | "academic" | "social" | "wellness";

export interface ActiveFloatReward {
  xp: number;
  coins: number;
}

export interface UseQuestsReturn {
  quests: Quest[];
  filter: QuestFilter;
  setFilter: (f: QuestFilter) => void;
  filteredQuests: Quest[];
  totalActive: number;
  totalXpAvailable: number;
  totalCoinsAvailable: number;
  activeFloat: ActiveFloatReward | null;
  setActiveFloat: (f: ActiveFloatReward | null) => void;
  handleClaim: (quest: Quest) => void;
}

/**
 * Custom hook for managing quests, category filtering, completion claiming, and reward floats.
 */
export function useQuests(): UseQuestsReturn {
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [filter, setFilter] = useState<QuestFilter>("all");
  const [activeFloat, setActiveFloat] = useState<ActiveFloatReward | null>(null);

  const { addXPAndCoins } = useUserShopProfile();

  const handleClaim = useCallback(
    (quest: Quest) => {
      if (quest.completed) return;

      setQuests((prev) =>
        prev.map((q) =>
          q.id === quest.id ? { ...q, progress: q.total, completed: true } : q
        )
      );

      setActiveFloat({ xp: quest.xp, coins: quest.coins });
      addXPAndCoins(quest.xp, quest.coins, false);
    },
    [addXPAndCoins]
  );

  const filteredQuests = useMemo(
    () => (filter === "all" ? quests : quests.filter((q) => q.category === filter)),
    [quests, filter]
  );

  const totalActive = useMemo(
    () => quests.filter((q) => !q.completed).length,
    [quests]
  );

  const totalXpAvailable = useMemo(
    () => quests.reduce((sum, q) => sum + q.xp, 0),
    [quests]
  );

  const totalCoinsAvailable = useMemo(
    () => quests.reduce((sum, q) => sum + q.coins, 0),
    [quests]
  );

  return {
    quests,
    filter,
    setFilter,
    filteredQuests,
    totalActive,
    totalXpAvailable,
    totalCoinsAvailable,
    activeFloat,
    setActiveFloat,
    handleClaim,
  };
}
