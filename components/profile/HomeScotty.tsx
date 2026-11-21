import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import DressedScotty from './DressedScotty';
import { useIsFocused } from 'expo-router/react-navigation';
import Animated, { cancelAnimation, Easing, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { PressableScale } from '@/components/ui/Motion';

export default function HomeScotty({ onPet, onTreat }: { onPet: () => void; onTreat: () => Promise<boolean> }) {
  const focused = useIsFocused();
  const reducedMotion = useReducedMotion();
  const idle = useSharedValue(0);
  const bounce = useSharedValue(0);
  const flight = useSharedValue(1);
  const sceneHeight = useSharedValue(200);
  const active = useRef(focused);
  const [feeding, setFeeding] = useState(false);
  const [message, setMessage] = useState('');
  const busy = useRef(false);
  const mounted = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; clearTimeout(timer.current); };
  }, []);

  useEffect(() => {
    active.current = focused;
    if (focused && !reducedMotion) {
      idle.set(withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true));
    } else {
      cancelAnimation(idle);
      cancelAnimation(bounce);
      idle.set(0);
      bounce.set(0);
      cancelAnimation(flight);
      flight.set(1);
    }
    return () => { cancelAnimation(idle); cancelAnimation(bounce); cancelAnimation(flight); };
  }, [focused, reducedMotion, idle, bounce, flight]);

  const dogStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -idle.value * 3 - bounce.value * 12 }, { rotate: `${bounce.value * 3}deg` }],
  }));
  const treatStyle = useAnimatedStyle(() => ({
    opacity: flight.value < 1 ? 1 : 0,
    transform: [
      { translateX: 48 * Math.sin(Math.PI * flight.value) },
      { translateY: -Math.max(30, (sceneHeight.value - 48) * 0.55) * flight.value - 45 * Math.sin(Math.PI * flight.value) },
      { rotate: `${flight.value * 300}deg` },
      { scale: 1 - flight.value * 0.45 },
    ],
  }));
  const caughtTreat = () => {
    if (mounted.current && active.current) setMessage('Nice catch, Scotty! ♥');
  };

  const feed = async () => {
    if (busy.current) return;
    busy.current = true;
    clearTimeout(timer.current);
    setFeeding(true);
    setMessage('');
    try {
      const success = await onTreat();
      if (!mounted.current || !active.current) return;
      if (!success) setMessage('Could not give treat. Try again.');
      else if (reducedMotion) caughtTreat();
      else {
        flight.set(0);
        flight.set(withTiming(1, { duration: 650, easing: Easing.linear }, finished => {
          if (finished) runOnJS(caughtTreat)();
        }));
        bounce.set(withDelay(650, withSequence(withTiming(1, { duration: 180 }), withTiming(0, { duration: 220 }), withTiming(0.6, { duration: 160 }), withTiming(0, { duration: 220 }))));
      }
    } catch {
      if (mounted.current) setMessage('Could not give treat. Try again.');
    } finally {
      if (mounted.current) {
        timer.current = setTimeout(() => { busy.current = false; setFeeding(false); setMessage(''); }, 2800);
      }
    }
  };

  return <View style={styles.container} pointerEvents="box-none" onLayout={event => sceneHeight.set(event.nativeEvent.layout.height)}>
    <PressableScale onPress={onPet} scaleTo={0.99} haptic="light" style={styles.dogButton} accessibilityLabel="Pet Scotty">
      <Animated.View style={[styles.dog, dogStyle]}>
        <DressedScotty hideToy />
      </Animated.View>
    </PressableScale>
    <View pointerEvents="none" style={styles.dogButton}>
      <DressedScotty toyOnly />
    </View>
    <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.flyingTreat, treatStyle]}>
      <Text style={styles.bone}>🦴</Text>
    </Animated.View>
    <View style={styles.controls}>
      <Text style={styles.message} accessibilityLiveRegion="polite">{message || ' '}</Text>
      <PressableScale onPress={() => { void feed(); }} disabled={feeding} haptic="light" style={styles.treat}
        accessibilityLabel="Throw Scotty a treat" accessibilityState={{ disabled: feeding, busy: feeding }}>
        <Text style={styles.treatText}>{feeding ? '♥ Scotty' : '🦴 Throw treat'}</Text>
      </PressableScale>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 64, bottom: 0, left: 0, right: 0 },
  dogButton: { position: 'absolute', top: 0, bottom: 48, left: 0, right: 0 },
  dog: { width: '100%', height: '100%' },
  flyingTreat: { position: 'absolute', bottom: 22, left: '50%', marginLeft: -18, width: 36, height: 36 },
  bone: { fontSize: 28, textAlign: 'center' },
  controls: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center' },
  message: { fontSize: 12, color: '#FFFFFF', textAlign: 'center', minHeight: 18 },
  treat: { minHeight: 44, paddingHorizontal: 18, borderRadius: 22, backgroundColor: '#FFFFFF', justifyContent: 'center' },
  treatText: { fontSize: 14, fontWeight: '700', color: '#41413E' },
});
