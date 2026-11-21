import { Platform } from "react-native";
import { SCOTTY_FONTS } from "@/constants/typography";

export type AppFontId = "scotty" | "system" | "rounded" | "serif" | "mono";
export type TextSizeId = "compact" | "default" | "large";
export type AppThemeId = "campus" | "slate" | "sage" | "ocean" | "midnight";
export type DefaultLandingTab = "scotty" | "tasks" | "habits";

export interface AppFontOption {
  id: AppFontId;
  label: string;
  description: string;
  /** Platform font family used when `id !== "scotty"`. */
  regularFamily?: string;
  boldFamily?: string;
  /** Slight per-font optical scale adjustment. */
  baseScale: number;
}

export const APP_FONTS: readonly AppFontOption[] = [
  {
    id: "scotty",
    label: "ScottyTasks",
    description: "Hand-drawn studio style",
    regularFamily: SCOTTY_FONTS.regular,
    boldFamily: SCOTTY_FONTS.bold,
    baseScale: 1.15,
  },
  {
    id: "system",
    label: "System Sans",
    description: "Clean native UI font",
    regularFamily: Platform.select({ ios: "System", android: "sans-serif", default: "system-ui" }),
    boldFamily: Platform.select({ ios: "System", android: "sans-serif-medium", default: "system-ui" }),
    baseScale: 1.0,
  },
  {
    id: "rounded",
    label: "Rounded",
    description: "Soft friendly geometric",
    regularFamily: Platform.select({
      ios: "ui-rounded",
      android: "sans-serif-medium",
      default: "'SF Pro Rounded', 'Nunito', ui-rounded, system-ui, sans-serif",
    }),
    boldFamily: Platform.select({
      ios: "ui-rounded",
      android: "sans-serif-medium",
      default: "'SF Pro Rounded', 'Nunito', ui-rounded, system-ui, sans-serif",
    }),
    baseScale: 1.0,
  },
  {
    id: "serif",
    label: "Serif",
    description: "Classic editorial notebook",
    regularFamily: Platform.select({ ios: "Georgia", android: "serif", default: "Georgia, serif" }),
    boldFamily: Platform.select({ ios: "Georgia", android: "serif", default: "Georgia, serif" }),
    baseScale: 1.0,
  },
  {
    id: "mono",
    label: "Monospace",
    description: "Crisp code-style alignment",
    regularFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "ui-monospace, monospace" }),
    boldFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "ui-monospace, monospace" }),
    baseScale: 0.94,
  },
] as const;

export const APP_FONTS_BY_ID: Record<AppFontId, AppFontOption> = Object.fromEntries(
  APP_FONTS.map((f) => [f.id, f]),
) as Record<AppFontId, AppFontOption>;

export interface TextSizeOption {
  id: TextSizeId;
  label: string;
  multiplier: number;
}

export const TEXT_SIZE_OPTIONS: readonly TextSizeOption[] = [
  { id: "compact", label: "Compact", multiplier: 0.9 },
  { id: "default", label: "Default", multiplier: 1.0 },
  { id: "large", label: "Large", multiplier: 1.12 },
] as const;

export const TEXT_SIZE_MULTIPLIER: Record<TextSizeId, number> = {
  compact: 0.9,
  default: 1.0,
  large: 1.12,
};

export interface AppThemePalette {
  id: AppThemeId;
  label: string;
  description: string;
  isDark: boolean;
  bg: string;
  card: string;
  subtle: string;
  border: string;
  accent: string;
  accentDark: string;
  accentTint: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnAccent: string;
  swatches: readonly [string, string, string];
}

export const APP_THEMES: readonly AppThemePalette[] = [
  {
    id: "campus",
    label: "Campus Warm",
    description: "Warm paper & CMU crimson",
    isDark: false,
    bg: "#F5F1E8",
    card: "#FFFCF5",
    subtle: "#EFE9DC",
    border: "#D8CEBE",
    accent: "#A6192E",
    accentDark: "#7E1424",
    accentTint: "#F3E3DF",
    textPrimary: "#252522",
    textSecondary: "#575349",
    textMuted: "#6D6559",
    textOnAccent: "#FFFCF5",
    swatches: ["#F5F1E8", "#FFFCF5", "#A6192E"],
  },
  {
    id: "slate",
    label: "Crisp Slate",
    description: "Clean white & scarlet",
    isDark: false,
    bg: "#F3F5F8",
    card: "#FFFFFF",
    subtle: "#E8ECF2",
    border: "#D5DCE6",
    accent: "#B0162E",
    accentDark: "#861022",
    accentTint: "#FCE8EC",
    textPrimary: "#1B1F27",
    textSecondary: "#4B5565",
    textMuted: "#6B7280",
    textOnAccent: "#FFFFFF",
    swatches: ["#F3F5F8", "#FFFFFF", "#B0162E"],
  },
  {
    id: "sage",
    label: "Forest Study",
    description: "Soft sage & pine green",
    isDark: false,
    bg: "#F1F5F1",
    card: "#FBFDFB",
    subtle: "#E4ECE5",
    border: "#CBDAC8",
    accent: "#2E6F4E",
    accentDark: "#215239",
    accentTint: "#E0EFE6",
    textPrimary: "#1E2922",
    textSecondary: "#485C4F",
    textMuted: "#63776A",
    textOnAccent: "#FFFFFF",
    swatches: ["#F1F5F1", "#FBFDFB", "#2E6F4E"],
  },
  {
    id: "ocean",
    label: "Ocean Focus",
    description: "Cool mist & cobalt blue",
    isDark: false,
    bg: "#F0F5FB",
    card: "#FFFFFF",
    subtle: "#E3ECF7",
    border: "#C9D9EC",
    accent: "#2563EB",
    accentDark: "#1D4ED8",
    accentTint: "#E4EEFF",
    textPrimary: "#172133",
    textSecondary: "#465874",
    textMuted: "#647692",
    textOnAccent: "#FFFFFF",
    swatches: ["#F0F5FB", "#FFFFFF", "#2563EB"],
  },
  {
    id: "midnight",
    label: "Midnight Ink",
    description: "Low-glare dark charcoal",
    isDark: true,
    bg: "#14161B",
    card: "#1D2028",
    subtle: "#262A35",
    border: "#323746",
    accent: "#E84A5F",
    accentDark: "#C73549",
    accentTint: "#351F27",
    textPrimary: "#F3F4F6",
    textSecondary: "#C3C8D4",
    textMuted: "#9098A9",
    textOnAccent: "#FFFFFF",
    swatches: ["#14161B", "#1D2028", "#E84A5F"],
  },
] as const;

