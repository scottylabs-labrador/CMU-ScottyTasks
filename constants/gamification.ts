export interface Quest {
  id: string;
  title: string;
  description: string;
  xp: number;
  coins: number;
  progress: number;
  total: number;
  completed: boolean;
  category: "cmu" | "academic" | "social" | "wellness";
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  xp: number;
  level: number;
  course: string;
  delta: number;
  isMe: boolean;
}

export interface Badge {
  id: string;
  emoji: string;
  label: string;
  description: string;
  earned: boolean;
}

export const INITIAL_QUESTS: Quest[] = [
  {
    id: "1",
    title: "Paint the Fence",
    description: "Be part of CMU tradition! Paint the fence on The Cut.",
    xp: 500,
    coins: 200,
    progress: 0,
    total: 1,
    completed: false,
    category: "cmu",
    rarity: "legendary",
  },
  {
    id: "2",
    title: "Buggy Spectator",
    description: "Watch a Buggy race on Frew Street as a CMU student.",
    xp: 300,
    coins: 100,
    progress: 0,
    total: 1,
    completed: false,
    category: "cmu",
    rarity: "epic",
  },
  {
    id: "3",
    title: "Perfect Week",
    description: "Complete all daily habits for 7 consecutive days.",
    xp: 250,
    coins: 75,
    progress: 4,
    total: 7,
    completed: false,
    category: "wellness",
    rarity: "rare",
  },
  {
    id: "4",
    title: "Study Warrior",
    description: "Complete 10 course assignments this week.",
    xp: 200,
    coins: 60,
    progress: 6,
    total: 10,
    completed: false,
    category: "academic",
    rarity: "rare",
  },
  {
    id: "5",
    title: "Social Butterfly",
    description: "Attend 3 campus events this month.",
    xp: 150,
    coins: 50,
    progress: 1,
    total: 3,
    completed: false,
    category: "social",
    rarity: "common",
  },
  {
    id: "6",
    title: "Tartan Tradition",
    description: "Wear CMU colors on a game day.",
    xp: 100,
    coins: 40,
    progress: 1,
    total: 1,
    completed: true,
    category: "cmu",
    rarity: "common",
  },
];

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "Alex Kim", avatar: "🦊", xp: 12450, level: 24, course: "CS '26", delta: 3, isMe: false },
  { rank: 2, name: "Jordan Lee", avatar: "🐺", xp: 11800, level: 23, course: "ECE '25", delta: 1, isMe: false },
  { rank: 3, name: "Sam Rivera", avatar: "🦁", xp: 10900, level: 22, course: "IS '26", delta: -1, isMe: false },
  { rank: 4, name: "You", avatar: "🐾", xp: 9650, level: 19, course: "CS '27", delta: 2, isMe: true },
  { rank: 5, name: "Casey Park", avatar: "🐻", xp: 9200, level: 18, course: "Math '26", delta: 0, isMe: false },
  { rank: 6, name: "Morgan Chen", avatar: "🐯", xp: 8750, level: 17, course: "CS '26", delta: -3, isMe: false },
  { rank: 7, name: "Riley Wang", avatar: "🦋", xp: 8100, level: 16, course: "BXA '27", delta: 5, isMe: false },
];

export const INITIAL_BADGES: Badge[] = [
  { id: "streak-21", emoji: "🔥", label: "21-Day Streak", description: "Maintained a 21-day streak", earned: true },
  { id: "deans-honors", emoji: "🎓", label: "Dean's Honors", description: "Completed 50 assignments on time", earned: true },
  { id: "first-quest", emoji: "🏁", label: "First Quest", description: "Finished your very first quest", earned: true },
  { id: "painted-fence", emoji: "🎨", label: "Painted Fence", description: "Participated in fence painting", earned: false },
  { id: "top-3", emoji: "🏆", label: "Top 3 Leaderboard", description: "Reached top 3 in your class rank", earned: false },
  { id: "hundred-tasks", emoji: "⭐", label: "100 Tasks", description: "Completed 100 total tasks", earned: false },
];

