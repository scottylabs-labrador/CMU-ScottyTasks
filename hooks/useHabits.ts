import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  HABIT_PRIORITY_XP,
  createInitialHabits,
  type HabitCategoryId,
  type HabitItem,
  type HabitSaveData,
} from "@/constants/habits";
import { useAuth } from "@/contexts/AuthContext";
import { useUserShopProfile } from "@/hooks/useUserShopProfile";
import { localDateKey, parseTaskDate } from "@/utils/taskDates";
import {
  evaluateNumericValue,
  isDayCompleted,
  normalizeHabit,
} from "@/utils/habitLogic";

export interface ActiveFloatReward {
  xp: number;
  coins: number;
}

export interface NumericLogTarget {
  habitId: string;
  dateKey: string;
}

const STORAGE_PREFIX = "scotty_habits_v2:";

async function loadStoredHabits(storageKey: string): Promise<HabitItem[] | null> {
  try {
    const raw =
      Platform.OS === "web"
        ? typeof window !== "undefined"
          ? window.localStorage.getItem(storageKey)
          : null
        : await AsyncStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const now = new Date();
    return parsed
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
      .map((item) => normalizeHabit(item, now));
  } catch {
    return null;
  }
}

async function persistStoredHabits(storageKey: string, items: HabitItem[]): Promise<void> {
  try {
    const serialized = JSON.stringify(items);
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, serialized);
      }
    } else {
      await AsyncStorage.setItem(storageKey, serialized);
    }
  } catch {
    // Non-fatal storage persistence failure
  }
}

function confirmAction(title: string, message: string, confirmText: string, onConfirm: () => void) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: confirmText, style: "destructive", onPress: onConfirm },
  ]);
}

