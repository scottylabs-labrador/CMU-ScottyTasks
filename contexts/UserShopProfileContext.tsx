import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { Alert, AppState } from 'react-native';
import { requireSupabase } from '@/config/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { defaultUserShopProfile, normalizeUserShopProfile, shopItemsById, type UserShopProfile } from '@/constants/shop';
import { calculateEffectiveHappiness, getHappinessMood } from '@/constants/gamification';

type PurchaseResult = { ok: true; reason: 'purchased' | 'owned' } | { ok: false; reason: 'not-enough-coins' | 'invalid-item' | 'error' };

function useProfileState() {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const currentUid = useRef(uid);
  useEffect(() => {
    currentUid.current = uid;
    return () => { currentUid.current = null; };
  }, [uid]);
  const [profile, setProfile] = useState<UserShopProfile>(() => uid ? { ...defaultUserShopProfile, xp: 0, streak: 0, tasksCompleted: 0 } : defaultUserShopProfile);
  const [loading, setLoading] = useState(!!uid);
  const refreshProfile = useCallback(async () => {
    if (!uid) return;
    const { data, error } = await requireSupabase().from('profiles').select('*').eq('id', uid).single();
    if (error) throw error;
    if (currentUid.current === uid) setProfile(normalizeUserShopProfile(data));
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    let active = true;
    const refresh = () => {
      void refreshProfile().catch(() => {
        if (active) Alert.alert('Profile unavailable', 'Could not load your profile. Please check your connection.');
      }).finally(() => { if (active) setLoading(false); });
    };
    const client = requireSupabase();
    const channel = client.channel(`profile:${uid}`).on('postgres_changes', {
      event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${uid}`,
    }, refresh).subscribe((status) => { if (status === 'SUBSCRIBED') refresh(); });
    refresh();
    const foreground = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    return () => { active = false; foreground.remove(); void client.removeChannel(channel); };
  }, [uid, refreshProfile]);

  const rpc = useCallback(async (name: string, args: Record<string, unknown> = {}) => {
    const { data, error } = await requireSupabase().rpc(name, args);
    if (error) throw error;
    if (data?.profile && currentUid.current === uid) setProfile(normalizeUserShopProfile(data.profile));
    return data;
  }, [uid]);

  const completeTask = useCallback((taskId: string, done: boolean) =>
    rpc('complete_task', { p_task_id: taskId, p_done: done }), [rpc]);

  const addGuestReward = useCallback((xp: number, coins: number, task = false, food = 0) => {
    if (uid) throw new Error('Signed-in rewards must use a database action');
    setProfile(prev => ({ ...prev, xp: prev.xp + xp, coins: prev.coins + coins,
      tasksCompleted: prev.tasksCompleted + (task ? 1 : 0),
      happiness: Math.min(100, calculateEffectiveHappiness(prev.happiness, prev.lastFedAt) + food), lastFedAt: Date.now() }));
  }, [uid]);

  const claimActivity = useCallback(async (kind: 'habit' | 'quest', id: string, xp: number, coins: number) => {
    if (!uid) { addGuestReward(xp, coins, false, kind === 'habit' ? 10 : 0); return { xp, coins }; }
    return rpc('claim_activity', { p_kind: kind, p_id: id, p_xp: xp });
  }, [uid, addGuestReward, rpc]);

  const purchaseItem = useCallback(async (itemId: string): Promise<PurchaseResult> => {
    const item = shopItemsById[itemId];
    if (!item) return { ok: false, reason: 'invalid-item' };
    if (!uid) {
      if (profile.ownedItems[itemId]) return { ok: true, reason: 'owned' };
      if (profile.coins < item.price) return { ok: false, reason: 'not-enough-coins' };
      setProfile(prev => ({ ...prev, coins: prev.coins - item.price, ownedItems: { ...prev.ownedItems, [itemId]: true } }));
      return { ok: true, reason: 'purchased' };
    }
    try { return await rpc('purchase_item', { p_item_id: itemId }); }
    catch { return { ok: false, reason: 'error' }; }
  }, [uid, profile, rpc]);

  const equipItem = useCallback(async (itemId: string) => {
    const item = shopItemsById[itemId];
    if (!item || !profile.ownedItems[itemId]) return false;
    const field = { backgrounds: 'equippedBackgroundId', dogHouses: 'equippedDogHouseId', toys: 'equippedToyId' }[item.category];
    if (!uid) { setProfile(prev => ({ ...prev, [field]: itemId })); return true; }
    try { await rpc('equip_item', { p_item_id: itemId }); return true; } catch { return false; }
  }, [uid, profile, rpc]);

  const updateAvatar = useCallback(async (avatarUrl: string) => {
    if (!uid) { setProfile(prev => ({ ...prev, avatarUrl })); return true; }
    const { error } = await requireSupabase().from('profiles').update({ avatarUrl }).eq('id', uid);
    if (error) throw error;
    await refreshProfile();
    return true;
  }, [uid, refreshProfile]);

  const petScotty = useCallback(async () => {
    if (!uid) {
      setProfile(prev => ({ ...prev, happiness: Math.min(100, calculateEffectiveHappiness(prev.happiness, prev.lastFedAt) + 2), lastFedAt: Date.now() }));
      return true;
    }
    try { await rpc('pet_scotty'); return true; } catch { return false; }
  }, [uid, rpc]);

  const effectiveHappiness = useMemo(() => calculateEffectiveHappiness(profile.happiness, profile.lastFedAt), [profile]);
  const mood = getHappinessMood(effectiveHappiness);
  return { uid, profile, loading, effectiveHappiness, mood, xpMultiplier: mood.xpMultiplier,
    refreshProfile, completeTask, addGuestReward, claimActivity, purchaseItem, equipItem, updateAvatar, petScotty };
}

const ProfileContext = createContext<ReturnType<typeof useProfileState> | null>(null);
function ProfileSession({ children }: PropsWithChildren) {
  const value = useProfileState();
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
export function useUserShopProfile() {
  const value = useContext(ProfileContext);
  if (!value) throw new Error('useUserShopProfile requires UserShopProfileProvider');
  return value;
}

export function UserShopProfileProvider({ children }: PropsWithChildren) {
  const { user, guest } = useAuth();
  return <ProfileSession key={user?.id ?? (guest ? "guest" : "signed-out")}>{children}</ProfileSession>;
}
