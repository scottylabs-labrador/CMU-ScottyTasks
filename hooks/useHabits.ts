import { UI_COLORS } from "@/constants/gamification";
import { useState, useMemo, useCallback } from "react";
import { Alert } from "react-native";

import type { HabitItem } from "@/components/AddHabitModal";
import { useUserShopProfile } from "@/hooks/useUserShopProfile";

export interface HabitSaveData {
  title: string;
  emoji: string;
  color: string;
  goal: number;
  unit: string;
  step: number;
}

export interface ActiveFloatReward {
  xp: number;
  coins: number;
}

export interface UseHabitsReturn {
  habits: HabitItem[];
  completedCount: number;
  totalStreak: number;
  modalVisible: boolean;
  setModalVisible: (v: boolean) => void;
  editingHabit: HabitItem | null;
  setEditingHabit: (h: HabitItem | null) => void;
  activeFloat: ActiveFloatReward | null;
  setActiveFloat: (f: ActiveFloatReward | null) => void;
  handleToggleToday: (habit: HabitItem) => void;
  handleSaveHabit: (data: HabitSaveData) => void;
  handleDeleteHabit: (id: string) => void;
  openNewHabit: () => void;
  openEditHabit: (habit: HabitItem) => void;
  closeModal: () => void;
}

export const INITIAL_HABITS: HabitItem[] = [
  {
    id: "h-1",
    title: "Morning Run",
    emoji: "🏃",
    streak: 14,
    completedToday: false,
    weekProgress: [true, true, true, true, true, false, false],
    xp: 40,
    color: UI_COLORS.streakOrange,
    goal: 30,
    unit: "mins",
    step: 5,
  },
  {
    id: "h-2",
    title: "No Phone after 11PM",
    emoji: "📵",
    streak: 7,
    completedToday: true,
    weekProgress: [true, true, false, true, true, true, true],
    xp: 50,
    color: UI_COLORS.questPurple,
    goal: 1,
    unit: "night",
    step: 1,
  },
  {
    id: "h-3",
    title: "Drink 8 Glasses of Water",
    emoji: "💧",
    streak: 21,
    completedToday: false,
    weekProgress: [true, true, true, true, true, true, false],
    xp: 30,
    color: UI_COLORS.cyan,
    goal: 64,
    unit: "oz",
    step: 8,
  },
  {
    id: "h-4",
    title: "Review Lecture Notes",
    emoji: "📝",
    streak: 5,
    completedToday: false,
    weekProgress: [false, true, true, true, false, true, false],
    xp: 60,
    color: UI_COLORS.xpGreen,
    goal: 45,
    unit: "mins",
    step: 15,
  },
  {
    id: "h-5",
    title: "Meditate 10 min",
    emoji: "🧘",
    streak: 3,
    completedToday: true,
    weekProgress: [true, false, false, true, true, true, false],
    xp: 35,
    color: UI_COLORS.rose,
    goal: 10,
    unit: "mins",
    step: 5,
  },
];

/**
 * Custom hook for habit tracking, completion toggling, and rewards.
 */
export function useHabits(): UseHabitsReturn {
  const [habits, setHabits] = useState<HabitItem[]>(INITIAL_HABITS);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitItem | null>(null);
  const [activeFloat, setActiveFloat] = useState<ActiveFloatReward | null>(null);

  const { claimActivity } = useUserShopProfile();

  const handleToggleToday = useCallback(
    async (habit: HabitItem) => {
      const nextCompleted = !habit.completedToday;
      let reward = { xp: 0, coins: 0 };
      if (nextCompleted) {
        try { reward = await claimActivity('habit', habit.id, habit.xp, 2); }
        catch { Alert.alert('Error', 'Could not save your habit reward. Please try again.'); return; }
      }
      setHabits((prev) =>
        prev.map((h) => {
          if (h.id !== habit.id) return h;
          const newProgress = [...h.weekProgress];
          newProgress[newProgress.length - 1] = nextCompleted;
          return {
            ...h,
            completedToday: nextCompleted,
            streak: nextCompleted ? h.streak + 1 : Math.max(0, h.streak - 1),
            weekProgress: newProgress,
          };
        })
      );

      if (reward.xp > 0) setActiveFloat(reward);
    },
    [claimActivity]
  );

  const handleSaveHabit = useCallback(
    (data: HabitSaveData) => {
      if (editingHabit) {
        setHabits((prev) =>
          prev.map((h) =>
            h.id === editingHabit.id ? { ...h, ...data } : h
          )
        );
      } else {
        const newHabit: HabitItem = {
          id: `habit-${Date.now()}`,
          ...data,
          streak: 0,
          completedToday: false,
          weekProgress: [false, false, false, false, false, false, false],
          xp: 40,
        };
        setHabits((prev) => [...prev, newHabit]);
      }
      setModalVisible(false);
      setEditingHabit(null);
    },
    [editingHabit]
  );

  const handleDeleteHabit = useCallback((id: string) => {
    Alert.alert("Delete Habit", "Are you sure you want to delete this habit?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setHabits((prev) => prev.filter((h) => h.id !== id));
        },
      },
    ]);
  }, []);

  const openNewHabit = useCallback(() => {
    setEditingHabit(null);
    setModalVisible(true);
  }, []);

  const openEditHabit = useCallback(async (habit: HabitItem) => {
    setEditingHabit(habit);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setEditingHabit(null);
  }, []);

  const completedCount = useMemo(
    () => habits.filter((h) => h.completedToday).length,
    [habits]
  );

  const totalStreak = useMemo(
    () => habits.reduce((sum, h) => sum + h.streak, 0),
    [habits]
  );

  return {
    habits,
    completedCount,
    totalStreak,
    modalVisible,
    setModalVisible,
    editingHabit,
    setEditingHabit,
    activeFloat,
    setActiveFloat,
    handleToggleToday,
    handleSaveHabit,
    handleDeleteHabit,
    openNewHabit,
    openEditHabit,
    closeModal,
  };
}
