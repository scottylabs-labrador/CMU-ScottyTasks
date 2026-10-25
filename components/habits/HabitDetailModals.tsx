import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";

import { AnimatedModal, PressableScale, WaveItem } from "@/components/ui/Motion";
import { parseHabitDecimal, type HabitItem } from "@/constants/habits";
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

function HabitNumericLogForm({
  habit,
  dateKey,
  today,
  onClose,
  onSaveValue,
}: {
  habit: HabitItem;
  dateKey: string;
  today: Date;
  onClose: () => void;
  onSaveValue: (habit: HabitItem, dateKey: string, value: number | null, note: string) => void;
}) {
  const existingEntry = habit.history[dateKey];
  const [rawVal, setRawVal] = useState(() =>
    existingEntry && typeof existingEntry.value === "number"
      ? String(existingEntry.value)
      : "0"
  );
  const [note, setNote] = useState(() => existingEntry?.note ?? "");

  const effectiveGoal =
    typeof existingEntry?.goal === "number" && existingEntry.goal > 0
      ? existingEntry.goal
      : habit.goal;
  const numericValue = parseHabitDecimal(rawVal, true) ?? 0;
  const meetsGoal = evaluateNumericValue(
    numericValue,
    habit.goalCondition,
    effectiveGoal
  );
  const progressPct =
    habit.goalCondition === "less_than"
      ? meetsGoal
        ? 100
        : 0
      : effectiveGoal > 0
      ? Math.min(100, Math.round((numericValue / effectiveGoal) * 100))
      : 0;

  const adjustBy = (delta: number) => {
    const next = Math.max(0, Math.round((numericValue + delta) * 100) / 100);
    setRawVal(String(next));
  };

  const handleCompleteShortcut = () => {
    const targetVal =
      habit.goalCondition === "less_than"
        ? Math.max(0, Math.round((effectiveGoal - habit.step) * 100) / 100)
        : effectiveGoal;
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
    <>
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
        <PressableScale onPress={onClose} scaleTo={0.9} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={UI_COLORS.textMuted} />
        </PressableScale>
      </View>

      <View style={styles.stepperSection}>
        <PressableScale
          style={styles.stepperBtn}
          scaleTo={0.92}
          haptic="selection"
          onPress={() => adjustBy(-habit.step)}
        >
          <Ionicons name="remove" size={22} color={UI_COLORS.textPrimary} />
        </PressableScale>

        <View style={styles.stepperCenter}>
          <TextInput
            style={styles.stepperInput}
            keyboardType="decimal-pad"
            value={rawVal}
            onChangeText={setRawVal}
            selectTextOnFocus
          />
          <Text style={styles.stepperUnit}>
            / {effectiveGoal} {habit.unit}
          </Text>
        </View>

        <PressableScale
          style={[styles.stepperBtn, { borderColor: habit.color }]}
          scaleTo={0.92}
          haptic="selection"
          onPress={() => adjustBy(habit.step)}
        >
          <Ionicons name="add" size={22} color={habit.color} />
        </PressableScale>
      </View>

      <ProgressBar
        progress={progressPct}
        color={meetsGoal ? UI_COLORS.xpGreen : habit.color}
        trackColor={UI_COLORS.bgDeep}
        height={8}
        style={styles.numericProgress}
      />

      <PressableScale
        style={[
          styles.quickCompleteBtn,
          { borderColor: habit.color, backgroundColor: `${habit.color}16` },
        ]}
        scaleTo={0.97}
        haptic="light"
        onPress={handleCompleteShortcut}
      >
        <Ionicons name="checkmark-circle" size={18} color={habit.color} />
        <Text style={[styles.quickCompleteText, { color: habit.color }]}>
          Mark Goal Reached ({habit.goalCondition === "less_than" ? `< ${effectiveGoal}` : effectiveGoal} {habit.unit})
        </Text>
      </PressableScale>

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
          <PressableScale style={styles.clearBtn} scaleTo={0.96} onPress={handleClear}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </PressableScale>
        ) : (
          <PressableScale style={styles.clearBtn} scaleTo={0.96} onPress={onClose}>
            <Text style={styles.clearBtnText}>Cancel</Text>
          </PressableScale>
        )}

        <PressableScale
          style={[styles.primaryBtn, { backgroundColor: UI_COLORS.cmuRed }]}
          scaleTo={0.96}
          haptic="light"
          onPress={handleSave}
        >
          <Text style={styles.primaryBtnText}>Save Entry</Text>
        </PressableScale>
      </View>
    </>
  );
}

