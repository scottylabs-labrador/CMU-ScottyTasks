import {
  calculateLevelProgress,
  categorizeTaskDueDate,
  computeEffectiveHappiness,
  computeHabitStats,
  getMoodLabel,
  isTaskDueWithinDays,
  localDateKey,
  parseTaskDate,
  type HabitGoalCondition,
  type HabitPriority,
  type RawHabitEntryRow,
  type RawHabitRow,
  type RawTaskRow,
} from "./dateUtils.ts";

export interface ProfileRow {
  name: string;
  coins: number;
  xp: number;
  streak: number;
  tasksCompleted: number;
  happiness: number;
  lastFedAt: number;
  ownedItems: Record<string, boolean>;
  equippedBackgroundId: string;
  equippedDogHouseId: string;
  equippedToyId: string;
}

export interface ShopItemRow {
  id: string;
  category: string;
  price: number;
}

export interface ActivityClaimRow {
  kind: "habit" | "quest";
  activity_id: string;
  period: string;
}

export type HabitCategoryId =
  | "water"
  | "sleep"
  | "hobbies"
  | "exercise"
  | "social"
  | "outdoor"
  | "custom";

export interface HabitCreatePayload {
  title: string;
  description: string;
  categoryId: HabitCategoryId;
  icon: string;
  color: string;
  evaluationType: "boolean" | "numeric";
  goalCondition: HabitGoalCondition;
  goal: number;
  unit: string;
  step: number;
  frequency: { type: "daily" };
  startDate: string;
  endDate: string | null;
  reminderTime: string;
  priority: HabitPriority;
}

export type PendingChatAction =
  | {
      type: "create_task";
      summaryLabel: string;
      payload: {
        text: string;
        course: string;
        priority: "high" | "medium" | "low";
        tag: string;
        dueDate: string;
        dueTime: string;
        xp: number;
      };
    }
  | {
      type: "create_habit";
      summaryLabel: string;
      payload: HabitCreatePayload;
    }
  | {
      type: "complete_task";
      summaryLabel: string;
      payload: {
        taskId: string;
        taskText: string;
        xp: number;
      };
    }
  | {
      type: "complete_habit";
      summaryLabel: string;
      payload: {
        habitId: string;
        habitTitle: string;
        xp: number;
      };
    }
  | {
      type: "pet_scotty";
      summaryLabel: string;
      payload: Record<string, never>;
    };

export interface UserSnapshot {
  localDate: string;
  profile: {
    name: string;
    coins: number;
    xp: number;
    level: number;
    xpIntoLevel: number;
    xpToNextLevel: number;
    streak: number;
    tasksCompleted: number;
    effectiveHappiness: number;
    moodState: string;
    xpMultiplier: number;
    equipped: {
      background: string;
      dogHouse: string;
      toy: string;
    };
  };
  taskSummary: {
    pendingCount: number;
    overdueCount: number;
    dueTodayCount: number;
    dueNext7DaysCount: number;
    completedCount: number;
    pendingXpTotal: number;
    xpDueToday: number;
  };
  pendingTasksPreview: Array<{
    id: string;
    text: string;
    course: string;
    priority: "high" | "medium" | "low";
    tag: string;
    dueDate: string;
    dueTime: string;
    xp: number;
    dueCategory: string;
  }>;
  recentCompletedTasks: Array<{
    id: string;
    text: string;
    course: string;
    dueDate: string;
  }>;
  habits: Array<{
    id: string;
    title: string;
    category: string;
    tracking: "boolean" | "numeric";
    goal: number | null;
    goalCondition: HabitGoalCondition;
    unit: string;
    xp: number;
    todayValue: number | null;
    completedToday: boolean;
    streak: number;
    completionsLast7Days: number;
  }>;
  quests: Array<{
    id: string;
    title: string;
    description: string;
    xp: number;
    coins: number;
    category: string;
    rarity: string;
    claimed: boolean;
  }>;
}

