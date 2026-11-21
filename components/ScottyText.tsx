import React, { createContext, forwardRef, useContext } from "react";
import {
  Platform,
  StyleSheet,
  Text as NativeText,
  type TextProps,
  type TextStyle,
} from "react-native";
import {
  CUSTOM_FONT_MIN_SIZE,
  SCOTTY_FONTS,
  TEXT_SIZE_SCALE,
} from "@/constants/typography";

const NestedTextContext = createContext(false);
const WeightContext = createContext<TextStyle["fontWeight"]>("400");
const DisplayTextContext = createContext(false);
export const FontReadyContext = createContext(false);
const systemFont = Platform.select({
  ios: "System",
  android: "sans-serif",
  default: "system-ui",
});

/** Keep unsupported characters in system-font runs, including emoji and digits. */
export type ScottyTextProps = TextProps & {
  variant?: "auto" | "heading" | "body";
};

export const Text = forwardRef<NativeText, ScottyTextProps>(function ScottyText(
  { style, children, variant = "auto", ...props },
  ref,
) {
  const inheritedWeight = useContext(WeightContext);
  const nested = useContext(NestedTextContext);
  const inheritedDisplay = useContext(DisplayTextContext);
  const ready = useContext(FontReadyContext);
  const flattened = StyleSheet.flatten(style);
  // Scale explicit sizes once. Nested text without a size inherits the already
  // enlarged parent, so inline labels do not grow a second time.
  const size = flattened?.fontSize ?? (nested ? undefined : 14);
  const sizing: TextStyle = {
    ...(size !== undefined
      ? { fontSize: Math.round(size * TEXT_SIZE_SCALE) }
      : {}),
    ...(flattened?.lineHeight !== undefined
      ? { lineHeight: Math.ceil(flattened.lineHeight * TEXT_SIZE_SCALE) }
      : {}),
  };
  const weight = flattened?.fontWeight ?? inheritedWeight;
  const bold = weight === "bold" || Number(weight) >= 600;
  const display =
    variant === "heading" ||
    (variant === "auto" &&
      (props.accessibilityRole === "header" ||
        props.role === "heading" ||
        (size !== undefined
          ? size >= CUSTOM_FONT_MIN_SIZE
          : inheritedDisplay)));
  const custom = ready && display && !flattened?.fontFamily;
  const content = custom
    ? React.Children.map(children, (child) => {
        if (typeof child !== "string" && typeof child !== "number")
          return child;
        // The supplied faces include Latin letters and these punctuation marks.
        // Keep digits, other symbols, scripts and emoji in the platform font.
        return String(child)
          .split(/([A-Za-z!"',.:?]+)/)
          .filter(Boolean)
          .map((run, index) => (
            <NativeText
              key={index}
              style={
                /^[A-Za-z!"',.:?]+$/.test(run)
                  ? {
                      fontFamily: bold
                        ? SCOTTY_FONTS.bold
                        : SCOTTY_FONTS.regular,
                      fontWeight: "400",
                    }
                  : { fontFamily: systemFont, fontWeight: weight }
              }
            >
              {run}
            </NativeText>
          ));
      })
    : children;
  return (
    <WeightContext.Provider value={weight}>
      <DisplayTextContext.Provider value={display}>
        <NestedTextContext.Provider value>
          <NativeText
            {...props}
            ref={ref}
            style={[{ fontFamily: systemFont }, style, sizing]}
          >
            {content}
          </NativeText>
        </NestedTextContext.Provider>
      </DisplayTextContext.Provider>
    </WeightContext.Provider>
  );
});
