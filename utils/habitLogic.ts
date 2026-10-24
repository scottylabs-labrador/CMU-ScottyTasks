import {
  HABIT_CATEGORIES,
  HABIT_PRIORITY_XP,
  type HabitDayEntry,
  type HabitFrequency,
  type HabitGoalCondition,
  type HabitItem,
} from "../constants/habits";
import { localDateKey, parseTaskDate } from "./taskDates";
import { UI_COLORS } from "../constants/gamification";

export const DAY_LABELS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta);
}

/** DST-safe calendar day difference (`end - start`). */
export function daysBetween(start: Date, end: Date): number {
  const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((utcEnd - utcStart) / 86_400_000);
}

/** Rolling 7-day window ending on `today` (matching HabitNow's card strip). */
export function getLast7Days(today = new Date()): Date[] {
  const anchor = startOfDay(today);
  return Array.from({ length: 7 }, (_, idx) => addDays(anchor, idx - 6));
}

export function formatFrequencyLabel(frequency: HabitFrequency): string {
  switch (frequency.type) {
    case "daily":
      return "Every day";
    case "days_of_week": {
      const sorted = Array.from(new Set(frequency.days)).sort((a, b) => a - b);
      if (sorted.length === 0 || sorted.length === 7) return "Every day";
      if (
        sorted.length === 5 &&
        sorted[0] === 1 &&
        sorted[1] === 2 &&
        sorted[2] === 3 &&
        sorted[3] === 4 &&
        sorted[4] === 5
      ) {
        return "Weekdays";
      }
      if (sorted.length === 2 && sorted[0] === 0 && sorted[1] === 6) {
        return "Weekends";
      }
      return sorted.map((d) => DAY_LABELS_SHORT[d]).join(", ");
    }
    case "days_per_week":
      return frequency.count === 1
        ? "1 day a week"
        : `${frequency.count} days a week`;
    case "interval":
      return `Every ${Math.max(2, frequency.everyDays)} days`;
  }
}

export function formatGoalSummary(
  habit: Pick<HabitItem, "evaluationType" | "goalCondition" | "goal" | "unit">
): string {
  if (habit.evaluationType === "boolean") return "Yes / No";
  const prefix =
    habit.goalCondition === "less_than"
      ? "Less than"
      : habit.goalCondition === "exactly"
      ? "Exactly"
      : "At least";
  return `${prefix} ${habit.goal} ${habit.unit}`;
}

export function evaluateNumericValue(
  value: number,
  condition: HabitGoalCondition,
  goal: number
): boolean {
  if (condition === "less_than") return value < goal;
  if (condition === "exactly") return value === goal;
  return value >= goal;
}

export function isDayCompleted(
  habit: Pick<HabitItem, "evaluationType" | "goalCondition" | "goal" | "history">,
  dateKey: string
): boolean {
  const entry: HabitDayEntry | undefined = habit.history[dateKey];
  if (!entry) return false;
  if (habit.evaluationType === "numeric" && typeof entry.value === "number") {
    return evaluateNumericValue(entry.value, habit.goalCondition, habit.goal);
  }
  return Boolean(entry.completed);
}

export function getDayNumericValue(
  habit: Pick<HabitItem, "history">,
  dateKey: string
): number | undefined {
  return habit.history[dateKey]?.value;
}

export function getDayProgressRatio(
  habit: Pick<HabitItem, "evaluationType" | "goalCondition" | "goal" | "history">,
  dateKey: string
): number {
  if (isDayCompleted(habit, dateKey)) return 1;
  const entry = habit.history[dateKey];
  if (!entry || habit.evaluationType !== "numeric" || typeof entry.value !== "number") {
    return 0;
  }
  if (habit.goalCondition === "less_than") {
    return entry.value < habit.goal ? 1 : 0;
  }
  if (habit.goal <= 0) return 0;
  return Math.max(0, Math.min(0.99, entry.value / habit.goal));
}

export function isDateScheduled(
  habit: Pick<HabitItem, "frequency" | "startDate" | "endDate">,
  date: Date
): boolean {
  const d = startOfDay(date);
  const start = parseTaskDate(habit.startDate, d);
  if (start && daysBetween(start, d) < 0) return false;

  if (habit.endDate) {
    const end = parseTaskDate(habit.endDate, d);
    if (end && daysBetween(end, d) > 0) return false;
  }

  switch (habit.frequency.type) {
    case "daily":
      return true;
    case "days_of_week":
      return habit.frequency.days.length === 0
        ? true
        : habit.frequency.days.includes(d.getDay());
    case "days_per_week":
      return true;
    case "interval": {
      if (!start) return true;
      const diff = daysBetween(start, d);
      const step = Math.max(2, habit.frequency.everyDays);
      return diff >= 0 && diff % step === 0;
    }
  }
}

