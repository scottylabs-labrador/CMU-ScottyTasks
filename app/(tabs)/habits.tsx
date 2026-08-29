import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { UI_COLORS } from "@/constants/gamification";
import { useUserShopProfile } from "@/hooks/useUserShopProfile";
import ScottyHeader from "@/components/ScottyHeader";
import ScottyDog from "@/components/ScottyDog";
import XPFloat from "@/components/XPFloat";
import AddHabitModal, { HabitItem } from "@/components/AddHabitModal";

const INITIAL_HABITS: HabitItem[] = [
  {
    id: "h-1",
    title: "Morning Run",
    emoji: "🏃",
    streak: 14,
    completedToday: false,
    weekProgress: [true, true, true, true, true, false, false],
    xp: 40,
    color: "#FB923C",
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
    color: "#A855F7",
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
    color: "#38BDF8",
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
    color: "#4ADE80",
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
    color: "#F472B6",
    goal: 10,
    unit: "mins",
    step: 5,
  },
];

const DAYS_LABEL = ["M", "T", "W", "T", "F", "S", "S"];

export default function HabitsScreen() {
  const [habits, setHabits] = useState<HabitItem[]>(INITIAL_HABITS);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitItem | null>(null);
  const [activeFloat, setActiveFloat] = useState<{ xp: number; coins: number } | null>(null);

  const { addXPAndCoins } = useUserShopProfile();

  const handleToggleToday = (habit: HabitItem) => {
    const nextCompleted = !habit.completedToday;
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

    if (nextCompleted) {
      setActiveFloat({ xp: habit.xp, coins: 2 });
      addXPAndCoins(habit.xp, 2, false);
    }
  };

  const handleSaveHabit = (data: {
    title: string;
    emoji: string;
    color: string;
    goal: number;
    unit: string;
    step: number;
  }) => {
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
  };

  const handleDeleteHabit = (id: string) => {
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
  };

  const completedCount = habits.filter((h) => h.completedToday).length;
  const totalStreak = habits.reduce((sum, h) => sum + h.streak, 0);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScottyHeader title="Daily Habits" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Progress Card */}
        <View style={styles.progressCard}>
          <ScottyDog size={52} animated={true} />
          <View style={styles.progressInfo}>
            <Text style={styles.progressSub}>Today's Progress</Text>
            <View style={styles.progressCountRow}>
              <Text style={styles.progressDoneCount}>{completedCount}</Text>
              <Text style={styles.progressTotalCount}>/ {habits.length}</Text>
            </View>

            <View style={styles.barBg}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${habits.length > 0 ? (completedCount / habits.length) * 100 : 0}%`,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.streakBox}>
            <Text style={styles.streakNumber}>{totalStreak}</Text>
            <Text style={styles.streakLabel}>total streak</Text>
          </View>
        </View>

        {/* Quick Tap Rings Row */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>TAP TO COMPLETE</Text>
          <TouchableOpacity
            style={styles.addHabitBtn}
            onPress={() => {
              setEditingHabit(null);
              setModalVisible(true);
            }}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addHabitBtnText}>New Habit</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.ringsRow}
        >
          {habits.map((habit) => (
            <TouchableOpacity
              key={habit.id}
              style={styles.ringItem}
              onPress={() => handleToggleToday(habit)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.ringCircle,
                  { borderColor: habit.color },
                  habit.completedToday && {
                    backgroundColor: `${habit.color}30`,
                    borderColor: UI_COLORS.xpGreen,
                  },
                ]}
              >
                <Text style={styles.ringEmoji}>
                  {habit.completedToday ? "✅" : habit.emoji}
                </Text>
              </View>
              <Text style={styles.ringTitle} numberOfLines={1}>
                {habit.title}
              </Text>
              <View
                style={[
                  styles.ringStreakBadge,
                  { backgroundColor: `${habit.color}25` },
                ]}
              >
                <Text style={[styles.ringStreakText, { color: habit.color }]}>
                  🔥 {habit.streak}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Weekly Matrix Grid */}
        <Text style={[styles.sectionHeader, { marginTop: 20 }]}>
          THIS WEEK'S TRACKER
        </Text>

        <View style={styles.matrixList}>
          {habits.map((habit) => (
            <View key={habit.id} style={styles.habitCard}>
              <View style={styles.cardTop}>
                <View style={styles.habitTitleRow}>
                  <Text style={styles.habitEmoji}>{habit.emoji}</Text>
                  <Text style={styles.habitTitle}>{habit.title}</Text>
                </View>

                <View style={styles.cardActions}>
                  <Text style={[styles.cardStreak, { color: habit.color }]}>
                    🔥 {habit.streak}d
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingHabit(habit);
                      setModalVisible(true);
                    }}
                    style={styles.iconBtn}
                  >
                    <Ionicons name="pencil" size={14} color={UI_COLORS.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteHabit(habit.id)}
                    style={styles.iconBtn}
                  >
                    <Ionicons name="trash-outline" size={14} color={UI_COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 7 Days Matrix */}
              <View style={styles.daysRow}>
                {DAYS_LABEL.map((day, idx) => {
                  const isDone = habit.weekProgress[idx];
                  const isToday = idx === DAYS_LABEL.length - 1;

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={styles.dayCol}
                      onPress={() => {
                        if (isToday) handleToggleToday(habit);
                      }}
                      disabled={!isToday}
                    >
                      <Text
                        style={[
                          styles.dayLabel,
                          isToday && { color: UI_COLORS.textPrimary, fontWeight: "800" },
                        ]}
                      >
                        {day}
                      </Text>
                      <View
                        style={[
                          styles.dayDot,
                          isDone && { backgroundColor: habit.color },
                          isToday && !isDone && styles.todayEmptyDot,
                        ]}
                      >
                        {isDone && (
                          <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <AddHabitModal
        visible={modalVisible}
        editingHabit={editingHabit}
        onClose={() => {
          setModalVisible(false);
          setEditingHabit(null);
        }}
        onSave={handleSaveHabit}
      />

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
  progressCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: UI_COLORS.bgCard,
    borderColor: "rgba(168, 85, 247, 0.3)",
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginBottom: 20,
    gap: 14,
  },
  progressInfo: {
    flex: 1,
  },
  progressSub: {
    fontSize: 11,
    fontWeight: "700",
    color: UI_COLORS.textMuted,
    textTransform: "uppercase",
  },
  progressCountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginVertical: 2,
  },
  progressDoneCount: {
    fontSize: 26,
    fontWeight: "900",
    color: UI_COLORS.textPrimary,
  },
  progressTotalCount: {
    fontSize: 14,
    fontWeight: "700",
    color: UI_COLORS.textMuted,
  },
  barBg: {
    height: 6,
    backgroundColor: UI_COLORS.bgElevated,
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 4,
  },
  barFill: {
    height: "100%",
    backgroundColor: UI_COLORS.cmuRed,
    borderRadius: 3,
  },
  streakBox: {
    alignItems: "center",
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: UI_COLORS.border,
  },
  streakNumber: {
    fontSize: 22,
    fontWeight: "900",
    color: UI_COLORS.streakOrange,
  },
  streakLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: UI_COLORS.textMuted,
    textTransform: "uppercase",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "800",
    color: UI_COLORS.textMuted,
    letterSpacing: 1,
  },
  addHabitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: UI_COLORS.cmuRed,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  addHabitBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  ringsRow: {
    gap: 12,
    paddingBottom: 4,
  },
  ringItem: {
    width: 78,
    alignItems: "center",
  },
  ringCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2.5,
    backgroundColor: UI_COLORS.bgCard,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  ringEmoji: {
    fontSize: 24,
  },
  ringTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: UI_COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 4,
  },
  ringStreakBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  ringStreakText: {
    fontSize: 10,
    fontWeight: "800",
  },
  matrixList: {
    gap: 12,
    marginTop: 12,
  },
  habitCard: {
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  habitTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  habitEmoji: {
    fontSize: 18,
  },
  habitTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: UI_COLORS.textPrimary,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardStreak: {
    fontSize: 12,
    fontWeight: "800",
    marginRight: 4,
  },
  iconBtn: {
    padding: 4,
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayCol: {
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: UI_COLORS.textMuted,
  },
  dayDot: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: UI_COLORS.bgWarm,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  todayEmptyDot: {
    borderColor: UI_COLORS.cmuRed,
    borderWidth: 1.5,
  },
});
