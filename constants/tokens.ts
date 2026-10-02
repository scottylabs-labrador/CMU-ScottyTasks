import { UI_COLORS } from "./gamification";

/**
 * Design Tokens — ScottyTasks
 *
 * Centralized spacing, border-radius, typography, and shadow scales.
 * Import these instead of using magic numbers in StyleSheet definitions.
 *
 * Colors live in `constants/gamification.ts` as `UI_COLORS`.
 */

/** 4px base-unit spacing scale */
export const spacing = {
  /** 4px */  xs: 4,
  /** 6px */  sm: 6,
  /** 8px */  md: 8,
  /** 12px */ lg: 12,
  /** 16px */ xl: 16,
  /** 20px */ xxl: 20,
  /** 24px */ xxxl: 24,
  /** 32px */ xxxxl: 32,
} as const;

/** Restrained corners for controls, cards, and dialogs. */
export const radii = {
  sm: 4,
  md: 6,
  lg: 6,
  xl: 8,
  xxl: 8,
  xxxl: 8,
  pill: 12,
  round: 9999,
} as const;

/** Font-size scale */
export const fontSize = {
  /** 9px  */ xxs: 9,
  /** 10px */ xs: 10,
  /** 11px */ sm: 11,
  /** 12px */ md: 12,
  /** 13px */ base: 13,
  /** 14px */ lg: 14,
  /** 15px */ xl: 15,
  /** 18px */ xxl: 18,
  /** 20px */ xxxl: 20,
  /** 22px */ title: 22,
  /** 26px */ hero: 26,
} as const;

/** Font-weight scale (React Native string weights) */
export const fontWeight = {
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
  black: "900" as const,
};

/** Common shadow presets */
export const shadows = {
  card: {
    shadowColor: UI_COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  elevated: {
    shadowColor: UI_COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  }),
} as const;

/** Common layout constants */
export const layout = {
  /** Standard horizontal padding for screen content */
  screenPaddingH: spacing.xl,
  /** Bottom padding to clear tab bar */
  tabBarClearance: 100,
  /** Tab bar height on iOS */
  tabBarHeightIOS: 88,
  /** Tab bar height on Android */
  tabBarHeightAndroid: 68,
} as const;
