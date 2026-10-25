import { UI_COLORS } from "./gamification";
import { localDateKey } from "../utils/taskDates";

export type HabitCategoryId =
  | "water"
  | "sleep"
  | "hobbies"
  | "exercise"
  | "social"
  | "outdoor"
  | "custom";

export type HabitEvaluationType = "boolean" | "numeric";

export type HabitUnitGroup = "amount" | "time" | "frequency";

export const HABIT_UNIT_GROUP_LABELS: Record<HabitUnitGroup, string> = {
  amount: "Amount / Volume",
  time: "Time / Duration",
  frequency: "Frequency / Count",
};

export interface HabitUnitOption {
  unit: string;
  label: string;
  group: HabitUnitGroup;
  defaultGoal: number;
  defaultStep: number;
}

export interface HabitCategory {
  id: HabitCategoryId;
  label: string;
  subtitle: string;
  icon: string;
  color: string;
  defaultEvaluation: HabitEvaluationType;
  allowedUnitGroups: HabitUnitGroup[];
  unitOptions: HabitUnitOption[];
  allowCustomUnit: boolean;
  suggestedTitle: string;
  examplePlaceholder: string;
}

export const HABIT_CATEGORIES: HabitCategory[] = [
  {
    id: "water",
    label: "Water",
    subtitle: "Volume & hydration",
    icon: "water-outline",
    color: UI_COLORS.cyan,
    defaultEvaluation: "numeric",
    allowedUnitGroups: ["amount"],
    unitOptions: [
      { unit: "oz", label: "oz", group: "amount", defaultGoal: 64, defaultStep: 8 },
      { unit: "glasses", label: "glasses", group: "amount", defaultGoal: 8, defaultStep: 1 },
      { unit: "cups", label: "cups", group: "amount", defaultGoal: 8, defaultStep: 1 },
      { unit: "mL", label: "mL", group: "amount", defaultGoal: 2000, defaultStep: 250 },
      { unit: "L", label: "L", group: "amount", defaultGoal: 2, defaultStep: 0.25 },
      { unit: "bottles", label: "bottles", group: "amount", defaultGoal: 4, defaultStep: 1 },
    ],
    allowCustomUnit: false,
    suggestedTitle: "Drink Water",
    examplePlaceholder: "e.g., Drink Water, Morning Hydration",
  },
  {
    id: "sleep",
    label: "Sleep",
    subtitle: "Duration & rest",
    icon: "moon-outline",
    color: UI_COLORS.questPurple,
    defaultEvaluation: "numeric",
    allowedUnitGroups: ["time"],
    unitOptions: [
      { unit: "hours", label: "hours", group: "time", defaultGoal: 8, defaultStep: 0.5 },
      { unit: "mins", label: "mins", group: "time", defaultGoal: 30, defaultStep: 15 },
    ],
    allowCustomUnit: false,
    suggestedTitle: "Sleep",
    examplePlaceholder: "e.g., Sleep 8 Hours, Lights Out by Midnight",
  },
  {
    id: "hobbies",
    label: "Hobbies",
    subtitle: "Creative & leisure",
    icon: "color-palette-outline",
    color: UI_COLORS.rose,
    defaultEvaluation: "numeric",
    allowedUnitGroups: ["time", "frequency"],
    unitOptions: [
      { unit: "mins", label: "mins", group: "time", defaultGoal: 30, defaultStep: 5 },
      { unit: "hours", label: "hours", group: "time", defaultGoal: 1, defaultStep: 0.5 },
      { unit: "sessions", label: "sessions", group: "frequency", defaultGoal: 1, defaultStep: 1 },
      { unit: "times", label: "times", group: "frequency", defaultGoal: 1, defaultStep: 1 },
      { unit: "pages", label: "pages", group: "frequency", defaultGoal: 20, defaultStep: 5 },
    ],
    allowCustomUnit: false,
    suggestedTitle: "",
    examplePlaceholder: "e.g., Practice Guitar, Read for Fun, Sketch",
  },
  {
    id: "exercise",
    label: "Exercise",
    subtitle: "Workouts & movement",
    icon: "barbell-outline",
    color: UI_COLORS.streakOrange,
    defaultEvaluation: "numeric",
    allowedUnitGroups: ["time", "frequency"],
    unitOptions: [
      { unit: "mins", label: "mins", group: "time", defaultGoal: 30, defaultStep: 5 },
      { unit: "hours", label: "hours", group: "time", defaultGoal: 1, defaultStep: 0.5 },
      { unit: "sessions", label: "sessions", group: "frequency", defaultGoal: 1, defaultStep: 1 },
      { unit: "times", label: "times", group: "frequency", defaultGoal: 1, defaultStep: 1 },
      { unit: "sets", label: "sets", group: "frequency", defaultGoal: 3, defaultStep: 1 },
      { unit: "reps", label: "reps", group: "frequency", defaultGoal: 20, defaultStep: 5 },
      { unit: "miles", label: "miles", group: "frequency", defaultGoal: 3, defaultStep: 0.5 },
      { unit: "steps", label: "steps", group: "frequency", defaultGoal: 8000, defaultStep: 1000 },
    ],
    allowCustomUnit: false,
    suggestedTitle: "",
    examplePlaceholder: "e.g., Morning Run, Gym Workout, Push-ups",
  },
  {
    id: "social",
    label: "Social",
    subtitle: "Friends & check-ins",
    icon: "people-outline",
    color: UI_COLORS.cmuGold,
    defaultEvaluation: "boolean",
    allowedUnitGroups: ["frequency", "time"],
    unitOptions: [
      { unit: "times", label: "times", group: "frequency", defaultGoal: 1, defaultStep: 1 },
      { unit: "check-ins", label: "check-ins", group: "frequency", defaultGoal: 1, defaultStep: 1 },
      { unit: "meetups", label: "meetups", group: "frequency", defaultGoal: 1, defaultStep: 1 },
      { unit: "mins", label: "mins", group: "time", defaultGoal: 30, defaultStep: 5 },
      { unit: "hours", label: "hours", group: "time", defaultGoal: 1, defaultStep: 0.5 },
    ],
    allowCustomUnit: false,
    suggestedTitle: "",
    examplePlaceholder: "e.g., Catch Up with a Friend, Call Family",
  },
  {
    id: "outdoor",
    label: "Outdoor",
    subtitle: "Fresh air & walks",
    icon: "leaf-outline",
    color: UI_COLORS.xpGreen,
    defaultEvaluation: "numeric",
    allowedUnitGroups: ["time", "frequency"],
    unitOptions: [
      { unit: "mins", label: "mins", group: "time", defaultGoal: 20, defaultStep: 5 },
      { unit: "hours", label: "hours", group: "time", defaultGoal: 1, defaultStep: 0.5 },
      { unit: "walks", label: "walks", group: "frequency", defaultGoal: 1, defaultStep: 1 },
      { unit: "times", label: "times", group: "frequency", defaultGoal: 1, defaultStep: 1 },
      { unit: "miles", label: "miles", group: "frequency", defaultGoal: 2, defaultStep: 0.5 },
      { unit: "steps", label: "steps", group: "frequency", defaultGoal: 5000, defaultStep: 500 },
    ],
    allowCustomUnit: false,
    suggestedTitle: "",
    examplePlaceholder: "e.g., Walk on The Cut, Fresh Air Break",
  },
  {
    id: "custom",
    label: "Custom",
    subtitle: "Create your own habit & unit",
    icon: "sparkles-outline",
    color: UI_COLORS.cmuRed,
    defaultEvaluation: "boolean",
    allowedUnitGroups: ["time", "frequency", "amount"],
    unitOptions: [
      { unit: "mins", label: "mins", group: "time", defaultGoal: 30, defaultStep: 5 },
      { unit: "hours", label: "hours", group: "time", defaultGoal: 1, defaultStep: 0.5 },
      { unit: "times", label: "times", group: "frequency", defaultGoal: 1, defaultStep: 1 },
      { unit: "sessions", label: "sessions", group: "frequency", defaultGoal: 1, defaultStep: 1 },
      { unit: "pages", label: "pages", group: "frequency", defaultGoal: 20, defaultStep: 5 },
      { unit: "oz", label: "oz", group: "amount", defaultGoal: 16, defaultStep: 4 },
      { unit: "glasses", label: "glasses", group: "amount", defaultGoal: 4, defaultStep: 1 },
    ],
    allowCustomUnit: true,
    suggestedTitle: "",
    examplePlaceholder: "e.g., Review Lecture Notes, Meditate, Journal",
  },
];