const SHOP_ITEM_LABELS: Record<string, string> = {
  "blue-house": "Blue House",
  "green-house": "Green House",
  "brown-house": "Brown House",
  "yellow-house": "Yellow House",
  "white-house": "White House",
  "red-house": "Red House",
  "toy-tennis": "Tennis Ball",
  "toy-bone": "Bone",
  "toy-rope": "Rope",
  "toy-frisbee": "Frisbee",
  "toy-squeaky": "Squeaky Toy",
  "toy-plush": "Plush Bear",
  "background-default": "Classic Lawn",
  "background-sunset": "Sunset",
  "background-night": "Night",
  "background-park": "Park",
  "background-dorm": "Dorm",
  "background-festival": "Festival",
};

const QUESTS_CATALOG = [
  {
    id: "1",
    title: "Paint the Fence",
    description: "Be part of CMU tradition! Paint the fence on The Cut.",
    xp: 500,
    coins: 200,
    category: "cmu",
    rarity: "legendary",
  },
  {
    id: "2",
    title: "Buggy Spectator",
    description: "Watch a Buggy race on Frew Street as a CMU student.",
    xp: 300,
    coins: 100,
    category: "cmu",
    rarity: "epic",
  },
  {
    id: "3",
    title: "Perfect Week",
    description: "Complete all daily habits for 7 consecutive days.",
    xp: 250,
    coins: 75,
    category: "wellness",
    rarity: "rare",
  },
  {
    id: "4",
    title: "Study Warrior",
    description: "Complete 10 course assignments this week.",
    xp: 200,
    coins: 60,
    category: "academic",
    rarity: "rare",
  },
  {
    id: "5",
    title: "Social Butterfly",
    description: "Attend 3 campus events this month.",
    xp: 150,
    coins: 50,
    category: "social",
    rarity: "common",
  },
  {
    id: "6",
    title: "Tartan Tradition",
    description: "Wear CMU colors on a game day.",
    xp: 100,
    coins: 40,
    category: "cmu",
    rarity: "common",
  },
];

const VALID_TAGS = new Set(["CS", "Math", "ML", "Writing", "Stats", "General"]);

interface CategorySpec {
  icon: string;
  color: string;
  defaultEvaluation: "boolean" | "numeric";
  defaultGoal: number;
  defaultUnit: string;
  defaultStep: number;
  allowedUnits: ReadonlySet<string> | null;
}

const CATEGORY_SPECS: Record<HabitCategoryId, CategorySpec> = {
  water: {
    icon: "water-outline",
    color: "#356575",
    defaultEvaluation: "numeric",
    defaultGoal: 8,
    defaultUnit: "glasses",
    defaultStep: 1,
    allowedUnits: new Set(["oz", "glasses", "cups", "mL", "L", "bottles"]),
  },
  sleep: {
    icon: "moon-outline",
    color: "#70546F",
    defaultEvaluation: "numeric",
    defaultGoal: 8,
    defaultUnit: "hours",
    defaultStep: 0.5,
    allowedUnits: new Set(["hours", "mins"]),
  },
  hobbies: {
    icon: "color-palette-outline",
    color: "#954765",
    defaultEvaluation: "numeric",
    defaultGoal: 30,
    defaultUnit: "mins",
    defaultStep: 5,
    allowedUnits: new Set(["mins", "hours", "sessions", "times", "pages"]),
  },
  exercise: {
    icon: "barbell-outline",
    color: "#9B4D2D",
    defaultEvaluation: "numeric",
    defaultGoal: 30,
    defaultUnit: "mins",
    defaultStep: 5,
    allowedUnits: new Set(["mins", "hours", "sessions", "times", "sets", "reps", "miles", "steps"]),
  },
  social: {
    icon: "people-outline",
    color: "#805B16",
    defaultEvaluation: "boolean",
    defaultGoal: 1,
    defaultUnit: "times",
    defaultStep: 1,
    allowedUnits: new Set(["times", "check-ins", "meetups", "mins", "hours"]),
  },
  outdoor: {
    icon: "leaf-outline",
    color: "#436448",
    defaultEvaluation: "numeric",
    defaultGoal: 20,
    defaultUnit: "mins",
    defaultStep: 5,
    allowedUnits: new Set(["mins", "hours", "walks", "times", "miles", "steps"]),
  },
  custom: {
    icon: "sparkles-outline",
    color: "#A6192E",
    defaultEvaluation: "boolean",
    defaultGoal: 1,
    defaultUnit: "times",
    defaultStep: 1,
    allowedUnits: null,
  },
};

