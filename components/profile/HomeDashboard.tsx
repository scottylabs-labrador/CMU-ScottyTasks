import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ScottyText';
import { PressableScale } from '@/components/ui/Motion';
import { useHomeProgress } from '@/hooks/useHomeProgress';
import HomeScotty from './HomeScotty';
import HomeShop from './HomeShop';

import { HOME_COLORS } from '@/constants/home';
export { HOME_COLORS } from '@/constants/home';

function Grass({ left, top, small = false }: { left: `${number}%`; top: `${number}%`; small?: boolean }) {
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.grass, { left, top, transform: [{ scale: small ? 0.65 : 1 }] }]}>
    <View style={styles.bladeLeft} /><View style={styles.bladeRight} />
  </View>;
}

export default function HomeDashboard({ name, onProfile, onChat, onTreat }: { name?: string; onProfile: () => void; onChat: () => void; onTreat: () => Promise<boolean> }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, error, guest, refresh } = useHomeProgress();
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const [shopVisible, setShopVisible] = useState(false);
  const handlePullRefresh = async () => {
    setPullRefreshing(true);
    try {
      await refresh();
    } finally {
      setPullRefreshing(false);
    }
  };
  const cards = [
    { key: 'tasks', title: 'Tasks', route: '/(tabs)/tasks', empty: 'No tasks due today' },
    { key: 'habits', title: 'Habits', route: '/(tabs)/habits', empty: 'Add your first habit' },
    { key: 'quests', title: 'Quests', route: '/(tabs)/quests', empty: 'Explore quests' },
  ] as const;

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}
    contentInsetAdjustmentBehavior="never"
    // Background updates on focus must not trigger the native pull-down animation.
    refreshControl={<RefreshControl refreshing={pullRefreshing} onRefresh={() => { void handlePullRefresh(); }} tintColor={HOME_COLORS.red} />}>
    <View style={[styles.canvas, { maxWidth: 560 }]}>
      <View style={styles.hero}>
        <View style={styles.ground} />
        <Grass left="12%" top="92%" />
        <Grass left="28%" top="73%" small />
        <Grass left="79%" top="79%" />
        <HomeScotty name={name} onPet={onChat} onTreat={onTreat} />
        <View style={styles.topBar}>
          <PressableScale onPress={onProfile} accessibilityLabel="Open profile and settings" style={styles.iconButton}>
            <Image source={require('@/assets/images/profile_icon.png')} style={styles.profileIcon} contentFit="contain" />
          </PressableScale>
          <PressableScale onPress={() => setShopVisible(true)} accessibilityLabel="Open shop" style={styles.iconButton}>
            <Image source={require('@/assets/images/shop_icon.png')} style={styles.shopIcon} contentFit="contain" />
          </PressableScale>
        </View>
      </View>
      <View style={[styles.lower, { paddingBottom: 16 + insets.bottom }]}>
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
                <Ionicons name="arrow-forward" size={24} color="#222222" />
              </View>
              <Text style={styles.detail}>{detail}</Text>
              <View style={styles.track} accessibilityRole="progressbar" accessibilityLabel={`${card.title} progress`}
                accessibilityValue={progress ? { min: 0, max: Math.max(1, progress.total), now: progress.done } : { text: detail }}>
                <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
              </View>
            </PressableScale>;
          })}
          <PressableScale onPress={() => router.push('/(tabs)/leaderboard')} style={styles.card}
            accessibilityLabel="Ranks. Open leaderboard">
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Ranks</Text>
              <Ionicons name="arrow-forward" size={24} color="#222222" />
            </View>
          </PressableScale>
        </View>
      </View>
    </View>
    {shopVisible && <HomeShop onClose={() => setShopVisible(false)} />}
  </ScrollView>;
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: HOME_COLORS.sky },
  scrollContent: { flexGrow: 1, alignItems: 'center', backgroundColor: HOME_COLORS.sky },
  canvas: { width: '100%', flexGrow: 1, backgroundColor: HOME_COLORS.grass },
  // Grow into the space remaining above the cards without a JS measurement/render cycle.
  // Keep enough height for the top bar, greeting, Scotty, and action buttons on compact iOS screens.
  hero: { flexGrow: 1, flexBasis: 280, minHeight: 280, backgroundColor: HOME_COLORS.sky, alignItems: 'center' },
  ground: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', backgroundColor: HOME_COLORS.grass },
  topBar: { position: 'absolute', top: 12, left: 20, right: 20, zIndex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  profileIcon: { width: 34, height: 34 },
  shopIcon: { width: 44, height: 44 },
  grass: { position: 'absolute', width: 26, height: 20 },
  bladeLeft: { position: 'absolute', left: 0, top: 7, width: 17, height: 4, borderRadius: 3, backgroundColor: HOME_COLORS.blade, transform: [{ rotate: '40deg' }] },
  bladeRight: { position: 'absolute', left: 11, top: 0, width: 4, height: 22, borderRadius: 3, backgroundColor: HOME_COLORS.blade, transform: [{ rotate: '28deg' }] },
  lower: { flexShrink: 0, paddingHorizontal: 24, paddingTop: 14, paddingBottom: 16, gap: 14 },
  cards: { gap: 10 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  cardTitle: { fontSize: 22, lineHeight: 26, color: '#41413E', flexShrink: 1 },
  detail: { fontSize: 13, color: '#777777', marginTop: 1, marginBottom: 8 },
  track: { height: 12, borderRadius: 12, backgroundColor: '#EEEEEE', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 12, backgroundColor: HOME_COLORS.red },
});
