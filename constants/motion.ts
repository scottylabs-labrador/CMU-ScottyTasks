import { Easing } from "react-native-reanimated";

/**
 * Motion Design System — ScottyTasks
 *
 * Principles:
 * 1. Smooth & unhurried (120–360ms) — clearly perceptible, graceful transitions without lag.
 * 2. Natural deceleration — smooth cubic ease-out & balanced springs for gentle settles.
 * 3. Staggered wave cascades — lists float up item-by-item (`55ms` wave step) rather than
 *    popping onto screen all at once.
 */

export const MOTION_DURATION = {
  /** 120ms — Cushioned thumb press-in acknowledgement */
  pressIn: 120,
  /** 220ms — Smooth exits, toolbar collapses, and micro-fades */
  fast: 220,
  /** 300ms — Standard dialog fades, tab glides, and sub-view switches */
  normal: 300,
  /** 360ms — Bottom sheets and full-screen panels */
  sheet: 360,
  /** 360ms — Individual item float-up duration in a staggered wave */
  waveItem: 360,
} as const;

export const MOTION_STAGGER = {
  /** 55ms — Delay increment between consecutive items in a wave */
  stepMs: 55,
  /** Cap stagger at item index 9 (max 495ms delay) so long lists stay responsive */
  maxIndex: 9,
} as const;

export const MOTION_EASING = {
  outCubic: Easing.out(Easing.cubic),
  inCubic: Easing.in(Easing.cubic),
  inOutCubic: Easing.inOut(Easing.cubic),
} as const;

export const MOTION_SPRING = {
  /** Gentle, cushioned release for buttons, pills, checkboxes, and FABs */
  press: {
    damping: 18,
    stiffness: 250,
    mass: 0.8,
  },
  /** Smooth bloom & settle for center dialogs */
  dialog: {
    damping: 22,
    stiffness: 200,
    mass: 0.92,
  },
  /** Silky arrival for bottom action sheets and full-height drawers */
  sheet: {
    damping: 24,
    stiffness: 185,
    mass: 0.95,
  },
  /** Lively yet graceful pop for checkboxes and focused tab icons */
  pop: {
    damping: 14,
    stiffness: 240,
    mass: 0.78,
  },
} as const;
