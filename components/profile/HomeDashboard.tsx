import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text as SystemText, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ScottyText';
import { PressableScale } from '@/components/ui/Motion';
import { useHomeProgress } from '@/hooks/useHomeProgress';

export const HOME_COLORS = { sky: '#ADEBFA', grass: '#6D9264', blade: '#7CC48A', red: '#B00624' };

function Grass({ left, top, small = false }: { left: `${number}%`; top: number; small?: boolean }) {
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.grass, { left, top, transform: [{ scale: small ? 0.65 : 1 }] }]}>
    <View style={styles.bladeLeft} /><View style={styles.bladeRight} />
  </View>;
}

export default function HomeDashboard({ name, onProfile, onPet }: { name?: string; onProfile: () => void; onPet: () => void }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const canvasWidth = Math.min(width, 560);
  const heroHeight = canvasWidth * 1.08;
  const { data, loading, error, guest, refresh } = useHomeProgress();
  const cards = [
    { key: 'tasks', title: 'Tasks', route: '/(tabs)/tasks', empty: 'No tasks due today' },
    { key: 'habits', title: 'Habits', route: '/(tabs)/habits', empty: 'Add your first habit' },
    { key: 'quests', title: 'Quests', route: '/(tabs)/quests', empty: 'Explore quests' },
  ] as const;

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}
    refreshControl={<RefreshControl refreshing={loading && !!data} onRefresh={() => { void refresh(); }} tintColor={HOME_COLORS.red} />}>
    <View style={[styles.canvas, { maxWidth: 560 }]}>
      <View style={[styles.hero, { height: heroHeight }]}>
        <View style={styles.ground} />
        <Grass left="12%" top={heroHeight - 28} />
        <Grass left="28%" top={heroHeight * 0.73} small />
        <Grass left="79%" top={heroHeight * 0.79} />
        <PressableScale onPress={onPet} scaleTo={0.99} haptic="light" style={[styles.dogButton, { width: canvasWidth * 0.85, height: canvasWidth * 0.85 }]}
          accessibilityLabel="Pet Scotty">
          <Image source={require('@/assets/images/scotty-logo-main.png')} style={styles.dog} contentFit="contain" accessibilityLabel="Scotty the dog" />
        </PressableScale>
        <View style={styles.topBar}>
          <PressableScale onPress={onProfile} accessibilityLabel="Open profile and settings" style={styles.iconButton}>
            <Image source={require('@/assets/images/profile_icon.png')} style={styles.profileIcon} contentFit="contain" />
          </PressableScale>
          <PressableScale onPress={() => router.push('/(tabs)/shop')} accessibilityLabel="Open shop" style={styles.iconButton}>
            <Image source={require('@/assets/images/shop_icon.png')} style={styles.shopIcon} contentFit="contain" />
          </PressableScale>
        </View>
      </View>
      <View style={styles.lower}>
        <Text accessibilityRole="header" style={styles.greeting}>{name ? `Welcome back, ${name}!` : 'Welcome back!'}</Text>
        <View style={styles.cards}>
          {cards.map(card => {
            const progress = data?.[card.key];
            const ratio = progress && progress.total > 0 ? Math.min(1, progress.done / progress.total) : 0;
            const detail = guest ? 'Sign in to save your progress' : error ? 'Progress unavailable · tap to open' : !progress ? 'Loading progress…'
              : progress.total === 0 ? card.empty : `${progress.done}/${progress.total} ${card.key === 'quests' ? 'claimed' : 'completed today'}`;
            return <PressableScale key={card.key} onPress={() => router.push(card.route)} style={styles.card}
              accessibilityLabel={`${card.title}. ${detail}. Open ${card.title.toLowerCase()}.`}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Ionicons name="arrow-forward" size={27} color="#222222" />
              </View>
              <SystemText style={styles.detail}>{detail}</SystemText>
              <View style={styles.track} accessibilityRole="progressbar" accessibilityLabel={`${card.title} progress`}
                accessibilityValue={progress ? { min: 0, max: Math.max(1, progress.total), now: progress.done } : { text: detail }}>
                <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
              </View>
            </PressableScale>;
          })}
        </View>
      </View>
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: HOME_COLORS.grass },
  scrollContent: { flexGrow: 1, alignItems: 'center', backgroundColor: HOME_COLORS.sky },
  canvas: { width: '100%', flexGrow: 1, backgroundColor: HOME_COLORS.grass },
  hero: { backgroundColor: HOME_COLORS.sky, alignItems: 'center' },
  ground: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '31%', backgroundColor: HOME_COLORS.grass },
  topBar: { position: 'absolute', top: 12, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  profileIcon: { width: 34, height: 34 },
  shopIcon: { width: 44, height: 44 },
  dogButton: { position: 'absolute', bottom: -12, alignItems: 'center', justifyContent: 'center' },
  dog: { width: '100%', height: '100%' },
  grass: { position: 'absolute', width: 26, height: 20 },
  bladeLeft: { position: 'absolute', left: 0, top: 7, width: 17, height: 4, borderRadius: 3, backgroundColor: HOME_COLORS.blade, transform: [{ rotate: '40deg' }] },
  bladeRight: { position: 'absolute', left: 11, top: 0, width: 4, height: 22, borderRadius: 3, backgroundColor: HOME_COLORS.blade, transform: [{ rotate: '28deg' }] },
  lower: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 30, gap: 22 },
  greeting: { color: '#FFFFFF', fontSize: 28, lineHeight: 37, textAlign: 'center' },
  cards: { gap: 15 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, paddingHorizontal: 20, paddingVertical: 13 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  cardTitle: { fontSize: 26, lineHeight: 31, color: '#41413E', flexShrink: 1 },
  detail: { fontSize: 15, color: '#777777', marginTop: 1, marginBottom: 11 },
  track: { height: 17, borderRadius: 12, backgroundColor: '#EEEEEE', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 12, backgroundColor: HOME_COLORS.red },
});
