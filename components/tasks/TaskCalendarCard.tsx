import React, { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FadeSwitchView, PressableScale } from "@/components/ui/Motion";
import type { DayTaskSummary } from "@/hooks/useTasks";
import {
  getCalendarWeekDays,
  getMonthGridCells,
  localDateKey,
  parseTaskDate,
} from "@/utils/taskDates";
import { UI_COLORS } from "@/constants/gamification";
import { fontSize, fontWeight, radii, shadows, spacing } from "@/constants/tokens";

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export interface TaskCalendarCardProps {
  todayKey: string;
  todayDate: Date;
  selectedDateKey: string;
  expanded: boolean;
  viewYear: number;
  viewMonth: number;
  daySummaries: Record<string, DayTaskSummary>;
  onSelectDate: (dateKey: string) => void;
  onJumpToToday: () => void;
  onToggleExpanded: () => void;
  onStepPeriod: (delta: -1 | 1) => void;
}

function getDotColor(
  priority: "high" | "medium" | "low",
  isSelected: boolean
): string {
  if (isSelected) {
    if (priority === "high") return UI_COLORS.textOnAccent;
    if (priority === "medium") return "#F6D58E";
    return "#C3E8C8";
  }
  if (priority === "high") return UI_COLORS.priorityHigh;
  if (priority === "medium") return UI_COLORS.priorityMedium;
  return UI_COLORS.priorityLow;
}

function DayIndicatorDots({
  summary,
  isSelected,
}: {
  summary?: DayTaskSummary;
  isSelected: boolean;
}) {
  if (!summary) {
    return <View style={styles.dotsPlaceholder} />;
  }

  if (summary.pendingCount > 0) {
    return (
      <View style={styles.dotsRow}>
        {summary.priorities.map((prio, idx) => (
          <View
            key={`${prio}-${idx}`}
            style={[
              styles.dot,
              { backgroundColor: getDotColor(prio, isSelected) },
            ]}
          />
        ))}
        {summary.pendingCount > 3 && (
          <Text
            style={[
              styles.morePlus,
              { color: isSelected ? UI_COLORS.textOnAccent : UI_COLORS.textMuted },
            ]}
          >
            +
          </Text>
        )}
      </View>
    );
  }

  if (summary.completedCount > 0) {
    return (
      <View style={styles.dotsRow}>
        <View
          style={[
            styles.doneDot,
            {
              backgroundColor: isSelected ? "#C3E8C8" : UI_COLORS.xpGreen,
            },
          ]}
        />
      </View>
    );
  }

  return <View style={styles.dotsPlaceholder} />;
}