const LEGACY_CATEGORY_MAP: Record<string, HabitCategoryId> = {
  hydration: "water",
  fitness: "exercise",
  creative: "hobbies",
  mindfulness: "outdoor",
  study: "custom",
  health: "custom",
  digital: "custom",
  home: "custom",
};

export function normalizeCategoryId(raw: unknown): HabitCategoryId {
  if (typeof raw === "string") {
    if (HABIT_CATEGORIES.some((c) => c.id === raw)) {
      return raw as HabitCategoryId;
    }
    if (raw in LEGACY_CATEGORY_MAP) {
      return LEGACY_CATEGORY_MAP[raw];
    }
  }
  return "custom";
}

export function getHabitCategory(id: HabitCategoryId): HabitCategory {
  return HABIT_CATEGORIES.find((c) => c.id === id) ?? HABIT_CATEGORIES[HABIT_CATEGORIES.length - 1];
}

export function getDefaultUnitOption(categoryId: HabitCategoryId): HabitUnitOption {
  const cat = getHabitCategory(categoryId);
  return cat.unitOptions[0];
}

export function isUnitValidForCategory(categoryId: HabitCategoryId, unit: string): boolean {
  const trimmed = unit.trim();
  if (!trimmed || trimmed.length > 20) return false;
  const cat = getHabitCategory(categoryId);
  if (cat.allowCustomUnit) return true;
  return cat.unitOptions.some((opt) => opt.unit === trimmed);
}

