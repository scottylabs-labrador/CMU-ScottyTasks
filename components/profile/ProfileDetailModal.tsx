import React, { memo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { UI_COLORS, calculateLevel } from "@/constants/gamification";
import { UserShopProfile } from "@/constants/shop";
import { fontSize, fontWeight, radii, spacing } from "@/constants/tokens";
import { AnimatedModal, PressableScale, WaveItem } from "@/components/ui/Motion";
import Avatar from "@/components/ui/Avatar";
import XPBar from "@/components/XPBar";
import StatsGrid from "./StatsGrid";
import BadgesGrid from "./BadgesGrid";

export interface ProfileDetailModalProps {
  /** Whether the modal is currently visible */
  visible: boolean;
  /** Callback fired when user closes the modal */
  onClose: () => void;
  /** Current user shop and gamification profile */
  profile: UserShopProfile;
  /** Optional callback for handling uploaded avatar photo URI */
  onAvatarUpload?: (uri: string) => Promise<void>;
  /** Optional callback for logging out */
  onLogout?: () => void;
}

const DANGER_RED = UI_COLORS.cmuRed;

/**
 * ProfileDetailModal
 *
 * Full-screen panel presenting user avatar, photo changer, university details,
 * XP progression, stats grid, badges grid, and account settings / logout.
 */
function ProfileDetailModalComponent({
  visible,
  onClose,
  profile,
  onAvatarUpload,
  onLogout,
}: ProfileDetailModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const level = calculateLevel(profile.xp);

  const handlePickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (onAvatarUpload) {
          setIsUploading(true);
          try {
            await onAvatarUpload(uri);
          } catch {
            Alert.alert("Upload Failed", "Could not update profile photo.");
          } finally {
            setIsUploading(false);
          }
        }
      }
    } catch {
      Alert.alert("Error", "Could not open image library.");
    }
  };

  return (
    <AnimatedModal visible={visible} variant="fullscreen" onClose={onClose}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile &amp; Account</Text>
          <PressableScale
            style={styles.closeButton}
            scaleTo={0.9}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Close profile"
          >
            <Ionicons name="close" size={24} color={UI_COLORS.textPrimary} />
          </PressableScale>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* User Hero Section */}
          <WaveItem index={0} waveKey={String(visible)}>
            <View style={styles.heroCard}>
              <View style={styles.avatarWrapper}>
                <Avatar
                  imageUri={profile.avatarUrl}
                  size={84}
                  animated={true}
                  showBorder
                  borderColor={UI_COLORS.cmuRed}
                />
              </View>

              <PressableScale
                style={styles.changePhotoButton}
                scaleTo={0.95}
                onPress={handlePickPhoto}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color={UI_COLORS.cmuRed} />
                ) : (
                  <Text style={styles.changePhotoText}>Change Photo 📷</Text>
                )}
              </PressableScale>

              <Text style={styles.heroName}>Scotty Jr.</Text>
              <Text style={styles.heroSubtitle}>
                CMU CS &apos;27 · Pittsburgh, PA
              </Text>

              <View style={styles.xpBarWrapper}>
                <XPBar totalXP={profile.xp} level={level} />
              </View>
            </View>
          </WaveItem>

          {/* Stats Grid */}
          <WaveItem index={1} waveKey={String(visible)} style={styles.sectionSpacing}>
            <StatsGrid
              xp={profile.xp}
              streak={profile.streak}
              tasksCompleted={profile.tasksCompleted}
            />
          </WaveItem>

          {/* Badges Grid */}
          <WaveItem index={2} waveKey={String(visible)}>
            <Text style={styles.sectionTitle}>BADGES &amp; ACHIEVEMENTS</Text>
            <View style={styles.sectionSpacing}>
              <BadgesGrid />
            </View>
          </WaveItem>

          {/* Account Settings */}
          <WaveItem index={3} waveKey={String(visible)}>
            <Text style={styles.sectionTitle}>ACCOUNT SETTINGS</Text>
            <View style={styles.settingsMenu}>
              <PressableScale
                style={styles.settingsItem}
                scaleTo={0.985}
                onPress={() => Alert.alert("Canvas LMS Sync", "Coming soon!")}
              >
                <Text style={styles.settingsItemText}>Canvas LMS Sync</Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={UI_COLORS.textMuted}
                />
              </PressableScale>

              <PressableScale
                style={styles.settingsItem}
                scaleTo={0.985}
                onPress={() =>
                  Alert.alert(
                    "Study Notifications",
                    "Daily reminders are active"
                  )
                }
              >
                <Text style={styles.settingsItemText}>Study Notifications</Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={UI_COLORS.textMuted}
                />
              </PressableScale>

              <PressableScale
                style={[styles.settingsItem, styles.logoutItem]}
                scaleTo={0.985}
                onPress={onLogout}
              >
                <Text style={styles.logoutText}>Log Out</Text>
                <Ionicons name="log-out-outline" size={18} color={DANGER_RED} />
              </PressableScale>
            </View>
          </WaveItem>
        </ScrollView>
      </SafeAreaView>
    </AnimatedModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_COLORS.bgWarm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: UI_COLORS.border,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxxl * 2,
  },
  heroCard: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: UI_COLORS.borderLight,
    padding: spacing.xxl,
    marginBottom: spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: UI_COLORS.border,
  },
  avatarWrapper: {
    marginBottom: spacing.sm,
  },
  changePhotoButton: {
    backgroundColor: UI_COLORS.redTint,
    borderColor: UI_COLORS.cmuRed,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  changePhotoText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.cmuRed,
  },
  heroName: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.black,
    color: UI_COLORS.textPrimary,
  },
  heroSubtitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: UI_COLORS.textSecondary,
    marginTop: 2,
    marginBottom: spacing.xl,
  },
  xpBarWrapper: {
    width: "100%",
  },
  sectionSpacing: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: spacing.lg,
  },
  settingsMenu: {
    backgroundColor: "transparent",
    borderColor: UI_COLORS.border,
    overflow: "hidden",
    borderBottomWidth: 1,
    borderBottomColor: UI_COLORS.border,
  },
  settingsItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: UI_COLORS.border,
  },
  settingsItemText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textPrimary,
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: DANGER_RED,
  },
});

export default memo(ProfileDetailModalComponent);
