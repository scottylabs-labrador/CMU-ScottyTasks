import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import ScreenContainer from "@/components/ui/ScreenContainer";
import ScreenTitle from "@/components/ui/ScreenTitle";
import HabitProgressCard from "@/components/habits/HabitProgressCard";
import HabitRing from "@/components/habits/HabitRing";
import HabitWeekRow from "@/components/habits/HabitWeekRow";
import AddHabitModal from "@/components/AddHabitModal";
import XPFloat from "@/components/XPFloat";
import { useHabits } from "@/hooks/useHabits";
import { UI_COLORS } from "@/constants/gamification";
import { fontSize, fontWeight, radii, spacing } from "@/constants/tokens";

export default function HabitsScreen() {
  const {
    habits,
    completedCount,
    totalStreak,
    modalVisible,
    editingHabit,
    activeFloat,
    setActiveFloat,
    handleToggleToday,
    handleSaveHabit,
    handleDeleteHabit,
    openNewHabit,
    openEditHabit,
    closeModal,
  } = useHabits();

  return (
    <ScreenContainer>
      <ScreenTitle title="Daily Habits" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Progress Card */}
        <HabitProgressCard
          completedCount={completedCount}
          totalHabits={habits.length}
          totalStreak={totalStreak}
        />

        {/* Quick Tap Rings Row */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>TAP TO COMPLETE</Text>
          <TouchableOpacity
            style={styles.addHabitBtn}
            onPress={openNewHabit}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color={UI_COLORS.textOnAccent} />
            <Text style={styles.addHabitBtnText}>New Habit</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.ringsRow}
        >
          {habits.map((habit) => (
            <HabitRing
              key={habit.id}
              habit={habit}
              onToggle={handleToggleToday}
            />
          ))}
        </ScrollView>

        {/* Weekly Matrix Grid */}
        <Text style={[styles.sectionHeader, styles.trackerHeader]}>
          THIS WEEK'S TRACKER
        </Text>

        <View style={styles.matrixList}>
          {habits.map((habit) => (
            <HabitWeekRow
              key={habit.id}
              habit={habit}
              onToggleToday={handleToggleToday}
              onEdit={openEditHabit}
              onDelete={handleDeleteHabit}
            />
          ))}
        </View>
      </ScrollView>

      <AddHabitModal
        visible={modalVisible}
        editingHabit={editingHabit}
        onClose={closeModal}
        onSave={handleSaveHabit}
      />

      {activeFloat && (
        <XPFloat
          amount={activeFloat.xp}
          coins={activeFloat.coins}
          onDone={() => setActiveFloat(null)}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 100,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textMuted,
    letterSpacing: 1,
  },
  trackerHeader: {
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
  },
  addHabitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: UI_COLORS.cmuRed,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.xs + 1,
    borderRadius: radii.lg,
  },
  addHabitBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textOnAccent,
  },
  ringsRow: {
    gap: spacing.lg,
    paddingBottom: spacing.xs,
  },
  matrixList: {
    gap: spacing.lg,
  },
});