const VALID_HABIT_COLORS = new Set([
  "#356575",
  "#70546F",
  "#954765",
  "#9B4D2D",
  "#805B16",
  "#436448",
  "#A6192E",
  "#725C46",
]);

const VALID_HABIT_ICONS = new Set([
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
]);

const PRIORITY_ORDER: Record<"high" | "medium" | "low", number> = { high: 0, medium: 1, low: 2 };
const DUE_ORDER: Record<string, number> = { overdue: 0, today: 1, upcoming: 2, unscheduled: 3 };

function inferHabitCategory(rawCat: unknown, rawUnit: string, rawTitle: string): HabitCategoryId {
  if (typeof rawCat === "string" && rawCat in CATEGORY_SPECS) {
    return rawCat as HabitCategoryId;
  }
  const combined = `${rawUnit} ${rawTitle}`.toLowerCase();
  if (/\b(water|hydrat|drink|oz|glasses|cups|ml|bottles)\b/.test(combined)) return "water";
  if (/\b(sleep|bed|nap|rest)\b/.test(combined)) return "sleep";
  if (/\b(run|gym|workout|exercise|push-?up|steps|miles|lift|stretch|yoga)\b/.test(combined)) {
    return "exercise";
  }
  if (/\b(walk|outdoor|outside|sun|park|cut|fresh air)\b/.test(combined)) return "outdoor";
  if (/\b(friend|family|call|social|meetup|check-?in)\b/.test(combined)) return "social";
  if (/\b(guitar|draw|paint|sketch|music|hobby|hobbies)\b/.test(combined)) return "hobbies";
  return "custom";
}

export function buildUserSnapshot(params: {
  profile: ProfileRow;
  tasks: RawTaskRow[];
  habits: RawHabitRow[];
  habitEntries: RawHabitEntryRow[];
  claims: ActivityClaimRow[];
  localToday: Date;
}): UserSnapshot {
  const { profile, tasks, habits, habitEntries, claims, localToday } = params;

  const effectiveHappiness = computeEffectiveHappiness(profile.happiness, profile.lastFedAt);
  const moodState = getMoodLabel(effectiveHappiness);
  const levelInfo = calculateLevelProgress(profile.xp);

  const pending = tasks.filter((t) => !t.done);
  const completed = tasks.filter((t) => t.done);

  let overdueCount = 0;
  let dueTodayCount = 0;
  let dueNext7DaysCount = 0;
  let pendingXpTotal = 0;
  let xpDueToday = 0;

  const decoratedPending = pending.map((t) => {
    const dueCategory = categorizeTaskDueDate(t.dueDate, localToday);
    if (dueCategory === "overdue") overdueCount += 1;
    if (dueCategory === "today") {
      dueTodayCount += 1;
      xpDueToday += t.xp;
    }
    if (isTaskDueWithinDays(t.dueDate, 7, localToday)) {
      dueNext7DaysCount += 1;
    }
    pendingXpTotal += t.xp;
    return {
      id: t.id,
      text: t.text,
      course: t.course,
      priority: t.priority,
      tag: t.tag,
      dueDate: t.dueDate,
      dueTime: t.dueTime,
      xp: t.xp,
      dueCategory,
    };
  });

  decoratedPending.sort((a, b) => {
    const dueDiff = (DUE_ORDER[a.dueCategory] ?? 3) - (DUE_ORDER[b.dueCategory] ?? 3);
    if (dueDiff !== 0) return dueDiff;
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  });

  const habitStats = computeHabitStats(habits, habitEntries, localToday);
  const claimedQuestIds = new Set(
    claims.filter((c) => c.kind === "quest").map((c) => c.activity_id),
  );

  return {
    localDate: localDateKey(localToday),
    profile: {
      name: profile.name || "Tartan",
      coins: profile.coins,
      xp: profile.xp,
      level: levelInfo.level,
      xpIntoLevel: levelInfo.xpIntoLevel,
      xpToNextLevel: levelInfo.xpToNextLevel,
      streak: profile.streak,
      tasksCompleted: profile.tasksCompleted,
      effectiveHappiness,
      moodState,
      xpMultiplier: effectiveHappiness >= 85 ? 1.25 : 1.0,
      equipped: {
        background: SHOP_ITEM_LABELS[profile.equippedBackgroundId] ?? profile.equippedBackgroundId,
        dogHouse: SHOP_ITEM_LABELS[profile.equippedDogHouseId] ?? profile.equippedDogHouseId,
        toy: SHOP_ITEM_LABELS[profile.equippedToyId] ?? profile.equippedToyId,
      },
    },
    taskSummary: {
      pendingCount: pending.length,
      overdueCount,
      dueTodayCount,
      dueNext7DaysCount,
      completedCount: completed.length,
      pendingXpTotal,
      xpDueToday,
    },
    pendingTasksPreview: decoratedPending.slice(0, 12),
    recentCompletedTasks: completed.slice(-5).map((t) => ({
      id: t.id,
      text: t.text,
      course: t.course,
      dueDate: t.dueDate,
    })),
    habits: habitStats,
    quests: QUESTS_CATALOG.map((q) => ({
      ...q,
      claimed: claimedQuestIds.has(q.id),
    })),
  };
}

