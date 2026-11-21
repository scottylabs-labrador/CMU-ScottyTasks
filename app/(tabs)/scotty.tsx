import React, { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import ScreenContainer from "@/components/ui/ScreenContainer";
import HomeDashboard, { HOME_COLORS } from "@/components/profile/HomeDashboard";
import ProfileDetailModal from "@/components/profile/ProfileDetailModal";
import { useScottyChat } from "@/hooks/useScottyChat";
import { useUserShopProfile } from "@/hooks/useUserShopProfile";
import { requireSupabase } from "@/config/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function ScottyScreen() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const { openChat } = useScottyChat();
  const {
    profile,
    updateAvatar,
    petScotty,
    uid,
  } = useUserShopProfile();
  const [modalVisible, setModalVisible] = useState(false);
  const displayName = typeof user?.user_metadata?.name === 'string'
    ? user.user_metadata.name.trim().split(/\s+/)[0] : undefined;

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
    <ScreenContainer style={{ backgroundColor: HOME_COLORS.sky }}>
      <HomeDashboard
        name={displayName}
        onProfile={() => setModalVisible(true)}
        onChat={openChat}
        onTreat={petScotty}
      />

      {/* Profile Detail Modal */}
      <ProfileDetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        profile={profile}
        onAvatarUpload={handleAvatarUpload}
        onOpenSettings={() => {
          setModalVisible(false);
          router.push("/settings");
        }}
        onLogout={handleLogout}
      />
    </ScreenContainer>
  );
}