function TaskCalendarCardComponent({
  todayKey,
  todayDate,
  selectedDateKey,
  expanded,
  viewYear,
  viewMonth,
  daySummaries,
  onSelectDate,
  onJumpToToday,
  onToggleExpanded,
  onStepPeriod,
}: TaskCalendarCardProps) {
  const selectedDate = useMemo(
    () => parseTaskDate(selectedDateKey, todayDate) ?? todayDate,
    [selectedDateKey, todayDate]
  );

  const weekDays = useMemo(
    () => getCalendarWeekDays(selectedDate),
    [selectedDate]
  );

  const monthRows = useMemo(() => {
    const flat = getMonthGridCells(viewYear, viewMonth);
    const rows: (Date | null)[][] = [];
    for (let i = 0; i < flat.length; i += 7) {
      rows.push(flat.slice(i, i + 7));
    }
    return rows;
  }, [viewYear, viewMonth]);

  const headerLabel = useMemo(() => {
    if (expanded) {
      return `${MONTH_NAMES[viewMonth]} ${viewYear}`;
    }
    const first = weekDays[0];
    const last = weekDays[6];
    if (first.getMonth() === last.getMonth()) {
      return `${MONTH_NAMES[first.getMonth()]} ${first.getFullYear()}`;
    }
    const firstShort = first.toLocaleDateString("en-US", { month: "short" });
    const lastShort = last.toLocaleDateString("en-US", { month: "short" });
    return `${firstShort} – ${lastShort} ${last.getFullYear()}`;
  }, [expanded, viewMonth, viewYear, weekDays]);

  const showTodayJump =
    selectedDateKey !== todayKey ||
    (expanded &&
      (viewYear !== todayDate.getFullYear() ||
        viewMonth !== todayDate.getMonth()));

  return (
    <View style={styles.card}>
      {/* Calendar Header Controls */}
      <View style={styles.topRow}>
        <View style={styles.monthTitleGroup}>
          <Text style={styles.monthTitle} numberOfLines={1}>
            {headerLabel}
          </Text>
          {showTodayJump && (
            <PressableScale
              style={styles.todayChip}
              scaleTo={0.93}
              haptic="selection"
              onPress={onJumpToToday}
              accessibilityRole="button"
              accessibilityLabel="Jump to today"
            >
              <Text style={styles.todayChipText}>Today</Text>
            </PressableScale>
          )}
        </View>

        <View style={styles.navActions}>
          <PressableScale
            style={styles.iconStepBtn}
            scaleTo={0.9}
            haptic="selection"
            onPress={() => onStepPeriod(-1)}
            accessibilityRole="button"
            accessibilityLabel={expanded ? "Previous month" : "Previous week"}
          >
            <Ionicons
              name="chevron-back"
              size={17}
              color={UI_COLORS.textSecondary}
            />
          </PressableScale>

          <PressableScale
            style={styles.iconStepBtn}
            scaleTo={0.9}
            haptic="selection"
            onPress={() => onStepPeriod(1)}
            accessibilityRole="button"
            accessibilityLabel={expanded ? "Next month" : "Next week"}
          >
            <Ionicons
              name="chevron-forward"
              size={17}
              color={UI_COLORS.textSecondary}
            />
          </PressableScale>

          <PressableScale
            style={[
              styles.expandToggleBtn,
              expanded && styles.expandToggleBtnActive,
            ]}
            scaleTo={0.94}
            haptic="selection"
            onPress={onToggleExpanded}
            accessibilityRole="button"
            accessibilityLabel={
              expanded ? "Collapse to week strip" : "Expand to month calendar"
            }
          >
            <Ionicons
              name={expanded ? "chevron-up" : "calendar-outline"}
              size={15}
              color={expanded ? UI_COLORS.cmuRed : UI_COLORS.textSecondary}
            />
            <Text
              style={[
                styles.expandToggleText,
                expanded && styles.expandToggleTextActive,
              ]}
            >
              {expanded ? "Week" : "Month"}
            </Text>
          </PressableScale>
        </View>
      </View>

      <FadeSwitchView viewKey={expanded ? `month:${viewYear}-${viewMonth}` : `week:${weekDays[0]?.getTime()}`}>
        {/* Collapsed 7-Day Week Strip */}
        {!expanded ? (
          <View style={styles.weekStripRow}>
            {weekDays.map((day, idx) => {
              const key = localDateKey(day);
              const isSelected = key === selectedDateKey;
              const isToday = key === todayKey;
              const summary = daySummaries[key];
              const hasOverdue = Boolean(summary?.hasOverdue);

              return (
                <PressableScale
                  key={key}
                  style={[
                    styles.weekPill,
                    isToday && !isSelected && styles.weekPillToday,
                    hasOverdue && !isSelected && styles.weekPillOverdue,
                    isSelected && styles.weekPillSelected,
                  ]}
                  scaleTo={0.92}
                  haptic="selection"
                  onPress={() => onSelectDate(key)}
                  accessibilityRole="button"
                  accessibilityLabel={`${WEEKDAY_SHORT[idx]} ${day.getDate()}`}
                >
                  <Text
                    style={[
                      styles.weekDayLabel,
                      isToday && !isSelected && styles.weekDayLabelToday,
                      isSelected && styles.weekDayLabelSelected,
                    ]}
                  >
                    {WEEKDAY_SHORT[idx]}
                  </Text>

                  <View
                    style={[
                      styles.weekDateNumberWrap,
                      isSelected && styles.weekDateNumberWrapSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.weekDateNumber,
                        isToday && !isSelected && styles.weekDateNumberToday,
                        isSelected && styles.weekDateNumberSelected,
                      ]}
                    >
                      {day.getDate()}
                    </Text>
                  </View>

                  <DayIndicatorDots summary={summary} isSelected={isSelected} />
                </PressableScale>
              );
            })}
          </View>
        ) : (
          /* Expanded Full Month Calendar Grid */
          <View style={styles.monthContainer}>
            <View style={styles.monthWeekdayHeader}>
              {WEEKDAY_SHORT.map((label) => (
                <Text key={label} style={styles.monthWeekdayText}>
                  {label.toUpperCase()}
                </Text>
              ))}
            </View>

            {monthRows.map((row, rowIdx) => (
              <View key={`row-${rowIdx}`} style={styles.monthWeekRow}>
                {row.map((cellDate, colIdx) => {
                  if (!cellDate) {
                    return (
                      <View
                        key={`empty-${rowIdx}-${colIdx}`}
                        style={styles.monthCellEmpty}
                      />
                    );
                  }

                  const key = localDateKey(cellDate);
                  const isSelected = key === selectedDateKey;
                  const isToday = key === todayKey;
                  const summary = daySummaries[key];
                  const hasOverdue = Boolean(summary?.hasOverdue);

                  return (
                    <PressableScale
                      key={key}
                      style={[
                        styles.monthCell,
                        isToday && !isSelected && styles.monthCellToday,
                        hasOverdue && !isSelected && styles.monthCellOverdue,
                        isSelected && styles.monthCellSelected,
                      ]}
                      scaleTo={0.92}
                      haptic="selection"
                      onPress={() => onSelectDate(key)}
                    >
                      <Text
                        style={[
                          styles.monthCellNumber,
                          isToday && !isSelected && styles.monthCellNumberToday,
                          isSelected && styles.monthCellNumberSelected,
                        ]}
                      >
                        {cellDate.getDate()}
                      </Text>

                      <DayIndicatorDots summary={summary} isSelected={isSelected} />
                    </PressableScale>
                  );
                })}
              </View>
            ))}

            {/* Legend & Collapse Handle */}
            <View style={styles.legendFooter}>
              <View style={styles.legendItems}>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: UI_COLORS.priorityHigh },
                    ]}
                  />
                  <Text style={styles.legendText}>High</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: UI_COLORS.priorityMedium },
                    ]}
                  />
                  <Text style={styles.legendText}>Med</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: UI_COLORS.xpGreen },
                    ]}
                  />
                  <Text style={styles.legendText}>Low / Done</Text>
                </View>
              </View>

              <PressableScale
                style={styles.collapseHintBtn}
                scaleTo={0.94}
                onPress={onToggleExpanded}
              >
                <Text style={styles.collapseHintText}>Collapse</Text>
                <Ionicons
                  name="chevron-up"
                  size={13}
                  color={UI_COLORS.textMuted}
                />
              </PressableScale>
            </View>
          </View>
        )}
      </FadeSwitchView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: UI_COLORS.bgCard,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    borderRadius: 14,
    paddingHorizontal: spacing.md + 2,
    paddingTop: spacing.md + 2,
    paddingBottom: spacing.md + 2,
    marginTop: spacing.md,
    ...shadows.card,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingHorizontal: 2,
  },
  monthTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  monthTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    color: UI_COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  todayChip: {
    backgroundColor: UI_COLORS.redTint,
    borderWidth: 1,
    borderColor: "rgba(166, 25, 46, 0.25)",
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  todayChipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.cmuRed,
  },
  navActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  iconStepBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: UI_COLORS.bgWarm,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  expandToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 28,
    paddingHorizontal: 9,
    borderRadius: 8,
    backgroundColor: UI_COLORS.bgWarm,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    marginLeft: 2,
  },
  expandToggleBtnActive: {
    backgroundColor: UI_COLORS.redTint,
    borderColor: "rgba(166, 25, 46, 0.3)",
  },
  expandToggleText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textSecondary,
  },
  expandToggleTextActive: {
    color: UI_COLORS.cmuRed,
  },

  /* 7-Day Week Strip */
  weekStripRow: {
    flexDirection: "row",
    gap: 6,
  },
  weekPill: {
    flex: 1,
    alignItems: "center",
    paddingTop: 7,
    paddingBottom: 7,
    borderRadius: 12,
    backgroundColor: UI_COLORS.bgWarm,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
  },
  weekPillToday: {
    borderColor: UI_COLORS.cmuRed,
    backgroundColor: UI_COLORS.bgCard,
  },
  weekPillOverdue: {
    borderColor: "rgba(166, 25, 46, 0.4)",
    backgroundColor: UI_COLORS.redTint,
  },
  weekPillSelected: {
    backgroundColor: UI_COLORS.cmuRed,
    borderColor: UI_COLORS.cmuRed,
  },
  weekDayLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textMuted,
  },
  weekDayLabelToday: {
    color: UI_COLORS.cmuRed,
    fontWeight: fontWeight.extrabold,
  },
  weekDayLabelSelected: {
    color: "rgba(255, 252, 245, 0.85)",
  },
  weekDateNumberWrap: {
    marginTop: 4,
    marginBottom: 4,
    width: 28,
    height: 26,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  weekDateNumberWrapSelected: {
    backgroundColor: "rgba(0, 0, 0, 0.14)",
  },
  weekDateNumber: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    color: UI_COLORS.textPrimary,
  },
  weekDateNumberToday: {
    color: UI_COLORS.cmuRed,
  },
  weekDateNumberSelected: {
    color: UI_COLORS.textOnAccent,
  },

  /* Month Grid */
  monthContainer: {
    paddingTop: 2,
  },
  monthWeekdayHeader: {
    flexDirection: "row",
    marginBottom: 4,
  },
  monthWeekdayText: {
    flex: 1,
    textAlign: "center",
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textMuted,
    letterSpacing: 0.4,
  },
  monthWeekRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 4,
  },
  monthCellEmpty: {
    flex: 1,
    height: 42,
  },
  monthCell: {
    flex: 1,
    height: 42,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: UI_COLORS.bgWarm,
    borderWidth: 1,
    borderColor: "transparent",
    paddingVertical: 3,
  },
  monthCellToday: {
    borderColor: UI_COLORS.cmuRed,
    backgroundColor: UI_COLORS.bgCard,
  },
  monthCellOverdue: {
    backgroundColor: UI_COLORS.redTint,
    borderColor: "rgba(166, 25, 46, 0.3)",
  },
  monthCellSelected: {
    backgroundColor: UI_COLORS.cmuRed,
    borderColor: UI_COLORS.cmuRed,
  },
  monthCellNumber: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textPrimary,
  },
  monthCellNumberToday: {
    color: UI_COLORS.cmuRed,
    fontWeight: fontWeight.black,
  },
  monthCellNumberSelected: {
    color: UI_COLORS.textOnAccent,
    fontWeight: fontWeight.black,
  },

  /* Dots */
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    height: 8,
  },
  dotsPlaceholder: {
    height: 8,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  doneDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  morePlus: {
    fontSize: 9,
    fontWeight: fontWeight.black,
    lineHeight: 9,
  },

  /* Legend Footer */
  legendFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: UI_COLORS.border,
  },
  legendItems: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: UI_COLORS.textMuted,
  },
  collapseHintBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  collapseHintText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textMuted,
  },
});

export default memo(TaskCalendarCardComponent);
