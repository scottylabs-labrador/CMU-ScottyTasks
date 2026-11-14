import React, { createContext, forwardRef, useContext, type ComponentRef } from 'react';
import { Platform, StyleSheet, Text as NativeText, type TextProps, type TextStyle } from 'react-native';
import { SCOTTY_FONTS, TEXT_SIZE_SCALE } from '@/constants/typography';

const NestedTextContext = createContext(false);
const WeightContext = createContext<TextStyle['fontWeight']>('400');
export const FontReadyContext = createContext(false);
const systemFont = Platform.select({ ios: 'System', android: 'sans-serif', default: 'system-ui' });

/** Keep unsupported characters in system-font runs, including emoji and digits. */
export const Text = forwardRef<ComponentRef<typeof NativeText>, TextProps>(function ScottyText({ style, children, ...props }, ref) {
  const inheritedWeight = useContext(WeightContext);
  const nested = useContext(NestedTextContext);
  const ready = useContext(FontReadyContext);
  const flattened = StyleSheet.flatten(style);
  // Scale explicit sizes once. Nested text without a size inherits the already
  // enlarged parent, so inline labels do not grow a second time.
  const size = flattened?.fontSize ?? (nested ? undefined : 14);
  const sizing: TextStyle = {
    ...(size !== undefined ? { fontSize: Math.round(size * TEXT_SIZE_SCALE) } : {}),
    ...(flattened?.lineHeight !== undefined
      ? { lineHeight: Math.ceil(flattened.lineHeight * TEXT_SIZE_SCALE) }
      : {}),
  };
  const weight = flattened?.fontWeight ?? inheritedWeight;
  const bold = weight === 'bold' || Number(weight) >= 600;
  const custom = ready && !flattened?.fontFamily;
  const content = custom ? React.Children.map(children, (child) => {
    if (typeof child !== 'string' && typeof child !== 'number') return child;
    // Both supplied faces currently provide only Latin letters. Preserve other
    // scripts, combining marks, punctuation and emoji with the platform font.
    return String(child).split(/([A-Za-z]+)/).filter(Boolean).map((run, index) => (
      <NativeText key={index} style={/^[A-Za-z]+$/.test(run)
        ? { fontFamily: bold ? SCOTTY_FONTS.bold : SCOTTY_FONTS.regular, fontWeight: '400' }
        : { fontFamily: systemFont, fontWeight: weight }}>
        {run}
      </NativeText>
    ));
  }) : children;
  return (
    <WeightContext.Provider value={weight}>
      <NestedTextContext.Provider value>
        <NativeText {...props} ref={ref} style={[style, sizing]}>{content}</NativeText>
      </NestedTextContext.Provider>
    </WeightContext.Provider>
  );
});
