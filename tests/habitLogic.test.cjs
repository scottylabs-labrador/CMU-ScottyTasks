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
  HABIT_CATEGORIES,
  isUnitValidForCategory,
  parseHabitDecimal,
  normalizeCategoryId,
} = require("../constants/habits.ts");
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
  mapDbHabitToItem,
  validateHabitSaveData,
} = require("../utils/habitLogic.ts");
const { localDateKey } = require("../utils/taskDates.ts");

const anchorToday = new Date(2026, 9, 3, 17, 39); // Sat Oct 3, 2026

function makeHabit(overrides = {}) {
  return normalizeHabit(
    {
      id: "test-1",
      title: "Sleep",
      categoryId: "sleep",
      evaluationType: "boolean",
      goalCondition: "at_least",
      goal: 1,
      unit: "",
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
    categoryId: "water",
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

test("normalizeHabit migrates legacy weekProgress arrays, categories, and clamps XP to 0..60", () => {
  const migrated = normalizeHabit(
    {
      id: "legacy-1",
      title: "Legacy Run",
      categoryId: "fitness",
      weekProgress: [true, false, true, true, false, true, true],
      xp: 95,
    },
    anchorToday
  );
  assert.equal(migrated.categoryId, "exercise");
  assert.equal(migrated.xp, 60);
  assert.equal(migrated.history["2026-10-03"].completed, true);
  assert.equal(migrated.history["2026-10-02"].completed, true);
  assert.equal(normalizeCategoryId("hydration"), "water");
  assert.equal(normalizeCategoryId("study"), "custom");
});

test("all 7 habit categories enforce reasonable domain unit categories", () => {
  assert.deepEqual(
    HABIT_CATEGORIES.map((c) => c.id),
    ["water", "sleep", "hobbies", "exercise", "social", "outdoor", "custom"]
  );

  // Water: volume/amount only (never time or frequency)
  for (const u of ["oz", "glasses", "cups", "mL", "L", "bottles"]) {
    assert.equal(isUnitValidForCategory("water", u), true);
  }
  for (const bad of ["hours", "mins", "times", "sessions", "miles"]) {
    assert.equal(isUnitValidForCategory("water", bad), false);
  }

  // Sleep: time only (never volume or frequency)
  for (const u of ["hours", "mins"]) {
    assert.equal(isUnitValidForCategory("sleep", u), true);
  }
  for (const bad of ["oz", "glasses", "times", "pages"]) {
    assert.equal(isUnitValidForCategory("sleep", bad), false);
  }

  // Hobbies, Exercise, Social, Outdoor: time or frequency/count (never volume)
  assert.equal(isUnitValidForCategory("hobbies", "mins"), true);
  assert.equal(isUnitValidForCategory("hobbies", "pages"), true);
  assert.equal(isUnitValidForCategory("hobbies", "oz"), false);

  assert.equal(isUnitValidForCategory("exercise", "mins"), true);
  assert.equal(isUnitValidForCategory("exercise", "reps"), true);
  assert.equal(isUnitValidForCategory("exercise", "miles"), true);
  assert.equal(isUnitValidForCategory("exercise", "mL"), false);

  assert.equal(isUnitValidForCategory("social", "times"), true);
  assert.equal(isUnitValidForCategory("social", "mins"), true);
  assert.equal(isUnitValidForCategory("social", "oz"), false);

  assert.equal(isUnitValidForCategory("outdoor", "mins"), true);
  assert.equal(isUnitValidForCategory("outdoor", "walks"), true);
  assert.equal(isUnitValidForCategory("outdoor", "cups"), false);

  // Custom: allows any 1..20 char unit
  assert.equal(isUnitValidForCategory("custom", "problems"), true);
  assert.equal(isUnitValidForCategory("custom", "flashcards"), true);
  assert.equal(isUnitValidForCategory("custom", ""), false);
  assert.equal(isUnitValidForCategory("custom", "a".repeat(21)), false);

  // validateHabitSaveData blocks invalid unit pairings (e.g. hours on water)
  const err = validateHabitSaveData({
    title: "Drink Water",
    description: "",
    categoryId: "water",
    icon: "water-outline",
    color: "#356575",
    evaluationType: "numeric",
    goalCondition: "at_least",
    goal: 2,
    unit: "hours",
    step: 0.5,
    frequency: { type: "daily" },
    startDate: "2026-10-03",
    endDate: null,
    reminderTime: "",
    priority: "medium",
  });
  assert.notEqual(err, null);
});

test("parseHabitDecimal handles decimals and rejects invalid numbers", () => {
  assert.equal(parseHabitDecimal("0.5"), 0.5);
  assert.equal(parseHabitDecimal("0,25"), 0.25);
  assert.equal(parseHabitDecimal("64"), 64);
  assert.equal(parseHabitDecimal("0", false), null);
  assert.equal(parseHabitDecimal("0", true), 0);
  for (const invalid of ["", "-2", "1.234", "100001", "abc", "Infinity"]) {
    assert.equal(parseHabitDecimal(invalid), null);
  }
});

test("mapDbHabitToItem maps Supabase rows and preserves snapshotted daily goals", () => {
  const mapped = mapDbHabitToItem(
    {
      id: "uuid-water",
      user_id: "u-1",
      category: "water",
      tracking: "numeric",
      title: "Drink Water",
      description: "Daily hydration",
      unit: "oz",
      goal: 80, // Current goal raised to 80 oz
      goal_condition: "at_least",
      step: 8,
      starts_on: "2026-10-01",
      priority: "medium",
      archived: false,
    },
    [
      // Oct 1 had snapshotted goal of 64 oz, so 64 oz was completed!
      { habit_id: "uuid-water", day: "2026-10-01", value: 64, goal: 64, note: "Done" },
      // Oct 3 uses new goal of 80 oz, so 64 oz is partial (not yet completed)
      { habit_id: "uuid-water", day: "2026-10-03", value: 64, goal: 80 },
    ],
    undefined,
    anchorToday
  );

  assert.equal(mapped.categoryId, "water");
  assert.equal(mapped.unit, "oz");
  assert.equal(isDayCompleted(mapped, "2026-10-01"), true);
  assert.equal(mapped.history["2026-10-01"].note, "Done");
  assert.equal(isDayCompleted(mapped, "2026-10-03"), false);
});
