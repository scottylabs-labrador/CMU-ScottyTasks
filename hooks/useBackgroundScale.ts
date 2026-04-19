import { useWindowDimensions } from "react-native";

/**
 * Returns a scale factor based on the current screen width
 * relative to a base design width (e.g. 390px = iPhone 14).
 * Use it to proportionally scale SVGs and UI elements.
 */
export function useBackgroundScale(baseWidth: number = 390): number {
  const { width } = useWindowDimensions();
  return width / baseWidth;
}
