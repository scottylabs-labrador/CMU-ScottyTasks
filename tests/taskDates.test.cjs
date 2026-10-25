const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  localDateKey,
  parseTaskDate,
  parseTaskTime,
  parseTaskMinutes,
  getTaskDateKey,
  isTaskDueToday,
  isTaskUpcoming,
  isTaskOverdue,
  formatTaskDate,
  compareTasksBySchedule,
  getCalendarWeekDays,
  getMonthGridCells,
  addDaysToDateKey,
  formatCalendarDayHeading,
} = require('../utils/taskDates.ts');

const today = new Date(2026, 9, 2, 23, 45); // Fri Oct 2, 2026

test('saved month/day dates and canonical dates both match Today', () => {
  for (const value of ['Oct 2', 'Fri Oct 2', 'Oct 2, 2026', '2026-10-02', 'Today']) {
    assert.equal(isTaskDueToday(value, today), true, value);
  }
  assert.equal(isTaskDueToday('2027-10-02', today), false);
});

test('Upcoming excludes overdue tasks and today', () => {
  assert.equal(isTaskUpcoming('2026-10-01', today), false);
  assert.equal(isTaskUpcoming('Oct 2', today), false);
  assert.equal(isTaskUpcoming('Oct 3', today), true);
  assert.equal(isTaskUpcoming('Tomorrow', today), true);
});

test('isTaskOverdue identifies past dates accurately', () => {
  assert.equal(isTaskOverdue('2026-10-01', today), true);
  assert.equal(isTaskOverdue('Sep 30', today), true);
  assert.equal(isTaskOverdue('2026-10-02', today), false);
  assert.equal(isTaskOverdue('Today', today), false);
  assert.equal(isTaskOverdue('Tomorrow', today), false);
  assert.equal(isTaskOverdue('invalid', today), false);
});

test('calendar serialization and parsing preserve local days near midnight', () => {
  assert.equal(localDateKey(today), '2026-10-02');
  const restored = parseTaskDate('2026-10-02', today);
  assert.equal(restored.getDate(), 2);
  assert.equal(restored.getHours(), 0);
  assert.equal(isTaskDueToday('2026-10-02', new Date(2026, 9, 3)), false);
});

test('validates dates and handles leap days and year rollover', () => {
  for (const value of ['2026-02-29', '2026-13-01', 'garbage', 'Oct 32']) {
    assert.equal(parseTaskDate(value, today), null);
  }
  assert.equal(localDateKey(parseTaskDate('2028-02-29')), '2028-02-29');
  assert.equal(formatTaskDate('2027-01-01', new Date(2026, 11, 31)), 'Tomorrow');
  assert.equal(formatTaskDate('2026-10-01', today), 'Yesterday');
});

test('editing restores the saved date and AM/PM time', () => {
  assert.equal(localDateKey(parseTaskDate('Oct 8', today)), '2026-10-08');
  assert.equal(parseTaskTime('11:59 PM', today).getHours(), 23);
  assert.equal(parseTaskTime('11:59 PM', today).getMinutes(), 59);
  assert.equal(parseTaskTime('12:00 AM', today).getHours(), 0);
  assert.equal(parseTaskTime('12:00 PM', today).getHours(), 12);
});

test('compareTasksBySchedule sorts by date, time, then priority', () => {
  assert.equal(parseTaskMinutes('9:00 AM'), 9 * 60);
  assert.equal(parseTaskMinutes('12:00 AM'), 0);
  assert.equal(parseTaskMinutes('11:59 PM'), 23 * 60 + 59);
  assert.equal(parseTaskMinutes(''), 1440);

  const items = [
    { text: 'Low evening', dueDate: '2026-10-02', dueTime: '11:59 PM', priority: 'low' },
    { text: 'High evening', dueDate: '2026-10-02', dueTime: '11:59 PM', priority: 'high' },
    { text: 'Morning quiz', dueDate: '2026-10-02', dueTime: '9:30 AM', priority: 'medium' },
    { text: 'Yesterday lab', dueDate: '2026-10-01', dueTime: '5:00 PM', priority: 'medium' },
  ];
  const sorted = [...items].sort((a, b) => compareTasksBySchedule(a, b, today));
  assert.deepEqual(
    sorted.map((x) => x.text),
    ['Yesterday lab', 'Morning quiz', 'High evening', 'Low evening']
  );
});

test('getCalendarWeekDays and getMonthGridCells build 7-column calendar grids', () => {
  // Fri Oct 2, 2026 belongs to week Sun Sep 27 .. Sat Oct 3
  const week = getCalendarWeekDays(today);
  assert.equal(week.length, 7);
  assert.equal(localDateKey(week[0]), '2026-09-27');
  assert.equal(localDateKey(week[6]), '2026-10-03');

  // October 2026 starts on Thursday (index 4) and has 31 days -> 35 cells (5 rows)
  const cells = getMonthGridCells(2026, 9);
  assert.equal(cells.length % 7, 0);
  assert.equal(cells.length, 35);
  assert.equal(cells[0], null);
  assert.equal(cells[3], null);
  assert.equal(localDateKey(cells[4]), '2026-10-01');
  assert.equal(localDateKey(cells[34]), '2026-10-31');

  assert.equal(addDaysToDateKey('2026-10-02', -7, today), '2026-09-25');
  assert.equal(getTaskDateKey('Tomorrow', today), '2026-10-03');

  const headingToday = formatCalendarDayHeading('2026-10-02', today);
  assert.equal(headingToday.primary, 'Today');
  assert.equal(headingToday.isToday, true);

  const headingFuture = formatCalendarDayHeading('2026-10-07', today);
  assert.equal(headingFuture.secondary, 'In 5 days');
});
