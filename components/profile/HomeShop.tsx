import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text as SystemText, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedModal, PressableScale } from '@/components/ui/Motion';
import { Text } from '@/components/ScottyText';
import { BONE_IMAGE, shopSections, type ShopItem } from '@/constants/shop';
import { useUserShopProfile } from '@/hooks/useUserShopProfile';
import { HOME_COLORS } from '@/constants/home';
import DressedScotty from './DressedScotty';
import ShopThumbnail from './ShopThumbnail';
import { DEFAULT_TOY_POSITION, normalizeToyPosition } from '@/utils/toyPosition';

const categoryIcons = {
  hats: require('@/assets/images/shop_hat_icon.png'),
  glasses: require('@/assets/images/shop_glasses_icon.png'),
  toys: require('@/assets/images/shop_items/toy-tennis-hq.png'),
};

export default function HomeShop({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { profile, purchaseItem, equipItem, placeToy, loading } = useUserShopProfile();
  const [category, setCategory] = useState(0);
  const [selected, setSelected] = useState<ShopItem>();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [placing, setPlacing] = useState(false);
  const [draftPosition, setDraftPosition] = useState(DEFAULT_TOY_POSITION);
  const busy = useRef(false);
  const mounted = useRef(true);
  React.useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const equipped = { hats: profile.equippedHatId, glasses: profile.equippedGlassesId, toys: profile.equippedToyId };
  const owned = selected && (!!profile.ownedItems[selected.id] || selected.price === 0);
  const inUse = selected && Object.values(equipped).includes(selected.id);
  const canAfford = selected && profile.coins >= selected.price;
  const beginPlacement = (item: ShopItem) => {
    setDraftPosition(normalizeToyPosition(profile.toyPositions?.[item.id]));
    setPlacing(true);
    setMessage('Drag the toy beside Scotty, then save its position.');
  };
  const act = async () => {
    if (!selected || busy.current) return;
    busy.current = true;
    setPending(true);
    setMessage('');
    try {
      if (placing) {
        await placeToy(selected.id, draftPosition);
        if (mounted.current) { setPlacing(false); setMessage(`${selected.label} placed!`); }
      } else if (!owned) {
        const result = await purchaseItem(selected.id);
        if (mounted.current) setMessage(result.ok ? `${selected.label} purchased! You can equip it now.` : result.reason === 'not-enough-coins' ? 'Earn more bones by completing tasks and habits.' : 'Could not purchase. Please try again.');
        if (result.ok && mounted.current && selected.category === 'toys') beginPlacement(selected);
      } else if (selected.category === 'toys') {
        beginPlacement(selected);
      } else {
        const success = await equipItem(selected.id);
        if (mounted.current) setMessage(success ? `${selected.label} equipped!` : 'Could not equip. Please try again.');
      }
    } catch { if (mounted.current) setMessage('Shop unavailable. Please try again.'); }
    finally { busy.current = false; if (mounted.current) setPending(false); }
  };

  return <AnimatedModal visible onClose={() => { if (!busy.current) onClose(); }} variant="fullscreen">
    <View style={[styles.overlay, { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]}>
      <View style={styles.preview}>
        <View style={styles.ground} />
        <View style={styles.dog} pointerEvents={pending ? 'none' : 'auto'}><DressedScotty preview={selected} placingToy={placing} onToyPositionChange={setDraftPosition} /></View>
        <View style={styles.balance} accessibilityLabel={`${profile.coins} bones`}>
          <Image source={BONE_IMAGE} style={styles.bone} contentFit="contain" />
          <SystemText style={styles.balanceText}>{loading ? '…' : profile.coins}</SystemText>
        </View>
      </View>
      <View style={styles.tabRow}>
        {shopSections.map((section, index) => <PressableScale key={section.category} disabled={pending || placing} onPress={() => { setCategory(index); setSelected(undefined); setMessage(''); }}
          style={[styles.tab, index > 0 && styles.overlappingTab, category === index && styles.selectedTab]} accessibilityLabel={section.title} accessibilityRole="tab" accessibilityState={{ selected: category === index }}>
          <Image source={categoryIcons[section.category]} style={styles.tabIcon} contentFit="contain" />
          <Text style={styles.tabLabel}>{section.title}</Text>
        </PressableScale>)}
        <View style={{ flex: 1 }} />
        <PressableScale onPress={onClose} disabled={pending} style={styles.close} accessibilityLabel="Close shop">
          <SystemText style={styles.arrow}>↓</SystemText>
        </PressableScale>
      </View>
      <View style={styles.sheetBackdrop}>
      <View style={styles.sheet}>
        <ScrollView key={category} contentContainerStyle={styles.grid} showsVerticalScrollIndicator>
          {shopSections[category].items.map(item => <PressableScale key={item.id} style={[styles.item, selected?.id === item.id && styles.selectedItem]}
            disabled={pending || placing} onPress={() => { setSelected(item); setMessage(''); }} accessibilityLabel={`Preview ${item.label}, ${profile.ownedItems[item.id] ? 'owned' : `${item.price} bones`}`} accessibilityState={{ selected: selected?.id === item.id, disabled: pending || placing }}>
            <ShopThumbnail item={item} />
            <View style={styles.price}>
              {!profile.ownedItems[item.id] && <Image source={BONE_IMAGE} style={styles.priceBone} contentFit="contain" />}
              <SystemText style={styles.priceText}>{Object.values(equipped).includes(item.id) ? 'In use' : profile.ownedItems[item.id] ? 'Owned' : item.price}</SystemText>
            </View>
          </PressableScale>)}
          {Array.from({ length: Math.max(0, 9 - shopSections[category].items.length) }, (_, i) => <View key={`locked-${i}`} style={styles.item} accessible accessibilityLabel="More items coming soon">
            <Image source={require('@/assets/images/shop_items/shop_lock.png')} contentFit="contain" style={styles.lock} />
            <SystemText style={styles.comingSoon}>Coming soon</SystemText>
          </View>)}
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: Math.max(12, insets.bottom) }]}>
          <SystemText style={styles.status} accessibilityLiveRegion="polite">{message || (selected ? `Trying on: ${selected.label}` : 'Tap an item to try it on Scotty')}</SystemText>
          {selected && <PressableScale onPress={() => { void act(); }} disabled={pending || loading || (!!inUse && selected.category !== 'toys') || (!owned && !canAfford)} style={[styles.action, (pending || loading || (inUse && selected.category !== 'toys') || (!owned && !canAfford)) && styles.disabled]} accessibilityLabel={placing ? 'Save toy position' : owned ? selected.category === 'toys' ? `Place ${selected.label}` : `Equip ${selected.label}` : `Buy ${selected.label} for ${selected.price} bones`}>
            <SystemText style={styles.actionText}>{pending ? 'Saving…' : placing ? 'Save position' : owned && selected.category === 'toys' ? inUse ? 'Edit position' : 'Place toy' : inUse ? 'Equipped' : owned ? 'Equip' : canAfford ? `Buy · ${selected.price} bones` : `Need ${selected.price - profile.coins} more bones`}</SystemText>
          </PressableScale>}
          {placing && <PressableScale disabled={pending} onPress={() => { setPlacing(false); setMessage('Placement cancelled. Your toy is still owned.'); }} accessibilityLabel="Cancel placement" style={styles.cancel}>
            <SystemText>Cancel</SystemText>
          </PressableScale>}
        </View>
      </View>
      </View>
    </View>
  </AnimatedModal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: HOME_COLORS.sky },
  preview: { flex: 1, minHeight: 130, alignItems: 'center' },
  ground: { position: 'absolute', bottom: 0, width: '100%', height: '25%', backgroundColor: HOME_COLORS.grass },
  dog: { width: '100%', flex: 1, marginTop: 36 },
  balance: { position: 'absolute', top: 8, left: 20, minHeight: 42, flexDirection: 'row', alignItems: 'center', backgroundColor: '#C7C7C7', borderRadius: 24, paddingLeft: 6, paddingRight: 18, gap: 4 },
  bone: { width: 34, height: 34 },
  balanceText: { fontSize: 22, fontWeight: '700', color: '#333' },
  tabRow: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: HOME_COLORS.grass, paddingHorizontal: 16, paddingTop: 8 },
  tab: { width: 76, paddingHorizontal: 6, paddingVertical: 6, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderWidth: 2, borderBottomWidth: 0, borderColor: '#000', backgroundColor: '#B6C6AF', alignItems: 'center' },
  overlappingTab: { marginLeft: -4 },
  selectedTab: { backgroundColor: '#FFF', zIndex: 1 },
  tabIcon: { width: 34, height: 24 },
  tabLabel: { fontSize: 12, color: '#222' },
  close: { width: 44, height: 44, borderRadius: 10, borderWidth: 2, borderColor: '#000', backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  arrow: { fontSize: 30, color: '#222' },
  sheetBackdrop: { height: '58%', backgroundColor: HOME_COLORS.grass },
  sheet: { flex: 1, backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12, padding: 24 },
  item: { width: '30%', aspectRatio: 1, padding: 6, borderRadius: 18, backgroundColor: '#ECECEC', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  selectedItem: { borderColor: HOME_COLORS.grass },
  price: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  priceBone: { width: 26, height: 22 },
  priceText: { fontSize: 13, fontWeight: '700', color: '#222' },
  lock: { width: 32, height: 40 },
  comingSoon: { fontSize: 10, color: '#666', marginTop: 6 },
  footer: { paddingHorizontal: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#EEE', gap: 8 },
  status: { fontSize: 12, color: '#555', textAlign: 'center' },
  action: { minHeight: 44, borderRadius: 22, backgroundColor: HOME_COLORS.red, alignItems: 'center', justifyContent: 'center' },
  disabled: { backgroundColor: '#888' },
  actionText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  cancel: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
