const { registerHooks } = require("node:module");
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && !/\.[a-z]+$/i.test(specifier)) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});

const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  getLast7Days,
  formatFrequencyLabel,
  evaluateNumericValue,
  isDateScheduled,
  isDayCompleted,
  calculateStreak,
  calculateBestStreak,
  calculateCompletionRate,
  normalizeHabit,
} = require("../utils/habitLogic.ts");
const { localDateKey } = require("../utils/taskDates.ts");

const anchorToday = new Date(2026, 9, 3, 17, 39); // Sat Oct 3, 2026 (matches screenshot!)

function makeHabit(overrides = {}) {
  return normalizeHabit(
    {
      id: "test-1",
      title: "Sleep",
      categoryId: "sleep",
      evaluationType: "boolean",
      goalCondition: "at_least",
      goal: 1,
      unit: "night",
      step: 1,
      frequency: { type: "daily" },
      startDate: "2026-09-27",
      endDate: null,
      priority: "medium",
      history: {},
      ...overrides,
    },
    anchorToday
  );
}

test("getLast7Days returns rolling 7-day window ending on today (Sun 27 .. Sat 3)", () => {
  const days = getLast7Days(anchorToday);
  assert.equal(days.length, 7);
  assert.equal(localDateKey(days[0]), "2026-09-27");
  assert.equal(days[0].getDay(), 0); // Sun
  assert.equal(localDateKey(days[6]), "2026-10-03");
  assert.equal(days[6].getDay(), 6); // Sat
});

test("formatFrequencyLabel formats all 4 HabitNow frequency modes", () => {
  assert.equal(formatFrequencyLabel({ type: "daily" }), "Every day");
  assert.equal(
    formatFrequencyLabel({ type: "days_of_week", days: [1, 2, 3, 4, 5] }),
    "Weekdays"
  );
  assert.equal(
    formatFrequencyLabel({ type: "days_of_week", days: [0, 6] }),
    "Weekends"
  );
  assert.equal(
    formatFrequencyLabel({ type: "days_of_week", days: [1, 3, 5] }),
    "Mon, Wed, Fri"
  );
  assert.equal(
    formatFrequencyLabel({ type: "days_per_week", count: 4 }),
    "4 days a week"
  );
  assert.equal(
    formatFrequencyLabel({ type: "interval", everyDays: 3 }),
    "Every 3 days"
  );
});

test("newly created habit today with no completion returns streak 0 and completion rate null ('-')", () => {
  const habit = makeHabit({ startDate: "2026-10-03", history: {} });
  assert.equal(calculateStreak(habit, anchorToday), 0);
  assert.equal(calculateCompletionRate(habit, anchorToday), null);

  // Once completed today, streak becomes 1 and rate becomes 100%
  const completedHabit = makeHabit({
    startDate: "2026-10-03",
    history: { "2026-10-03": { completed: true } },
  });
  assert.equal(calculateStreak(completedHabit, anchorToday), 1);
  assert.equal(calculateCompletionRate(completedHabit, anchorToday), 100);
});

test("daily streak preserves yesterday's streak while today is still pending", () => {
  const habit = makeHabit({
    startDate: "2026-09-27",
    history: {
      "2026-09-27": { completed: true },
      "2026-09-28": { completed: true },
      "2026-09-29": { completed: true },
      "2026-09-30": { completed: true },
      "2026-10-01": { completed: true },
      "2026-10-02": { completed: true },
    },
  });
  assert.equal(calculateStreak(habit, anchorToday), 6);
  assert.equal(calculateBestStreak(habit, anchorToday), 6);
  assert.equal(calculateCompletionRate(habit, anchorToday), 86); // 6 / 7
});

test("specific days of week skips unscheduled days when computing streak", () => {
  // Scheduled Mon (Sep 28), Wed (Sep 30), Fri (Oct 2); Today is Sat (Oct 3, unscheduled)
  const mwfHabit = makeHabit({
    startDate: "2026-09-28",
    frequency: { type: "days_of_week", days: [1, 3, 5] },
    history: {
      "2026-09-28": { completed: true },
      "2026-09-30": { completed: true },
      "2026-10-02": { completed: true },
    },
  });
  assert.equal(isDateScheduled(mwfHabit, new Date(2026, 8, 29)), false); // Tue
  assert.equal(isDateScheduled(mwfHabit, new Date(2026, 8, 30)), true); // Wed
  assert.equal(calculateStreak(mwfHabit, anchorToday), 3);
  assert.equal(calculateCompletionRate(mwfHabit, anchorToday), 100);
});

test("numeric habit conditions (at_least, less_than, exactly) evaluate accurately", () => {
  assert.equal(evaluateNumericValue(8, "at_least", 8), true);
  assert.equal(evaluateNumericValue(7, "at_least", 8), false);
  assert.equal(evaluateNumericValue(1, "less_than", 2), true);
  assert.equal(evaluateNumericValue(2, "less_than", 2), false);
  assert.equal(evaluateNumericValue(30, "exactly", 30), true);
  assert.equal(evaluateNumericValue(35, "exactly", 30), false);

  const waterHabit = makeHabit({
    evaluationType: "numeric",
    goalCondition: "at_least",
    goal: 8,
    unit: "glasses",
    history: {
      "2026-10-02": { completed: false, value: 8 },
      "2026-10-03": { completed: false, value: 5 },
    },
  });
  assert.equal(isDayCompleted(waterHabit, "2026-10-02"), true);
  assert.equal(isDayCompleted(waterHabit, "2026-10-03"), false);
});

test("normalizeHabit migrates legacy weekProgress arrays and clamps XP to 0..60", () => {
  const migrated = normalizeHabit(
    {
      id: "legacy-1",
      title: "Legacy Run",
      weekProgress: [true, false, true, true, false, true, true],
      xp: 95,
    },
    anchorToday
  );
  assert.equal(migrated.xp, 60);
  assert.equal(migrated.history["2026-10-03"].completed, true);
  assert.equal(migrated.history["2026-10-02"].completed, true);
});
