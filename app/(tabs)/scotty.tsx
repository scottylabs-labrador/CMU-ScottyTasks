import React from "react";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  UI_COLORS,
  INITIAL_BADGES,
  calculateLevel,
} from "@/constants/gamification";
import {
  backgroundSceneSources,
  DEFAULT_BACKGROUND_ID,
  DEFAULT_DOG_HOUSE_ID,
  DEFAULT_TOY_ID,
  dogHouseSources,
  toySources,
} from "@/constants/shop";
import { useUserShopProfile } from "@/hooks/useUserShopProfile";
import { auth, signOut } from "@/config/firebase";
import ScottyHeader from "@/components/ScottyHeader";
import ScottyDog from "@/components/ScottyDog";
import XPBar from "@/components/XPBar";

export default function ProfileScreen() {
  const router = useRouter();
  const { profile } = useUserShopProfile();
  const level = calculateLevel(profile.xp);

  const backgroundSource =
    backgroundSceneSources[
      profile.equippedBackgroundId ?? DEFAULT_BACKGROUND_ID
    ] ?? backgroundSceneSources[DEFAULT_BACKGROUND_ID];
  const dogHouseSource =
    dogHouseSources[profile.equippedDogHouseId ?? DEFAULT_DOG_HOUSE_ID] ??
    dogHouseSources[DEFAULT_DOG_HOUSE_ID];
  const toySource =
    toySources[profile.equippedToyId ?? DEFAULT_TOY_ID] ??
    toySources[DEFAULT_TOY_ID];

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
            router.replace("/login");
          } catch (e) {
            Alert.alert("Error", "Could not log out");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScottyHeader title="Student Profile" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Character Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroAvatarBox}>
            <ScottyDog size={84} animated={true} />
          </View>
          <Text style={styles.heroName}>Scotty Jr.</Text>
          <Text style={styles.heroSubtitle}>CMU CS &apos;27 · Pittsburgh, PA</Text>

          <View style={styles.heroXPWrapper}>
            <XPBar totalXP={profile.xp} level={level} />
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: UI_COLORS.cmuGold }]}>
              {profile.xp.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>TOTAL XP</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: UI_COLORS.streakOrange }]}>
              {profile.streak} 🔥
            </Text>
            <Text style={styles.statLabel}>DAY STREAK</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: UI_COLORS.xpGreen }]}>
              {profile.tasksCompleted}
            </Text>
            <Text style={styles.statLabel}>TASKS DONE</Text>
          </View>
        </View>

        {/* Virtual Pet Scene & Shop Launcher */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>SCOTTY&apos;S HOME &amp; YARD</Text>
          <TouchableOpacity
            style={styles.shopLinkBtn}
            onPress={() => router.push("/(tabs)/shop")}
          >
            <Text style={styles.shopLinkText}>Open Shop 🛍️</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.petSceneContainer}
          onPress={() => router.push("/(tabs)/shop")}
          activeOpacity={0.9}
        >
          <ImageBackground
            source={backgroundSource}
            style={styles.sceneBackground}
            imageStyle={{ borderRadius: 20 }}
            resizeMode="cover"
          >
            <View style={styles.sceneOverlay}>
              {/* Dog House in background */}
              <ExpoImage
                source={dogHouseSource}
                style={styles.sceneHouse}
                contentFit="contain"
              />

              {/* Scotty dog in foreground */}
              <ExpoImage
                source={require("@/assets/images/scotty.svg")}
                style={styles.sceneDog}
                contentFit="contain"
              />

              {/* Toy */}
              <ExpoImage
                source={toySource}
                style={styles.sceneToy}
                contentFit="contain"
              />

              <View style={styles.sceneBadge}>
                <Ionicons name="bag-handle" size={14} color="#FFFFFF" />
                <Text style={styles.sceneBadgeText}>
                  Customize Yard ({profile.coins} 🪙)
                </Text>
              </View>
            </View>
          </ImageBackground>
        </TouchableOpacity>

        {/* Badges & Achievements Grid */}
        <Text style={[styles.sectionHeader, { marginTop: 24, marginBottom: 12 }]}>
          BADGES &amp; ACHIEVEMENTS
        </Text>
        <View style={styles.badgesGrid}>
          {INITIAL_BADGES.map((badge) => (
            <View
              key={badge.id}
              style={[
                styles.badgeCard,
                badge.earned && styles.badgeCardEarned,
              ]}
            >
              <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
              <Text style={styles.badgeLabel}>{badge.label}</Text>
              <Text style={styles.badgeStatus}>
                {badge.earned ? "Unlocked" : "Locked"}
              </Text>
            </View>
          ))}
        </View>

        {/* Settings & Logout */}
        <Text style={[styles.sectionHeader, { marginTop: 24, marginBottom: 12 }]}>
          ACCOUNT
        </Text>
        <View style={styles.settingsMenu}>
          <TouchableOpacity
            style={styles.settingsItem}
            onPress={() => Alert.alert("Canvas Integration", "Coming soon in next release!")}
          >
            <Text style={styles.settingsItemText}>Canvas LMS Sync</Text>
            <Ionicons name="chevron-forward" size={18} color={UI_COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsItem}
            onPress={() => Alert.alert("Notifications", "Daily reminders are active.")}
          >
            <Text style={styles.settingsItemText}>Study Notifications</Text>
            <Ionicons name="chevron-forward" size={18} color={UI_COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingsItem, { borderBottomWidth: 0 }]}
            onPress={handleLogout}
          >
            <Text style={[styles.settingsItemText, { color: "#F87171" }]}>
              Log Out of ScottyTasks
            </Text>
            <Ionicons name="log-out-outline" size={18} color="#F87171" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_COLORS.bgWarm,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  heroCard: {
    alignItems: "center",
    backgroundColor: UI_COLORS.bgCard,
    borderColor: "rgba(196, 18, 48, 0.4)",
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  heroAvatarBox: {
    marginBottom: 8,
  },
  heroName: {
    fontSize: 22,
    fontWeight: "900",
    color: UI_COLORS.textPrimary,
  },
  heroSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: UI_COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 16,
  },
  heroXPWrapper: {
    width: "100%",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: UI_COLORS.textMuted,
    letterSpacing: 0.5,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "800",
    color: UI_COLORS.textMuted,
    letterSpacing: 1,
  },
  shopLinkBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(196, 18, 48, 0.2)",
    borderColor: UI_COLORS.cmuRed,
    borderWidth: 1,
    borderRadius: 12,
  },
  shopLinkText: {
    fontSize: 11,
    fontWeight: "800",
    color: UI_COLORS.cmuRed,
  },
  petSceneContainer: {
    height: 180,
    borderRadius: 20,
    overflow: "hidden",
    borderColor: UI_COLORS.border,
    borderWidth: 1,
  },
  sceneBackground: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  sceneOverlay: {
    flex: 1,
    position: "relative",
    justifyContent: "flex-end",
    padding: 12,
  },
  sceneHouse: {
    position: "absolute",
    right: 10,
    bottom: 30,
    width: 110,
    height: 110,
  },
  sceneDog: {
    position: "absolute",
    left: 24,
    bottom: 20,
    width: 80,
    height: 80,
  },
  sceneToy: {
    position: "absolute",
    left: 100,
    bottom: 15,
    width: 36,
    height: 36,
  },
  sceneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sceneBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  badgeCard: {
    width: "31%",
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    opacity: 0.45,
  },
  badgeCardEarned: {
    opacity: 1,
    borderColor: "rgba(255, 184, 0, 0.5)",
    backgroundColor: "rgba(255, 184, 0, 0.08)",
  },
  badgeEmoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: UI_COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 2,
  },
  badgeStatus: {
    fontSize: 9,
    fontWeight: "700",
    color: UI_COLORS.textMuted,
  },
  settingsMenu: {
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    borderRadius: 18,
    overflow: "hidden",
  },
  settingsItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: UI_COLORS.border,
  },
  settingsItemText: {
    fontSize: 14,
    fontWeight: "700",
    color: UI_COLORS.textPrimary,
  },
});
