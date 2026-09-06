import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import ScreenContainer from "@/components/ui/ScreenContainer";
import ScreenTitle from "@/components/ui/ScreenTitle";
import Avatar from "@/components/ui/Avatar";
import PetYardScene from "@/components/profile/PetYardScene";
import ProfileDetailModal from "@/components/profile/ProfileDetailModal";
import { useUserShopProfile } from "@/hooks/useUserShopProfile";
import { auth, signOut, storage, storageRef, uploadBytes, getDownloadURL } from "@/config/firebase";
import { UI_COLORS } from "@/constants/gamification";
import { fontSize, fontWeight, radii, spacing } from "@/constants/tokens";

export default function ScottyScreen() {
  const router = useRouter();
  const { profile, updateAvatar, uid } = useUserShopProfile();
  const [modalVisible, setModalVisible] = useState(false);

  const handleAvatarUpload = async (uri: string) => {
    try {
      // Attempt Firebase Storage upload if available
      if (storage && uid) {
        const response = await fetch(uri);
        const blob = await response.blob();
        const fileRef = storageRef(storage, `avatars/${uid}_${Date.now()}.jpg`);
        await uploadBytes(fileRef, blob);
        const downloadUrl = await getDownloadURL(fileRef);
        await updateAvatar(downloadUrl);
      } else {
        // Fallback: save local URI directly
        await updateAvatar(uri);
      }
      Alert.alert("Success! 🎉", "Profile photo updated successfully.");
    } catch {
      // Fallback: save local URI if network/storage error
      try {
        await updateAvatar(uri);
        Alert.alert("Success! 🎉", "Profile photo updated successfully.");
      } catch {
        Alert.alert("Error", "Could not save profile photo.");
      }
    }
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            setModalVisible(false);
            await signOut(auth);
            router.replace("/login");
          } catch {
            Alert.alert("Error", "Could not log out");
          }
        },
      },
    ]);
  };

  return (
    <ScreenContainer>
      <ScreenTitle
        title="My Scotty"
        rightSlot={
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Open profile and settings"
          >
            <Avatar
              imageUri={profile.avatarUrl}
              size={40}
              showBorder
              borderColor={UI_COLORS.cmuRed}
            />
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        {/* Dominant Pet Yard Scene */}
        <View style={styles.sceneWrapper}>
          <PetYardScene
            profile={profile}
            onOpenShop={() => router.push("/(tabs)/shop")}
            height={420}
          />
        </View>

        {/* Action Controls */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => router.push("/(tabs)/shop")}
            activeOpacity={0.85}
          >
            <Ionicons name="bag-handle" size={20} color="#FFFFFF" />
            <Text style={styles.shopBtnText}>Shop &amp; Wardrobe</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="person-circle-outline" size={20} color={UI_COLORS.textPrimary} />
            <Text style={styles.profileBtnText}>My Stats</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Detail Modal */}
      <ProfileDetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        profile={profile}
        onAvatarUpload={handleAvatarUpload}
        onLogout={handleLogout}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 100,
    justifyContent: "space-between",
  },
  sceneWrapper: {
    flex: 1,
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  shopBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: UI_COLORS.cmuRed,
    paddingVertical: spacing.lg,
    borderRadius: radii.xxl,
    shadowColor: UI_COLORS.cmuRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shopBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.extrabold,
    color: "#FFFFFF",
  },
  profileBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    paddingVertical: spacing.lg,
    borderRadius: radii.xxl,
  },
  profileBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textPrimary,
  },
});
