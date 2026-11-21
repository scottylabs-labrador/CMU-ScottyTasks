import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ScottyText';
import { Ionicons } from '@expo/vector-icons';
import DressedScotty from './DressedScotty';
import { useIsFocused } from 'expo-router/react-navigation';
import Animated, { cancelAnimation, Easing, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useOptionalSettings } from '@/hooks/useSettings';
import { PressableScale } from '@/components/ui/Motion';

export default function HomeScotty({ name, onPet, onTreat }: { name?: string; onPet: () => void; onTreat: () => Promise<boolean> }) {
  const focused = useIsFocused();
  const osReducedMotion = useReducedMotion();
  const { settings } = useOptionalSettings();
  const reducedMotion = osReducedMotion || settings.reduceMotion;
  const idle = useSharedValue(0);
  const bounce = useSharedValue(0);
  const flight = useSharedValue(1);
  const sceneHeight = useSharedValue(200);
  const active = useRef(focused);
  const [controlsHeight, setControlsHeight] = useState(62);
  const [greetingHeight, setGreetingHeight] = useState(44);
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
    <Text accessibilityRole="header" style={styles.greeting} onLayout={event => setGreetingHeight(event.nativeEvent.layout.height)}>{name ? `Welcome back, ${name}!` : 'Welcome back!'}</Text>
    <PressableScale onPress={onPet} scaleTo={0.99} haptic="light" style={[styles.dogButton, { top: greetingHeight + 8, bottom: controlsHeight + 4 }]} accessibilityLabel="Chat with Scotty">
      <Animated.View style={[styles.dog, dogStyle]}>
        <DressedScotty hideToy />
      </Animated.View>
    </PressableScale>
    <View pointerEvents="none" style={[styles.dogButton, { top: greetingHeight + 8, bottom: controlsHeight + 4 }]}>
      <DressedScotty toyOnly />
    </View>
    <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.flyingTreat, treatStyle]}>
      <Text style={styles.bone}>🦴</Text>
    </Animated.View>
    <View style={styles.controls} onLayout={event => setControlsHeight(event.nativeEvent.layout.height)}>
      <Text style={styles.message} accessibilityLiveRegion="polite">{message || ' '}</Text>
      <View style={styles.actionRow}>
        <PressableScale onPress={onPet} haptic="light" style={[styles.treat, styles.chatButton]}
          accessibilityRole="button" accessibilityLabel="Talk to Scotty">
          <Ionicons name="chatbubble-outline" size={16} color="#41413E" />
          <Text style={styles.treatText}>Talk to me!</Text>
        </PressableScale>
      <PressableScale onPress={() => { void feed(); }} disabled={feeding} haptic="light" style={styles.treat}
        accessibilityLabel="Throw Scotty a treat" accessibilityState={{ disabled: feeding, busy: feeding }}>
        <Text style={styles.treatText}>{feeding ? '♥ Scotty' : '🦴 Throw treat'}</Text>
      </PressableScale>
      </View>
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
  greeting: { color: '#41413E', fontSize: 29, lineHeight: 36, textAlign: 'center', paddingHorizontal: 24 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  chatButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  treat: { minHeight: 44, paddingHorizontal: 18, borderRadius: 22, backgroundColor: '#FFFFFF', justifyContent: 'center' },
  treatText: { fontSize: 13, fontWeight: '700', color: '#41413E' },
});
