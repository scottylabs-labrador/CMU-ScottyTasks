import React, { useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";

import type { HabitItem } from "@/constants/habits";
import { UI_COLORS } from "@/constants/gamification";
import { fontSize, fontWeight, radii, spacing } from "@/constants/tokens";
import ProgressBar from "@/components/ui/ProgressBar";
import { formatTaskDate, localDateKey, parseTaskDate } from "@/utils/taskDates";
import {
  DAY_LABELS_SHORT,
  calculateBestStreak,
  calculateCompletionRate,
  calculateStreak,
  calculateTotalCompletions,
  calculateWeekdayConsistency,
  daysBetween,
  evaluateNumericValue,
  formatFrequencyLabel,
  formatGoalSummary,
  getDayProgressRatio,
  isDateScheduled,
  isDayCompleted,
} from "@/utils/habitLogic";

/* -------------------------------------------------------------------------- */
/* 1. Numeric Habit Daily Progress Modal                                      */
/* -------------------------------------------------------------------------- */

export interface HabitNumericLogModalProps {
  visible: boolean;
  habit: HabitItem | null;
  dateKey: string | null;
  today: Date;
  onClose: () => void;
  onSaveValue: (habit: HabitItem, dateKey: string, value: number | null, note: string) => void;
}

export function HabitNumericLogModal({
  visible,
  habit,
  dateKey,
  today,
  onClose,
  onSaveValue,
}: HabitNumericLogModalProps) {
  const existingEntry = habit && dateKey ? habit.history[dateKey] : undefined;
  const [rawVal, setRawVal] = useState(() =>
    existingEntry && typeof existingEntry.value === "number"
      ? String(existingEntry.value)
      : "0"
  );
  const [note, setNote] = useState(() => existingEntry?.note ?? "");

  if (!habit || !dateKey) return null;

  const numericValue = Math.max(0, Number(rawVal) || 0);
  const meetsGoal = evaluateNumericValue(
    numericValue,
    habit.goalCondition,
    habit.goal
  );
  const progressPct =
    habit.goalCondition === "less_than"
      ? meetsGoal
        ? 100
        : 0
      : habit.goal > 0
      ? Math.min(100, Math.round((numericValue / habit.goal) * 100))
      : 0;

  const adjustBy = (delta: number) => {
    const next = Math.max(0, Math.round((numericValue + delta) * 100) / 100);
    setRawVal(String(next));
  };

  const handleCompleteShortcut = () => {
    const targetVal =
      habit.goalCondition === "less_than"
        ? Math.max(0, habit.goal - habit.step)
        : habit.goal;
    onSaveValue(habit, dateKey, targetVal, note.trim());
    onClose();
  };

  const handleSave = () => {
    onSaveValue(habit, dateKey, numericValue, note.trim());
    onClose();
  };

  const handleClear = () => {
    onSaveValue(habit, dateKey, null, "");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <View style={styles.modalHeaderLeft}>
              <View style={[styles.headerIconBox, { backgroundColor: habit.color }]}>
                <Ionicons
                  name={habit.icon as keyof typeof Ionicons.glyphMap}
                  size={18}
                  color={UI_COLORS.textOnAccent}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {habit.title}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {formatTaskDate(dateKey, today)} · {formatGoalSummary(habit)}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={UI_COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.stepperSection}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => adjustBy(-habit.step)}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={22} color={UI_COLORS.textPrimary} />
            </TouchableOpacity>

            <View style={styles.stepperCenter}>
              <TextInput
                style={styles.stepperInput}
                keyboardType="numeric"
                value={rawVal}
                onChangeText={setRawVal}
                selectTextOnFocus
              />
              <Text style={styles.stepperUnit}>
                / {habit.goal} {habit.unit}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.stepperBtn, { borderColor: habit.color }]}
              onPress={() => adjustBy(habit.step)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={22} color={habit.color} />
            </TouchableOpacity>
          </View>

          <ProgressBar
            progress={progressPct}
            color={meetsGoal ? UI_COLORS.xpGreen : habit.color}
            trackColor={UI_COLORS.bgDeep}
            height={8}
            style={styles.numericProgress}
          />

          <TouchableOpacity
            style={[styles.quickCompleteBtn, { borderColor: habit.color, backgroundColor: `${habit.color}16` }]}
            onPress={handleCompleteShortcut}
            activeOpacity={0.75}
          >
            <Ionicons name="checkmark-circle" size={18} color={habit.color} />
            <Text style={[styles.quickCompleteText, { color: habit.color }]}>
              Mark Goal Reached ({habit.goalCondition === "less_than" ? `< ${habit.goal}` : habit.goal} {habit.unit})
            </Text>
          </TouchableOpacity>

          <Text style={styles.fieldLabel}>Note (Optional)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Add a note for this day..."
            placeholderTextColor={UI_COLORS.textMuted}
            value={note}
            onChangeText={setNote}
          />

          <View style={styles.footerButtons}>
            {habit.history[dateKey] ? (
              <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.clearBtn} onPress={onClose}>
                <Text style={styles.clearBtnText}>Cancel</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: UI_COLORS.cmuRed }]}
              onPress={handleSave}
            >
              <Text style={styles.primaryBtnText}>Save Entry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. Full Monthly Calendar History Modal                                     */
