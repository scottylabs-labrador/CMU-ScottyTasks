import { UI_COLORS } from "./gamification";
import { localDateKey } from "../utils/taskDates";

export type HabitCategoryId =
  | "study"
  | "fitness"
  | "sleep"
  | "hydration"
  | "mindfulness"
  | "health"
  | "social"
  | "home"
  | "creative"
  | "digital";

export interface HabitCategory {
  id: HabitCategoryId;
  label: string;
  icon: string;
  color: string;
}

export const HABIT_CATEGORIES: HabitCategory[] = [
  {
    id: "study",
    label: "Study",
    icon: "book-outline",
    color: UI_COLORS.xpGreen,
  },
  {
    id: "fitness",
    label: "Fitness",
    icon: "barbell-outline",
    color: UI_COLORS.streakOrange,
  },
  {
    id: "sleep",
    label: "Sleep & Rest",
    icon: "home-outline",
    color: UI_COLORS.cmuGold,
  },
  {
    id: "hydration",
    label: "Hydration",
    icon: "water-outline",
    color: UI_COLORS.cyan,
  },
  {
    id: "mindfulness",
    label: "Mindfulness",
    icon: "leaf-outline",
    color: UI_COLORS.rose,
  },
  {
    id: "health",
    label: "Health",
    icon: "heart-outline",
    color: UI_COLORS.cmuRed,
  },
  {
    id: "digital",
    label: "Digital Detox",
    icon: "moon-outline",
    color: UI_COLORS.questPurple,
  },
  {
    id: "social",
    label: "Social",
    icon: "chatbox-ellipses-outline",
    color: UI_COLORS.xpGreen,
  },
  {
    id: "home",
    label: "Daily Routine",
    icon: "sunny-outline",
    color: UI_COLORS.bronze,
  },
  {
    id: "creative",
    label: "Creative",
    icon: "musical-notes-outline",
    color: UI_COLORS.questPurple,
  },
];

export const HABIT_ICON_OPTIONS: string[] = [
  "book-outline",
  "barbell-outline",
  "walk-outline",
  "bicycle-outline",
  "home-outline",
  "moon-outline",
  "sunny-outline",
  "water-outline",
  "nutrition-outline",
  "cafe-outline",
  "leaf-outline",
  "heart-outline",
  "medkit-outline",
  "chatbox-ellipses-outline",
  "people-outline",
  "musical-notes-outline",
  "brush-outline",
  "code-slash-outline",
  "phone-portrait-outline",
  "sparkles-outline",
];

export const HABIT_COLOR_OPTIONS: string[] = [
  UI_COLORS.xpGreen,
  UI_COLORS.streakOrange,
  UI_COLORS.cmuGold,
  UI_COLORS.cyan,
  UI_COLORS.questPurple,
  UI_COLORS.rose,
  UI_COLORS.cmuRed,
  UI_COLORS.bronze,
];

export type HabitEvaluationType = "boolean" | "numeric";

export type HabitGoalCondition = "at_least" | "less_than" | "exactly";

export type HabitFrequency =
  | { type: "daily" }
  | { type: "days_of_week"; days: number[] } // 0 = Sun ... 6 = Sat
  | { type: "days_per_week"; count: number } // 1..6
  | { type: "interval"; everyDays: number }; // 2..30

export type HabitPriority = "low" | "medium" | "high";

/** Supabase `claim_activity` enforces 0..60 XP for habits. */
export const HABIT_PRIORITY_XP: Record<HabitPriority, number> = {
  low: 25,
  medium: 40,
  high: 60,
};

export interface HabitDayEntry {
  completed: boolean;
  value?: number;
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
 * Generates rich default campus habits anchored relative to `now`
 * so the 7-day history strip, streaks, and completion percentages are immediately meaningful.
 */
export function createInitialHabits(now = new Date()): HabitItem[] {
  return [
    {
      id: "h-1",
      title: "Morning Run",
      description: "Jog around Schenley Park before class",
      categoryId: "fitness",
      icon: "walk-outline",
      color: UI_COLORS.streakOrange,
      evaluationType: "boolean",
      goalCondition: "at_least",
      goal: 1,
      unit: "session",
      step: 1,
      frequency: { type: "daily" },
      startDate: shiftDateKey(now, -14),
      endDate: null,
      reminderTime: "07:30 AM",
      priority: "medium",
      xp: 40,
      archived: false,
      history: {
        [shiftDateKey(now, -6)]: { completed: true },
        [shiftDateKey(now, -5)]: { completed: true },
        [shiftDateKey(now, -4)]: { completed: true },
        [shiftDateKey(now, -3)]: { completed: true },
        [shiftDateKey(now, -2)]: { completed: true },
        [shiftDateKey(now, -1)]: { completed: true },
      },
    },
    {
      id: "h-2",
      title: "Review Lecture Notes",
      description: "Summarize key takeaways from today's lectures",
      categoryId: "study",
      icon: "book-outline",
      color: UI_COLORS.xpGreen,
      evaluationType: "boolean",
      goalCondition: "at_least",
      goal: 1,
      unit: "session",
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
    {
      id: "h-3",
      title: "Drink Water",
      description: "Stay hydrated throughout the day",
      categoryId: "hydration",
      icon: "water-outline",
      color: UI_COLORS.cyan,
      evaluationType: "numeric",
      goalCondition: "at_least",
      goal: 8,
      unit: "glasses",
      step: 1,
      frequency: { type: "daily" },
      startDate: shiftDateKey(now, -7),
      endDate: null,
      reminderTime: "",
      priority: "medium",
      xp: 40,
      archived: false,
      history: {
        [shiftDateKey(now, -6)]: { completed: true, value: 8 },
        [shiftDateKey(now, -5)]: { completed: true, value: 9 },
        [shiftDateKey(now, -4)]: { completed: false, value: 5 },
        [shiftDateKey(now, -3)]: { completed: true, value: 8 },
        [shiftDateKey(now, -2)]: { completed: true, value: 10 },
        [shiftDateKey(now, -1)]: { completed: true, value: 8 },
        [shiftDateKey(now, 0)]: { completed: false, value: 4 },
      },
    },
    {
      id: "h-4",
      title: "Sleep Before Midnight",
      description: "Wind down and get full rest",
      categoryId: "sleep",
      icon: "home-outline",
      color: UI_COLORS.cmuGold,
      evaluationType: "boolean",
      goalCondition: "at_least",
      goal: 1,
      unit: "night",
      step: 1,
      frequency: { type: "daily" },
      startDate: shiftDateKey(now, -8),
      endDate: null,
      reminderTime: "11:30 PM",
      priority: "high",
      xp: 60,
      archived: false,
      history: {
        [shiftDateKey(now, -6)]: { completed: true },
        [shiftDateKey(now, -5)]: { completed: true },
        [shiftDateKey(now, -4)]: { completed: true },
        [shiftDateKey(now, -3)]: { completed: true },
        [shiftDateKey(now, -2)]: { completed: true },
        [shiftDateKey(now, -1)]: { completed: true },
      },
    },
    {
      id: "h-5",
      title: "Mindful Meditation",
      description: "10 minutes of quiet breathing",
      categoryId: "mindfulness",
      icon: "leaf-outline",
      color: UI_COLORS.rose,
      evaluationType: "numeric",
      goalCondition: "at_least",
      goal: 10,
      unit: "mins",
      step: 5,
      frequency: { type: "days_per_week", count: 4 },
      startDate: shiftDateKey(now, 0),
      endDate: null,
      reminderTime: "09:00 AM",
      priority: "low",
      xp: 25,
      archived: false,
      history: {},
    },
  ];
}
