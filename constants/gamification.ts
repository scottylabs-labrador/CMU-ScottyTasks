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

export const UI_COLORS = {
  bgDeep: "#0D0C15",
  bgWarm: "#13111F",
  bgCard: "#1C1C2E",
  bgCardActive: "#24223A",
  bgElevated: "#2A2A40",
  bgSubtle: "#161524",
  border: "#2A2A40",
  borderLight: "#3A3A56",
  
  cmuRed: "#C41230",
  cmuRedDark: "#8B0A20",
  cmuRedGlow: "rgba(196, 18, 48, 0.25)",
  cmuGold: "#FFB800",
  
  textPrimary: "#FFFFFF",
  textSecondary: "#A4A4C2",
  textMuted: "#6E6E8F",
  
  priorityHigh: "#C41230",
  priorityMedium: "#FFB800",
  priorityLow: "#4ADE80",
  
  streakOrange: "#FB923C",
  questPurple: "#7950F2",
  xpGreen: "#4ADE80",
  cyan: "#38BDF8",
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
