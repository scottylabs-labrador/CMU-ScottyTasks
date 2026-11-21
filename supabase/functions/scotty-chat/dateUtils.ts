export interface RawTaskRow {
  id: string;
  text: string;
  course: string;
  priority: "high" | "medium" | "low";
  tag: string;
  dueDate: string;
  dueTime: string;
  xp: number;
  done: boolean;
  rewarded?: boolean;
  created_at?: string;
}

export type HabitPriority = "low" | "medium" | "high";
export type HabitGoalCondition = "at_least" | "less_than" | "exactly";

export interface RawHabitRow {
  id: string;
  category: string;
  tracking: "boolean" | "numeric";
  title: string;
  description?: string;
  unit: string;
  goal: number | null;
  goal_condition?: HabitGoalCondition;
  icon?: string;
  color?: string;
  step?: number;
  starts_on?: string;
  ends_on?: string | null;
  priority?: HabitPriority;
  archived?: boolean;
}

export interface RawHabitEntryRow {
  habit_id: string;
  day: string;
  value: number;
  goal?: number | null;
  note?: string | null;
}

export type TaskDueCategory = "overdue" | "today" | "upcoming" | "unscheduled";

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

const PRIORITY_XP: Record<HabitPriority, number> = {
  low: 25,
  medium: 40,
  high: 60,
};

export function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function shiftLocalDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function parseIsoCalendarDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day
    ? date
    : null;
}

export function resolveLocalToday(localDate?: string, timezone?: string): Date {
  if (localDate) {
    const parsed = parseIsoCalendarDate(localDate);
    if (parsed) return parsed;
  }

  if (timezone) {
    try {
      const formatted = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
      const parsed = parseIsoCalendarDate(formatted);
      if (parsed) return parsed;
    } catch {
      // Fall back to UTC calendar day when timezone is unrecognized.
    }
  }

  const now = new Date();
  return new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

export function parseTaskDate(value: string, now: Date): Date | null {
  const text = value.trim().toLowerCase();
  if (text === "today" || text === "tomorrow") {
    return shiftLocalDays(now, text === "tomorrow" ? 1 : 0);
  }

  const iso = parseIsoCalendarDate(text);
  if (iso) return iso;

  const legacy = /^(?:(?:mon|tue|wed|thu|fri|sat|sun)\s+)?([a-z]{3})\s+(\d{1,2})(?:,?\s+(\d{4}))?$/.exec(
    text,
  );
  if (!legacy) return null;

  const year = Number(legacy[3] || now.getFullYear());
  const month = MONTHS.indexOf(legacy[1]);
  const day = Number(legacy[2]);
  if (month < 0) return null;

  const date = new Date(year, month, day);
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day
    ? date
    : null;
}

export function categorizeTaskDueDate(dueDate: string, now: Date): TaskDueCategory {
  const parsed = parseTaskDate(dueDate, now);
  if (!parsed) return "unscheduled";
  const key = localDateKey(parsed);
  const todayKey = localDateKey(now);
  if (key < todayKey) return "overdue";
  if (key === todayKey) return "today";
  return "upcoming";
}

export function isTaskDueWithinDays(dueDate: string, days: number, now: Date): boolean {
  if (days < 0) return false;
  const parsed = parseTaskDate(dueDate, now);
  if (!parsed) return false;
  const key = localDateKey(parsed);
  return key >= localDateKey(now) && key <= localDateKey(shiftLocalDays(now, days));
}

export function computeEffectiveHappiness(
  rawHappiness: number,
  lastFedAt: number,
  nowMs = Date.now(),
): number {
  if (!lastFedAt || lastFedAt <= 0) return Math.min(100, Math.max(15, rawHappiness));
  const hoursElapsed = Math.max(0, (nowMs - lastFedAt) / (1000 * 60 * 60));
  const decay = Math.floor(hoursElapsed * 0.833);
  return Math.min(100, Math.max(15, rawHappiness - decay));
}

export function getMoodLabel(happiness: number): "ecstatic" | "happy" | "peckish" | "sleepy" {
  if (happiness >= 85) return "ecstatic";
  if (happiness >= 60) return "happy";
  if (happiness >= 30) return "peckish";
  return "sleepy";
}

export function calculateLevelProgress(totalXp: number): {
  level: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
} {
  const safeXp = Math.max(0, totalXp);
  const level = Math.max(1, Math.floor(safeXp / 1000) + 1);
  const xpIntoLevel = safeXp % 1000;
  return { level, xpIntoLevel, xpToNextLevel: 1000 - xpIntoLevel };
}

function isEntryCompleted(habit: RawHabitRow, entry: RawHabitEntryRow): boolean {
  const value = Number(entry.value);
  if (!Number.isFinite(value)) return false;
  if (habit.tracking === "boolean") {
    return value === 1;
  }
  const effectiveGoal = entry.goal === null ? null : Number(entry.goal ?? habit.goal);
  if (effectiveGoal === null || !Number.isFinite(effectiveGoal) || effectiveGoal <= 0) {
    return value > 0;
  }
  const condition = habit.goal_condition ?? "at_least";
  if (condition === "less_than") return value < effectiveGoal;
  if (condition === "exactly") return value === effectiveGoal;
  return value >= effectiveGoal;
}

export function computeHabitStats(
  habits: RawHabitRow[],
  entries: RawHabitEntryRow[],
  now: Date,
) {
  const entriesByHabit = new Map<string, Map<string, RawHabitEntryRow>>();
  for (const row of entries) {
    let map = entriesByHabit.get(row.habit_id);
    if (!map) {
      map = new Map<string, RawHabitEntryRow>();
      entriesByHabit.set(row.habit_id, map);
    }
    map.set(row.day, row);
  }

  const todayKey = localDateKey(now);
  const weekCutoff = localDateKey(shiftLocalDays(now, -6));

  return habits
    .filter((habit) => !habit.archived)
    .map((habit) => {
      const entryMap = entriesByHabit.get(habit.id) ?? new Map<string, RawHabitEntryRow>();
      const completedDates = new Set<string>();
      for (const [day, entry] of entryMap) {
        if (isEntryCompleted(habit, entry)) {
          completedDates.add(day);
        }
      }

      const todayEntry = entryMap.get(todayKey);
      const completedToday = completedDates.has(todayKey);
      const todayValue = todayEntry ? Number(todayEntry.value) : null;

      let offset = completedToday ? 0 : -1;
      let streak = 0;
      while (streak < 3660 && completedDates.has(localDateKey(shiftLocalDays(now, offset)))) {
        streak += 1;
        offset -= 1;
      }

      let completionsLast7Days = 0;
      for (const dateKey of completedDates) {
        if (dateKey >= weekCutoff && dateKey <= todayKey) {
          completionsLast7Days += 1;
        }
      }

      const priority: HabitPriority =
        habit.priority === "low" || habit.priority === "high" ? habit.priority : "medium";

      return {
        id: habit.id,
        title: habit.title,
        category: habit.category,
        tracking: habit.tracking,
        goal: habit.goal === null ? null : Number(habit.goal),
        goalCondition: habit.goal_condition ?? "at_least",
        unit: habit.unit ?? "",
        xp: PRIORITY_XP[priority],
        todayValue,
        completedToday,
        streak,
        completionsLast7Days,
      };
    });
}
