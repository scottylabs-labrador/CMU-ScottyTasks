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

export function isTaskDueToday(value: string, now = new Date()): boolean {
  const date = parseTaskDate(value, now);
  return date !== null && localDateKey(date) === localDateKey(now);
}

export function isTaskUpcoming(value: string, now = new Date()): boolean {
  const date = parseTaskDate(value, now);
  return date !== null && localDateKey(date) > localDateKey(now);
}

export function formatTaskDate(value: string, now = new Date()): string {
  const date = parseTaskDate(value, now);
  if (!date) return value;
  if (localDateKey(date) === localDateKey(now)) return 'Today';
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (localDateKey(date) === localDateKey(tomorrow)) return 'Tomorrow';
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
