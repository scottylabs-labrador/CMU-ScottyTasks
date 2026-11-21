import { shopItemsById, type UserShopProfile } from '@/constants/shop';

export function getPlacedToyIds(profile: UserShopProfile): string[] {
  return [...new Set([profile.equippedToyId, ...Object.keys(profile.toyPositions ?? {})])]
    .filter(id => shopItemsById[id]?.category === 'toys' && !!profile.ownedItems[id]);
}