export const GEMINI_FUNCTION_DECLARATIONS = [
  {
    name: "search_tasks",
    description:
      "Search and filter the signed-in student's tasks by completion state, due timeframe, keyword, priority, or course tag.",
    parameters: {
      type: "OBJECT",
      properties: {
        status: {
          type: "STRING",
          enum: ["pending", "completed", "all"],
          description: "Filter by completion status (defaults to pending).",
        },
        timeframe: {
          type: "STRING",
          enum: ["all", "overdue", "today", "upcoming", "this_week"],
          description: "Filter by local calendar due date window (defaults to all).",
        },
        query: {
          type: "STRING",
          description: "Case-insensitive keyword to match in task title, course, or tag.",
        },
        priority: {
          type: "STRING",
          enum: ["all", "high", "medium", "low"],
          description: "Optional priority filter.",
        },
      },
    },
  },
  {
    name: "query_shop_inventory",
    description:
      "Inspect the Scotty shop items, prices, owned status, and which items the user can currently afford with their coins.",
    parameters: {
      type: "OBJECT",
      properties: {
        category: {
          type: "STRING",
          enum: ["all", "backgrounds", "dogHouses", "toys"],
        },
        affordableOnly: {
          type: "BOOLEAN",
          description: "If true, only include unowned items the user has enough coins to buy.",
        },
      },
    },
  },
  {
    name: "propose_action",
    description:
      "Propose a 1-tap confirmation action card for the user to approve. Never executes changes automatically. Use create_habit for recurring daily habits (Habits tab) and create_task for one-off assignments or due-dated to-dos (Tasks tab). Use complete_task, complete_habit, or pet_scotty for those actions.",
    parameters: {
      type: "OBJECT",
      properties: {
        actionType: {
          type: "STRING",
          enum: ["create_task", "create_habit", "complete_task", "complete_habit", "pet_scotty"],
        },
        text: {
          type: "STRING",
          description: "Required for create_task: concise task title.",
        },
        course: {
          type: "STRING",
          description: "Optional course code for create_task (e.g., 15-112).",
        },
        priority: {
          type: "STRING",
          enum: ["high", "medium", "low"],
          description: "Priority for create_task or create_habit (defaults to medium).",
        },
        tag: {
          type: "STRING",
          enum: ["CS", "Math", "ML", "Writing", "Stats", "General"],
          description: "Category tag for create_task (defaults to General).",
        },
        dueDate: {
          type: "STRING",
          description: "Due date for create_task as YYYY-MM-DD, 'today', or 'tomorrow'.",
        },
        dueTime: {
          type: "STRING",
          description: "Optional due time for create_task like '11:59 PM' or '5:00 PM'.",
        },
        title: {
          type: "STRING",
          description: "Required for create_habit: concise recurring habit name (1-80 chars, e.g., 'Drink Water', 'Meditate').",
        },
        description: {
          type: "STRING",
          description: "Optional short note/description for create_habit.",
        },
        categoryId: {
          type: "STRING",
          enum: ["water", "sleep", "hobbies", "exercise", "social", "outdoor", "custom"],
          description: "Category for create_habit (e.g., 'water' for hydration, 'sleep', 'exercise', 'custom').",
        },
        evaluationType: {
          type: "STRING",
          enum: ["boolean", "numeric"],
          description: "Habit tracking style: 'boolean' for simple daily check-in, 'numeric' for tracked quantity/time like 8 glasses or 30 mins.",
        },
        goal: {
          type: "NUMBER",
          description: "Optional numeric daily target > 0 for create_habit (up to 100000, e.g., 8 for glasses or 64 for oz).",
        },
        unit: {
          type: "STRING",
          description: "Optional unit for numeric create_habit (e.g., 'glasses', 'oz', 'hours', 'mins', 'pages', 'times').",
        },
        step: {
          type: "NUMBER",
          description: "Optional increment step > 0 for numeric create_habit (defaults to 1).",
        },
        goalCondition: {
          type: "STRING",
          enum: ["at_least", "less_than", "exactly"],
          description: "Optional target comparison for numeric create_habit (defaults to at_least).",
        },
        color: {
          type: "STRING",
          enum: ["#356575", "#70546F", "#954765", "#9B4D2D", "#805B16", "#436448", "#A6192E", "#725C46"],
          description: "Optional accent hex color for create_habit.",
        },
        icon: {
          type: "STRING",
          description: "Optional Ionicons outline icon name for create_habit (e.g., 'water-outline', 'moon-outline', 'barbell-outline').",
        },
        taskId: {
          type: "STRING",
          description: "Required for complete_task: exact UUID of a pending task from the user's tasks.",
        },
        habitId: {
          type: "STRING",
          description: "Required for complete_habit: exact UUID of an uncompleted active habit from the user's habits.",
        },
      },
      required: ["actionType"],
    },
  },
];

