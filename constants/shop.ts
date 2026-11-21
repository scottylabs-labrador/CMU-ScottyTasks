import { ImageSourcePropType } from "react-native";
import { type ToyPosition } from '@/utils/toyPosition';

export type ShopCategory = "dogHouses" | "toys" | "backgrounds" | "hats" | "glasses";
export type ShopImageSource = Exclude<ImageSourcePropType, readonly unknown[]>;

export type ShopItem = {
  id: string;
  label: string;
  price: number;
  category: ShopCategory;
  image?: ShopImageSource;
  thumbnailMode?: "contain" | "cover";
};

// Updated Defaults
export const DEFAULT_BACKGROUND_ID = "background-default";
export const DEFAULT_DOG_HOUSE_ID = "blue-house";
export const DEFAULT_TOY_ID = "toy-tennis";
export const STARTING_COINS = 25;
export const STARTING_XP = 9650;
export const STARTING_STREAK = 21;

export const backgroundSceneSources: Record<string, ShopImageSource> = {};

export const dogHouseSources: Record<string, ShopImageSource> = {};

export const toySources: Record<string, ShopImageSource> = {
  "toy-tennis": require("@/assets/images/shop_items/toy-tennis-hq.png"),
  "toy-frisbee": require("@/assets/images/shop_items/toy-frisbee-hq.png"),
  "toy-squeaky": require("@/assets/images/shop_items/toy-squeaky-hq.png"),
  "toy-plush": require("@/assets/images/shop_items/toy-plush-hq.png"),
};

const legacyShopSections: {
  title: string;
  category: ShopCategory;
  items: ShopItem[];
}[] = [
  {
    title: "Dog Houses",
    category: "dogHouses",
    items: [
      {
        id: "blue-house",
        label: "Blue House",
        price: 0,
        category: "dogHouses",
        image: dogHouseSources["blue-house"],
      },
      {
        id: "green-house",
        label: "Green House",
        price: 5,
        category: "dogHouses",
        image: dogHouseSources["green-house"],
      },
      {
        id: "brown-house",
        label: "Brown House",
        price: 5,
        category: "dogHouses",
        image: dogHouseSources["brown-house"],
      },
      {
        id: "yellow-house",
        label: "Yellow House",
        price: 8,
        category: "dogHouses",
        image: dogHouseSources["yellow-house"],
      },
      {
        id: "white-house",
        label: "White House",
        price: 8,
        category: "dogHouses",
        image: dogHouseSources["white-house"],
      },
      {
        id: "red-house",
        label: "Red House",
        price: 12,
        category: "dogHouses",
        image: dogHouseSources["red-house"],
      },
    ],
  },
  {
    title: "Toys",
    category: "toys",
    items: [
      {
        id: "toy-tennis",
        label: "Tennis Ball",
        price: 0,
        category: "toys",
        image: toySources["toy-tennis"],
      },
      {
        id: "toy-frisbee",
        label: "Frisbee",
        price: 6,
        category: "toys",
        image: toySources["toy-frisbee"],
      },
      {
        id: "toy-squeaky",
        label: "Squeaky Toy",
        price: 7,
        category: "toys",
        image: toySources["toy-squeaky"],
      },
      {
        id: "toy-plush",
        label: "Plush Bear",
        price: 10,
        category: "toys",
        image: toySources["toy-plush"],
      },
    ],
  },
  {
    title: "Backgrounds",
    category: "backgrounds",
    items: [
      {
        id: "background-default",
        label: "Classic Lawn",
        price: 0,
        category: "backgrounds",
        image: backgroundSceneSources[DEFAULT_BACKGROUND_ID],
        thumbnailMode: "cover",
      },
      {
        id: "background-sunset",
        label: "Sunset",
        price: 5,
        category: "backgrounds",
        image: backgroundSceneSources["background-sunset"],
        thumbnailMode: "cover",
      },
      {
        id: "background-night",
        label: "Night",
        price: 6,
        category: "backgrounds",
        image: backgroundSceneSources["background-night"],
        thumbnailMode: "cover",
      },
      {
        id: "background-park",
        label: "Park",
        price: 8,
        category: "backgrounds",
        image: backgroundSceneSources["background-park"],
        thumbnailMode: "cover",
      },
      {
        id: "background-dorm",
        label: "Dorm",
        price: 10,
        category: "backgrounds",
        image: backgroundSceneSources["background-dorm"],
        thumbnailMode: "cover",
      },
      {
        id: "background-festival",
        label: "Festival",
        price: 12,
        category: "backgrounds",
        image: backgroundSceneSources["background-festival"],
        thumbnailMode: "cover",
      },
    ],
  },
];