/**
 * Parses a positive or non-negative decimal with at most 2 decimal places (`<= 100000`).
 */
export function parseHabitDecimal(text: string, allowZero = false): number | null {
  const normalized = text.trim().replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const val = Number(normalized);
  if (!Number.isFinite(val) || val > 100000) return null;
  if (!allowZero && val <= 0) return null;
  return val;
}

export const HABIT_ICON_OPTIONS: string[] = [
  "water-outline",
  "moon-outline",
  "color-palette-outline",
  "barbell-outline",
  "people-outline",
  "leaf-outline",
  "sparkles-outline",
  "book-outline",
  "walk-outline",
  "bicycle-outline",
  "sunny-outline",
  "nutrition-outline",
  "cafe-outline",
  "heart-outline",
  "medkit-outline",
  "chatbox-ellipses-outline",
  "musical-notes-outline",
  "brush-outline",
  "code-slash-outline",
  "phone-portrait-outline",
];

export const HABIT_COLOR_OPTIONS: string[] = [
  UI_COLORS.cyan,
  UI_COLORS.questPurple,
  UI_COLORS.rose,
  UI_COLORS.streakOrange,
  UI_COLORS.cmuGold,
  UI_COLORS.xpGreen,
  UI_COLORS.cmuRed,
  UI_COLORS.bronze,
];

export type HabitGoalCondition = "at_least" | "less_than" | "exactly";

export type HabitFrequency =
  | { type: "daily" }
  | { type: "days_of_week"; days: number[] } // 0 = Sun ... 6 = Sat
  | { type: "days_per_week"; count: number } // 1..6
  | { type: "interval"; everyDays: number }; // 2..30

export type HabitPriority = "low" | "medium" | "high";

/** Base habit XP by priority (matches server-side `record_habit_day` tiers). */
export const HABIT_PRIORITY_XP: Record<HabitPriority, number> = {
  low: 25,
  medium: 40,
  high: 60,
};

export interface HabitDayEntry {
  completed: boolean;
  value?: number;
  goal?: number | null;
  note?: string;
}

export interface HabitItem {
  id: string;
  title: string;
  description: string;
  categoryId: HabitCategoryId;
  icon: string;
  color: string;
  evaluationType: HabitEvaluationType;
  goalCondition: HabitGoalCondition;
  goal: number;
  unit: string;
  step: number;
  frequency: HabitFrequency;
  startDate: string; // YYYY-MM-DD
  endDate: string | null; // YYYY-MM-DD or null
  reminderTime: string; // e.g. "08:00 AM" or ""
  priority: HabitPriority;
  xp: number;
  archived: boolean;
  history: Record<string, HabitDayEntry>;
}

export interface HabitSaveData {
  title: string;
  description: string;
  categoryId: HabitCategoryId;
  icon: string;
  color: string;
  evaluationType: HabitEvaluationType;
  goalCondition: HabitGoalCondition;
  goal: number;
  unit: string;
  step: number;
  frequency: HabitFrequency;
  startDate: string;
  endDate: string | null;
  reminderTime: string;
  priority: HabitPriority;
}

function shiftDateKey(base: Date, offsetDays: number): string {
  return localDateKey(
    new Date(base.getFullYear(), base.getMonth(), base.getDate() + offsetDays)
  );
}

