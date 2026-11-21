import { Platform, type ViewStyle } from "react-native";
import { UI_COLORS } from "./gamification";

/**
 * Design Tokens — ScottyTasks
 *
 * Centralized spacing, border-radius, typography, and shadow scales.
 * Import these instead of using magic numbers in StyleSheet definitions.
 *
 * Colors live in `constants/gamification.ts` as `UI_COLORS`.
 */

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "").trim();
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  return `rgba(82, 70, 54, ${alpha})`;
}

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

/** Common shadow presets (uses CSS `boxShadow` on Web to avoid deprecated `shadow*` warnings) */
export const shadows = {
  subtle: Platform.select<ViewStyle>({
    web: {
      boxShadow: `0px 1px 3px ${hexToRgba(UI_COLORS.shadow, 0.04)}`,
    },
    default: {
      shadowColor: UI_COLORS.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 4,
      elevation: 1,
    },
  }) as ViewStyle,
  card: Platform.select<ViewStyle>({
    web: {
      boxShadow: `0px 2px 6px ${hexToRgba(UI_COLORS.shadow, 0.08)}`,
    },
    default: {
      shadowColor: UI_COLORS.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
  }) as ViewStyle,
  elevated: Platform.select<ViewStyle>({
    web: {
      boxShadow: `0px 6px 14px ${hexToRgba(UI_COLORS.shadow, 0.14)}`,
    },
    default: {
      shadowColor: UI_COLORS.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
      elevation: 6,
    },
  }) as ViewStyle,
  glow: (color: string): ViewStyle =>
    Platform.select<ViewStyle>({
      web: {
        boxShadow: `0px 4px 12px ${hexToRgba(color, 0.25)}`,
      },
      default: {
        shadowColor: color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
        elevation: 8,
      },
    }) as ViewStyle,
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
