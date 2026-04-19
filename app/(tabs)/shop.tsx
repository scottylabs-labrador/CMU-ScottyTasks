import React, { memo } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import {
  DEFAULT_BACKGROUND_ID,
  shopSections,
  ShopItem,
} from "@/constants/shop";
import { useUserShopProfile } from "@/hooks/useUserShopProfile";
import { useHideAndroidNavBar } from "@/hooks/useHideAndroidNavBar";

const PriceBadge = memo(function PriceBadge({ value }: { value: number }) {
  return (
    <View style={styles.priceBadge}>
      <Text style={styles.coin}>C</Text>
      <Text style={styles.priceText}>{value}</Text>
    </View>
  );
});

const ShopCard = memo(function ShopCard({
  item,
  owned,
  equipped,
  canAfford,
  onBuy,
  onEquip,
}: {
  item: ShopItem;
  owned: boolean;
  equipped: boolean;
  canAfford: boolean;
  onBuy: () => void;
  onEquip: () => void;
}) {
  const isBackground = item.category === "backgrounds";
  const showEquip = owned;

  return (
    <View style={styles.card}>
      <View
        style={[
          styles.cardInner,
          isBackground ? styles.backgroundCardInner : styles.objectCardInner,
        ]}
      >
        {item.image ? (
          <ExpoImage
            source={item.image}
            style={[styles.cardImage, isBackground && styles.backgroundImage]}
            contentFit={item.thumbnailMode ?? "contain"}
            transition={100}
            cachePolicy="memory-disk"
          />
        ) : (
          <Text style={styles.textOnlyLabel}>{item.label}</Text>
        )}
        {equipped ? (
          <View style={styles.equippedBadge}>
            <Text style={styles.equippedBadgeText}>Using</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.cardLabel}>{item.label}</Text>
      <PriceBadge value={item.price} />
      <Pressable
        disabled={owned || !canAfford}
        onPress={onBuy}
        style={[
          styles.actionButton,
          (owned || !canAfford) && styles.actionButtonDisabled,
        ]}
      >
        <Text style={styles.actionButtonText}>
          {owned ? "Owned" : canAfford ? "Buy" : "Need coins"}
        </Text>
      </Pressable>
      {showEquip ? (
        <Pressable
          onPress={onEquip}
          disabled={equipped}
          style={[
            styles.secondaryButton,
            equipped && styles.secondaryButtonDisabled,
          ]}
        >
          <Text style={styles.secondaryButtonText}>
            {equipped ? "Equipped" : "Equip"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
});

export default function ShopScreen() {
  useHideAndroidNavBar();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, purchaseItem, equipItem } = useUserShopProfile();

  const handlePurchase = async (itemId: string) => {
    const result = await purchaseItem(itemId);

    if (!result.ok) {
      if (result.reason === "not-enough-coins") {
        Alert.alert("Not enough coins", "Complete tasks or save coins before buying this item.");
      } else if (result.reason !== "error") {
        Alert.alert("Unable to purchase", "Please try again.");
      }
      return;
    }

    if (result.reason === "purchased") {
      Alert.alert("Purchased", "Item added to your collection.");
    }
  };

  const handleEquip = async (itemId: string) => {
    const equipped = await equipItem(itemId);
    if (!equipped) {
      Alert.alert("Unable to equip", "Purchase the item first.");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 96 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Return to Scotty"
            onPress={() => router.replace("/(tabs)/scotty")}
            style={styles.headerButton}
          >
            <Ionicons name="arrow-back" size={18} color="#9d5a39" />
          </Pressable>
          <ExpoImage
            source={require("@/assets/images/ScottyLogo.png")}
            style={styles.headerLogo}
            contentFit="contain"
          />
          <View style={styles.coinsChip}>
            <Text style={styles.coinsChipText}>{profile?.coins ?? 0} coins</Text>
          </View>
        </View>

        {shopSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.divider} />
            <View style={styles.rowShell}>
              <Text style={styles.arrow}>{"<"}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rowContent}
              >
                {section.items.map((item) => (
                  <ShopCard
                    key={item.id}
                    item={item}
                    owned={Boolean(profile?.ownedItems[item.id])}
                    equipped={
                      (section.category === "backgrounds" &&
                        (profile?.equippedBackgroundId ?? DEFAULT_BACKGROUND_ID) === item.id) ||
                      (section.category === "dogHouses" &&
                        profile?.equippedDogHouseId === item.id) ||
                      (section.category === "toys" &&
                        profile?.equippedToyId === item.id)
                    }
                    canAfford={(profile?.coins ?? 0) >= item.price}
                    onBuy={() => handlePurchase(item.id)}
                    onEquip={() => handleEquip(item.id)}
                  />
                ))}
              </ScrollView>
              <Text style={styles.arrow}>{">"}</Text>
            </View>
            <View style={styles.divider} />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f2ec",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 14,
    gap: 18,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerButton: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "#fff7ef",
    borderWidth: 2,
    borderColor: "#cc6e47",
    alignItems: "center",
    justifyContent: "center",
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#9d5a39",
  },
  headerLogo: {
    width: 180,
    height: 54,
  },
  coinsChip: {
    minWidth: 90,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#fff1ba",
    alignItems: "center",
  },
  coinsChipText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#9b6b00",
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#c7633f",
  },
  divider: {
    height: 4,
    backgroundColor: "#cc6e47",
  },
  rowShell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  arrow: {
    fontSize: 26,
    color: "#4d4d4d",
    width: 16,
    textAlign: "center",
  },
  rowContent: {
    gap: 12,
    paddingHorizontal: 4,
    alignItems: "flex-start",
  },
  card: {
    width: 124,
    alignItems: "center",
    gap: 6,
  },
  cardInner: {
    width: 120,
    height: 112,
    borderWidth: 3,
    borderColor: "#cc6e47",
    backgroundColor: "#fff8f1",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  backgroundCardInner: {
    padding: 0,
    backgroundColor: "#f3e6db",
  },
  objectCardInner: {
    padding: 10,
  },
  cardImage: {
    width: 96,
    height: 96,
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
  },
  equippedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(99, 56, 35, 0.88)",
  },
  equippedBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff6ef",
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#76513d",
    textAlign: "center",
    minHeight: 30,
  },
  textOnlyLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "center",
    color: "#1b1b1b",
  },
  priceBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 36,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#fff1ba",
  },
  coin: {
    fontSize: 12,
    fontWeight: "900",
    color: "#b88000",
  },
  priceText: {
    marginLeft: 2,
    fontSize: 11,
    fontWeight: "800",
    color: "#f1a000",
  },
  actionButton: {
    minWidth: 76,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#cc6e47",
    alignItems: "center",
  },
  actionButtonDisabled: {
    opacity: 0.55,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#fff",
  },
  secondaryButton: {
    minWidth: 76,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#cc6e47",
    backgroundColor: "#fff7ef",
    alignItems: "center",
  },
  secondaryButtonDisabled: {
    opacity: 0.6,
  },
  secondaryButtonText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#9d5a39",
  },
});