export function calculateStreak(habit: HabitItem, today = new Date()): number {
  const anchor = startOfDay(today);
  const start = parseTaskDate(habit.startDate, anchor) ?? addDays(anchor, -365);

  if (daysBetween(start, anchor) < 0) return 0;

  if (habit.frequency.type === "days_per_week") {
    const target = Math.max(1, Math.min(7, habit.frequency.count));
    const currentWeekStart = addDays(anchor, -anchor.getDay());
    let streak = 0;

    // Count completions in the current week so far
    for (let i = 0; i <= anchor.getDay(); i++) {
      const day = addDays(currentWeekStart, i);
      if (daysBetween(start, day) >= 0 && isDayCompleted(habit, localDateKey(day))) {
        streak++;
      }
    }

    // Walk prior Sun..Sat weeks while the weekly target was met
    for (let w = 1; w <= 260; w++) {
      const weekStart = addDays(currentWeekStart, -7 * w);
      const weekEnd = addDays(weekStart, 6);
      if (daysBetween(start, weekEnd) < 0) break;

      let activeDaysInWeek = 0;
      let weekCompletions = 0;
      for (let i = 0; i < 7; i++) {
        const day = addDays(weekStart, i);
        if (daysBetween(start, day) >= 0) {
          activeDaysInWeek++;
          if (isDayCompleted(habit, localDateKey(day))) {
            weekCompletions++;
          }
        }
      }
      const requiredForWeek = Math.min(target, activeDaysInWeek);
      if (weekCompletions >= requiredForWeek && requiredForWeek > 0) {
        streak += weekCompletions;
      } else {
        break;
      }
    }
    return streak;
  }

  let streak = 0;
  const maxLookback = Math.min(3650, daysBetween(start, anchor));

  for (let offset = 0; offset <= maxLookback; offset++) {
    const d = addDays(anchor, -offset);
    const key = localDateKey(d);
    const completed = isDayCompleted(habit, key);
    const scheduled = isDateScheduled(habit, d);

    if (completed) {
      streak++;
    } else if (offset === 0) {
      // Today is still in progress; don't break prior streak yet.
      continue;
    } else if (scheduled) {
      break;
    }
  }

  return streak;
}

export function calculateBestStreak(habit: HabitItem, today = new Date()): number {
  const anchor = startOfDay(today);
  const start = parseTaskDate(habit.startDate, anchor);
  if (!start || daysBetween(start, anchor) < 0) {
    return calculateStreak(habit, anchor);
  }

  const totalSpan = Math.min(3650, daysBetween(start, anchor));
  let best = 0;
  let running = 0;

  if (habit.frequency.type === "days_per_week") {
    // Evaluate streak snapshot across completed dates and today
    for (let i = 0; i <= totalSpan; i++) {
      const d = addDays(start, i);
      if (isDayCompleted(habit, localDateKey(d)) || i === totalSpan) {
        best = Math.max(best, calculateStreak(habit, d));
      }
    }
    return best;
  }

  for (let i = 0; i <= totalSpan; i++) {
    const d = addDays(start, i);
    const completed = isDayCompleted(habit, localDateKey(d));
    const scheduled = isDateScheduled(habit, d);

    if (completed) {
      running++;
      if (running > best) best = running;
    } else if (scheduled && i < totalSpan) {
      running = 0;
    }
  }

  return Math.max(best, calculateStreak(habit, anchor));
}

/**
 * Returns `0..100` completion percentage, or `null` when a newly created habit
 * has no elapsed scheduled days and is not yet completed today (rendered as `"-"`).
 */
export function calculateCompletionRate(
  habit: HabitItem,
  today = new Date()
): number | null {
  const anchor = startOfDay(today);
  const start = parseTaskDate(habit.startDate, anchor);
  if (!start || daysBetween(start, anchor) < 0) return null;

  const endBound = habit.endDate ? parseTaskDate(habit.endDate, anchor) : null;
  const effectiveEnd =
    endBound && daysBetween(endBound, anchor) > 0 ? endBound : anchor;

  const spanDays = daysBetween(start, effectiveEnd);
  if (spanDays < 0) return null;

  if (spanDays === 0) {
    return isDayCompleted(habit, localDateKey(anchor)) ? 100 : null;
  }

  if (habit.frequency.type === "days_per_week") {
    let completed = 0;
    for (let i = 0; i <= spanDays; i++) {
      if (isDayCompleted(habit, localDateKey(addDays(start, i)))) {
        completed++;
      }
    }
    const expected = Math.max(
      1,
      Math.round(((spanDays + 1) / 7) * habit.frequency.count)
    );
    return Math.min(100, Math.round((completed / expected) * 100));
  }

  let scheduledCount = 0;
  let completedCount = 0;

  for (let i = 0; i <= spanDays; i++) {
    const d = addDays(start, i);
    const key = localDateKey(d);
    const scheduled = isDateScheduled(habit, d);
    const completed = isDayCompleted(habit, key);

    if (scheduled) {
      scheduledCount++;
      if (completed) completedCount++;
    } else if (completed) {
      completedCount++;
    }
  }

  if (scheduledCount === 0) {
    return completedCount > 0 ? 100 : null;
  }

  return Math.min(100, Math.round((completedCount / scheduledCount) * 100));
}

export function calculateTotalCompletions(habit: HabitItem): number {
  return Object.keys(habit.history).filter((dateKey) =>
    isDayCompleted(habit, dateKey)
  ).length;
}

