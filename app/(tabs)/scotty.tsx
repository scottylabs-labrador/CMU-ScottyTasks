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
import { requireSupabase } from "@/config/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { UI_COLORS } from "@/constants/gamification";
import { spacing } from "@/constants/tokens";

export default function ScottyScreen() {
  const router = useRouter();
  const { logout } = useAuth();
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
      if (uid) {
        const response = await fetch(uri);
        const body = await response.arrayBuffer();
        const contentType = response.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
        const extension = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
        const client = requireSupabase();
        const path = `${uid}/${Date.now()}.${extension}`;
        const { error } = await client.storage.from('avatars').upload(path, body, { contentType });
        if (error) throw error;
        const { data } = client.storage.from('avatars').getPublicUrl(path);
        await updateAvatar(data.publicUrl);
      } else {
        await updateAvatar(uri);
      }
      Alert.alert("Success! 🎉", "Profile photo updated successfully.");
    } catch {
      Alert.alert("Error", "Could not save profile photo. Please try again.");
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
            await logout();
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
