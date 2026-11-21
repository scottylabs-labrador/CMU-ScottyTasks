import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ScottyText';
import { PressableScale } from '@/components/ui/Motion';
import { useHomeProgress } from '@/hooks/useHomeProgress';
import { useScottyChat } from '@/hooks/useScottyChat';
import { useOptionalSettings } from '@/hooks/useSettings';

export const HOME_COLORS = { sky: '#ADEBFA', grass: '#6D9264', blade: '#7CC48A', red: '#B00624' };

function Grass({ left, top, small = false }: { left: `${number}%`; top: number; small?: boolean }) {
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.grass, { left, top, transform: [{ scale: small ? 0.65 : 1 }] }]}>
    <View style={styles.bladeLeft} /><View style={styles.bladeRight} />
  </View>;
}

export default function HomeDashboard({
  name,
  onProfile,
  onChat,
  onPet,
}: {
  name?: string;
  onProfile: () => void;
  onChat?: () => void;
  onPet?: () => void;
}) {
  const router = useRouter();
  const { openChat } = useScottyChat();
  const { theme } = useOptionalSettings();
  const { width } = useWindowDimensions();
  const canvasWidth = Math.min(width, 560);
  const heroHeight = Math.round(canvasWidth * 0.84);
  const dogSize = Math.round(canvasWidth * 0.78);
  const { data, loading, error, guest, refresh } = useHomeProgress();
  const handleDogPress = onChat ?? onPet ?? openChat;
  const cards = [
    { key: 'tasks', title: 'Tasks', route: '/(tabs)/tasks', empty: 'No tasks due today' },
    { key: 'habits', title: 'Habits', route: '/(tabs)/habits', empty: 'Add your first habit' },
    { key: 'quests', title: 'Quests', route: '/(tabs)/quests', empty: 'Explore quests' },
  ] as const;

  return (
    <View style={styles.root}>
      {/* Fixed Top Action Bar — always visible above the scrollable hero */}
      <View style={styles.topBarWrapper}>
        <View style={[styles.topBar, { maxWidth: 560 }]}>
          <View style={styles.topBarGroup}>
            <PressableScale onPress={onProfile} accessibilityLabel="Open profile and stats" style={styles.iconButton}>
              <Image source={require('@/assets/images/profile_icon.png')} style={styles.profileIcon} contentFit="contain" />
            </PressableScale>
            <PressableScale onPress={() => router.push('/settings')} accessibilityLabel="Open settings" style={styles.iconButton}>
              <Ionicons name="settings-outline" size={28} color="#1E1E1E" />
            </PressableScale>
          </View>
          <PressableScale onPress={() => router.push('/shop')} accessibilityLabel="Open shop" style={styles.iconButton}>
            <Image source={require('@/assets/images/shop_icon.png')} style={styles.shopIcon} contentFit="contain" />
          </PressableScale>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading && !!data}
            onRefresh={() => { void refresh(); }}
            tintColor={theme.accent}
          />
        }
      >
        <View style={[styles.canvas, { maxWidth: 560 }]}>
          <View style={[styles.hero, { height: heroHeight }]}>
            <View style={styles.ground} />
            <Grass left="12%" top={heroHeight - 28} />
            <Grass left="28%" top={heroHeight * 0.73} small />
            <Grass left="79%" top={heroHeight * 0.79} />
            <PressableScale
              onPress={handleDogPress}
              scaleTo={0.99}
              haptic="light"
              style={[styles.dogButton, { width: dogSize, height: dogSize }]}
              accessibilityRole="button"
              accessibilityLabel="Chat with Scotty"
            >
              <Image
                source={require('@/assets/images/scotty-logo-main.png')}
                style={styles.dog}
                contentFit="contain"
                accessibilityLabel="Scotty the dog"
              />
            </PressableScale>
          </View>

          <View style={styles.lower}>
            <Text accessibilityRole="header" style={styles.greeting}>
              {name ? `Welcome back, ${name}!` : 'Welcome back!'}
            </Text>
            <View style={styles.cards}>
              {cards.map((card) => {
                const progress = data?.[card.key];
                const ratio = progress && progress.total > 0 ? Math.min(1, progress.done / progress.total) : 0;
                const detail = guest
                  ? 'Sign in to save your progress'
                  : error
                    ? 'Progress unavailable · tap to open'
                    : !progress
                      ? 'Loading progress…'
                      : progress.total === 0
                        ? card.empty
                        : `${progress.done}/${progress.total} ${card.key === 'quests' ? 'claimed' : 'completed today'}`;
                return (
                  <PressableScale
                    key={card.key}
                    onPress={() => router.push(card.route)}
                    style={[styles.card, { backgroundColor: theme.card }]}
                    accessibilityLabel={`${card.title}. ${detail}. Open ${card.title.toLowerCase()}.`}
                  >
                    <View style={styles.cardHeader}>
                      <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{card.title}</Text>
                      <Ionicons name="arrow-forward" size={26} color={theme.textPrimary} />
                    </View>
                    <Text style={[styles.detail, { color: theme.textSecondary }]}>{detail}</Text>
                    <View
                      style={[styles.track, { backgroundColor: theme.subtle }]}
                      accessibilityRole="progressbar"
                      accessibilityLabel={`${card.title} progress`}
                      accessibilityValue={
                        progress
                          ? { min: 0, max: Math.max(1, progress.total), now: progress.done }
                          : { text: detail }
                      }
                    >
                      <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: theme.accent }]} />
                    </View>
                  </PressableScale>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: HOME_COLORS.grass },
  topBarWrapper: {
    backgroundColor: HOME_COLORS.sky,
    alignItems: 'center',
    zIndex: 20,
    elevation: 20,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 2,
  },
  topBarGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  profileIcon: { width: 32, height: 32 },
  shopIcon: { width: 40, height: 40 },
  scroll: { flex: 1, backgroundColor: HOME_COLORS.grass },
  scrollContent: { flexGrow: 1, alignItems: 'center', backgroundColor: HOME_COLORS.sky },
  canvas: { width: '100%', flexGrow: 1, backgroundColor: HOME_COLORS.grass },
  hero: { width: '100%', backgroundColor: HOME_COLORS.sky, alignItems: 'center' },
  ground: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '33%', backgroundColor: HOME_COLORS.grass },
  dogButton: { position: 'absolute', bottom: -10, alignItems: 'center', justifyContent: 'center' },
  dog: { width: '100%', height: '100%' },
  grass: { position: 'absolute', width: 26, height: 20 },
  bladeLeft: { position: 'absolute', left: 0, top: 7, width: 17, height: 4, borderRadius: 3, backgroundColor: HOME_COLORS.blade, transform: [{ rotate: '40deg' }] },
  bladeRight: { position: 'absolute', left: 11, top: 0, width: 4, height: 22, borderRadius: 3, backgroundColor: HOME_COLORS.blade, transform: [{ rotate: '28deg' }] },
  lower: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 30, gap: 20 },
  greeting: { color: '#FFFFFF', fontSize: 28, lineHeight: 37, textAlign: 'center' },
  cards: { gap: 14 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, paddingHorizontal: 20, paddingVertical: 13 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  cardTitle: { fontSize: 24, lineHeight: 30, color: '#41413E', flexShrink: 1 },
  detail: { fontSize: 14, color: '#777777', marginTop: 2, marginBottom: 10 },
  track: { height: 15, borderRadius: 12, backgroundColor: '#EEEEEE', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 12, backgroundColor: HOME_COLORS.red },
});
