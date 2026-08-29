import React, { memo } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import {
  DEFAULT_BACKGROUND_ID,
  DEFAULT_DOG_HOUSE_ID,
  DEFAULT_TOY_ID,
  shopSections,
  ShopItem,
} from "@/constants/shop";
import { UI_COLORS } from "@/constants/gamification";
import { useUserShopProfile } from "@/hooks/useUserShopProfile";

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

  return (
    <View style={[styles.card, equipped && styles.cardEquipped]}>
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
            cachePolicy="memory-disk"
          />
        ) : (
          <Text style={styles.textOnlyLabel}>{item.label}</Text>
        )}

        {equipped ? (
          <View style={styles.equippedBadge}>
            <Text style={styles.equippedBadgeText}>In Use</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.cardLabel} numberOfLines={1}>
        {item.label}
      </Text>

      <View style={styles.priceRow}>
        <Text style={styles.priceText}>
          {item.price === 0 ? "Free" : `🪙 ${item.price}`}
        </Text>
      </View>

      {!owned && item.price > 0 ? (
        <Pressable
          disabled={!canAfford}
          onPress={onBuy}
          style={[styles.buyBtn, !canAfford && styles.buyBtnDisabled]}
        >
          <Text style={styles.buyBtnText}>
            {canAfford ? "Buy" : "Need Coins"}
          </Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={onEquip}
          disabled={equipped}
          style={[
            styles.equipBtn,
            equipped && styles.equipBtnDisabled,
          ]}
        >
          <Text style={styles.equipBtnText}>
            {equipped ? "Equipped" : "Equip"}
          </Text>
        </Pressable>
      )}
    </View>
  );
});

export default function ShopScreen() {
  const router = useRouter();
  const { profile, purchaseItem, equipItem } = useUserShopProfile();

  const handlePurchase = async (itemId: string) => {
    const result = await purchaseItem(itemId);

    if (!result.ok) {
      if (result.reason === "not-enough-coins") {
        Alert.alert(
          "Not Enough Coins",
          "Complete more tasks and daily habits to earn coins!"
        );
      } else if (result.reason !== "error") {
        Alert.alert("Unable to Purchase", "Please try again later.");
      }
      return;
    }

    if (result.reason === "purchased") {
      Alert.alert("Purchased! 🎉", "Item added to your Scotty collection.");
    }
  };

  const handleEquip = async (itemId: string) => {
    const equipped = await equipItem(itemId);
    if (!equipped) {
      Alert.alert("Unable to equip", "Please purchase the item first.");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Shop Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.titleText}>Scotty Shop</Text>

        <View style={styles.coinsPill}>
          <Text style={styles.coinsIcon}>🪙</Text>
          <Text style={styles.coinsCount}>{profile.coins}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {shopSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
              <Text style={styles.itemCountText}>
                {section.items.length} items
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardsRow}
            >
              {section.items.map((item) => (
                <ShopCard
                  key={item.id}
                  item={item}
                  owned={
                    Boolean(profile.ownedItems[item.id]) || item.price === 0
                  }
                  equipped={
                    (section.category === "backgrounds" &&
                      (profile.equippedBackgroundId ?? DEFAULT_BACKGROUND_ID) ===
                        item.id) ||
                    (section.category === "dogHouses" &&
                      (profile.equippedDogHouseId ?? DEFAULT_DOG_HOUSE_ID) ===
                        item.id) ||
                    (section.category === "toys" &&
                      (profile.equippedToyId ?? DEFAULT_TOY_ID) === item.id)
                  }
                  canAfford={profile.coins >= item.price}
                  onBuy={() => handlePurchase(item.id)}
                  onEquip={() => handleEquip(item.id)}
                />
              ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_COLORS.bgWarm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: UI_COLORS.border,
  },
  backBtn: {
    padding: 6,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "900",
    color: UI_COLORS.textPrimary,
  },
  coinsPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  coinsIcon: {
    fontSize: 14,
  },
  coinsCount: {
    fontSize: 14,
    fontWeight: "800",
    color: UI_COLORS.cmuGold,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 60,
  },
  section: {
    marginBottom: 26,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: UI_COLORS.textMuted,
    letterSpacing: 1,
  },
  itemCountText: {
    fontSize: 11,
    fontWeight: "600",
    color: UI_COLORS.textMuted,
  },
  cardsRow: {
    gap: 12,
    paddingBottom: 4,
  },
  card: {
    width: 140,
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 10,
    alignItems: "center",
  },
  cardEquipped: {
    borderColor: UI_COLORS.cmuRed,
    backgroundColor: "rgba(196, 18, 48, 0.08)",
  },
  cardInner: {
    width: "100%",
    height: 100,
    borderRadius: 14,
    backgroundColor: UI_COLORS.bgWarm,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
    marginBottom: 8,
  },
  objectCardInner: {
    padding: 8,
  },
  backgroundCardInner: {
    padding: 0,
  },
  cardImage: {
    width: "80%",
    height: "80%",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
  },
  textOnlyLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: UI_COLORS.textPrimary,
  },
  equippedBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: UI_COLORS.cmuRed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  equippedBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: UI_COLORS.textPrimary,
    marginBottom: 4,
    textAlign: "center",
  },
  priceRow: {
    marginBottom: 8,
  },
  priceText: {
    fontSize: 11,
    fontWeight: "800",
    color: UI_COLORS.cmuGold,
  },
  buyBtn: {
    width: "100%",
    backgroundColor: UI_COLORS.cmuRed,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: "center",
  },
  buyBtnDisabled: {
    backgroundColor: UI_COLORS.bgElevated,
    opacity: 0.6,
  },
  buyBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  equipBtn: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: "center",
  },
  equipBtnDisabled: {
    backgroundColor: "rgba(196, 18, 48, 0.2)",
    borderColor: UI_COLORS.cmuRed,
  },
  equipBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
