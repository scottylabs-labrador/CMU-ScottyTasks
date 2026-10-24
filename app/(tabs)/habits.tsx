import React from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import ScreenContainer from "@/components/ui/ScreenContainer";
import ScreenTitle from "@/components/ui/ScreenTitle";
import HabitCard from "@/components/habits/HabitCard";
import {
  HabitActionsModal,
  HabitCalendarModal,
  HabitNumericLogModal,
  HabitStatsModal,
} from "@/components/habits/HabitDetailModals";
import AddHabitModal from "@/components/AddHabitModal";
import XPFloat from "@/components/XPFloat";
import { HABIT_CATEGORIES } from "@/constants/habits";
import { UI_COLORS } from "@/constants/gamification";
import { fontSize, fontWeight, radii, shadows, spacing } from "@/constants/tokens";
import { useHabits } from "@/hooks/useHabits";

export default function HabitsScreen() {
  const {
    filteredHabits,
    today,
    archivedCount,
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
    modalVisible,
    editingHabit,
    openNewHabit,
    openEditHabit,
    closeModal,
    handleSaveHabit,
    handlePressDay,
    handleSaveNumericValue,
    handleToggleArchive,
    handleResetProgress,
    handleDeleteHabit,
    numericLogTarget,
    numericLogHabit,
    closeNumericLog,
    calendarHabit,
    openCalendar,
    closeCalendar,
    statsHabit,
    openStats,
    closeStats,
    actionsHabit,
    openActions,
    closeActions,
    activeFloat,
    setActiveFloat,
  } = useHabits();

  const hasActiveFilter = categoryFilter !== "all";

  return (
    <ScreenContainer>
      <ScreenTitle
        title="Habits"
        rightSlot={
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[
                styles.headerIconBtn,
                searchVisible && styles.headerIconBtnActive,
              ]}
              onPress={toggleSearch}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Search habits"
            >
              <Ionicons
                name="search-outline"
                size={21}
                color={searchVisible ? UI_COLORS.cmuRed : UI_COLORS.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.headerIconBtn,
                (filterVisible || hasActiveFilter) && styles.headerIconBtnActive,
              ]}
              onPress={toggleFilterBar}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Filter habits by category"
            >
              <Ionicons
                name="filter-outline"
                size={21}
                color={
                  filterVisible || hasActiveFilter
                    ? UI_COLORS.cmuRed
                    : UI_COLORS.textSecondary
                }
              />
              {hasActiveFilter && <View style={styles.activeFilterDot} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.headerIconBtn,
                showArchived && styles.headerIconBtnActive,
              ]}
              onPress={toggleArchivedView}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={
                showArchived ? "View active habits" : "View archived habits"
              }
            >
              <Ionicons
                name="archive-outline"
                size={21}
                color={showArchived ? UI_COLORS.cmuRed : UI_COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Collapsible Search Bar */}
      {searchVisible && (
        <View style={styles.searchToolbar}>
          <View style={styles.searchBox}>
            <Ionicons
              name="search-outline"
              size={17}
              color={UI_COLORS.textMuted}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search habits..."
              placeholderTextColor={UI_COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons
                  name="close-circle"
                  size={17}
                  color={UI_COLORS.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Collapsible Category Filter Strip */}
      {(filterVisible || hasActiveFilter) && (
        <View style={styles.filterToolbar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                categoryFilter === "all" && styles.categoryChipActive,
              ]}
              onPress={() => setCategoryFilter("all")}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  categoryFilter === "all" && styles.categoryChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>

            {HABIT_CATEGORIES.map((cat) => {
              const selected = categoryFilter === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    selected && {
                      backgroundColor: cat.color,
                      borderColor: cat.color,
                    },
                  ]}
                  onPress={() =>
                    setCategoryFilter(selected ? "all" : cat.id)
                  }
                >
                  <Ionicons
                    name={cat.icon as keyof typeof Ionicons.glyphMap}
                    size={13}
                    color={selected ? UI_COLORS.textOnAccent : cat.color}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      selected && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Archive View Banner */}
      {showArchived && (
        <View style={styles.archiveBanner}>
          <View style={styles.archiveBannerLeft}>
            <Ionicons name="archive" size={16} color={UI_COLORS.cmuRed} />
            <Text style={styles.archiveBannerText}>
              Archived Habits ({archivedCount})
            </Text>
          </View>
          <TouchableOpacity onPress={toggleArchivedView}>
            <Text style={styles.archiveBannerLink}>Back to Active</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Habits Card List */}
      <FlatList
        data={filteredHabits}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <HabitCard
            habit={item}
            today={today}
            onPressDay={handlePressDay}
            onOpenCalendar={openCalendar}
            onOpenStats={openStats}
            onOpenActions={openActions}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name={showArchived ? "archive-outline" : "ribbon-outline"}
                size={36}
                color={UI_COLORS.cmuRed}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {showArchived
                ? "No archived habits"
                : searchQuery.trim() || hasActiveFilter
                ? "No matching habits"
                : "No habits yet"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {showArchived
                ? "Archived habits will appear here for safekeeping."
                : searchQuery.trim() || hasActiveFilter
                ? "Try clearing your search or category filter."
                : "Tap the + button below to create your first daily habit."}
            </Text>
          </View>
        }
        contentContainerStyle={[
          styles.listContent,
          filteredHabits.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating '+' Action Button */}
      {!showArchived && (
        <TouchableOpacity
          style={styles.fab}
          onPress={openNewHabit}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Create new habit"
        >
          <Ionicons name="add" size={30} color={UI_COLORS.textOnAccent} />
        </TouchableOpacity>
      )}

      {/* Habit Creation Wizard / Single-View Editor */}
      {modalVisible && (
        <AddHabitModal
          key={editingHabit?.id ?? "new"}
          visible={modalVisible}
          editingHabit={editingHabit}
          onClose={closeModal}
          onSave={handleSaveHabit}
        />
      )}

      {/* Numeric Daily Log Modal */}
      {numericLogTarget && numericLogHabit && (
        <HabitNumericLogModal
          key={`${numericLogTarget.habitId}:${numericLogTarget.dateKey}`}
          visible
          habit={numericLogHabit}
          dateKey={numericLogTarget.dateKey}
          today={today}
          onClose={closeNumericLog}
          onSaveValue={handleSaveNumericValue}
        />
      )}

      {/* Monthly Calendar History Modal */}
      {calendarHabit && (
        <HabitCalendarModal
          key={calendarHabit.id}
          visible
          habit={calendarHabit}
          today={today}
          onClose={closeCalendar}
          onPressDay={handlePressDay}
        />
      )}

      {/* Habit Statistics Modal */}
      <HabitStatsModal
        visible={Boolean(statsHabit)}
        habit={statsHabit}
        today={today}
        onClose={closeStats}
      />

      {/* More Options (`⋮`) Sheet */}
      <HabitActionsModal
        visible={Boolean(actionsHabit)}
        habit={actionsHabit}
        onClose={closeActions}
        onEdit={openEditHabit}
        onOpenCalendar={openCalendar}
        onOpenStats={openStats}
        onToggleArchive={handleToggleArchive}
        onResetProgress={handleResetProgress}
        onDelete={handleDeleteHabit}
      />

      {/* Gamification XP & Coin Float */}
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  headerIconBtnActive: {
    backgroundColor: UI_COLORS.redTint,
  },
  activeFilterDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: UI_COLORS.cmuRed,
  },
  searchToolbar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: UI_COLORS.bgCard,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.lg,
    color: UI_COLORS.textPrimary,
    paddingVertical: 0,
  },
  filterToolbar: {
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.xs,
  },
  filterScrollContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    alignItems: "center",
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: UI_COLORS.bgCard,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    borderRadius: radii.xl,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  categoryChipActive: {
    backgroundColor: UI_COLORS.cmuRed,
    borderColor: UI_COLORS.cmuRed,
  },
  categoryChipText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textSecondary,
  },
  categoryChipTextActive: {
    color: UI_COLORS.textOnAccent,
  },
  archiveBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: UI_COLORS.redTint,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
  },
  archiveBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  archiveBannerText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textPrimary,
  },
  archiveBannerLink: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.cmuRed,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 110,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.xxxxl,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: UI_COLORS.redTint,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textPrimary,
    marginBottom: spacing.xs + 2,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: fontSize.lg,
    color: UI_COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  fab: {
    position: "absolute",
    right: spacing.xl,
    bottom: spacing.xxl,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: UI_COLORS.cmuRed,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.elevated,
  },
});
