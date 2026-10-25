import React, { useState } from "react";
import {
  ActivityIndicator,
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
  FadeSwitchView,
  PressableScale,
} from "@/components/ui/Motion";
import TaskHeroBanner from "@/components/tasks/TaskHeroBanner";
import TaskCalendarCard from "@/components/tasks/TaskCalendarCard";
import TaskCard from "@/components/tasks/TaskCard";
import AddTaskModal from "@/components/AddTaskModal";
import XPFloat from "@/components/XPFloat";
import { useTasks, type TaskPriorityFilter } from "@/hooks/useTasks";
import { formatCalendarDayHeading } from "@/utils/taskDates";
import { UI_COLORS } from "@/constants/gamification";
import { fontSize, fontWeight, radii, shadows, spacing } from "@/constants/tokens";

const PRIORITY_OPTIONS: {
  id: TaskPriorityFilter;
  label: string;
  color?: string;
}[] = [
  { id: "all", label: "All Priorities" },
  { id: "high", label: "High", color: UI_COLORS.priorityHigh },
  { id: "medium", label: "Medium", color: UI_COLORS.priorityMedium },
  { id: "low", label: "Low", color: UI_COLORS.priorityLow },
];

export default function TasksScreen() {
  const {
    todayKey,
    todayDate,
    loading,
    error,
    refresh,
    pendingCount,
    dueTodayCount,
    overdueCount,
    totalXpToday,

    viewMode,
    setViewMode,
    selectedDateKey,
    selectDate,
    jumpToToday,
    calendarExpanded,
    toggleCalendarExpanded,
    viewYear,
    viewMonth,
    stepCalendarPeriod,
    daySummaries,

    searchVisible,
    toggleSearch,
    searchQuery,
    setSearchQuery,
    filterVisible,
    toggleFilterBar,
    priorityFilter,
    setPriorityFilter,
    tagFilter,
    setTagFilter,
    availableTags,
    hasActiveFilter,
    clearFilters,

    overdueTasks,
    selectedDayPending,
    selectedDayCompleted,
    agendaSections,
    completedTodayTasks,

    modalVisible,
    editingTask,
    newTaskDefaultDate,
    activeFloat,
    setActiveFloat,

    handleToggleComplete,
    handleSaveTask,
    handleDeleteTask,
    handleRescheduleToToday,
    handleRescheduleAllOverdue,
    openNewTask,
    openEditTask,
    closeModal,
  } = useTasks();

  const [refreshing, setRefreshing] = useState(false);
  const [overdueCollapsed, setOverdueCollapsed] = useState(false);
  const [completedExpanded, setCompletedExpanded] = useState(true);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const dayHeading = formatCalendarDayHeading(selectedDateKey, todayDate);
  const isSelectedDatePast = selectedDateKey < todayKey;
  const isFilteredOrSearching = Boolean(searchQuery.trim()) || hasActiveFilter;

  return (
    <ScreenContainer>
      <ScreenTitle
        title="Tasks"
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
              accessibilityLabel="Search tasks"
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
              accessibilityLabel="Filter tasks by priority or course tag"
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
                viewMode === "day" &&
                  calendarExpanded &&
                  styles.headerIconBtnActive,
              ]}
              scaleTo={0.9}
              haptic="selection"
              onPress={() => {
                if (viewMode === "agenda") {
                  setViewMode("day");
                  jumpToToday();
                } else {
                  toggleCalendarExpanded();
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Toggle month calendar"
            >
              <Ionicons
                name={
                  viewMode === "day" && calendarExpanded
                    ? "calendar"
                    : "calendar-outline"
                }
                size={20}
                color={
                  viewMode === "day" && calendarExpanded
                    ? UI_COLORS.cmuRed
                    : UI_COLORS.textSecondary
                }
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
            placeholder="Search tasks, courses (e.g. 15-112), or tags..."
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

      {/* Collapsible Priority + Tag Filter Strip */}
      <AnimatedCollapsible
        visible={filterVisible || hasActiveFilter}
        style={styles.filterToolbar}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {PRIORITY_OPTIONS.map((opt) => {
            const selected = priorityFilter === opt.id;
            const activeColor = opt.color ?? UI_COLORS.cmuRed;
            return (
              <PressableScale
                key={`prio-${opt.id}`}
                scaleTo={0.94}
                haptic="selection"
                style={[
                  styles.filterChip,
                  selected && {
                    backgroundColor: activeColor,
                    borderColor: activeColor,
                  },
                ]}
                onPress={() =>
                  setPriorityFilter(
                    selected && opt.id !== "all" ? "all" : opt.id
                  )
                }
              >
                {opt.color && (
                  <View
                    style={[
                      styles.filterDot,
                      {
                        backgroundColor: selected
                          ? UI_COLORS.textOnAccent
                          : opt.color,
                      },
                    ]}
                  />
                )}
                <Text
                  style={[
                    styles.filterChipText,
                    selected && styles.filterChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </PressableScale>
            );
          })}

          <View style={styles.filterDivider} />

          <PressableScale
            scaleTo={0.94}
            haptic="selection"
            style={[
              styles.filterChip,
              tagFilter === "all" && styles.filterChipActive,
            ]}
            onPress={() => setTagFilter("all")}
          >
            <Text
              style={[
                styles.filterChipText,
                tagFilter === "all" && styles.filterChipTextActive,
              ]}
            >
              All Tags
            </Text>
          </PressableScale>

          {availableTags.map((tag) => {
            const selected = tagFilter === tag;
            return (
              <PressableScale
                key={`tag-${tag}`}
                scaleTo={0.94}
                haptic="selection"
                style={[
                  styles.filterChip,
                  selected && {
                    backgroundColor: UI_COLORS.cyan,
                    borderColor: UI_COLORS.cyan,
                  },
                ]}
                onPress={() => setTagFilter(selected ? "all" : tag)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selected && styles.filterChipTextActive,
                  ]}
                >
                  {tag}
                </Text>
              </PressableScale>
            );
          })}
        </ScrollView>
      </AnimatedCollapsible>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={UI_COLORS.cmuRed}
          />
        }
      >
        {/* Compact Scotty & Daily XP Banner + Day/Agenda Toggle */}
        <TaskHeroBanner
          pendingCount={pendingCount}
          dueTodayCount={dueTodayCount}
          overdueCount={overdueCount}
          totalXpToday={totalXpToday}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
        />

        <FadeSwitchView viewKey={viewMode}>
          {viewMode === "day" ? (
            <>
              {/* Collapsible 7-Day Week Strip ↔ Month Calendar */}
              <TaskCalendarCard
                todayKey={todayKey}
                todayDate={todayDate}
                selectedDateKey={selectedDateKey}
                expanded={calendarExpanded}
                viewYear={viewYear}
                viewMonth={viewMonth}
                daySummaries={daySummaries}
                onSelectDate={selectDate}
                onJumpToToday={jumpToToday}
                onToggleExpanded={toggleCalendarExpanded}
                onStepPeriod={stepCalendarPeriod}
              />

              {/* Pinned Overdue Callout (when viewing Today) */}
              {overdueTasks.length > 0 && (
                <View style={styles.overdueSection}>
                  <View style={styles.overdueHeaderBar}>
                    <PressableScale
                      style={styles.overdueTitleGroup}
                      scaleTo={0.97}
                      onPress={() => setOverdueCollapsed((c) => !c)}
                    >
                      <Ionicons
                        name="alert-circle"
                        size={17}
                        color={UI_COLORS.cmuRed}
                      />
                      <Text style={styles.overdueTitle}>
                        Overdue ({overdueTasks.length})
                      </Text>
                      <Ionicons
                        name={overdueCollapsed ? "chevron-down" : "chevron-up"}
                        size={15}
                        color={UI_COLORS.cmuRed}
                      />
                    </PressableScale>

                    <PressableScale
                      style={styles.moveAllBtn}
                      scaleTo={0.94}
                      haptic="light"
                      onPress={handleRescheduleAllOverdue}
                      accessibilityRole="button"
                      accessibilityLabel="Reschedule all overdue tasks to today"
                    >
                      <Ionicons
                        name="arrow-forward-circle"
                        size={14}
                        color={UI_COLORS.textOnAccent}
                      />
                      <Text style={styles.moveAllBtnText}>
                        Move all to Today
                      </Text>
                    </PressableScale>
                  </View>

                  <AnimatedCollapsible visible={!overdueCollapsed}>
                    {overdueTasks.map((task, idx) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        index={idx}
                        waveKey={`overdue:${overdueCollapsed}:${priorityFilter}:${tagFilter}`}
                        isOverdue
                        now={todayDate}
                        onToggleComplete={handleToggleComplete}
                        onPress={openEditTask}
                        onDelete={handleDeleteTask}
                        onRescheduleToday={handleRescheduleToToday}
                      />
                    ))}
                  </AnimatedCollapsible>
                </View>
              )}

              {/* Selected Calendar Day Section */}
              <View style={styles.daySection}>
                <FadeSwitchView
                  viewKey={selectedDateKey}
                  style={styles.daySectionHeader}
                >
                  <View style={styles.dayHeadingRow}>
                    <Text style={styles.dayPrimaryTitle}>
                      {dayHeading.primary}
                    </Text>
                    {dayHeading.secondary ? (
                      <Text style={styles.daySecondarySubtitle}>
                        · {dayHeading.secondary}
                      </Text>
                    ) : null}
                    {selectedDayPending.length > 0 && (
                      <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>
                          {selectedDayPending.length}
                        </Text>
                      </View>
                    )}
                  </View>

                  <PressableScale
                    style={styles.inlineAddBtn}
                    scaleTo={0.93}
                    haptic="selection"
                    onPress={() => openNewTask(selectedDateKey)}
                  >
                    <Ionicons name="add" size={15} color={UI_COLORS.cmuRed} />
                    <Text style={styles.inlineAddText}>Add task</Text>
                  </PressableScale>
                </FadeSwitchView>

              {loading ? (
                <View style={styles.stateCard}>
                  <ActivityIndicator size="large" color={UI_COLORS.cmuRed} />
                  <Text style={[styles.stateSubtitle, { marginTop: spacing.md }]}>
                    Loading your tasks...
                  </Text>
                </View>
              ) : error ? (
                <View style={styles.stateCard}>
                  <View style={styles.stateIconCircle}>
                    <Ionicons
                      name="cloud-offline-outline"
                      size={30}
                      color={UI_COLORS.cmuRed}
                    />
                  </View>
                  <Text style={styles.stateTitle}>Could not load tasks</Text>
                  <Text style={styles.stateSubtitle}>{error}</Text>
                  <PressableScale
                    style={styles.retryBtn}
                    scaleTo={0.95}
                    onPress={handleRefresh}
                  >
                    <Text style={styles.retryBtnText}>Try Again</Text>
                  </PressableScale>
                </View>
              ) : selectedDayPending.length > 0 ? (
                selectedDayPending.map((task, idx) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={idx}
                    waveKey={`day:${selectedDateKey}:${priorityFilter}:${tagFilter}`}
                    isOverdue={isSelectedDatePast}
                    now={todayDate}
                    onToggleComplete={handleToggleComplete}
                    onPress={openEditTask}
                    onDelete={handleDeleteTask}
                    onRescheduleToday={
                      isSelectedDatePast ? handleRescheduleToToday : undefined
                    }
                  />
                ))
              ) : (
                <View style={styles.stateCard}>
                  <View
                    style={[
                      styles.stateIconCircle,
                      selectedDayCompleted.length > 0 &&
                        styles.stateIconCircleDone,
                    ]}
                  >
                    <Ionicons
                      name={
                        selectedDayCompleted.length > 0
                          ? "checkmark-done"
                          : isFilteredOrSearching
                          ? "search-outline"
                          : "calendar-clear-outline"
                      }
                      size={28}
                      color={
                        selectedDayCompleted.length > 0
                          ? UI_COLORS.xpGreen
                          : UI_COLORS.cmuRed
                      }
                    />
                  </View>
                  <Text style={styles.stateTitle}>
                    {selectedDayCompleted.length > 0
                      ? `All done for ${dayHeading.primary}!`
                      : isFilteredOrSearching
                      ? "No matching tasks on this day"
                      : `No tasks due ${
                          dayHeading.isToday
                            ? "today"
                            : `on ${dayHeading.primary}`
                        }`}
                  </Text>
                  <Text style={styles.stateSubtitle}>
                    {selectedDayCompleted.length > 0
                      ? `You completed ${selectedDayCompleted.length} ${
                          selectedDayCompleted.length === 1 ? "task" : "tasks"
                        } scheduled for this day.`
                      : isFilteredOrSearching
                      ? "Try clearing your search/filters or switch to Agenda view."
                      : "Tap + to schedule an assignment or task for this date."}
                  </Text>
                  {isFilteredOrSearching && (
                    <PressableScale
                      style={styles.clearFilterBtn}
                      scaleTo={0.95}
                      onPress={clearFilters}
                    >
                      <Text style={styles.clearFilterBtnText}>
                        Clear Filters
                      </Text>
                    </PressableScale>
                  )}
                </View>
              )}
              </View>

              {/* Completed Tasks on Selected Day */}
              {selectedDayCompleted.length > 0 && (
                <View style={styles.completedSection}>
                  <PressableScale
                    style={styles.completedToggleHeader}
                    scaleTo={0.98}
                    onPress={() => setCompletedExpanded((v) => !v)}
                  >
                    <View style={styles.completedTitleGroup}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={UI_COLORS.xpGreen}
                      />
                      <Text style={styles.completedHeader}>
                        COMPLETED ({selectedDayCompleted.length})
                      </Text>
                    </View>
                    <Ionicons
                      name={completedExpanded ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={UI_COLORS.textMuted}
                    />
                  </PressableScale>

                  <AnimatedCollapsible visible={completedExpanded}>
                    {selectedDayCompleted.map((task, idx) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        index={idx}
                        waveKey={`done:${selectedDateKey}:${completedExpanded}`}
                        now={todayDate}
                        onToggleComplete={handleToggleComplete}
                        onPress={openEditTask}
                        onDelete={handleDeleteTask}
                      />
                    ))}
                  </AnimatedCollapsible>
                </View>
              )}
            </>
          ) : (
            /* Chronological Agenda / Timeline View */
            <View style={styles.agendaContainer}>
              {loading ? (
                <View style={styles.stateCard}>
                  <ActivityIndicator size="large" color={UI_COLORS.cmuRed} />
                  <Text style={[styles.stateSubtitle, { marginTop: spacing.md }]}>
                    Loading your agenda...
                  </Text>
                </View>
              ) : error ? (
                <View style={styles.stateCard}>
                  <View style={styles.stateIconCircle}>
                    <Ionicons
                      name="cloud-offline-outline"
                      size={30}
                      color={UI_COLORS.cmuRed}
                    />
                  </View>
                  <Text style={styles.stateTitle}>Could not load tasks</Text>
                  <Text style={styles.stateSubtitle}>{error}</Text>
                  <PressableScale
                    style={styles.retryBtn}
                    scaleTo={0.95}
                    onPress={handleRefresh}
                  >
                    <Text style={styles.retryBtnText}>Try Again</Text>
                  </PressableScale>
                </View>
              ) : agendaSections.length > 0 ? (
                agendaSections.map((section, secIdx) => (
                  <View key={section.key} style={styles.agendaSection}>
                    {section.isOverdue ? (
                      <View style={styles.overdueHeaderBar}>
                        <View style={styles.overdueTitleGroup}>
                          <Ionicons
                            name="alert-circle"
                            size={17}
                            color={UI_COLORS.cmuRed}
                          />
                          <Text style={styles.overdueTitle}>
                            Overdue ({section.tasks.length})
                          </Text>
                        </View>

                        <PressableScale
                          style={styles.moveAllBtn}
                          scaleTo={0.94}
                          haptic="light"
                          onPress={handleRescheduleAllOverdue}
                        >
                          <Ionicons
                            name="arrow-forward-circle"
                            size={14}
                            color={UI_COLORS.textOnAccent}
                          />
                          <Text style={styles.moveAllBtnText}>
                            Move all to Today
                          </Text>
                        </PressableScale>
                      </View>
                    ) : (
                      <View style={styles.agendaDateHeader}>
                        <PressableScale
                          style={styles.dayHeadingRow}
                          scaleTo={0.98}
                          onPress={() => {
                            if (section.dateKey) {
                              selectDate(section.dateKey);
                              setViewMode("day");
                            }
                          }}
                        >
                          {section.isToday && (
                            <View style={styles.todayAccentBar} />
                          )}
                          <Text
                            style={[
                              styles.agendaDateTitle,
                              section.isToday && styles.agendaDateTitleToday,
                            ]}
                          >
                            {section.title}
                          </Text>
                          {section.subtitle ? (
                            <Text style={styles.daySecondarySubtitle}>
                              · {section.subtitle}
                            </Text>
                          ) : null}
                          <View style={styles.countBadge}>
                            <Text style={styles.countBadgeText}>
                              {section.tasks.length}
                            </Text>
                          </View>
                        </PressableScale>

                        {section.dateKey ? (
                          <PressableScale
                            style={styles.inlineAddBtn}
                            scaleTo={0.93}
                            haptic="selection"
                            onPress={() => openNewTask(section.dateKey!)}
                          >
                            <Ionicons
                              name="add"
                              size={15}
                              color={UI_COLORS.cmuRed}
                            />
                            <Text style={styles.inlineAddText}>Add</Text>
                          </PressableScale>
                        ) : null}
                      </View>
                    )}

                    {section.tasks.map((task, taskIdx) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        index={secIdx * 2 + taskIdx}
                        waveKey={`agenda:${priorityFilter}:${tagFilter}`}
                        isOverdue={section.isOverdue}
                        now={todayDate}
                        onToggleComplete={handleToggleComplete}
                        onPress={openEditTask}
                        onDelete={handleDeleteTask}
                        onRescheduleToday={
                          section.isOverdue ? handleRescheduleToToday : undefined
                        }
                      />
                    ))}
                  </View>
                ))
              ) : (
                <View style={styles.stateCard}>
                  <View style={styles.stateIconCircle}>
                    <Ionicons
                      name={
                        isFilteredOrSearching
                          ? "search-outline"
                          : "checkmark-done-outline"
                      }
                      size={30}
                      color={
                        isFilteredOrSearching
                          ? UI_COLORS.cmuRed
                          : UI_COLORS.xpGreen
                      }
                    />
                  </View>
                  <Text style={styles.stateTitle}>
                    {isFilteredOrSearching
                      ? "No matching upcoming tasks"
                      : "Your schedule is clear!"}
                  </Text>
                  <Text style={styles.stateSubtitle}>
                    {isFilteredOrSearching
                      ? "Try adjusting your search query or active filters."
                      : "No pending or upcoming tasks. Tap + below to add one."}
                  </Text>
                  {isFilteredOrSearching && (
                    <PressableScale
                      style={styles.clearFilterBtn}
                      scaleTo={0.95}
                      onPress={clearFilters}
                    >
                      <Text style={styles.clearFilterBtnText}>
                        Clear Filters
                      </Text>
                    </PressableScale>
                  )}
                </View>
              )}

              {/* Completed Today Footer in Agenda Mode */}
              {completedTodayTasks.length > 0 && (
                <View style={styles.completedSection}>
                  <PressableScale
                    style={styles.completedToggleHeader}
                    scaleTo={0.98}
                    onPress={() => setCompletedExpanded((v) => !v)}
                  >
                    <View style={styles.completedTitleGroup}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={UI_COLORS.xpGreen}
                      />
                      <Text style={styles.completedHeader}>
                        COMPLETED TODAY ({completedTodayTasks.length})
                      </Text>
                    </View>
                    <Ionicons
                      name={completedExpanded ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={UI_COLORS.textMuted}
                    />
                  </PressableScale>

                  <AnimatedCollapsible visible={completedExpanded}>
                    {completedTodayTasks.map((task, idx) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        index={idx}
                        waveKey={`agenda-done:${completedExpanded}`}
                        now={todayDate}
                        onToggleComplete={handleToggleComplete}
                        onPress={openEditTask}
                        onDelete={handleDeleteTask}
                      />
                    ))}
                  </AnimatedCollapsible>
                </View>
              )}
            </View>
          )}
        </FadeSwitchView>
      </ScrollView>

      {/* Floating '+' Action Button (pre-fills currently selected calendar date) */}
      <PressableScale
        style={styles.fab}
        scaleTo={0.9}
        haptic="light"
        onPress={() => openNewTask()}
        accessibilityRole="button"
        accessibilityLabel="Create new task"
      >
        <Ionicons name="add" size={30} color={UI_COLORS.textOnAccent} />
      </PressableScale>

      <AddTaskModal
        visible={modalVisible}
        editingTask={editingTask}
        initialDueDate={newTaskDefaultDate}
        onClose={closeModal}
        onSave={handleSaveTask}
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

  /* Search & Filter Toolbars */
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
  filterChip: {
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
  filterChipActive: {
    backgroundColor: UI_COLORS.cmuRed,
    borderColor: UI_COLORS.cmuRed,
  },
  filterDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  filterChipText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: UI_COLORS.textOnAccent,
  },
  filterDivider: {
    width: 1,
    height: 18,
    backgroundColor: UI_COLORS.border,
    marginHorizontal: 2,
  },

  /* Scroll Container */
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md + 2,
    paddingBottom: 112,
  },

  /* Overdue Section */
  overdueSection: {
    marginTop: spacing.lg,
  },
  overdueHeaderBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: UI_COLORS.redTint,
    borderWidth: 1,
    borderColor: "rgba(166, 25, 46, 0.25)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: spacing.md,
  },
  overdueTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  overdueTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.black,
    color: UI_COLORS.cmuRed,
  },
  moveAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: UI_COLORS.cmuRed,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
  },
  moveAllBtnText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textOnAccent,
  },

  /* Selected Day Section */
  daySection: {
    marginTop: spacing.lg + 2,
  },
  daySectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  dayHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  dayPrimaryTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.black,
    color: UI_COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  daySecondarySubtitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: UI_COLORS.textMuted,
  },
  countBadge: {
    backgroundColor: UI_COLORS.bgElevated,
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  countBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textSecondary,
  },
  inlineAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: UI_COLORS.redTint,
    borderWidth: 1,
    borderColor: "rgba(166, 25, 46, 0.22)",
  },
  inlineAddText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.cmuRed,
  },

  /* Agenda View */
  agendaContainer: {
    marginTop: spacing.lg,
  },
  agendaSection: {
    marginBottom: spacing.lg,
  },
  agendaDateHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm + 2,
    paddingBottom: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: UI_COLORS.border,
  },
  todayAccentBar: {
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: UI_COLORS.cmuRed,
  },
  agendaDateTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    color: UI_COLORS.textPrimary,
  },
  agendaDateTitleToday: {
    color: UI_COLORS.cmuRed,
  },

  /* Empty / Loading / Error Card */
  stateCard: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: UI_COLORS.bgCard,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    borderRadius: 14,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxxl,
  },
  stateIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: UI_COLORS.redTint,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  stateIconCircleDone: {
    backgroundColor: UI_COLORS.greenTint,
  },
  stateTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 4,
  },
  stateSubtitle: {
    fontSize: fontSize.base,
    color: UI_COLORS.textMuted,
    textAlign: "center",
    lineHeight: 19,
  },
  retryBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: 9,
    borderRadius: radii.xl,
    backgroundColor: UI_COLORS.cmuRed,
  },
  retryBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textOnAccent,
  },
  clearFilterBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 7,
    borderRadius: radii.xl,
    backgroundColor: UI_COLORS.bgWarm,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
  },
  clearFilterBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textPrimary,
  },

  /* Completed Section */
  completedSection: {
    marginTop: spacing.lg,
  },
  completedToggleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  completedTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  completedHeader: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textMuted,
    letterSpacing: 0.8,
  },

  /* Floating '+' Action Button */
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