// Campus notebook: warm paper, charcoal ink, and muted stationery accents.
export const UI_COLORS = {
  bgDeep: "#EAE3D6",
  bgWarm: "#F5F1E8",
  bgCard: "#FFFCF5",
  bgCardActive: "#EEE6D8",
  bgElevated: "#E5DCCD",
  bgSubtle: "#F0EBE0",
  border: "#D8CEBE",
  borderLight: "#B6A996",

  cmuRed: "#A6192E",
  cmuRedDark: "#7E1424",
  cmuRedGlow: "rgba(166, 25, 46, 0.12)",
  cmuGold: "#805B16",

  textPrimary: "#252522",
  textSecondary: "#575349",
  textMuted: "#6D6559",
  textOnAccent: "#FFFCF5",

  priorityHigh: "#A6192E",
  priorityMedium: "#805B16",
  priorityLow: "#436448",

  streakOrange: "#9B4D2D",
  questPurple: "#70546F",
  xpGreen: "#436448",
  cyan: "#356575",
  rose: "#954765",
  silver: "#68645D",
  bronze: "#875433",
  redTint: "#F3E3DF",
  goldTint: "#EEE4CC",
  greenTint: "#E3EBDD",
  blueTint: "#E1EAEB",
  purpleTint: "#EDE4EC",
  overlay: "rgba(37, 37, 34, 0.45)",
  shadow: "#524636",
};

export function calculateLevel(totalXP: number): number {
  return Math.max(1, Math.floor(totalXP / 1000) + 1);
}

export function calculateLevelProgress(totalXP: number): { current: number; max: number; pct: number } {
  const current = totalXP % 1000;
  const max = 1000;
  const pct = Math.min(100, Math.max(0, Math.round((current / max) * 100)));
  return { current, max, pct };
}

export interface HappinessMood {
  state: "ecstatic" | "happy" | "neutral" | "sleepy";
  label: string;
  emoji: string;
  color: string;
  message: string;
  xpMultiplier: number;
}

export function calculateEffectiveHappiness(rawHappiness: number, lastFedAt: number): number {
  if (!lastFedAt || lastFedAt <= 0) return Math.min(100, Math.max(15, rawHappiness));
  const hoursElapsed = Math.max(0, (Date.now() - lastFedAt) / (1000 * 60 * 60));
  // 5% decay per 6 hours (~0.833% per hour), max decay 60%, floor at 15%
  const decay = Math.floor(hoursElapsed * 0.833);
  return Math.min(100, Math.max(15, rawHappiness - decay));
}

export function getHappinessMood(happiness: number): HappinessMood {
  if (happiness >= 85) {
    return {
      state: "ecstatic",
      label: "Ecstatic",
      emoji: "💖",
      color: UI_COLORS.cmuGold,
      message: "Scotty is thrilled! 1.25× XP Streak Buff is active! ⚡",
      xpMultiplier: 1.25,
    };
  }
  if (happiness >= 60) {
    return {
      state: "happy",
      label: "Happy",
      emoji: "🐾",
      color: UI_COLORS.xpGreen,
      message: "Scotty loves seeing you study! Complete tasks to reach 85%+! 🦴",
      xpMultiplier: 1.0,
    };
  }
  if (happiness >= 30) {
    return {
      state: "neutral",
      label: "Peckish",
      emoji: "💭",
      color: UI_COLORS.streakOrange,
      message: "Scotty is feeling a bit hungry. Finish a task to feed him! 🦴",
      xpMultiplier: 1.0,
    };
  }
  return {
    state: "sleepy",
    label: "Sleepy",
    emoji: "💤",
    color: UI_COLORS.cyan,
    message: "Scotty missed you today... Complete a task to wake him up! 🥺",
    xpMultiplier: 1.0,
  };
}
