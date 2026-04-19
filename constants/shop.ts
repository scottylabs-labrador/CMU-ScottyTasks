import { ImageSourcePropType } from "react-native";

export type ShopCategory = "dogHouses" | "toys" | "backgrounds";

export type ShopItem = {
  id: string;
  label: string;
  price: number;
  category: ShopCategory;
  image?: ImageSourcePropType;
  thumbnailMode?: "contain" | "cover";
};

export const DEFAULT_BACKGROUND_ID = "background-default";
export const DEFAULT_DOG_HOUSE_ID = "doghouse-starter";
export const DEFAULT_TOY_ID = "toy-tennis";
export const STARTING_COINS = 20;

export const backgroundSceneSources: Record<string, ImageSourcePropType> = {
  [DEFAULT_BACKGROUND_ID]: require("@/assets/images/background-classic-scene.jpg"),
  "background-sunset": require("@/assets/images/background-sunset-scene.jpg"),
  "background-night": require("@/assets/images/background-night-scene.jpg"),
  "background-park": require("@/assets/images/background-park-scene.jpg"),
  "background-dorm": require("@/assets/images/background-dorm-scene.jpg"),
  "background-festival": require("@/assets/images/background-festival-scene.jpg"),
};

export const dogHouseSources: Record<string, ImageSourcePropType> = {
  "doghouse-starter": require("@/assets/images/doghouse-starter-hq.png"),
  "doghouse-cozy": require("@/assets/images/doghouse-cozy-hq.png"),
  "doghouse-cabin": require("@/assets/images/doghouse-cabin-hq.png"),
  "doghouse-sunrise": require("@/assets/images/doghouse-sunrise-hq.png"),
  "doghouse-skyline": require("@/assets/images/doghouse-skyline-hq.png"),
  "doghouse-deluxe": require("@/assets/images/doghouse-deluxe-hq.png"),
};

export const toySources: Record<string, ImageSourcePropType> = {
  "toy-tennis": require("@/assets/images/toy-tennis-hq.png"),
  "toy-bone": require("@/assets/images/toy-bone-hq.png"),
  "toy-rope": require("@/assets/images/toy-rope-hq.png"),
  "toy-frisbee": require("@/assets/images/toy-frisbee-hq.png"),
  "toy-squeaky": require("@/assets/images/toy-squeaky-hq.png"),
  "toy-plush": require("@/assets/images/toy-plush-hq.png"),
};

export const shopSections: {
  title: string;
  category: ShopCategory;
  items: ShopItem[];
}[] = [
  {
    title: "Dog Houses",
    category: "dogHouses",
    items: [
      {
        id: "doghouse-starter",
        label: "Starter",
        price: 3,
        category: "dogHouses",
        image: dogHouseSources["doghouse-starter"],
      },
      {
        id: "doghouse-cozy",
        label: "Cozy",
        price: 5,
        category: "dogHouses",
        image: dogHouseSources["doghouse-cozy"],
      },
      {
        id: "doghouse-cabin",
        label: "Cabin",
        price: 7,
        category: "dogHouses",
        image: dogHouseSources["doghouse-cabin"],
      },
      {
        id: "doghouse-sunrise",
        label: "Sunrise",
        price: 9,
        category: "dogHouses",
        image: dogHouseSources["doghouse-sunrise"],
      },
      {
        id: "doghouse-skyline",
        label: "Skyline",
        price: 11,
        category: "dogHouses",
        image: dogHouseSources["doghouse-skyline"],
      },
      {
        id: "doghouse-deluxe",
        label: "Deluxe",
        price: 14,
        category: "dogHouses",
        image: dogHouseSources["doghouse-deluxe"],
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
        price: 2,
        category: "toys",
        image: toySources["toy-tennis"],
      },
      {
        id: "toy-bone",
        label: "Bone",
        price: 3,
        category: "toys",
        image: toySources["toy-bone"],
      },
      {
        id: "toy-rope",
        label: "Rope",
        price: 4,
        category: "toys",
        image: toySources["toy-rope"],
      },
      {
        id: "toy-frisbee",
        label: "Frisbee",
        price: 5,
        category: "toys",
        image: toySources["toy-frisbee"],
      },
      {
        id: "toy-squeaky",
        label: "Squeaky",
        price: 6,
        category: "toys",
        image: toySources["toy-squeaky"],
      },
      {
        id: "toy-plush",
        label: "Plush",
        price: 7,
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
        id: DEFAULT_BACKGROUND_ID,
        label: "Classic",
        price: 0,
        category: "backgrounds",
        image: backgroundSceneSources[DEFAULT_BACKGROUND_ID],
        thumbnailMode: "cover",
      },
      {
        id: "background-sunset",
        label: "Sunset",
        price: 4,
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

export const shopItemsById: Record<string, ShopItem> = Object.fromEntries(
  shopSections.flatMap((section) => section.items.map((item) => [item.id, item])),
) as Record<string, ShopItem>;

export type UserShopProfile = {
  coins: number;
  ownedItems: Record<string, boolean>;
  equippedBackgroundId: string;
  equippedDogHouseId: string;
  equippedToyId: string;
};

export const defaultUserShopProfile: UserShopProfile = {
  coins: STARTING_COINS,
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
    value?.equippedToyId && ownedItems[value.equippedToyId]
      ? value.equippedToyId
      : DEFAULT_TOY_ID;

  return {
    coins:
      typeof value?.coins === "number" && Number.isFinite(value.coins)
        ? value.coins
        : STARTING_COINS,
    ownedItems,
    equippedBackgroundId,
    equippedDogHouseId,
    equippedToyId,
  };
}
