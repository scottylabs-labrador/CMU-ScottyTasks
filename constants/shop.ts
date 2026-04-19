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

// Updated Defaults
export const DEFAULT_BACKGROUND_ID = "background-default";
export const DEFAULT_DOG_HOUSE_ID = "blue-house"; // Changed to Blue House
export const DEFAULT_TOY_ID = "toy-tennis";
export const STARTING_COINS = 20;

export const backgroundSceneSources: Record<string, ImageSourcePropType> = {
  [DEFAULT_BACKGROUND_ID]: require("@/assets/images/default_background.png"),
  "background-sunset": require("@/assets/images/background-sunset-scene.jpg"),
  "background-night": require("@/assets/images/background-night-scene.jpg"),
  "background-park": require("@/assets/images/background-park-scene.jpg"),
  "background-dorm": require("@/assets/images/background-dorm-scene.jpg"),
  "background-festival": require("@/assets/images/background-festival-scene.jpg"),
};

// Updated Dog House SVG Mappings
export const dogHouseSources: Record<string, ImageSourcePropType> = {
  "blue-house": require("@/assets/images/blue_house.svg"),
  "green-house": require("@/assets/images/green_house.svg"),
  "brown-house": require("@/assets/images/brown_house.svg"),
  "yellow-house": require("@/assets/images/yellow_house.svg"),
  "white-house": require("@/assets/images/white_house.svg"),
  "red-house": require("@/assets/images/red_house.svg"),
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
        id: "blue-house",
        label: "Blue House",
        price: 0, // Default house is free
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
        label: "Default",
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