import React, { useCallback, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { type ShopItem } from '@/constants/shop';

import { TOY_SIZE, DEFAULT_TOY_POSITION as INITIAL_POSITION, normalizeToyPosition, type ToyPosition } from '@/utils/toyPosition';

export default function DraggableToy({ item, sceneSize, sceneWidth = sceneSize, editable = false, initialPosition = INITIAL_POSITION, onPositionChange }: {
  item: ShopItem; sceneSize: number; sceneWidth?: number; editable?: boolean; initialPosition?: ToyPosition; onPositionChange?: (position: ToyPosition) => void;
}) {
  // Keep saved coordinates compatible while spreading horizontal travel across the scene.
  const horizontalScale = Math.max(0, sceneWidth - sceneSize * TOY_SIZE) / (1 - TOY_SIZE);
  // Store fractions so rotating/resizing the screen keeps the toy inside the scene.
  const [position, setPosition] = useState(() => normalizeToyPosition(initialPosition));
  const latest = useRef(position);
  const origin = useRef(position);
  const [dragging, setDragging] = useState(false);
  const move = useCallback((x: number, y: number) => {
    latest.current = normalizeToyPosition({ x, y });
    setPosition(latest.current);
    onPositionChange?.(latest.current);
  }, [onPositionChange]);
  // PanResponder stores these callbacks; refs are read only when a gesture fires.
  // eslint-disable-next-line react-hooks/refs
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => editable && sceneSize > 0,
    onMoveShouldSetPanResponder: () => editable && sceneSize > 0,
    onPanResponderGrant: () => { origin.current = latest.current; setDragging(true); },
    onPanResponderMove: (_, gesture) => {
      if (sceneSize > 0 && horizontalScale > 0) move(origin.current.x + gesture.dx / horizontalScale, origin.current.y + gesture.dy / sceneSize);
    },
    onPanResponderRelease: () => setDragging(false),
    onPanResponderTerminate: () => setDragging(false),
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => true,
  }), [sceneSize, horizontalScale, editable, move]);
  const displayed = editable ? position : normalizeToyPosition(initialPosition);

  return <View {...(editable ? responder.panHandlers : {})} pointerEvents={editable ? 'auto' : 'none'} accessible accessibilityRole={editable ? 'adjustable' : 'image'}
    accessibilityLabel={item.label} accessibilityHint={editable ? 'Drag to place the toy, then save its position.' : undefined}
    accessibilityActions={editable ? [
      { name: 'left', label: 'Move left' }, { name: 'right', label: 'Move right' },
      { name: 'up', label: 'Move up' }, { name: 'down', label: 'Move down' },
      { name: 'reset', label: 'Reset position' },
    ] : []}
    onAccessibilityAction={({ nativeEvent: { actionName } }) => {
      const { x, y } = latest.current;
      if (actionName === 'left') move(x - 0.05, y);
      if (actionName === 'right') move(x + 0.05, y);
      if (actionName === 'up') move(x, y - 0.05);
      if (actionName === 'down') move(x, y + 0.05);
      if (actionName === 'reset') move(INITIAL_POSITION.x, INITIAL_POSITION.y);
    }}
    style={[styles.toy, { left: displayed.x * horizontalScale, top: displayed.y * sceneSize,
      width: sceneSize * TOY_SIZE, height: sceneSize * TOY_SIZE, opacity: dragging ? 0.9 : 1 }]}>
    <View pointerEvents="none" style={styles.canvas}>
      {item.id === 'toy-tennis' && <View style={styles.ballBacking} />}
      <Image source={item.image} style={styles.canvas} contentFit="contain" />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  toy: { position: 'absolute', zIndex: 2, touchAction: 'none' } as ViewStyle,
  canvas: { width: '100%', height: '100%' },
  ballBacking: { position: 'absolute', left: '23.5%', top: '19%', width: '53%', height: '54%', borderRadius: 999, backgroundColor: '#F0D45F' },
});
