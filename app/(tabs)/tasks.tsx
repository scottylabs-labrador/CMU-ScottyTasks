import { Text } from "@/components/ScottyText";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { Easing, LinearTransition, useReducedMotion } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import ScreenContainer from "@/components/ui/ScreenContainer";
import ScreenTitle from "@/components/ui/ScreenTitle";
import {
  AnimatedCollapsible,
  PressableScale,
} from "@/components/ui/Motion";
import TaskCalendarCard from "@/components/tasks/TaskCalendarCard";
import TaskCard from "@/components/tasks/TaskCard";
import AddTaskModal, { type TaskItem } from "@/components/AddTaskModal";
import XPFloat from "@/components/XPFloat";
import { useOptionalSettings } from "@/hooks/useSettings";
import { useTasks, type AgendaSection, type TaskPriorityFilter } from "@/hooks/useTasks";
import { compareTasksBySchedule, isTaskOverdue, formatCalendarDayHeading } from "@/utils/taskDates";
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

const PRIORITY_RANK: Record<TaskItem["priority"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export default function TasksScreen() {
  const {
    todayKey,
    todayDate,
    loading,
    error,
    refresh,

    selectedDateKey,
    selectDate,
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
    hasActiveFilter,
    clearFilters,

    agendaSections,
    selectedDayPending,
    completedTodayTasks,
    selectedDayCompleted,

    modalVisible,
    editingTask,
    newTaskDefaultDate,
    activeFloat,
    setActiveFloat,

    handleToggleComplete,
    handleSaveTask,
    handleDeleteTask,
    handleRescheduleToToday,
    openNewTask,
    openEditTask,
    closeModal,
  } = useTasks();

  const osReducedMotion = useReducedMotion();
  const { settings } = useOptionalSettings();
  const reducedMotion = osReducedMotion || settings.reduceMotion;

  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const mountedRef = useRef(true);
  const completingIdsRef = useRef<Set<string>>(new Set());
  const cleanupTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [completingIds, setCompletingIds] = useState<Record<string, boolean>>({});
  const [recentlyCompletedIds, setRecentlyCompletedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanupTimersRef.current.forEach(clearTimeout);
      cleanupTimersRef.current = [];
    };
  }, []);

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const toggleSection = (key: string) => {
    setCollapsedSections((current) => ({ ...current, [key]: !current[key] }));
  };

  const [agendaSort, setAgendaSort] = useState<"date" | "priority">("date");
  const sortedAgendaSections = useMemo<AgendaSection[]>(() => {
    if (calendarExpanded) {
      const heading = formatCalendarDayHeading(selectedDateKey, todayDate);
      const keepRelativeLabel =
        heading.primary === "Today" ||
        heading.primary === "Tomorrow" ||
        heading.primary === "Yesterday";
      const dayTasks =
        agendaSort === "priority"
          ? [...selectedDayPending].sort(
              (a, b) =>
                PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
                compareTasksBySchedule(a, b, todayDate)
            )
          : selectedDayPending;
      return [
        {
          key: `date:${selectedDateKey}`,
          dateKey: selectedDateKey,
          title: heading.primary,
          subtitle: keepRelativeLabel ? heading.secondary : "",
          isOverdue: false,
          isToday: selectedDateKey === todayKey,
          tasks: dayTasks,
        },
      ];
    }

    const nonOverdueSections = agendaSections.filter((section) => !section.isOverdue);
    if (agendaSort === "date") {
      return nonOverdueSections;
    }

    const tasks = nonOverdueSections.flatMap((section) => section.tasks);
    return (["high", "medium", "low"] as const).map((priority) => ({
      key: `priority:${priority}`,
      dateKey: null,
      title: `${priority[0].toUpperCase()}${priority.slice(1)} priority`,
      subtitle: "",
      isOverdue: false,
      isToday: false,
      tasks: tasks.filter((task) => task.priority === priority)
        .sort((a, b) => compareTasksBySchedule(a, b, todayDate)),
    })).filter((section) => section.tasks.length > 0);
  }, [agendaSections, agendaSort, calendarExpanded, selectedDateKey, selectedDayPending, todayDate, todayKey]);
  const [refreshing, setRefreshing] = useState(false);
  const [completedExpanded, setCompletedExpanded] = useState(true);

  const handleAnimatedToggleComplete = useCallback(
    (task: TaskItem) => {
      if (task.done || reducedMotion) {
        void handleToggleComplete(task);
        return;
      }
      if (completingIdsRef.current.has(task.id)) return;
      completingIdsRef.current.add(task.id);
      setCompletingIds((prev) => ({ ...prev, [task.id]: true }));

      {
        if (mountedRef.current) {
          setCompletedExpanded(true);
          setRecentlyCompletedIds((prev) => ({ ...prev, [task.id]: true }));
        }
        void handleToggleComplete(task).finally(() => {
          completingIdsRef.current.delete(task.id);
          if (mountedRef.current) {
            setCompletingIds((prev) => {
              if (!prev[task.id]) return prev;
              const next = { ...prev };
              delete next[task.id];
              return next;
            });
            const clearRecentTimer = setTimeout(() => {
              if (!mountedRef.current) return;
              setRecentlyCompletedIds((prev) => {
                if (!prev[task.id]) return prev;
                const next = { ...prev };
                delete next[task.id];
                return next;
              });
            }, 240);
            cleanupTimersRef.current.push(clearRecentTimer);
          }
        });
      }
    },
    [handleToggleComplete, reducedMotion]
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const completedTasks = calendarExpanded ? selectedDayCompleted : completedTodayTasks;
  const hasTaskGroups = sortedAgendaSections.length > 0 || completedTasks.length > 0;
  const allGroupsCollapsed = hasTaskGroups
    && sortedAgendaSections.every((section) => collapsedSections[section.key])
    && (completedTasks.length === 0 || !completedExpanded);
  const toggleAllGroups = () => {
    const collapse = !allGroupsCollapsed;
    setCollapsedSections((current) => ({
      ...current,
      ...Object.fromEntries(sortedAgendaSections.map((section) => [section.key, collapse])),
    }));
    setCompletedExpanded(!collapse);
  };
  const completedLabel = calendarExpanded && selectedDateKey !== todayKey
    ? `COMPLETED · ${formatCalendarDayHeading(selectedDateKey, todayDate).primary}`
    : "COMPLETED TODAY";
  const isFilteredOrSearching = Boolean(searchQuery.trim()) || hasActiveFilter;

  return (
    <ScreenContainer>
      <ScreenTitle
        title="Tasks"
        style={{ paddingTop: spacing.lg + 8 }}
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
              accessibilityLabel="Filter tasks by priority"
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
                calendarExpanded &&
                  styles.headerIconBtnActive,
              ]}
              scaleTo={0.9}
              haptic="selection"
              onPress={() => {
                toggleCalendarExpanded();
                scrollRef.current?.scrollTo({ y: 0, animated: true });
              }}
              accessibilityRole="button"
              accessibilityLabel="Toggle month calendar"
            >
              <Ionicons
                name={
                  calendarExpanded
                    ? "calendar"
                    : "calendar-outline"
                }
                size={20}
                color={
                  calendarExpanded
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
            placeholder="Search tasks..."
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

      {/* Collapsible Priority Filter Strip */}
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

        </ScrollView>
      </AnimatedCollapsible>

      {/* Main Content */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={UI_COLORS.cmuRed}
          />
        }
      >
        <View collapsable={false}>
        <TaskCalendarCard
          monthOnly
          todayKey={todayKey}
          todayDate={todayDate}
          selectedDateKey={selectedDateKey}
          expanded={calendarExpanded}
          viewYear={viewYear}
          viewMonth={viewMonth}
          daySummaries={daySummaries}
          onSelectDate={(key) => {
            selectDate(key);
            setCollapsedSections((current) => ({ ...current, [`date:${key}`]: false }));
          }}
          onToggleExpanded={toggleCalendarExpanded}
          onStepPeriod={stepCalendarPeriod}
        />
            <View style={[styles.agendaContainer, !calendarExpanded && styles.agendaContainerCompact]}>
              <View style={styles.agendaSortRow}>
                <Text style={styles.agendaSortLabel}>Sort by</Text>
                {(["date", "priority"] as const).map((sort) => (
                  <PressableScale key={sort} onPress={() => setAgendaSort(sort)} style={[styles.agendaSortButton, agendaSort === sort && styles.agendaSortSelected]} accessibilityRole="button" accessibilityState={{ selected: agendaSort === sort }} accessibilityLabel={`Sort agenda by ${sort}`}>
                    <Text style={[styles.agendaSortLabel, agendaSort === sort && { color: UI_COLORS.textOnAccent }]}>{sort === "date" ? "Date" : "Priority"}</Text>
                  </PressableScale>
                ))}
                {!loading && !error && hasTaskGroups && (
                  <PressableScale
                    style={styles.collapseAllButton}
                    onPress={toggleAllGroups}
                    accessibilityRole="button"
                    accessibilityLabel={allGroupsCollapsed ? "Expand all task groups" : "Collapse all task groups"}
                  >
                    <Ionicons name={allGroupsCollapsed ? "chevron-down" : "chevron-up"} size={14} color={UI_COLORS.cmuRed} />
                    <Text style={styles.inlineAddText}>{allGroupsCollapsed ? "Expand all" : "Collapse all"}</Text>
                  </PressableScale>
                )}
              </View>
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
              ) : sortedAgendaSections.length > 0 ? (
                sortedAgendaSections.map((section, secIdx) => (
                  <View key={section.key} style={styles.agendaSection} collapsable={false}>
                      <View style={styles.agendaDateHeader}>
                        <PressableScale style={styles.dayHeadingRow}
                          onPress={() => toggleSection(section.key)}
                          accessibilityRole="button"
                          accessibilityLabel={`${section.title} tasks`}
                          accessibilityState={{ expanded: !collapsedSections[section.key] }}
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
                          <Ionicons name={collapsedSections[section.key] ? "chevron-down" : "chevron-up"} size={16} color={UI_COLORS.textSecondary} />
                        </PressableScale>

                      </View>

                    {!collapsedSections[section.key] && <>
                    {section.tasks.length === 0 && (
                      <Text style={styles.emptyDateSubtitle}>{isFilteredOrSearching ? "No matching tasks for this date." : "No pending tasks for this date."}</Text>
                    )}
                    {section.tasks.map((task, taskIdx) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        showDueDate={!calendarExpanded && agendaSort === "priority"}
                        index={secIdx * 2 + taskIdx}
                        waveKey={calendarExpanded ? `cal:${selectedDateKey}:${priorityFilter}` : `agenda:${priorityFilter}`}
                        isOverdue={isTaskOverdue(task.dueDate, todayDate)}
                        now={todayDate}
                        completing={Boolean(completingIds[task.id])}
                        onToggleComplete={handleAnimatedToggleComplete}
                        onPress={openEditTask}
                        onDelete={handleDeleteTask}
                        onRescheduleToday={
                          isTaskOverdue(task.dueDate, todayDate) ? handleRescheduleToToday : undefined
                        }
                      />
                    ))}
                    </>}
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
                      : "No pending or upcoming tasks. Tap Add task below to create one."}
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

              {/* Completed Section */}
              {completedTasks.length > 0 && (
                <Animated.View
                  style={styles.completedSection}
                  layout={
                    reducedMotion
                      ? undefined
                      : LinearTransition.duration(480).easing(Easing.inOut(Easing.cubic))
                  }
                >
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
                        {completedLabel} ({completedTasks.length})
                      </Text>
                    </View>
                    <Ionicons
                      name={completedExpanded ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={UI_COLORS.textMuted}
                    />
                  </PressableScale>

                  <AnimatedCollapsible visible={completedExpanded}>
                    {completedTasks.map((task, idx) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        showDueDate={!calendarExpanded && agendaSort === "priority"}
                        index={idx}
                        waveKey={`agenda-done:${calendarExpanded ? selectedDateKey : "today"}`}
                        now={todayDate}
                        enteringSlow={Boolean(recentlyCompletedIds[task.id])}
                        onToggleComplete={handleAnimatedToggleComplete}
                        onPress={openEditTask}
                        onDelete={handleDeleteTask}
                      />
                    ))}
                  </AnimatedCollapsible>
                </Animated.View>
              )}
            </View>
      </View>
      </ScrollView>

      {/* Add a task */}
      <PressableScale
        style={styles.fab}
        scaleTo={0.9}
        haptic="light"
        onPress={() => openNewTask(calendarExpanded ? selectedDateKey : todayKey)}
        accessibilityRole="button"
        accessibilityLabel="Create new task"
      >
        <Ionicons name="add" size={24} color={UI_COLORS.textOnAccent} />
        <Text style={styles.fabLabel}>Add task</Text>
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
  collapseAllButton: { marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: UI_COLORS.border, backgroundColor: UI_COLORS.bgCard },
  agendaSortRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  agendaSortLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: UI_COLORS.textSecondary },
  agendaSortButton: { paddingHorizontal: 14, minHeight: 36, justifyContent: "center", borderRadius: 18, borderWidth: 1, borderColor: UI_COLORS.border, backgroundColor: UI_COLORS.bgCard },
  agendaSortSelected: { backgroundColor: UI_COLORS.cmuRed, borderColor: UI_COLORS.cmuRed },
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

  /* Selected Day Section */
  daySection: {
    marginTop: spacing.lg + 2,
  },
  daySectionHeader: {
    flexDirection: "column",
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
  inlineAddText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.cmuRed,
  },

  /* Agenda View */
  agendaContainer: {
    marginTop: spacing.lg,
  },
  agendaContainerCompact: {
    marginTop: 0,
  },
  emptyDateSubtitle: {
    fontSize: fontSize.base,
    color: UI_COLORS.textMuted,
    textAlign: "center",
    lineHeight: 19,
    marginTop: spacing.md,
  },
  agendaSection: {
    marginBottom: spacing.lg,
  },
  agendaDateHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 0,
    paddingBottom: 0,
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
    fontSize: fontSize.xxxl,
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

  fabLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: UI_COLORS.textOnAccent },
  /* Floating Add task button */
  fab: {
    position: "absolute",
    right: spacing.xl,
    bottom: spacing.xxl,
    paddingHorizontal: 18,
    flexDirection: "row",
    gap: 6,
    height: 56,
    borderRadius: 16,
    backgroundColor: UI_COLORS.cmuRed,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.elevated,
  },
});
