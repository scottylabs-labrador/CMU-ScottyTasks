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
  normalizeUserShopProfile,
  shopItemsById,
  UserShopProfile,
} from "@/constants/shop";

type PurchaseResult =
  | { ok: true; reason: "purchased" | "owned" }
  | { ok: false; reason: "not-enough-coins" | "no-user" | "invalid-item" | "error" };

export function useUserShopProfile() {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [profile, setProfile] = useState<UserShopProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!uid) {
      setProfile(null);
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
      async purchaseItem(itemId: string): Promise<PurchaseResult> {
        if (!uid) {
          return { ok: false, reason: "no-user" };
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
        if (!uid) {
          return false;
        }

        const item = shopItemsById[itemId];
        if (!item) {
          return false;
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