/* -------------------------------------------------------------------------- */

export interface HabitCalendarModalProps {
  visible: boolean;
  habit: HabitItem | null;
  today: Date;
  onClose: () => void;
  onPressDay: (habit: HabitItem, dateKey: string) => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function HabitCalendarModal({
  visible,
  habit,
  today,
  onClose,
  onPressDay,
}: HabitCalendarModalProps) {
  const [viewYear, setViewYear] = useState(() => today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => today.getMonth());

  const calendarCells = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const startOffset = firstOfMonth.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(viewYear, viewMonth, d));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  if (!habit) return null;

  const todayKey = localDateKey(today);
  const streak = calculateStreak(habit, today);
  const rate = calculateCompletionRate(habit, today);

  const monthCompletions = calendarCells.reduce((acc, d) => {
    if (!d) return acc;
    return acc + (isDayCompleted(habit, localDateKey(d)) ? 1 : 0);
  }, 0);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeaderRow}>
            <View style={styles.modalHeaderLeft}>
              <View style={[styles.headerIconBox, { backgroundColor: habit.color }]}>
                <Ionicons
                  name={habit.icon as keyof typeof Ionicons.glyphMap}
                  size={18}
                  color={UI_COLORS.textOnAccent}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {habit.title}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {formatFrequencyLabel(habit.frequency)} · Tap a date to log
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={UI_COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Month Selector */}
          <View style={styles.monthNavRow}>
            <TouchableOpacity onPress={goPrevMonth} style={styles.monthNavBtn}>
              <Ionicons name="chevron-back" size={20} color={UI_COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.monthNavLabel}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity onPress={goNextMonth} style={styles.monthNavBtn}>
              <Ionicons name="chevron-forward" size={20} color={UI_COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Weekday Headers */}
          <View style={styles.calWeekHeader}>
            {DAY_LABELS_SHORT.map((lbl) => (
              <Text key={lbl} style={styles.calWeekHeaderText}>
                {lbl}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.calGrid}>
            {calendarCells.map((cellDate, idx) => {
              if (!cellDate) {
                return <View key={`empty-${idx}`} style={styles.calCell} />;
              }
              const dKey = localDateKey(cellDate);
              const isFuture = daysBetween(today, cellDate) > 0;
              const isTodayCell = dKey === todayKey;
              const completed = isDayCompleted(habit, dKey);
              const partial = !completed && getDayProgressRatio(habit, dKey) > 0;
              const scheduled = isDateScheduled(habit, cellDate);

              return (
                <View key={dKey} style={styles.calCell}>
                  <TouchableOpacity
                    disabled={isFuture}
                    activeOpacity={0.7}
                    onPress={() => onPressDay(habit, dKey)}
                    style={[
                      styles.calDayBubble,
                      isFuture && styles.calDayFuture,
                      !scheduled && !completed && styles.calDayUnscheduled,
                      partial && {
                        borderWidth: 1.5,
                        borderColor: habit.color,
                        backgroundColor: `${habit.color}14`,
                      },
                      isTodayCell && !completed && styles.calDayToday,
                      completed && {
                        backgroundColor: isTodayCell ? habit.color : `${habit.color}25`,
                        borderWidth: 2,
                        borderColor: habit.color,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.calDayText,
                        !scheduled && !completed && { color: UI_COLORS.borderLight },
                        isTodayCell && !completed && {
                          color: UI_COLORS.textPrimary,
                          fontWeight: fontWeight.extrabold,
                        },
                        completed && {
                          color: isTodayCell ? UI_COLORS.textOnAccent : habit.color,
                          fontWeight: fontWeight.extrabold,
                        },
                      ]}
                    >
                      {cellDate.getDate()}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* Summary Strip */}
          <View style={styles.calSummaryRow}>
            <View style={styles.calSummaryStat}>
              <Text style={[styles.calSummaryValue, { color: habit.color }]}>
                {monthCompletions}
              </Text>
              <Text style={styles.calSummaryLabel}>This Month</Text>
            </View>
            <View style={styles.calSummaryDivider} />
            <View style={styles.calSummaryStat}>
              <Text style={[styles.calSummaryValue, { color: habit.color }]}>
                {streak}d
              </Text>
              <Text style={styles.calSummaryLabel}>Streak</Text>
            </View>
            <View style={styles.calSummaryDivider} />
            <View style={styles.calSummaryStat}>
              <Text style={[styles.calSummaryValue, { color: habit.color }]}>
                {rate === null ? "-" : `${rate}%`}
              </Text>
              <Text style={styles.calSummaryLabel}>Completion</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. Habit Statistics Modal                                                  */
/* -------------------------------------------------------------------------- */

export interface HabitStatsModalProps {
  visible: boolean;
  habit: HabitItem | null;
  today: Date;
  onClose: () => void;
}

export function HabitStatsModal({
  visible,
  habit,
  today,
  onClose,
}: HabitStatsModalProps) {
  if (!habit) return null;

  const streak = calculateStreak(habit, today);
  const bestStreak = calculateBestStreak(habit, today);
  const rate = calculateCompletionRate(habit, today);
  const totalCompletions = calculateTotalCompletions(habit);
  const weekdayBars = calculateWeekdayConsistency(habit, today);

  const ringSize = 116;
  const strokeWidth = 10;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = rate ?? 0;
  const strokeDashoffset = circumference * (1 - pct / 100);

  const startParsed = parseTaskDate(habit.startDate, today);
  const formattedStart = startParsed
    ? startParsed.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : habit.startDate;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeaderRow}>
            <View style={styles.modalHeaderLeft}>
              <View style={[styles.headerIconBox, { backgroundColor: habit.color }]}>
                <Ionicons
                  name={habit.icon as keyof typeof Ionicons.glyphMap}
                  size={18}
                  color={UI_COLORS.textOnAccent}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {habit.title}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {formatFrequencyLabel(habit.frequency)} · {formatGoalSummary(habit)}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={UI_COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Habit Score Ring */}
            <View style={styles.scoreSection}>
              <View style={{ width: ringSize, height: ringSize }}>
                <Svg width={ringSize} height={ringSize}>
                  <Circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={radius}
                    stroke={UI_COLORS.bgElevated}
                    strokeWidth={strokeWidth}
                    fill="none"
                  />
                  {pct > 0 && (
                    <Circle
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                      r={radius}
                      stroke={habit.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${circumference} ${circumference}`}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="none"
                      rotation="-90"
                      origin={`${ringSize / 2}, ${ringSize / 2}`}
                    />
                  )}
                </Svg>
                <View style={styles.scoreCenter}>
                  <Text style={[styles.scoreNumber, { color: habit.color }]}>
                    {rate === null ? "-" : `${rate}%`}
                  </Text>
                  <Text style={styles.scoreCaption}>Habit Score</Text>
                </View>
              </View>

              <View style={styles.scoreMetaCol}>
                <Text style={styles.scoreMetaLabel}>Started {formattedStart}</Text>
                {habit.description ? (
                  <Text style={styles.scoreDesc} numberOfLines={2}>
                    {habit.description}
                  </Text>
                ) : null}
                <View style={styles.xpPill}>
                  <Text style={styles.xpPillText}>⚡ +{habit.xp} XP · +2 🪙 / day</Text>
                </View>
              </View>
            </View>

            {/* Key Metrics Grid */}
            <View style={styles.statsTilesRow}>
              <View style={styles.statTile}>
                <Ionicons name="link-outline" size={18} color={habit.color} />
                <Text style={styles.statTileValue}>{streak}</Text>
                <Text style={styles.statTileLabel}>Current Streak</Text>
              </View>

              <View style={styles.statTile}>
                <Ionicons name="trophy-outline" size={18} color={UI_COLORS.cmuGold} />
                <Text style={styles.statTileValue}>{bestStreak}</Text>
                <Text style={styles.statTileLabel}>Best Streak</Text>
              </View>

              <View style={styles.statTile}>
                <Ionicons name="checkmark-done-outline" size={18} color={UI_COLORS.xpGreen} />
                <Text style={styles.statTileValue}>{totalCompletions}</Text>
                <Text style={styles.statTileLabel}>Total Done</Text>
              </View>
            </View>

            {/* Day-of-Week Consistency Chart */}
            <Text style={styles.sectionSmallTitle}>CONSISTENCY BY DAY OF WEEK</Text>
            <View style={styles.weekdayChartBox}>
              {DAY_LABELS_SHORT.map((lbl, idx) => {
                const barPct = weekdayBars[idx];
                return (
                  <View key={lbl} style={styles.weekdayBarCol}>
                    <Text style={styles.weekdayPctText}>{barPct}%</Text>
                    <View style={styles.weekdayBarTrack}>
                      <View
                        style={[
                          styles.weekdayBarFill,
                          {
                            height: `${Math.max(barPct, 4)}%`,
                            backgroundColor: barPct > 0 ? habit.color : UI_COLORS.border,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.weekdayAxisLabel}>{lbl}</Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. Habit More Options Sheet (`⋮`)                                          */
/* -------------------------------------------------------------------------- */

export interface HabitActionsModalProps {
  visible: boolean;
  habit: HabitItem | null;
  onClose: () => void;
  onEdit: (habit: HabitItem) => void;
  onOpenCalendar: (habit: HabitItem) => void;
  onOpenStats: (habit: HabitItem) => void;
  onToggleArchive: (habit: HabitItem) => void;
  onResetProgress: (habit: HabitItem) => void;
  onDelete: (id: string) => void;
}

export function HabitActionsModal({
  visible,
  habit,
  onClose,
  onEdit,
  onOpenCalendar,
  onOpenStats,
  onToggleArchive,
  onResetProgress,
  onDelete,
}: HabitActionsModalProps) {
  if (!habit) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.actionSheetCard} onStartShouldSetResponder={() => true}>
          <View style={styles.modalHeaderRow}>
            <View style={styles.modalHeaderLeft}>
              <View style={[styles.headerIconBox, { backgroundColor: habit.color }]}>
                <Ionicons
                  name={habit.icon as keyof typeof Ionicons.glyphMap}
                  size={18}
                  color={UI_COLORS.textOnAccent}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {habit.title}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {formatFrequencyLabel(habit.frequency)}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={UI_COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.actionList}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                onClose();
                onEdit(habit);
              }}
            >
              <Ionicons name="create-outline" size={20} color={UI_COLORS.textPrimary} />
              <Text style={styles.actionItemText}>Edit Habit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                onClose();
                onOpenCalendar(habit);
              }}
            >
              <Ionicons name="calendar-outline" size={20} color={UI_COLORS.textPrimary} />
              <Text style={styles.actionItemText}>Calendar & History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                onClose();
                onOpenStats(habit);
              }}
            >
              <Ionicons name="bar-chart-outline" size={20} color={UI_COLORS.textPrimary} />
              <Text style={styles.actionItemText}>Statistics</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                onClose();
                onToggleArchive(habit);
              }}
            >
              <Ionicons name="archive-outline" size={20} color={UI_COLORS.textPrimary} />
              <Text style={styles.actionItemText}>
                {habit.archived ? "Restore to Active Habits" : "Archive Habit"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                onClose();
                onResetProgress(habit);
              }}
            >
              <Ionicons name="refresh-outline" size={20} color={UI_COLORS.textSecondary} />
              <Text style={styles.actionItemText}>Reset Progress</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionItem, styles.actionItemDestructive]}
              onPress={() => {
                onClose();
                onDelete(habit.id);
              }}
            >
              <Ionicons name="trash-outline" size={20} color={UI_COLORS.cmuRed} />
              <Text style={[styles.actionItemText, { color: UI_COLORS.cmuRed }]}>
                Delete Habit
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: UI_COLORS.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  modalCard: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "88%",
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.xl,
  },
  actionSheetCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.xl,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
    paddingRight: spacing.sm,
  },
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: fontSize.md,
    color: UI_COLORS.textMuted,
    fontWeight: fontWeight.medium,
    marginTop: 1,
  },
  closeBtn: {
    padding: spacing.xs,
  },

  /* Numeric Modal */
  stepperSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  stepperBtn: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: UI_COLORS.bgWarm,
    borderWidth: 1.5,
    borderColor: UI_COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  stepperCenter: {
    flex: 1,
    alignItems: "center",
  },
  stepperInput: {
    fontSize: 28,
    fontWeight: fontWeight.black,
    color: UI_COLORS.textPrimary,
    textAlign: "center",
    minWidth: 80,
    paddingVertical: 2,
  },
  stepperUnit: {
    fontSize: fontSize.md,
    color: UI_COLORS.textMuted,
    fontWeight: fontWeight.semibold,
  },
  numericProgress: {
    marginBottom: spacing.lg,
  },
  quickCompleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: 10,
    borderRadius: radii.xl,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  quickCompleteText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  fieldLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  noteInput: {
    backgroundColor: UI_COLORS.bgWarm,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    borderRadius: radii.xl,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: UI_COLORS.textPrimary,
    fontSize: fontSize.lg,
  },
  footerButtons: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  clearBtn: {
    flex: 1,
    backgroundColor: UI_COLORS.bgElevated,
    borderRadius: radii.xl,
    paddingVertical: 12,
    alignItems: "center",
  },
  clearBtnText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textSecondary,
  },
  primaryBtn: {
    flex: 2,
    borderRadius: radii.xl,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textOnAccent,
  },

  /* Calendar Modal */
  monthNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: UI_COLORS.bgWarm,
    borderRadius: radii.xl,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
  },
  monthNavBtn: {
    padding: spacing.xs,
  },
  monthNavLabel: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textPrimary,
  },
  calWeekHeader: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  calWeekHeaderText: {
    flex: 1,
    textAlign: "center",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textMuted,
  },
  calGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calCell: {
    width: "14.285%",
    alignItems: "center",
    marginBottom: 8,
  },
  calDayBubble: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: UI_COLORS.bgSubtle,
  },
  calDayFuture: {
    opacity: 0.35,
    backgroundColor: "transparent",
  },
  calDayUnscheduled: {
    backgroundColor: UI_COLORS.bgWarm,
  },
  calDayToday: {
    backgroundColor: UI_COLORS.bgCard,
    borderWidth: 2,
    borderColor: UI_COLORS.textPrimary,
  },
  calDayText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: UI_COLORS.textSecondary,
  },
  calSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: UI_COLORS.border,
  },
  calSummaryStat: {
    alignItems: "center",
  },
  calSummaryValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.black,
  },
  calSummaryLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: UI_COLORS.textMuted,
    marginTop: 2,
  },
  calSummaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: UI_COLORS.border,
  },

  /* Statistics Modal */
  scoreSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    backgroundColor: UI_COLORS.bgWarm,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    marginBottom: spacing.lg,
  },
  scoreCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreNumber: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.black,
  },
  scoreCaption: {
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textMuted,
    textTransform: "uppercase",
  },
  scoreMetaCol: {
    flex: 1,
    gap: 6,
  },
  scoreMetaLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textMuted,
  },
  scoreDesc: {
    fontSize: fontSize.base,
    color: UI_COLORS.textSecondary,
    lineHeight: 18,
  },
  xpPill: {
    alignSelf: "flex-start",
    backgroundColor: UI_COLORS.goldTint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  xpPillText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.cmuGold,
  },
  statsTilesRow: {
    flexDirection: "row",
    gap: spacing.sm + 2,
    marginBottom: spacing.xl,
  },
  statTile: {
    flex: 1,
    backgroundColor: UI_COLORS.bgWarm,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    borderRadius: 10,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    gap: 3,
  },
  statTileValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.black,
    color: UI_COLORS.textPrimary,
  },
  statTileLabel: {
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textMuted,
    textTransform: "uppercase",
    textAlign: "center",
  },
  sectionSmallTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  weekdayChartBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    backgroundColor: UI_COLORS.bgWarm,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  weekdayBarCol: {
    alignItems: "center",
    flex: 1,
    gap: 5,
  },
  weekdayPctText: {
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textMuted,
  },
  weekdayBarTrack: {
    width: 16,
    height: 76,
    borderRadius: 8,
    backgroundColor: UI_COLORS.bgElevated,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  weekdayBarFill: {
    width: "100%",
    borderRadius: 8,
  },
  weekdayAxisLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textSecondary,
  },

  /* Actions Sheet */
  actionList: {
    gap: 2,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.xl,
  },
  actionItemDestructive: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: UI_COLORS.border,
    borderRadius: 0,
    paddingTop: 14,
  },
  actionItemText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: UI_COLORS.textPrimary,
  },
});