export const shopSections: { title: string; category: 'hats' | 'glasses' | 'toys'; items: ShopItem[] }[] = [
  { title: 'Hats', category: 'hats', items: [
    { id: 'hat-baseball', label: 'Baseball Cap', price: 100, category: 'hats', image: require('@/assets/images/shop_items/hat_baseball.png') },
    { id: 'hat-graduation', label: 'Graduation Cap', price: 100, category: 'hats', image: require('@/assets/images/shop_items/hat_graduation.png') },
  ] },
  { title: 'Glasses', category: 'glasses', items: [
    { id: 'glasses-clear', label: 'Round Glasses', price: 100, category: 'glasses', image: require('@/assets/images/shop_items/glasses_clear.png') },
    { id: 'glasses-dark', label: 'Sunglasses', price: 100, category: 'glasses', image: require('@/assets/images/shop_items/glasses_dark.png') },
  ] },
  { title: 'Toys', category: 'toys', items: legacyShopSections.find(section => section.category === 'toys')!.items },
];

// Internal balance field remains `coins` so existing accounts keep their balances.
export const BONE_IMAGE = require('@/assets/images/shop_item_bone.png');

export const shopItemsById: Record<string, ShopItem> = Object.fromEntries(
  shopSections.flatMap((section) => section.items.map((item) => [item.id, item])),
) as Record<string, ShopItem>;

export type UserShopProfile = {
  coins: number;
  xp: number;
  streak: number;
  tasksCompleted: number;
  avatarUrl?: string;
  happiness: number;
  lastFedAt: number;
  ownedItems: Record<string, boolean>;
  equippedBackgroundId: string;
  equippedDogHouseId: string;
  equippedToyId: string;
  toyPositions?: Record<string, ToyPosition>;
  equippedHatId?: string;
  equippedGlassesId?: string;
};

export const defaultUserShopProfile: UserShopProfile = {
  coins: STARTING_COINS,
  xp: STARTING_XP,
  streak: STARTING_STREAK,
  tasksCompleted: 47,
  avatarUrl: undefined,
  happiness: 85,
  lastFedAt: Date.now(),
  ownedItems: {
    [DEFAULT_BACKGROUND_ID]: true,
    [DEFAULT_DOG_HOUSE_ID]: true,
    [DEFAULT_TOY_ID]: true,
  },
  equippedBackgroundId: DEFAULT_BACKGROUND_ID,
  equippedDogHouseId: DEFAULT_DOG_HOUSE_ID,
  equippedToyId: DEFAULT_TOY_ID,
};

export function normalizeUserShopProfile(
  value: Partial<UserShopProfile> | null | undefined,
): UserShopProfile {
  const ownedItems = {
    ...defaultUserShopProfile.ownedItems,
    ...(value?.ownedItems ?? {}),
  };

  const equippedBackgroundId =
    value?.equippedBackgroundId && ownedItems[value.equippedBackgroundId]
      ? value.equippedBackgroundId
      : DEFAULT_BACKGROUND_ID;

  const equippedDogHouseId =
    value?.equippedDogHouseId && ownedItems[value.equippedDogHouseId]
      ? value.equippedDogHouseId
      : DEFAULT_DOG_HOUSE_ID;

  const equippedToyId =
    value?.equippedToyId && ownedItems[value.equippedToyId] && shopItemsById[value.equippedToyId]?.category === 'toys'
      ? value.equippedToyId
      : DEFAULT_TOY_ID;

  return {
    coins:
      typeof value?.coins === "number" && Number.isFinite(value.coins)
        ? value.coins
        : STARTING_COINS,
    xp:
      typeof value?.xp === "number" && Number.isFinite(value.xp)
        ? value.xp
        : STARTING_XP,
    streak:
      typeof value?.streak === "number" && Number.isFinite(value.streak)
        ? value.streak
        : STARTING_STREAK,
    tasksCompleted:
      typeof value?.tasksCompleted === "number" && Number.isFinite(value.tasksCompleted)
        ? value.tasksCompleted
        : 47,
    avatarUrl: typeof value?.avatarUrl === "string" ? value.avatarUrl : undefined,
    happiness:
      typeof value?.happiness === "number" && Number.isFinite(value.happiness)
        ? Math.min(100, Math.max(0, value.happiness))
        : 85,
    lastFedAt:
      typeof value?.lastFedAt === "number" && Number.isFinite(value.lastFedAt)
        ? value.lastFedAt
        : Date.now(),
    ownedItems,
    equippedBackgroundId,
    equippedDogHouseId,
    equippedToyId,
    toyPositions: value?.toyPositions && typeof value.toyPositions === 'object' ? value.toyPositions : {},
    equippedHatId: value?.equippedHatId && ownedItems[value.equippedHatId] && shopItemsById[value.equippedHatId]?.category === 'hats' ? value.equippedHatId : undefined,
    equippedGlassesId: value?.equippedGlassesId && ownedItems[value.equippedGlassesId] && shopItemsById[value.equippedGlassesId]?.category === 'glasses' ? value.equippedGlassesId : undefined,
  };
}
