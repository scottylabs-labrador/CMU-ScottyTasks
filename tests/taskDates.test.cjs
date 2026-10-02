const { test } = require('node:test');
const assert = require('node:assert/strict');
const { localDateKey, parseTaskDate, parseTaskTime, isTaskDueToday, isTaskUpcoming, formatTaskDate } = require('../utils/taskDates.ts');

const today = new Date(2026, 9, 2, 23, 45);
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
test('calendar serialization and parsing preserve local days near midnight', () => {
  assert.equal(localDateKey(today), '2026-10-02');
  const restored = parseTaskDate('2026-10-02', today);
  assert.equal(restored.getDate(), 2);
  assert.equal(restored.getHours(), 0);
  assert.equal(isTaskDueToday('2026-10-02', new Date(2026, 9, 3)), false);
});
test('validates dates and handles leap days and year rollover', () => {
  for (const value of ['2026-02-29', '2026-13-01', 'garbage', 'Oct 32']) assert.equal(parseTaskDate(value, today), null);
  assert.equal(localDateKey(parseTaskDate('2028-02-29')), '2028-02-29');
  assert.equal(formatTaskDate('2027-01-01', new Date(2026, 11, 31)), 'Tomorrow');
});
test('editing restores the saved date and AM/PM time', () => {
  assert.equal(localDateKey(parseTaskDate('Oct 8', today)), '2026-10-08');
  assert.equal(parseTaskTime('11:59 PM', today).getHours(), 23);
  assert.equal(parseTaskTime('11:59 PM', today).getMinutes(), 59);
  assert.equal(parseTaskTime('12:00 AM', today).getHours(), 0);
  assert.equal(parseTaskTime('12:00 PM', today).getHours(), 12);
});
