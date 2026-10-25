import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
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
import {
  AnimatedCollapsible,
  PressableScale,
} from "@/components/ui/Motion";
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
    loading,
    error,
    saving,
    refresh,
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

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const hasActiveFilter = categoryFilter !== "all";

  return (
    <ScreenContainer>
      <ScreenTitle
        title="Habits"
        rightSlot={
          <View style={styles.headerActions}>
            <PressableScale
              style={[
                styles.headerIconBtn,
                searchVisible && styles.headerIconBtnActive,
              ]}
              scaleTo={0.9}
              haptic="selection"
              onPress={toggleSearch}
              accessibilityRole="button"
              accessibilityLabel="Search habits"
            >
              <Ionicons
                name="search-outline"
                size={21}
                color={searchVisible ? UI_COLORS.cmuRed : UI_COLORS.textSecondary}
              />
            </PressableScale>

            <PressableScale
              style={[
                styles.headerIconBtn,
                (filterVisible || hasActiveFilter) && styles.headerIconBtnActive,
              ]}
              scaleTo={0.9}
              haptic="selection"
              onPress={toggleFilterBar}
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
            </PressableScale>

            <PressableScale
              style={[
                styles.headerIconBtn,
                showArchived && styles.headerIconBtnActive,
              ]}
              scaleTo={0.9}
              haptic="selection"
              onPress={toggleArchivedView}
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
            </PressableScale>
          </View>
        }
      />

      {/* Collapsible Search Bar */}
      <AnimatedCollapsible visible={searchVisible} style={styles.searchToolbar}>
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
      </AnimatedCollapsible>

      {/* Collapsible Category Filter Strip */}
      <AnimatedCollapsible
        visible={filterVisible || hasActiveFilter}
        style={styles.filterToolbar}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          <PressableScale
            scaleTo={0.94}
            haptic="selection"
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
          </PressableScale>

          {HABIT_CATEGORIES.map((cat) => {
            const selected = categoryFilter === cat.id;
            return (
              <PressableScale
                key={cat.id}
                scaleTo={0.94}
                haptic="selection"
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
              </PressableScale>
            );
          })}
        </ScrollView>
      </AnimatedCollapsible>

      {/* Archive View Banner */}
      <AnimatedCollapsible visible={showArchived} style={styles.archiveBanner}>
        <View style={styles.archiveBannerLeft}>
          <Ionicons name="archive" size={16} color={UI_COLORS.cmuRed} />
          <Text style={styles.archiveBannerText}>
            Archived Habits ({archivedCount})
          </Text>
        </View>
        <PressableScale scaleTo={0.95} onPress={toggleArchivedView}>
          <Text style={styles.archiveBannerLink}>Back to Active</Text>
        </PressableScale>
      </AnimatedCollapsible>

      {/* Habits Card List */}
      <FlatList
        data={filteredHabits}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={UI_COLORS.cmuRed}
          />
        }
        renderItem={({ item, index }) => (
          <HabitCard
            habit={item}
            index={index}
            waveKey={`${showArchived}:${categoryFilter}`}
            today={today}
            onPressDay={handlePressDay}
            onOpenCalendar={openCalendar}
            onOpenStats={openStats}
            onOpenActions={openActions}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={UI_COLORS.cmuRed} />
              <Text style={[styles.emptySubtitle, { marginTop: spacing.md }]}>
                Loading your habits...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons
                  name="cloud-offline-outline"
                  size={34}
                  color={UI_COLORS.cmuRed}
                />
              </View>
              <Text style={styles.emptyTitle}>Could not load habits</Text>
              <Text style={styles.emptySubtitle}>{error}</Text>
              <PressableScale
                style={styles.retryBtn}
                scaleTo={0.95}
                onPress={handleRefresh}
              >
                <Text style={styles.retryBtnText}>Try Again</Text>
              </PressableScale>
            </View>
          ) : (
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
          )
        }
        contentContainerStyle={[
          styles.listContent,
          filteredHabits.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating '+' Action Button */}
      {!showArchived && (
        <PressableScale
          style={styles.fab}
          scaleTo={0.9}
          haptic="light"
          onPress={openNewHabit}
          accessibilityRole="button"
          accessibilityLabel="Create new habit"
        >
          <Ionicons name="add" size={30} color={UI_COLORS.textOnAccent} />
        </PressableScale>
      )}

      {/* Habit Creation Wizard / Single-View Editor */}
      <AddHabitModal
        visible={modalVisible}
        editingHabit={editingHabit}
        saving={saving}
        onClose={closeModal}
        onSave={handleSaveHabit}
      />

      {/* Numeric Daily Log Modal */}
      <HabitNumericLogModal
        visible={Boolean(numericLogTarget && numericLogHabit)}
        habit={numericLogHabit}
        dateKey={numericLogTarget?.dateKey ?? null}
        today={today}
        onClose={closeNumericLog}
        onSaveValue={handleSaveNumericValue}
      />

      {/* Monthly Calendar History Modal */}
      <HabitCalendarModal
        visible={Boolean(calendarHabit)}
        habit={calendarHabit}
        today={today}
        onClose={closeCalendar}
        onPressDay={handlePressDay}
      />

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
  retryBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
    borderRadius: radii.xl,
    backgroundColor: UI_COLORS.cmuRed,
  },
  retryBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textOnAccent,
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