export const APP_THEMES_BY_ID: Record<AppThemeId, AppThemePalette> = Object.fromEntries(
  APP_THEMES.map((t) => [t.id, t]),
) as Record<AppThemeId, AppThemePalette>;

export interface AppSettings {
  // General
  defaultTab: DefaultLandingTab;
  weekStartsOn: "sunday" | "monday";
  timeFormat: "12h" | "24h";
  hapticsEnabled: boolean;
  confirmBeforeDelete: boolean;
  // Appearance
  fontId: AppFontId;
  textSize: TextSizeId;
  themeId: AppThemeId;
  reduceMotion: boolean;
  // Tasks & Habits
  defaultTasksView: "day" | "agenda";
  defaultTaskPriority: "low" | "medium" | "high";
  showXpPopups: boolean;
  // Scotty AI
  showChatQuickPrompts: boolean;
  // Notifications
  studyReminders: boolean;
  deadlineAlerts: boolean;
  habitNudges: boolean;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  defaultTab: "scotty",
  weekStartsOn: "sunday",
  timeFormat: "12h",
  hapticsEnabled: true,
  confirmBeforeDelete: true,
  fontId: "scotty",
  textSize: "default",
  themeId: "campus",
  reduceMotion: false,
  defaultTasksView: "agenda",
  defaultTaskPriority: "medium",
  showXpPopups: true,
  showChatQuickPrompts: true,
  studyReminders: true,
  deadlineAlerts: true,
  habitNudges: false,
};

export function normalizeAppSettings(raw: unknown): AppSettings {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_APP_SETTINGS };
  const obj = raw as Partial<AppSettings>;
  return {
    // Retired controls must not retain hidden overrides from older installs.
    defaultTab: DEFAULT_APP_SETTINGS.defaultTab,
    weekStartsOn: obj.weekStartsOn === "monday" ? "monday" : "sunday",
    timeFormat: obj.timeFormat === "24h" ? "24h" : "12h",
    hapticsEnabled: typeof obj.hapticsEnabled === "boolean" ? obj.hapticsEnabled : DEFAULT_APP_SETTINGS.hapticsEnabled,
    confirmBeforeDelete:
      typeof obj.confirmBeforeDelete === "boolean"
        ? obj.confirmBeforeDelete
        : DEFAULT_APP_SETTINGS.confirmBeforeDelete,
    fontId: obj.fontId && obj.fontId in APP_FONTS_BY_ID ? obj.fontId : DEFAULT_APP_SETTINGS.fontId,
    textSize: DEFAULT_APP_SETTINGS.textSize,
    themeId: obj.themeId && obj.themeId in APP_THEMES_BY_ID ? obj.themeId : DEFAULT_APP_SETTINGS.themeId,
    reduceMotion: typeof obj.reduceMotion === "boolean" ? obj.reduceMotion : DEFAULT_APP_SETTINGS.reduceMotion,
    defaultTasksView: DEFAULT_APP_SETTINGS.defaultTasksView,
    defaultTaskPriority: DEFAULT_APP_SETTINGS.defaultTaskPriority,
    showXpPopups: DEFAULT_APP_SETTINGS.showXpPopups,
    showChatQuickPrompts:
      typeof obj.showChatQuickPrompts === "boolean"
        ? obj.showChatQuickPrompts
        : DEFAULT_APP_SETTINGS.showChatQuickPrompts,
    studyReminders: typeof obj.studyReminders === "boolean" ? obj.studyReminders : DEFAULT_APP_SETTINGS.studyReminders,
    deadlineAlerts: typeof obj.deadlineAlerts === "boolean" ? obj.deadlineAlerts : DEFAULT_APP_SETTINGS.deadlineAlerts,
    habitNudges: typeof obj.habitNudges === "boolean" ? obj.habitNudges : DEFAULT_APP_SETTINGS.habitNudges,
  };
}