export function HabitNumericLogModal({
  visible,
  habit,
  dateKey,
  today,
  onClose,
  onSaveValue,
}: HabitNumericLogModalProps) {
  const [cachedHabit, setCachedHabit] = useState<HabitItem | null>(habit);
  const [cachedDateKey, setCachedDateKey] = useState<string | null>(dateKey);

  if (habit && habit !== cachedHabit) {
    setCachedHabit(habit);
  }
  if (dateKey && dateKey !== cachedDateKey) {
    setCachedDateKey(dateKey);
  }

  const activeHabit = habit ?? cachedHabit;
  const activeDateKey = dateKey ?? cachedDateKey;

  return (
    <AnimatedModal
      visible={visible && Boolean(activeHabit && activeDateKey)}
      variant="dialog"
      dismissOnBackdropPress
      onClose={onClose}
      cardStyle={styles.modalCard}
    >
      {activeHabit && activeDateKey ? (
        <HabitNumericLogForm
          key={`${activeHabit.id}:${activeDateKey}`}
          habit={activeHabit}
          dateKey={activeDateKey}
          today={today}
          onClose={onClose}
          onSaveValue={onSaveValue}
        />
      ) : null}
    </AnimatedModal>
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
  const [cachedHabit, setCachedHabit] = useState<HabitItem | null>(habit);
  if (habit && habit !== cachedHabit) {
    setCachedHabit(habit);
  }
  const activeHabit = habit ?? cachedHabit;

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

  const todayKey = localDateKey(today);
  const streak = activeHabit ? calculateStreak(activeHabit, today) : 0;
  const rate = activeHabit ? calculateCompletionRate(activeHabit, today) : null;
  const monthCompletions = activeHabit
    ? calendarCells.reduce((acc, d) => {
        if (!d) return acc;
        return acc + (isDayCompleted(activeHabit, localDateKey(d)) ? 1 : 0);
      }, 0)
    : 0;

  return (
    <AnimatedModal
      visible={visible && Boolean(activeHabit)}
      variant="dialog"
      dismissOnBackdropPress
      onClose={onClose}
      cardStyle={styles.modalCard}
    >
      {activeHabit ? (
        <>
          {/* Header */}
          <View style={styles.modalHeaderRow}>
            <View style={styles.modalHeaderLeft}>
              <View style={[styles.headerIconBox, { backgroundColor: activeHabit.color }]}>
                <Ionicons
                  name={activeHabit.icon as keyof typeof Ionicons.glyphMap}
                  size={18}
                  color={UI_COLORS.textOnAccent}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {activeHabit.title}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {formatFrequencyLabel(activeHabit.frequency)} · Tap a date to log
                </Text>
              </View>
            </View>
            <PressableScale onPress={onClose} scaleTo={0.9} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={UI_COLORS.textMuted} />
            </PressableScale>
          </View>

          {/* Month Selector */}
          <View style={styles.monthNavRow}>
            <PressableScale onPress={goPrevMonth} scaleTo={0.9} style={styles.monthNavBtn}>
              <Ionicons name="chevron-back" size={20} color={UI_COLORS.textPrimary} />
            </PressableScale>
            <Text style={styles.monthNavLabel}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>
            <PressableScale onPress={goNextMonth} scaleTo={0.9} style={styles.monthNavBtn}>
              <Ionicons name="chevron-forward" size={20} color={UI_COLORS.textPrimary} />
            </PressableScale>
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
              const completed = isDayCompleted(activeHabit, dKey);
              const partial = !completed && getDayProgressRatio(activeHabit, dKey) > 0;
              const scheduled = isDateScheduled(activeHabit, cellDate);

              return (
                <View key={dKey} style={styles.calCell}>
                  <PressableScale
                    disabled={isFuture}
                    scaleTo={0.9}
                    haptic="selection"
                    onPress={() => onPressDay(activeHabit, dKey)}
                    style={[
                      styles.calDayBubble,
                      isFuture && styles.calDayFuture,
                      !scheduled && !completed && styles.calDayUnscheduled,
                      partial && {
                        borderWidth: 1.5,
                        borderColor: activeHabit.color,
                        backgroundColor: `${activeHabit.color}14`,
                      },
                      isTodayCell && !completed && styles.calDayToday,
                      completed && {
                        backgroundColor: isTodayCell ? activeHabit.color : `${activeHabit.color}25`,
                        borderWidth: 2,
                        borderColor: activeHabit.color,
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
                          color: isTodayCell ? UI_COLORS.textOnAccent : activeHabit.color,
                          fontWeight: fontWeight.extrabold,
                        },
                      ]}
                    >
                      {cellDate.getDate()}
                    </Text>
                  </PressableScale>
                </View>
              );
            })}
          </View>

          {/* Summary Strip */}
          <View style={styles.calSummaryRow}>
            <View style={styles.calSummaryStat}>
              <Text style={[styles.calSummaryValue, { color: activeHabit.color }]}>
                {monthCompletions}
              </Text>
              <Text style={styles.calSummaryLabel}>This Month</Text>
            </View>
            <View style={styles.calSummaryDivider} />
            <View style={styles.calSummaryStat}>
              <Text style={[styles.calSummaryValue, { color: activeHabit.color }]}>
                {streak}d
              </Text>
              <Text style={styles.calSummaryLabel}>Streak</Text>
            </View>
            <View style={styles.calSummaryDivider} />
            <View style={styles.calSummaryStat}>
              <Text style={[styles.calSummaryValue, { color: activeHabit.color }]}>
                {rate === null ? "-" : `${rate}%`}
              </Text>
              <Text style={styles.calSummaryLabel}>Completion</Text>
            </View>
          </View>
        </>
      ) : null}
    </AnimatedModal>
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
  const [cachedHabit, setCachedHabit] = useState<HabitItem | null>(habit);
  if (habit && habit !== cachedHabit) {
    setCachedHabit(habit);
  }
  const activeHabit = habit ?? cachedHabit;

  const streak = activeHabit ? calculateStreak(activeHabit, today) : 0;
  const bestStreak = activeHabit ? calculateBestStreak(activeHabit, today) : 0;
  const rate = activeHabit ? calculateCompletionRate(activeHabit, today) : null;
  const totalCompletions = activeHabit ? calculateTotalCompletions(activeHabit) : 0;
  const weekdayBars = activeHabit
    ? calculateWeekdayConsistency(activeHabit, today)
    : [0, 0, 0, 0, 0, 0, 0];

  const ringSize = 116;
  const strokeWidth = 10;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = rate ?? 0;
  const strokeDashoffset = circumference * (1 - pct / 100);

  const startParsed = activeHabit ? parseTaskDate(activeHabit.startDate, today) : null;
  const formattedStart = startParsed
    ? startParsed.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : activeHabit?.startDate ?? "";

  return (
    <AnimatedModal
      visible={visible && Boolean(activeHabit)}
      variant="dialog"
      dismissOnBackdropPress
      onClose={onClose}
      cardStyle={styles.modalCard}
    >
      {activeHabit ? (
        <>
          {/* Header */}
          <View style={styles.modalHeaderRow}>
            <View style={styles.modalHeaderLeft}>
              <View style={[styles.headerIconBox, { backgroundColor: activeHabit.color }]}>
                <Ionicons
                  name={activeHabit.icon as keyof typeof Ionicons.glyphMap}
                  size={18}
                  color={UI_COLORS.textOnAccent}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {activeHabit.title}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {formatFrequencyLabel(activeHabit.frequency)} · {formatGoalSummary(activeHabit)}
                </Text>
              </View>
            </View>
            <PressableScale onPress={onClose} scaleTo={0.9} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={UI_COLORS.textMuted} />
            </PressableScale>
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
                      stroke={activeHabit.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${circumference} ${circumference}`}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="none"
                      transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                    />
                  )}
                </Svg>
                <View style={styles.scoreCenter}>
                  <Text style={[styles.scoreNumber, { color: activeHabit.color }]}>
                    {rate === null ? "-" : `${rate}%`}
                  </Text>
                  <Text style={styles.scoreCaption}>Habit Score</Text>
                </View>
              </View>

              <View style={styles.scoreMetaCol}>
                <Text style={styles.scoreMetaLabel}>Started {formattedStart}</Text>
                {activeHabit.description ? (
                  <Text style={styles.scoreDesc} numberOfLines={2}>
                    {activeHabit.description}
                  </Text>
                ) : null}
                <View style={styles.xpPill}>
                  <Text style={styles.xpPillText}>⚡ +{activeHabit.xp} XP · +2 🪙 / day</Text>
                </View>
              </View>
            </View>

            {/* Key Metrics Grid */}
            <View style={styles.statsTilesRow}>
              <WaveItem
                index={0}
                waveKey={`${visible}:${activeHabit.id}`}
                style={styles.statTile}
              >
                <Ionicons name="link-outline" size={18} color={activeHabit.color} />
                <Text style={styles.statTileValue}>{streak}</Text>
                <Text style={styles.statTileLabel}>Current Streak</Text>
              </WaveItem>

              <WaveItem
                index={1}
                waveKey={`${visible}:${activeHabit.id}`}
                style={styles.statTile}
              >
                <Ionicons name="trophy-outline" size={18} color={UI_COLORS.cmuGold} />
                <Text style={styles.statTileValue}>{bestStreak}</Text>
                <Text style={styles.statTileLabel}>Best Streak</Text>
              </WaveItem>

              <WaveItem
                index={2}
                waveKey={`${visible}:${activeHabit.id}`}
                style={styles.statTile}
              >
                <Ionicons name="checkmark-done-outline" size={18} color={UI_COLORS.xpGreen} />
                <Text style={styles.statTileValue}>{totalCompletions}</Text>
                <Text style={styles.statTileLabel}>Total Done</Text>
              </WaveItem>
            </View>

            {/* Day-of-Week Consistency Chart */}
            <WaveItem index={3} waveKey={`${visible}:${activeHabit.id}`}>
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
                              backgroundColor: barPct > 0 ? activeHabit.color : UI_COLORS.border,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.weekdayAxisLabel}>{lbl}</Text>
                    </View>
                  );
                })}
              </View>
            </WaveItem>
          </ScrollView>
        </>
      ) : null}
    </AnimatedModal>
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
  const [cachedHabit, setCachedHabit] = useState<HabitItem | null>(habit);
  if (habit && habit !== cachedHabit) {
    setCachedHabit(habit);
  }
  const activeHabit = habit ?? cachedHabit;

  return (
    <AnimatedModal
      visible={visible && Boolean(activeHabit)}
      variant="sheet"
      dismissOnBackdropPress
      onClose={onClose}
      cardStyle={styles.actionSheetCard}
    >
      {activeHabit ? (
        <>
          <View style={styles.modalHeaderRow}>
            <View style={styles.modalHeaderLeft}>
              <View style={[styles.headerIconBox, { backgroundColor: activeHabit.color }]}>
                <Ionicons
                  name={activeHabit.icon as keyof typeof Ionicons.glyphMap}
                  size={18}
                  color={UI_COLORS.textOnAccent}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {activeHabit.title}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {formatFrequencyLabel(activeHabit.frequency)}
                </Text>
              </View>
            </View>
            <PressableScale onPress={onClose} scaleTo={0.9} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={UI_COLORS.textMuted} />
            </PressableScale>
          </View>

          <View style={styles.actionList}>
            <WaveItem index={0} waveKey={`${visible}:${activeHabit.id}`} stepMs={45} distance={14}>
              <PressableScale
                style={styles.actionItem}
                scaleTo={0.98}
                onPress={() => {
                  onClose();
                  onEdit(activeHabit);
                }}
              >
                <Ionicons name="create-outline" size={20} color={UI_COLORS.textPrimary} />
                <Text style={styles.actionItemText}>Edit Habit</Text>
              </PressableScale>
            </WaveItem>

            <WaveItem index={1} waveKey={`${visible}:${activeHabit.id}`} stepMs={45} distance={14}>
              <PressableScale
                style={styles.actionItem}
                scaleTo={0.98}
                onPress={() => {
                  onClose();
                  onOpenCalendar(activeHabit);
                }}
              >
                <Ionicons name="calendar-outline" size={20} color={UI_COLORS.textPrimary} />
                <Text style={styles.actionItemText}>Calendar & History</Text>
              </PressableScale>
            </WaveItem>

            <WaveItem index={2} waveKey={`${visible}:${activeHabit.id}`} stepMs={45} distance={14}>
              <PressableScale
                style={styles.actionItem}
                scaleTo={0.98}
                onPress={() => {
                  onClose();
                  onOpenStats(activeHabit);
                }}
              >
                <Ionicons name="bar-chart-outline" size={20} color={UI_COLORS.textPrimary} />
                <Text style={styles.actionItemText}>Statistics</Text>
              </PressableScale>
            </WaveItem>

            <WaveItem index={3} waveKey={`${visible}:${activeHabit.id}`} stepMs={45} distance={14}>
              <PressableScale
                style={styles.actionItem}
                scaleTo={0.98}
                onPress={() => {
                  onClose();
                  onToggleArchive(activeHabit);
                }}
              >
                <Ionicons name="archive-outline" size={20} color={UI_COLORS.textPrimary} />
                <Text style={styles.actionItemText}>
                  {activeHabit.archived ? "Restore to Active Habits" : "Archive Habit"}
                </Text>
              </PressableScale>
            </WaveItem>

            <WaveItem index={4} waveKey={`${visible}:${activeHabit.id}`} stepMs={45} distance={14}>
              <PressableScale
                style={styles.actionItem}
                scaleTo={0.98}
                onPress={() => {
                  onClose();
                  onResetProgress(activeHabit);
                }}
              >
                <Ionicons name="refresh-outline" size={20} color={UI_COLORS.textSecondary} />
                <Text style={styles.actionItemText}>Reset Progress</Text>
              </PressableScale>
            </WaveItem>

            <WaveItem index={5} waveKey={`${visible}:${activeHabit.id}`} stepMs={45} distance={14}>
              <PressableScale
                style={[styles.actionItem, styles.actionItemDestructive]}
                scaleTo={0.98}
                onPress={() => {
                  onClose();
                  onDelete(activeHabit.id);
                }}
              >
                <Ionicons name="trash-outline" size={20} color={UI_COLORS.cmuRed} />
                <Text style={[styles.actionItemText, { color: UI_COLORS.cmuRed }]}>
                  Delete Habit
                </Text>
              </PressableScale>
            </WaveItem>
          </View>
        </>
      ) : null}
    </AnimatedModal>
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
