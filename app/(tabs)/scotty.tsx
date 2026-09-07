import React, { useState } from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";

import ScreenContainer from "@/components/ui/ScreenContainer";
import ScreenTitle from "@/components/ui/ScreenTitle";
import Avatar from "@/components/ui/Avatar";
import PetYardScene from "@/components/profile/PetYardScene";
import PetHappinessCard from "@/components/profile/PetHappinessCard";
import ProfileDetailModal from "@/components/profile/ProfileDetailModal";
import { useUserShopProfile } from "@/hooks/useUserShopProfile";
import { auth, signOut, storage, storageRef, uploadBytes, getDownloadURL } from "@/config/firebase";
import { UI_COLORS } from "@/constants/gamification";
import { spacing } from "@/constants/tokens";

export default function ScottyScreen() {
  const router = useRouter();
  const {
    profile,
    updateAvatar,
    uid,
    effectiveHappiness,
    mood,
    petScotty,
  } = useUserShopProfile();
  const [modalVisible, setModalVisible] = useState(false);

  const handleAvatarUpload = async (uri: string) => {
    try {
      if (storage && uid) {
        const response = await fetch(uri);
        const blob = await response.blob();
        const fileRef = storageRef(storage, `avatars/${uid}_${Date.now()}.jpg`);
        await uploadBytes(fileRef, blob);
        const downloadUrl = await getDownloadURL(fileRef);
        await updateAvatar(downloadUrl);
      } else {
        await updateAvatar(uri);
      }
      Alert.alert("Success! 🎉", "Profile photo updated successfully.");
    } catch {
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
        {/* Upper section: Scotty's Pet Yard Picture */}
        <View style={styles.yardWrapper}>
          <PetYardScene
            profile={profile}
            onOpenShop={() => router.push("/(tabs)/shop")}
          />
        </View>

        {/* Lower section: Scotty's Mood & Happiness */}
        <PetHappinessCard
          happiness={effectiveHappiness}
          mood={mood}
          onPet={petScotty}
        />
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  yardWrapper: {
    flex: 1,
  },
});