export function useHabits() {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const storageKey = `${STORAGE_PREFIX}${uid ?? "guest"}`;

  const [todayKey, setTodayKey] = useState(() => localDateKey(new Date()));
  const today = useMemo(
    () => parseTaskDate(todayKey) ?? new Date(),
    [todayKey]
  );

  useEffect(() => {
    const refreshDay = () => setTodayKey(localDateKey(new Date()));
    const timer = setInterval(refreshDay, 30_000);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshDay();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, []);

  const [habits, setHabits] = useState<HabitItem[]>(() =>
    createInitialHabits(new Date())
  );
  const hydratedKeyRef = useRef<string | null>(null);
  const guestRewardedRef = useRef<Set<string>>(new Set());

  // Hydrate habits per user/guest session
  useEffect(() => {
    let active = true;
    hydratedKeyRef.current = null;
    void loadStoredHabits(storageKey).then((loaded) => {
      if (!active) return;
      if (loaded) {
        setHabits(loaded);
      } else {
        setHabits(createInitialHabits(new Date()));
      }
      hydratedKeyRef.current = storageKey;
    });
    return () => {
      active = false;
    };
  }, [storageKey]);

  // Persist changes once hydrated
  useEffect(() => {
    if (hydratedKeyRef.current !== storageKey) return;
    void persistStoredHabits(storageKey, habits);
  }, [habits, storageKey]);

  // Header controls: Search, Category Filter, Archive Toggle
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<"all" | HabitCategoryId>("all");
  const [showArchived, setShowArchived] = useState(false);

  // Modals state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitItem | null>(null);
  const [numericLogTarget, setNumericLogTarget] = useState<NumericLogTarget | null>(null);
  const [calendarHabitId, setCalendarHabitId] = useState<string | null>(null);
  const [statsHabitId, setStatsHabitId] = useState<string | null>(null);
  const [actionsHabitId, setActionsHabitId] = useState<string | null>(null);
  const [activeFloat, setActiveFloat] = useState<ActiveFloatReward | null>(null);

  const { claimActivity } = useUserShopProfile();

  const awardHabitTodayIfEligible = useCallback(
    async (habit: HabitItem) => {
      const claimKey = `${habit.id}:${todayKey}`;
      if (!uid) {
        if (guestRewardedRef.current.has(claimKey)) return;
        guestRewardedRef.current.add(claimKey);
      }
      try {
        const reward = await claimActivity("habit", habit.id, habit.xp, 2);
        if (reward.xp > 0) {
          setActiveFloat({ xp: reward.xp, coins: reward.coins });
        }
      } catch {
        // Keep local habit completion responsive even if network claim fails
      }
    },
    [claimActivity, todayKey, uid]
  );

  const handlePressDay = useCallback(
    (habit: HabitItem, dateKey: string) => {
      if (habit.evaluationType === "numeric") {
        setNumericLogTarget({ habitId: habit.id, dateKey });
        return;
      }

      const wasCompleted = isDayCompleted(habit, dateKey);
      const nextCompleted = !wasCompleted;

      setHabits((prev) =>
        prev.map((h) => {
          if (h.id !== habit.id) return h;
          const nextHistory = { ...h.history };
          if (nextCompleted) {
            nextHistory[dateKey] = {
              ...nextHistory[dateKey],
              completed: true,
            };
          } else if (nextHistory[dateKey]?.note) {
            nextHistory[dateKey] = {
              ...nextHistory[dateKey],
              completed: false,
            };
          } else {
            delete nextHistory[dateKey];
          }

          const nextStartDate =
            nextCompleted && dateKey < h.startDate ? dateKey : h.startDate;

          return {
            ...h,
            startDate: nextStartDate,
            history: nextHistory,
          };
        })
      );

      if (nextCompleted && dateKey === todayKey) {
        void awardHabitTodayIfEligible(habit);
      }
    },
    [awardHabitTodayIfEligible, todayKey]
  );

  const handleSaveNumericValue = useCallback(
    (habit: HabitItem, dateKey: string, value: number | null, note: string) => {
      const wasCompleted = isDayCompleted(habit, dateKey);
      const nextCompleted =
        value !== null &&
        evaluateNumericValue(value, habit.goalCondition, habit.goal);

      setHabits((prev) =>
        prev.map((h) => {
          if (h.id !== habit.id) return h;
          const nextHistory = { ...h.history };
          if (value === null) {
            delete nextHistory[dateKey];
          } else {
            nextHistory[dateKey] = {
              completed: nextCompleted,
              value,
              ...(note ? { note } : {}),
            };
          }

          const nextStartDate =
            value !== null && dateKey < h.startDate ? dateKey : h.startDate;

          return {
            ...h,
            startDate: nextStartDate,
            history: nextHistory,
          };
        })
      );

      if (!wasCompleted && nextCompleted && dateKey === todayKey) {
        void awardHabitTodayIfEligible(habit);
      }
    },
    [awardHabitTodayIfEligible, todayKey]
  );

  const handleSaveHabit = useCallback(
    (data: HabitSaveData) => {
      const xp = HABIT_PRIORITY_XP[data.priority];
      if (editingHabit) {
        setHabits((prev) =>
          prev.map((h) => {
            if (h.id !== editingHabit.id) return h;
            // Re-evaluate existing numeric history entries if goal/condition changed
            const updatedHistory = { ...h.history };
            if (data.evaluationType === "numeric") {
              for (const [k, entry] of Object.entries(updatedHistory)) {
                if (typeof entry.value === "number") {
                  updatedHistory[k] = {
                    ...entry,
                    completed: evaluateNumericValue(
                      entry.value,
                      data.goalCondition,
                      data.goal
                    ),
                  };
                }
              }
            }
            return {
              ...h,
              ...data,
              xp,
              history: updatedHistory,
            };
          })
        );
      } else {
        const newHabit: HabitItem = {
          id: `habit-${Date.now()}`,
          ...data,
          xp,
          archived: false,
          history: {},
        };
        setHabits((prev) => [newHabit, ...prev]);
      }

      setModalVisible(false);
      setEditingHabit(null);
    },
    [editingHabit]
  );

  const handleToggleArchive = useCallback((habit: HabitItem) => {
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habit.id ? { ...h, archived: !h.archived } : h
      )
    );
  }, []);

  const handleResetProgress = useCallback((habit: HabitItem) => {
    confirmAction(
      "Reset Habit Progress",
      `Clear all recorded history for "${habit.title}"?`,
      "Reset",
      () => {
        setHabits((prev) =>
          prev.map((h) =>
            h.id === habit.id
              ? { ...h, history: {}, startDate: localDateKey(new Date()) }
              : h
          )
        );
      }
    );
  }, []);

  const handleDeleteHabit = useCallback((id: string) => {
    confirmAction(
      "Delete Habit",
      "Are you sure you want to permanently delete this habit?",
      "Delete",
      () => {
        setHabits((prev) => prev.filter((h) => h.id !== id));
      }
    );
  }, []);

  const openNewHabit = useCallback(() => {
    setEditingHabit(null);
    setModalVisible(true);
  }, []);

  const openEditHabit = useCallback((habit: HabitItem) => {
    setEditingHabit(habit);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setEditingHabit(null);
  }, []);

  const toggleSearch = useCallback(() => {
    setSearchVisible((prev) => {
      if (prev) setSearchQuery("");
      return !prev;
    });
  }, []);

  const toggleFilterBar = useCallback(() => {
    setFilterVisible((prev) => !prev);
  }, []);

  const toggleArchivedView = useCallback(() => {
    setShowArchived((prev) => !prev);
  }, []);

  const archivedCount = useMemo(
    () => habits.filter((h) => h.archived).length,
    [habits]
  );

  const filteredHabits = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return habits.filter((h) => {
      if (Boolean(h.archived) !== showArchived) return false;
      if (categoryFilter !== "all" && h.categoryId !== categoryFilter) {
        return false;
      }
      if (query) {
        const matchesTitle = h.title.toLowerCase().includes(query);
        const matchesDesc = h.description.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }
      return true;
    });
  }, [habits, showArchived, categoryFilter, searchQuery]);

  const numericLogHabit = useMemo(
    () =>
      numericLogTarget
        ? habits.find((h) => h.id === numericLogTarget.habitId) ?? null
        : null,
    [habits, numericLogTarget]
  );

  const calendarHabit = useMemo(
    () =>
      calendarHabitId
        ? habits.find((h) => h.id === calendarHabitId) ?? null
        : null,
    [habits, calendarHabitId]
  );

  const statsHabit = useMemo(
    () =>
      statsHabitId ? habits.find((h) => h.id === statsHabitId) ?? null : null,
    [habits, statsHabitId]
  );

  const actionsHabit = useMemo(
    () =>
      actionsHabitId
        ? habits.find((h) => h.id === actionsHabitId) ?? null
        : null,
    [habits, actionsHabitId]
  );

  return {
    habits,
    filteredHabits,
    today,
    archivedCount,

    // Header bar state
    searchVisible,
    searchQuery,
    setSearchQuery,
    toggleSearch,
    filterVisible,
    categoryFilter,
    setCategoryFilter,
    toggleFilterBar,
    showArchived,
    toggleArchivedView,

    // Create / Edit modal
    modalVisible,
    editingHabit,
    openNewHabit,
    openEditHabit,
    closeModal,
    handleSaveHabit,

    // Card interactions & detail modals
    handlePressDay,
    handleSaveNumericValue,
    handleToggleArchive,
    handleResetProgress,
    handleDeleteHabit,

    numericLogTarget,
    numericLogHabit,
    closeNumericLog: () => setNumericLogTarget(null),

    calendarHabit,
    openCalendar: (h: HabitItem) => setCalendarHabitId(h.id),
    closeCalendar: () => setCalendarHabitId(null),

    statsHabit,
    openStats: (h: HabitItem) => setStatsHabitId(h.id),
    closeStats: () => setStatsHabitId(null),

    actionsHabit,
    openActions: (h: HabitItem) => setActionsHabitId(h.id),
    closeActions: () => setActionsHabitId(null),

    // Gamification reward popup
    activeFloat,
    setActiveFloat,
  };
}