export interface ToolExecutionContext {
  tasks: RawTaskRow[];
  snapshot: UserSnapshot;
  profile: ProfileRow;
  shopItems: ShopItemRow[];
  localToday: Date;
  onProposeAction: (action: PendingChatAction) => void;
  onSearchMatchedCount: (count: number) => void;
}

export function executeToolCall(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolExecutionContext,
): Record<string, unknown> {
  if (name === "search_tasks") {
    const status = typeof args.status === "string" ? args.status : "pending";
    const timeframe = typeof args.timeframe === "string" ? args.timeframe : "all";
    const priority = typeof args.priority === "string" ? args.priority : "all";
    const query = typeof args.query === "string" ? args.query.trim().toLowerCase() : "";

    const matched = ctx.tasks.filter((task) => {
      if (status === "pending" && task.done) return false;
      if (status === "completed" && !task.done) return false;
      if (priority !== "all" && task.priority !== priority) return false;
      if (
        query &&
        !task.text.toLowerCase().includes(query) &&
        !task.tag.toLowerCase().includes(query) &&
        !task.course.toLowerCase().includes(query)
      ) {
        return false;
      }

      const cat = categorizeTaskDueDate(task.dueDate, ctx.localToday);
      if (timeframe === "overdue" && cat !== "overdue") return false;
      if (timeframe === "today" && cat !== "today") return false;
      if (timeframe === "upcoming" && cat !== "upcoming") return false;
      if (timeframe === "this_week" && !isTaskDueWithinDays(task.dueDate, 7, ctx.localToday)) {
        return false;
      }
      return true;
    });

    ctx.onSearchMatchedCount(matched.length);
    return {
      totalMatched: matched.length,
      tasks: matched.slice(0, 20).map((t) => ({
        id: t.id,
        text: t.text,
        course: t.course,
        priority: t.priority,
        tag: t.tag,
        dueDate: t.dueDate,
        dueTime: t.dueTime,
        xp: t.xp,
        done: t.done,
        dueCategory: categorizeTaskDueDate(t.dueDate, ctx.localToday),
      })),
    };
  }

  if (name === "query_shop_inventory") {
    const category = typeof args.category === "string" ? args.category : "all";
    const affordableOnly = Boolean(args.affordableOnly);
    const owned = ctx.profile.ownedItems ?? {};

    const items = ctx.shopItems
      .filter((item) => category === "all" || item.category === category)
      .map((item) => {
        const isOwned = Boolean(owned[item.id]);
        const canAfford = !isOwned && ctx.profile.coins >= item.price;
        return {
          id: item.id,
          label: SHOP_ITEM_LABELS[item.id] ?? item.id,
          category: item.category,
          price: item.price,
          owned: isOwned,
          canAfford,
        };
      })
      .filter((item) => !affordableOnly || item.canAfford);

    return {
      coins: ctx.profile.coins,
      items,
    };
  }

  if (name === "propose_action") {
    const actionType = typeof args.actionType === "string" ? args.actionType : "";

    if (actionType === "create_task") {
      const rawText = typeof args.text === "string" ? args.text.trim() : "";
      if (!rawText) {
        return { ok: false, error: "Task title 'text' is required for create_task." };
      }
      const priority =
        args.priority === "high" || args.priority === "medium" || args.priority === "low"
          ? args.priority
          : "medium";
      const xp = priority === "high" ? 120 : priority === "medium" ? 80 : 40;
      const rawTag = typeof args.tag === "string" ? args.tag.trim() : "General";
      const tag = VALID_TAGS.has(rawTag) ? rawTag : "General";
      const course = typeof args.course === "string" ? args.course.trim().slice(0, 40) : "";
      const rawDate = typeof args.dueDate === "string" ? args.dueDate.trim() : "today";
      const parsedDate = parseTaskDate(rawDate, ctx.localToday) ?? ctx.localToday;
      const dueDate = localDateKey(parsedDate);
      const dueTime = typeof args.dueTime === "string" ? args.dueTime.trim().slice(0, 20) : "11:59 PM";
      const text = rawText.slice(0, 200);

      const action: PendingChatAction = {
        type: "create_task",
        summaryLabel: `Add task: ${text} (${dueDate})`,
        payload: { text, course, priority, tag, dueDate, dueTime, xp },
      };
      ctx.onProposeAction(action);
      return { ok: true, proposed: action };
    }

    if (actionType === "create_habit") {
      const rawTitle =
        typeof args.title === "string" && args.title.trim()
          ? args.title.trim()
          : typeof args.text === "string"
            ? args.text.trim()
            : "";
      if (!rawTitle) {
        return { ok: false, error: "Habit name 'title' is required for create_habit." };
      }

      const title = rawTitle.slice(0, 80);
      const description =
        typeof args.description === "string" ? args.description.trim().slice(0, 400) : "";
      const rawUnitArg = typeof args.unit === "string" ? args.unit.trim().slice(0, 20) : "";
      let categoryId = inferHabitCategory(args.categoryId, rawUnitArg, title);
      const initialSpec = CATEGORY_SPECS[categoryId];

      const numericGoalArg = typeof args.goal === "number" ? args.goal : Number(args.goal);
      const hasNumericGoal = Number.isFinite(numericGoalArg) && numericGoalArg > 0;

      const evaluationType: "boolean" | "numeric" =
        args.evaluationType === "numeric"
          ? "numeric"
          : args.evaluationType === "boolean" && !hasNumericGoal && !rawUnitArg
            ? "boolean"
            : hasNumericGoal || rawUnitArg
              ? "numeric"
              : initialSpec.defaultEvaluation;

      let goal = 1;
      let unit = "";
      let step = 1;

      if (evaluationType === "numeric") {
        if (rawUnitArg) {
          if (initialSpec.allowedUnits && !initialSpec.allowedUnits.has(rawUnitArg)) {
            categoryId = "custom";
          }
          unit = rawUnitArg;
        } else {
          unit = initialSpec.defaultUnit;
        }

        const specAfterUnit = CATEGORY_SPECS[categoryId];
        goal = hasNumericGoal
          ? Math.min(100000, Math.round(numericGoalArg * 100) / 100)
          : specAfterUnit.defaultGoal;

        const numericStepArg = typeof args.step === "number" ? args.step : Number(args.step);
        step =
          Number.isFinite(numericStepArg) && numericStepArg > 0 && numericStepArg <= 100000
            ? Math.round(numericStepArg * 100) / 100
            : specAfterUnit.defaultStep;
      }

      const finalSpec = CATEGORY_SPECS[categoryId];
      const rawColor = typeof args.color === "string" ? args.color.trim() : "";
      const color = VALID_HABIT_COLORS.has(rawColor) ? rawColor : finalSpec.color;
      const rawIcon = typeof args.icon === "string" ? args.icon.trim() : "";
      const icon = VALID_HABIT_ICONS.has(rawIcon) ? rawIcon : finalSpec.icon;

      const goalCondition: HabitGoalCondition =
        args.goalCondition === "less_than" || args.goalCondition === "exactly"
          ? args.goalCondition
          : "at_least";

      const priority: HabitPriority =
        args.priority === "low" || args.priority === "high" ? args.priority : "medium";

      const summaryLabel =
        evaluationType === "numeric"
          ? `Add habit: ${title} (${goal} ${unit}/day)`
          : `Add habit: ${title}`;

      const action: PendingChatAction = {
        type: "create_habit",
        summaryLabel,
        payload: {
          title,
          description,
          categoryId,
          icon,
          color,
          evaluationType,
          goalCondition,
          goal,
          unit,
          step,
          frequency: { type: "daily" },
          startDate: ctx.snapshot.localDate,
          endDate: null,
          reminderTime: "",
          priority,
        },
      };
      ctx.onProposeAction(action);
      return { ok: true, proposed: action };
    }

    if (actionType === "complete_task") {
      const taskId = typeof args.taskId === "string" ? args.taskId.trim() : "";
      const target = ctx.tasks.find((t) => t.id === taskId && !t.done);
      if (!target) {
        return { ok: false, error: "No pending task found with that exact taskId." };
      }
      const action: PendingChatAction = {
        type: "complete_task",
        summaryLabel: `Complete task: ${target.text}`,
        payload: { taskId: target.id, taskText: target.text, xp: target.xp },
      };
      ctx.onProposeAction(action);
      return { ok: true, proposed: action };
    }

    if (actionType === "complete_habit") {
      const habitId = typeof args.habitId === "string" ? args.habitId.trim() : "";
      const target = ctx.snapshot.habits.find((h) => h.id === habitId && !h.completedToday);
      if (!target) {
        return { ok: false, error: "No uncompleted habit for today found with that exact habitId." };
      }
      const action: PendingChatAction = {
        type: "complete_habit",
        summaryLabel: `Complete habit today: ${target.title}`,
        payload: { habitId: target.id, habitTitle: target.title, xp: target.xp },
      };
      ctx.onProposeAction(action);
      return { ok: true, proposed: action };
    }

    if (actionType === "pet_scotty") {
      const action: PendingChatAction = {
        type: "pet_scotty",
        summaryLabel: "Pet Scotty (+2% happiness)",
        payload: {},
      };
      ctx.onProposeAction(action);
      return { ok: true, proposed: action };
    }

    return { ok: false, error: `Unknown actionType '${actionType}'.` };
  }

  return { ok: false, error: `Unknown tool '${name}'.` };
}
