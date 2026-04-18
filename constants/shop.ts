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
export const STARTING_COINS = 20;

export const backgroundSources: Record<string, ImageSourcePropType> = {
  [DEFAULT_BACKGROUND_ID]: require("@/assets/images/scottyBackground.png"),
  "background-sunset": require("@/assets/images/background-sunset.png"),
  "background-night": require("@/assets/images/background-night.png"),
  "background-park": require("@/assets/images/background-park.png"),
  "background-dorm": require("@/assets/images/background-dorm.png"),
  "background-festival": require("@/assets/images/background-festival.png"),
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
        image: require("@/assets/images/doghouse-starter.png"),
      },
      {
        id: "doghouse-cozy",
        label: "Cozy",
        price: 5,
        category: "dogHouses",
        image: require("@/assets/images/doghouse-cozy.png"),
      },
      {
        id: "doghouse-cabin",
        label: "Cabin",
        price: 7,
        category: "dogHouses",
        image: require("@/assets/images/doghouse-cabin.png"),
      },
      {
        id: "doghouse-sunrise",
        label: "Sunrise",
        price: 9,
        category: "dogHouses",
        image: require("@/assets/images/doghouse-sunrise.png"),
      },
      {
        id: "doghouse-skyline",
        label: "Skyline",
        price: 11,
        category: "dogHouses",
        image: require("@/assets/images/doghouse-skyline.png"),
      },
      {
        id: "doghouse-deluxe",
        label: "Deluxe",
        price: 14,
        category: "dogHouses",
        image: require("@/assets/images/doghouse-deluxe.png"),
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
        image: require("@/assets/images/toy-tennis.png"),
      },
      {
        id: "toy-bone",
        label: "Bone",
        price: 3,
        category: "toys",
        image: require("@/assets/images/toy-bone.png"),
      },
      {
        id: "toy-rope",
        label: "Rope",
        price: 4,
        category: "toys",
        image: require("@/assets/images/toy-rope.png"),
      },
      {
        id: "toy-frisbee",
        label: "Frisbee",
        price: 5,
        category: "toys",
        image: require("@/assets/images/toy-frisbee.png"),
      },
      {
        id: "toy-squeaky",
        label: "Squeaky",
        price: 6,
        category: "toys",
        image: require("@/assets/images/toy-squeaky.png"),
      },
      {
        id: "toy-plush",
        label: "Plush",
        price: 7,
        category: "toys",
        image: require("@/assets/images/toy-plush.png"),
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
        image: backgroundSources[DEFAULT_BACKGROUND_ID],
        thumbnailMode: "cover",
      },
      {
        id: "background-sunset",
        label: "Sunset",
        price: 4,
        category: "backgrounds",
        image: backgroundSources["background-sunset"],
        thumbnailMode: "cover",
      },
      {
        id: "background-night",
        label: "Night",
        price: 6,
        category: "backgrounds",
        image: backgroundSources["background-night"],
        thumbnailMode: "cover",
      },
      {
        id: "background-park",
        label: "Park",
        price: 8,
        category: "backgrounds",
        image: backgroundSources["background-park"],
        thumbnailMode: "cover",
      },
      {
        id: "background-dorm",
        label: "Dorm",
        price: 10,
        category: "backgrounds",
        image: backgroundSources["background-dorm"],
        thumbnailMode: "cover",
      },
      {
        id: "background-festival",
        label: "Festival",
        price: 12,
        category: "backgrounds",
        image: backgroundSources["background-festival"],
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
};

export const defaultUserShopProfile: UserShopProfile = {
  coins: STARTING_COINS,
  ownedItems: {
    [DEFAULT_BACKGROUND_ID]: true,
  },
  equippedBackgroundId: DEFAULT_BACKGROUND_ID,
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

  return {
    coins:
      typeof value?.coins === "number" && Number.isFinite(value.coins)
        ? value.coins
        : STARTING_COINS,
    ownedItems,
    equippedBackgroundId,
  };
}
