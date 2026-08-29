import { useEffect, useMemo, useState } from "react";

import {
  auth,
  database,
  onAuthStateChanged,
  onValue,
  ref,
  runTransaction,
  update,
} from "@/config/firebase";
import {
  defaultUserShopProfile,
  normalizeUserShopProfile,
  shopItemsById,
  UserShopProfile,
} from "@/constants/shop";

type PurchaseResult =
  | { ok: true; reason: "purchased" | "owned" }
  | { ok: false; reason: "not-enough-coins" | "no-user" | "invalid-item" | "error" };

export function useUserShopProfile() {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [profile, setProfile] = useState<UserShopProfile>(defaultUserShopProfile);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
      if (!user) {
        setProfile(defaultUserShopProfile);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!uid) {
      setProfile(defaultUserShopProfile);
      setLoading(false);
      return;
    }

    const userRef = ref(database, `users/${uid}`);
    setLoading(true);

    const unsubscribe = onValue(userRef, (snapshot) => {
      const rawValue = snapshot.val() ?? {};
      const normalized = normalizeUserShopProfile(rawValue);
      setProfile(normalized);
      setLoading(false);

      const patch: Partial<UserShopProfile> = {};

      if (typeof rawValue.coins !== "number") {
        patch.coins = normalized.coins;
      }
      if (typeof rawValue.xp !== "number") {
        patch.xp = normalized.xp;
      }
      if (typeof rawValue.streak !== "number") {
        patch.streak = normalized.streak;
      }
      if (typeof rawValue.tasksCompleted !== "number") {
        patch.tasksCompleted = normalized.tasksCompleted;
      }

      if (
        !rawValue.ownedItems ||
        typeof rawValue.ownedItems !== "object" ||
        !rawValue.ownedItems[normalized.equippedBackgroundId] ||
        !rawValue.ownedItems[normalized.equippedDogHouseId] ||
        !rawValue.ownedItems[normalized.equippedToyId] ||
        !rawValue.ownedItems["background-default"]
      ) {
        patch.ownedItems = normalized.ownedItems;
      }

      if (rawValue.equippedBackgroundId !== normalized.equippedBackgroundId) {
        patch.equippedBackgroundId = normalized.equippedBackgroundId;
      }

      if (rawValue.equippedDogHouseId !== normalized.equippedDogHouseId) {
        patch.equippedDogHouseId = normalized.equippedDogHouseId;
      }

      if (rawValue.equippedToyId !== normalized.equippedToyId) {
        patch.equippedToyId = normalized.equippedToyId;
      }

      if (Object.keys(patch).length > 0) {
        void update(userRef, patch);
      }
    });

    return () => unsubscribe();
  }, [uid]);

  const actions = useMemo(
    () => ({
      async addXPAndCoins(
        xpToAdd: number,
        coinsToAdd: number,
        taskCompletedIncrement = false,
      ) {
        if (!uid) {
          // Local fallback for guest
          setProfile((prev) => ({
            ...prev,
            xp: prev.xp + xpToAdd,
            coins: prev.coins + coinsToAdd,
            tasksCompleted: taskCompletedIncrement
              ? prev.tasksCompleted + 1
              : prev.tasksCompleted,
          }));
          return;
        }

        try {
          await runTransaction(ref(database, `users/${uid}`), (currentValue) => {
            const normalized = normalizeUserShopProfile(currentValue ?? {});
            return {
              ...(currentValue ?? {}),
              xp: normalized.xp + xpToAdd,
              coins: normalized.coins + coinsToAdd,
              tasksCompleted: taskCompletedIncrement
                ? normalized.tasksCompleted + 1
                : normalized.tasksCompleted,
            };
          });
        } catch (e) {
          console.error("Error updating user rewards:", e);
        }
      },

      async purchaseItem(itemId: string): Promise<PurchaseResult> {
        if (!uid) {
          // Local fallback for guest
          const item = shopItemsById[itemId];
          if (!item) return { ok: false, reason: "invalid-item" };
          if (profile.ownedItems[itemId]) return { ok: true, reason: "owned" };
          if (profile.coins < item.price) return { ok: false, reason: "not-enough-coins" };

          setProfile((prev) => ({
            ...prev,
            coins: prev.coins - item.price,
            ownedItems: { ...prev.ownedItems, [itemId]: true },
          }));
          return { ok: true, reason: "purchased" };
        }

        const item = shopItemsById[itemId];
        if (!item) {
          return { ok: false, reason: "invalid-item" };
        }

        let wasOwned = false;
        let purchased = false;
        let notEnoughCoins = false;

        try {
          await runTransaction(ref(database, `users/${uid}`), (currentValue) => {
            const normalized = normalizeUserShopProfile(currentValue ?? {});

            if (normalized.ownedItems[itemId]) {
              wasOwned = true;
              return currentValue;
            }

            if (normalized.coins < item.price) {
              notEnoughCoins = true;
              return;
            }

            purchased = true;
            return {
              ...(currentValue ?? {}),
              coins: normalized.coins - item.price,
              ownedItems: {
                ...normalized.ownedItems,
                [itemId]: true,
              },
              equippedBackgroundId: normalized.equippedBackgroundId,
              equippedDogHouseId: normalized.equippedDogHouseId,
              equippedToyId: normalized.equippedToyId,
            };
          });

          if (purchased) {
            return { ok: true, reason: "purchased" };
          }

          if (wasOwned) {
            return { ok: true, reason: "owned" };
          }

          if (notEnoughCoins) {
            return { ok: false, reason: "not-enough-coins" };
          }

          return { ok: false, reason: "error" };
        } catch {
          return { ok: false, reason: "error" };
        }
      },

      async equipItem(itemId: string) {
        const item = shopItemsById[itemId];
        if (!item) return false;

        if (!uid) {
          if (!profile.ownedItems[itemId]) return false;
          setProfile((prev) => {
            if (item.category === "backgrounds") return { ...prev, equippedBackgroundId: itemId };
            if (item.category === "dogHouses") return { ...prev, equippedDogHouseId: itemId };
            if (item.category === "toys") return { ...prev, equippedToyId: itemId };
            return prev;
          });
          return true;
        }

        const currentProfile = profile ?? normalizeUserShopProfile({});
        if (!currentProfile.ownedItems[itemId]) {
          return false;
        }

        const updates: Partial<UserShopProfile> = {};

        if (item.category === "backgrounds") {
          updates.equippedBackgroundId = itemId;
        } else if (item.category === "dogHouses") {
          updates.equippedDogHouseId = itemId;
        } else if (item.category === "toys") {
          updates.equippedToyId = itemId;
        } else {
          return false;
        }

        try {
          await update(ref(database, `users/${uid}`), updates);
          return true;
        } catch {
          return false;
        }
      },
    }),
    [profile, uid],
  );

  return {
    uid,
    profile,
    loading,
    ...actions,
  };
}
