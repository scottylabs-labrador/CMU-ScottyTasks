import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import ScreenContainer from "@/components/ui/ScreenContainer";
import ScreenTitle from "@/components/ui/ScreenTitle";
import FilterRow from "@/components/ui/FilterRow";
import TaskHeroBanner from "@/components/tasks/TaskHeroBanner";
import TaskCard from "@/components/tasks/TaskCard";
import AddTaskModal from "@/components/AddTaskModal";
import XPFloat from "@/components/XPFloat";
import { useTasks } from "@/hooks/useTasks";
import { UI_COLORS } from "@/constants/gamification";
import { fontSize, fontWeight, spacing } from "@/constants/tokens";

const FILTER_OPTIONS = [
  { id: "all" as const, label: "ALL" },
  { id: "today" as const, label: "TODAY" },
  { id: "upcoming" as const, label: "UPCOMING" },
];

export default function TasksScreen() {
  const {
    filter,
    setFilter,
    filteredPending,
    pendingCount,
    completedTasks,
    totalXpToday,
    modalVisible,
    editingTask,
    activeFloat,
    setActiveFloat,
    handleToggleComplete,
    handleSaveTask,
    handleDeleteTask,
    openNewTask,
    openEditTask,
    closeModal,
  } = useTasks();

  return (
    <ScreenContainer>
      <ScreenTitle title="My Tasks" />

      <FlatList
        data={filteredPending}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <TaskHeroBanner
              pendingCount={pendingCount}
              totalXpToday={totalXpToday}
              onAddTask={openNewTask}
            />

            <FilterRow
              options={FILTER_OPTIONS}
              selected={filter}
              onSelect={setFilter}
              style={styles.filterRow}
            />
          </View>
        }
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onToggleComplete={handleToggleComplete}
            onPress={openEditTask}
            onDelete={handleDeleteTask}
          />
        )}
        ListFooterComponent={
          completedTasks.length > 0 ? (
            <View style={styles.completedSection}>
              <Text style={styles.completedHeader}>
                COMPLETED TODAY ({completedTasks.length})
              </Text>
              {completedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleComplete={handleToggleComplete}
                  onPress={openEditTask}
                  onDelete={handleDeleteTask}
                />
              ))}
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {modalVisible && <AddTaskModal
        key={editingTask?.id ?? "new"}
        visible={modalVisible}
        editingTask={editingTask}
        onClose={closeModal}
        onSave={handleSaveTask}
      />}

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
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
  },
  headerSection: {
    paddingTop: spacing.xl,
  },
  filterRow: {
    marginBottom: spacing.xl,
  },
  completedSection: {
    marginTop: spacing.xl,
  },
  completedHeader: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: spacing.lg,
  },
});