/** Returns 7 percentages (`0..100`) for `Sun..Sat` consistency over active history. */
export function calculateWeekdayConsistency(
  habit: HabitItem,
  today = new Date()
): number[] {
  const anchor = startOfDay(today);
  const start = parseTaskDate(habit.startDate, anchor) ?? addDays(anchor, -27);
  const effectiveStart =
    daysBetween(start, anchor) > 84 ? addDays(anchor, -84) : start;
  const span = Math.max(0, daysBetween(effectiveStart, anchor));

  const totals = [0, 0, 0, 0, 0, 0, 0];
  const dones = [0, 0, 0, 0, 0, 0, 0];

  for (let i = 0; i <= span; i++) {
    const d = addDays(effectiveStart, i);
    const dow = d.getDay();
    if (isDateScheduled(habit, d)) {
      totals[dow]++;
      if (isDayCompleted(habit, localDateKey(d))) {
        dones[dow]++;
      }
    }
  }

  return totals.map((t, idx) => (t > 0 ? Math.round((dones[idx] / t) * 100) : 0));
}

/** Hydrates and migrates saved or partial habit records safely. */
export function normalizeHabit(
  raw: Record<string, unknown>,
  fallbackNow = new Date()
): HabitItem {
  const defaultCat = HABIT_CATEGORIES[0];
  const categoryId = HABIT_CATEGORIES.some((c) => c.id === raw.categoryId)
    ? (raw.categoryId as HabitItem["categoryId"])
    : defaultCat.id;
  const cat = HABIT_CATEGORIES.find((c) => c.id === categoryId) ?? defaultCat;

  const priority: HabitItem["priority"] =
    raw.priority === "low" || raw.priority === "medium" || raw.priority === "high"
      ? raw.priority
      : "medium";

  const evaluationType: HabitItem["evaluationType"] =
    raw.evaluationType === "numeric" ? "numeric" : "boolean";

  const goalCondition: HabitItem["goalCondition"] =
    raw.goalCondition === "less_than" || raw.goalCondition === "exactly"
      ? raw.goalCondition
      : "at_least";

  let frequency: HabitFrequency = { type: "daily" };
  if (raw.frequency && typeof raw.frequency === "object") {
    const f = raw.frequency as Record<string, unknown>;
    if (f.type === "days_of_week" && Array.isArray(f.days)) {
      frequency = {
        type: "days_of_week",
        days: f.days.filter((n): n is number => typeof n === "number" && n >= 0 && n <= 6),
      };
    } else if (f.type === "days_per_week" && typeof f.count === "number") {
      frequency = { type: "days_per_week", count: Math.max(1, Math.min(6, f.count)) };
    } else if (f.type === "interval" && typeof f.everyDays === "number") {
      frequency = { type: "interval", everyDays: Math.max(2, Math.min(30, f.everyDays)) };
    }
  }

  const history: Record<string, HabitDayEntry> = {};
  if (raw.history && typeof raw.history === "object") {
    for (const [k, v] of Object.entries(raw.history as Record<string, unknown>)) {
      if (v && typeof v === "object") {
        const entry = v as Record<string, unknown>;
        history[k] = {
          completed: Boolean(entry.completed),
          ...(typeof entry.value === "number" ? { value: entry.value } : {}),
          ...(typeof entry.note === "string" && entry.note ? { note: entry.note } : {}),
        };
      }
    }
  } else if (Array.isArray(raw.weekProgress)) {
    // Migrate legacy `weekProgress` array if encountered
    const last7 = getLast7Days(fallbackNow);
    raw.weekProgress.slice(0, 7).forEach((done, idx) => {
      if (done && last7[idx]) {
        history[localDateKey(last7[idx])] = { completed: true };
      }
    });
  }

  const rawXp = typeof raw.xp === "number" ? raw.xp : HABIT_PRIORITY_XP[priority];

  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : `habit-${Date.now()}`,
    title: typeof raw.title === "string" && raw.title.trim() ? raw.title.trim() : "Habit",
    description: typeof raw.description === "string" ? raw.description : "",
    categoryId,
    icon: typeof raw.icon === "string" && raw.icon ? raw.icon : cat.icon,
    color: typeof raw.color === "string" && raw.color ? raw.color : UI_COLORS.xpGreen,
    evaluationType,
    goalCondition,
    goal: typeof raw.goal === "number" && raw.goal > 0 ? raw.goal : 1,
    unit: typeof raw.unit === "string" && raw.unit.trim() ? raw.unit.trim() : "times",
    step: typeof raw.step === "number" && raw.step > 0 ? raw.step : 1,
    frequency,
    startDate:
      typeof raw.startDate === "string" && parseTaskDate(raw.startDate, fallbackNow)
        ? raw.startDate
        : localDateKey(fallbackNow),
    endDate:
      typeof raw.endDate === "string" && parseTaskDate(raw.endDate, fallbackNow)
        ? raw.endDate
        : null,
    reminderTime: typeof raw.reminderTime === "string" ? raw.reminderTime : "",
    priority,
    xp: Math.max(0, Math.min(60, rawXp)),
    archived: Boolean(raw.archived),
    history,
  };
}