/**
 * Sample guest-mode habits demonstrating the 7 categories and domain-matched units.
 * Signed-in accounts load their real habits from Supabase instead.
 */
export function createInitialHabits(now = new Date()): HabitItem[] {
  return [
    {
      id: "guest-h-1",
      title: "Drink Water",
      description: "Stay hydrated throughout classes and study sessions",
      categoryId: "water",
      icon: "water-outline",
      color: UI_COLORS.cyan,
      evaluationType: "numeric",
      goalCondition: "at_least",
      goal: 64,
      unit: "oz",
      step: 8,
      frequency: { type: "daily" },
      startDate: shiftDateKey(now, -7),
      endDate: null,
      reminderTime: "",
      priority: "medium",
      xp: 40,
      archived: false,
      history: {
        [shiftDateKey(now, -6)]: { completed: true, value: 64, goal: 64 },
        [shiftDateKey(now, -5)]: { completed: true, value: 72, goal: 64 },
        [shiftDateKey(now, -4)]: { completed: false, value: 40, goal: 64 },
        [shiftDateKey(now, -3)]: { completed: true, value: 64, goal: 64 },
        [shiftDateKey(now, -2)]: { completed: true, value: 80, goal: 64 },
        [shiftDateKey(now, -1)]: { completed: true, value: 64, goal: 64 },
        [shiftDateKey(now, 0)]: { completed: false, value: 32, goal: 64 },
      },
    },
    {
      id: "guest-h-2",
      title: "Sleep",
      description: "Get a full night of rest before morning lectures",
      categoryId: "sleep",
      icon: "moon-outline",
      color: UI_COLORS.questPurple,
      evaluationType: "numeric",
      goalCondition: "at_least",
      goal: 8,
      unit: "hours",
      step: 0.5,
      frequency: { type: "daily" },
      startDate: shiftDateKey(now, -8),
      endDate: null,
      reminderTime: "11:30 PM",
      priority: "high",
      xp: 60,
      archived: false,
      history: {
        [shiftDateKey(now, -6)]: { completed: true, value: 8, goal: 8 },
        [shiftDateKey(now, -5)]: { completed: true, value: 8.5, goal: 8 },
        [shiftDateKey(now, -4)]: { completed: true, value: 8, goal: 8 },
        [shiftDateKey(now, -3)]: { completed: false, value: 6.5, goal: 8 },
        [shiftDateKey(now, -2)]: { completed: true, value: 8, goal: 8 },
        [shiftDateKey(now, -1)]: { completed: true, value: 8, goal: 8 },
      },
    },
    {
      id: "guest-h-3",
      title: "Morning Run",
      description: "Jog around Schenley Park before class",
      categoryId: "exercise",
      icon: "barbell-outline",
      color: UI_COLORS.streakOrange,
      evaluationType: "numeric",
      goalCondition: "at_least",
      goal: 30,
      unit: "mins",
      step: 5,
      frequency: { type: "daily" },
      startDate: shiftDateKey(now, -10),
      endDate: null,
      reminderTime: "07:30 AM",
      priority: "medium",
      xp: 40,
      archived: false,
      history: {
        [shiftDateKey(now, -6)]: { completed: true, value: 30, goal: 30 },
        [shiftDateKey(now, -5)]: { completed: true, value: 35, goal: 30 },
        [shiftDateKey(now, -4)]: { completed: true, value: 30, goal: 30 },
        [shiftDateKey(now, -3)]: { completed: true, value: 30, goal: 30 },
        [shiftDateKey(now, -2)]: { completed: true, value: 40, goal: 30 },
        [shiftDateKey(now, -1)]: { completed: true, value: 30, goal: 30 },
      },
    },
    {
      id: "guest-h-4",
      title: "Review Lecture Notes",
      description: "Summarize key takeaways from today's lectures",
      categoryId: "custom",
      icon: "book-outline",
      color: UI_COLORS.xpGreen,
      evaluationType: "boolean",
      goalCondition: "at_least",
      goal: 1,
      unit: "",
      step: 1,
      frequency: { type: "days_of_week", days: [1, 2, 3, 4, 5] },
      startDate: shiftDateKey(now, -10),
      endDate: null,
      reminderTime: "08:00 PM",
      priority: "high",
      xp: 60,
      archived: false,
      history: {
        [shiftDateKey(now, -5)]: { completed: true },
        [shiftDateKey(now, -4)]: { completed: true },
        [shiftDateKey(now, -3)]: { completed: true },
        [shiftDateKey(now, -1)]: { completed: true },
      },
    },
  ];
}
