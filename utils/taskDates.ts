/** Store calendar dates without UTC conversion, so a due day is stable across time zones. */
export function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export function parseTaskDate(value: string, now = new Date()): Date | null {
  const text = value.trim().toLowerCase();
  if (text === 'today' || text === 'tomorrow') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + (text === 'tomorrow' ? 1 : 0));
  }
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  // Older saved tasks omitted the year; interpret those in the current local year.
  const legacy = /^(?:(?:mon|tue|wed|thu|fri|sat|sun)\s+)?([a-z]{3})\s+(\d{1,2})(?:,?\s+(\d{4}))?$/.exec(text);
  if (!iso && !legacy) return null;
  const year = iso ? Number(iso[1]) : Number(legacy![3] || now.getFullYear());
  const month = iso ? Number(iso[2]) - 1 : months.indexOf(legacy![1]);
  const day = Number(iso ? iso[3] : legacy![2]);
  const date = new Date(year, month, day);
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day ? date : null;
}

export function getTaskDateKey(value: string, now = new Date()): string | null {
  const date = parseTaskDate(value, now);
  return date ? localDateKey(date) : null;
}

export function isTaskDueToday(value: string, now = new Date()): boolean {
  const date = parseTaskDate(value, now);
  return date !== null && localDateKey(date) === localDateKey(now);
}

export function isTaskUpcoming(value: string, now = new Date()): boolean {
  const date = parseTaskDate(value, now);
  return date !== null && localDateKey(date) > localDateKey(now);
}

export function isTaskOverdue(value: string, now = new Date()): boolean {
  const date = parseTaskDate(value, now);
  return date !== null && localDateKey(date) < localDateKey(now);
}

export function formatTaskDate(value: string, now = new Date()): string {
  const date = parseTaskDate(value, now);
  if (!date) return value;
  if (localDateKey(date) === localDateKey(now)) return 'Today';
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (localDateKey(date) === localDateKey(tomorrow)) return 'Tomorrow';
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (localDateKey(date) === localDateKey(yesterday)) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
    ...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' as const } : {}),
  });
}

export function parseTaskTime(value: string, now = new Date()): Date {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(value.trim());
  const date = new Date(now);
  if (match && Number(match[1]) >= 1 && Number(match[1]) <= 12 && Number(match[2]) < 60) {
    date.setHours(Number(match[1]) % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0), Number(match[2]), 0, 0);
  }
  return date;
}

/** Convert a 12-hour time string (e.g. "11:59 PM") into minutes from midnight (0..1439), or 1440 if unset. */
export function parseTaskMinutes(value: string): number {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec((value ?? '').trim());
  if (!match) return 1440;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 1 || h > 12 || m < 0 || m >= 60) return 1440;
  const hour24 = (h % 12) + (match[3].toUpperCase() === 'PM' ? 12 : 0);
  return hour24 * 60 + m;
}

const PRIORITY_RANK: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export interface SchedulableTaskLike {
  text: string;
  dueDate: string;
  dueTime: string;
  priority: 'high' | 'medium' | 'low';
}

/** Sort tasks chronologically by due date, then due time, then priority (high -> medium -> low). */
export function compareTasksBySchedule<T extends SchedulableTaskLike>(
  a: T,
  b: T,
  now = new Date()
): number {
  const keyA = getTaskDateKey(a.dueDate, now) ?? '9999-99-99';
  const keyB = getTaskDateKey(b.dueDate, now) ?? '9999-99-99';
  if (keyA !== keyB) return keyA < keyB ? -1 : 1;

  const minA = parseTaskMinutes(a.dueTime);
  const minB = parseTaskMinutes(b.dueTime);
  if (minA !== minB) return minA - minB;

  const prioA = PRIORITY_RANK[a.priority] ?? 3;
  const prioB = PRIORITY_RANK[b.priority] ?? 3;
  if (prioA !== prioB) return prioA - prioB;

  return a.text.localeCompare(b.text);
}

/** Return the 7-day Sunday..Saturday calendar week containing `anchor`. */
export function getCalendarWeekDays(anchor: Date): Date[] {
  const startOfWeek = new Date(
    anchor.getFullYear(),
    anchor.getMonth(),
    anchor.getDate() - anchor.getDay()
  );
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(
      new Date(
        startOfWeek.getFullYear(),
        startOfWeek.getMonth(),
        startOfWeek.getDate() + i
      )
    );
  }
  return days;
}

/** Return padded 7-column calendar grid cells (`null` for leading/trailing blanks) for a given month. */
export function getMonthGridCells(year: number, month: number): (Date | null)[] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month, d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function addDaysToDateKey(dateKey: string, deltaDays: number, now = new Date()): string {
  const base = parseTaskDate(dateKey, now) ?? now;
  const shifted = new Date(base.getFullYear(), base.getMonth(), base.getDate() + deltaDays);
  return localDateKey(shifted);
}

export function formatCalendarDayHeading(
  dateKey: string,
  now = new Date()
): { primary: string; secondary: string; isToday: boolean } {
  const date = parseTaskDate(dateKey, now);
  if (!date) {
    return { primary: dateKey, secondary: '', isToday: false };
  }
  const todayKey = localDateKey(now);
  const tomorrowKey = localDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  const yesterdayKey = localDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));

  const fullLabel = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' as const } : {}),
  });

  if (dateKey === todayKey) {
    return { primary: 'Today', secondary: fullLabel, isToday: true };
  }
  if (dateKey === tomorrowKey) {
    return { primary: 'Tomorrow', secondary: fullLabel, isToday: false };
  }
  if (dateKey === yesterdayKey) {
    return { primary: 'Yesterday', secondary: fullLabel, isToday: false };
  }

  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const targetMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((targetMidnight - todayMidnight) / 86_400_000);
  const relative =
    diffDays > 1
      ? `In ${diffDays} days`
      : diffDays < -1
      ? `${Math.abs(diffDays)} days ago`
      : '';

  return { primary: fullLabel, secondary: relative, isToday: false };
}
