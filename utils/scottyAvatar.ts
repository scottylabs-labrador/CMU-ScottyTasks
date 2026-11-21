import { shopItemsById, type UserShopProfile } from "@/constants/shop";
const PREFIX = "scotty-avatar:";
export function createScottyAvatar(profile: UserShopProfile): string {
  return PREFIX + encodeURIComponent(JSON.stringify({ hat: profile.equippedHatId ?? "", glasses: profile.equippedGlassesId ?? "" }));
}
export function readScottyAvatar(value?: string) {
  if (!value?.startsWith(PREFIX)) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(value.slice(PREFIX.length)));
    const hat = typeof parsed.hat === "string" && shopItemsById[parsed.hat]?.category === "hats" ? parsed.hat : "";
    const glasses = typeof parsed.glasses === "string" && shopItemsById[parsed.glasses]?.category === "glasses" ? parsed.glasses : "";
    return { equippedHatId: hat, equippedGlassesId: glasses };
  } catch { return null; }
}
