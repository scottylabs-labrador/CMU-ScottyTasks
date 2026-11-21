import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { type ShopItem } from '@/constants/shop';

// Source size and visible artwork bounds, excluding transparent margins and toy shadows.
// Keep the original PNGs intact: their full canvas is used when dressing Scotty.
const artworkBounds: Record<string, readonly [number, number, number, number, number, number]> = {
  'hat-baseball': [186, 135, 0, 0, 186, 135],
  'hat-graduation': [273, 273, 37, 68, 198, 126],
  'glasses-clear': [264, 264, 16, 84, 232, 96],
  'glasses-dark': [255, 132, 4, 15, 248, 93],
  'toy-tennis': [900, 900, 210, 170, 481, 491],
  'toy-frisbee': [900, 900, 120, 300, 661, 261],
  'toy-squeaky': [900, 900, 250, 230, 541, 391],
  'toy-plush': [900, 900, 250, 120, 401, 581],
};

export default function ShopThumbnail({ item }: { item: ShopItem }) {
  const [frame, setFrame] = useState({ width: 0, height: 0 });
  const bounds = artworkBounds[item.id];
  const scale = bounds ? Math.min(frame.width / bounds[4], frame.height / bounds[5]) : 1;
  return <View style={styles.frame} onLayout={({ nativeEvent: { layout } }) => setFrame({ width: layout.width, height: layout.height })}>
    {bounds ? <View style={{ width: bounds[4] * scale, height: bounds[5] * scale, overflow: 'hidden' }}>
      <Image source={item.image} contentFit="contain" style={{ position: 'absolute',
        width: bounds[0] * scale, height: bounds[1] * scale, left: -bounds[2] * scale, top: -bounds[3] * scale }} />
    </View> : <Image source={item.image} contentFit="contain" style={styles.fallback} />}
  </View>;
}

const styles = StyleSheet.create({
  frame: { width: '85%', height: '55%', alignItems: 'center', justifyContent: 'center' },
  fallback: { width: '100%', height: '100%' },
});
