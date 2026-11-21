import React, { createContext, forwardRef, useContext, type ComponentRef } from 'react';
import { Platform, StyleSheet, Text as NativeText, type TextProps, type TextStyle } from 'react-native';
import {
  APP_FONTS_BY_ID,
  TEXT_SIZE_MULTIPLIER,
  type AppFontId,
  type TextSizeId,
} from '@/constants/settings';
import { CUSTOM_FONT_MIN_SIZE, SCOTTY_FONTS } from '@/constants/typography';
import { useOptionalSettings } from '@/hooks/useSettings';

export interface ScottyTextProps extends TextProps {
  variant?: "auto" | "heading" | "body";
  /** Optional font override (e.g. for live preview windows without changing global app text). */
  fontIdOverride?: AppFontId;
  /** Optional text size override (e.g. for live preview windows). */
  textSizeOverride?: TextSizeId;
}

const DisplayTextContext = createContext(false);
const NestedTextContext = createContext(false);
const WeightContext = createContext<TextStyle['fontWeight']>('400');
export const FontReadyContext = createContext(false);
const systemFont = Platform.select({ ios: 'System', android: 'sans-serif', default: 'system-ui' });

const CUSTOM_FONT_RUN = /([A-Za-z0-9 !"'.:,?\/\-+%#()]+)/;
const IS_CUSTOM_FONT_RUN = /^[A-Za-z0-9 !"'.:,?\/\-+%#()]+$/;

/** Keep unsupported characters (such as emoji or non-Latin scripts) in system-font runs. */
export const Text = forwardRef<ComponentRef<typeof NativeText>, ScottyTextProps>(function ScottyText(
  { style, children, variant = "auto", fontIdOverride, textSizeOverride, ...props },
  ref,
) {
  const inheritedWeight = useContext(WeightContext);
  const nested = useContext(NestedTextContext);
  const inheritedDisplay = useContext(DisplayTextContext);
  const ready = useContext(FontReadyContext);
  const { settings } = useOptionalSettings();

  const effectiveFontId = fontIdOverride ?? settings.fontId;
  const effectiveTextSize = textSizeOverride ?? settings.textSize;
  const effectiveFont = APP_FONTS_BY_ID[effectiveFontId];
  const effectiveScale = effectiveFont.baseScale * TEXT_SIZE_MULTIPLIER[effectiveTextSize];

  const flattened = StyleSheet.flatten(style);
  // Scale explicit sizes once. Nested text without a size inherits the already
  // enlarged parent, so inline labels do not grow a second time.
  const size = flattened?.fontSize ?? (nested ? undefined : 14);
  const sizing: TextStyle = {
    ...(size !== undefined ? { fontSize: Math.round(size * effectiveScale) } : {}),
    ...(flattened?.lineHeight !== undefined
      ? { lineHeight: Math.ceil(flattened.lineHeight * effectiveScale) }
      : {}),
  };
  const weight = flattened?.fontWeight ?? inheritedWeight;
  const bold = weight === 'bold' || Number(weight) >= 600;
  const hasExplicitFamily = Boolean(flattened?.fontFamily);
  const display = variant === 'heading' || (variant === 'auto' && (props.accessibilityRole === 'header' || props.role === 'heading' || (size !== undefined ? size >= CUSTOM_FONT_MIN_SIZE : inheritedDisplay)));
  const useScottyCustom = !hasExplicitFamily && effectiveFontId === 'scotty' && ready && display;
  const platformFamilyStyle: TextStyle | undefined =
    !hasExplicitFamily && effectiveFontId !== 'scotty'
      ? { fontFamily: bold ? effectiveFont.boldFamily : effectiveFont.regularFamily }
      : undefined;

  const content = useScottyCustom ? React.Children.map(children, (child) => {
    if (typeof child !== 'string' && typeof child !== 'number') return child;
    // Both supplied faces cover Latin letters, digits 0-9, and common punctuation/symbols.
    // Preserve unsupported punctuation (e.g. ';'), other scripts, combining marks, and emoji with the platform font.
    return String(child).split(CUSTOM_FONT_RUN).filter(Boolean).map((run, index) => (
      <NativeText key={index} style={IS_CUSTOM_FONT_RUN.test(run)
        ? { fontFamily: bold ? SCOTTY_FONTS.bold : SCOTTY_FONTS.regular, fontWeight: '400' }
        : { fontFamily: systemFont, fontWeight: weight }}>
        {run}
      </NativeText>
    ));
  }) : children;

  return (
    <WeightContext.Provider value={weight}>
      <DisplayTextContext.Provider value={display}>
      <NestedTextContext.Provider value>
        <NativeText {...props} ref={ref} style={[{ fontFamily: systemFont }, style, platformFamilyStyle, sizing]}>{content}</NativeText>
      </NestedTextContext.Provider>
      </DisplayTextContext.Provider>
    </WeightContext.Provider>
  );
});
