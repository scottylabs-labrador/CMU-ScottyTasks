import { Text } from "@/components/ScottyText";
import React, { memo, useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { UI_COLORS, calculateLevel } from "@/constants/gamification";
import { UserShopProfile } from "@/constants/shop";
import { fontSize, fontWeight, radii, spacing } from "@/constants/tokens";
import {
  AnimatedModal,
  PressableScale,
  WaveItem,
} from "@/components/ui/Motion";
import Avatar from "@/components/ui/Avatar";
import XPBar from "@/components/XPBar";
import SettingsScreen from "@/components/settings/SettingsScreen";
import StatsGrid from "./StatsGrid";
import BadgesGrid from "./BadgesGrid";
import { useAuth } from "@/contexts/AuthContext";

export interface ProfileDetailModalProps {
  /** Whether the modal is currently visible */
  visible: boolean;
  /** Callback fired when user closes the modal */
  onClose: () => void;
  /** Current user shop and gamification profile */
  profile: UserShopProfile;
  /** Optional callback for handling uploaded avatar photo URI */
  onAvatarUpload?: (uri: string) => Promise<void>;
  onAvatarReset?: () => Promise<void>;
  onUseScotty?: () => Promise<void>;
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
  onAvatarReset,
  onUseScotty,
  onLogout,
}: ProfileDetailModalProps) {
  const insets = useSafeAreaInsets();
  const [showSettings, setShowSettings] = useState(false);
  const settingsBackHandler = useRef<(() => void) | null>(null);
  const registerSettingsBack = useCallback((handler: (() => void) | null) => {
    settingsBackHandler.current = handler;
  }, []);
  const { user } = useAuth();
  const displayName =
    [user?.user_metadata?.name, user?.user_metadata?.full_name]
      .find(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      )
      ?.trim() ?? (user ? "Your profile" : "Guest");
  const [isUploading, setIsUploading] = useState(false);
  const level = calculateLevel(profile.xp);

  const handleUseScotty = async () => {
    if (!onUseScotty || isUploading) return;
    setIsUploading(true);
    try {
      await onUseScotty();
    } catch {
      Alert.alert("Could not update profile", "Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetPhoto = async () => {
    if (!onAvatarReset || isUploading) return;
    setIsUploading(true);
    try {
      await onAvatarReset();
    } catch {
      Alert.alert(
        "Reset Failed",
        "Could not reset your profile photo. Please try again.",
      );
    } finally {
      setIsUploading(false);
    }
  };

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
    <AnimatedModal
      visible={visible}
      variant="fullscreen"
      onDismiss={() => setShowSettings(false)}
      onClose={() => {
        if (showSettings) settingsBackHandler.current?.();
        else onClose();
      }}
    >
      {showSettings ? (
        <SettingsScreen
          onBack={() => setShowSettings(false)}
          onNavigateAway={onClose}
          onBackHandlerChange={registerSettingsBack}
        />
      ) : (
        <>
          {/* Use the screen's insets explicitly: this modal is a separate native surface. */}
          <View
            style={[
              styles.container,
              {
                paddingTop: insets.top,
                paddingLeft: insets.left,
                paddingRight: insets.right,
              },
            ]}
          >
            {/* Header */}
            <View
              pointerEvents="box-none"
              style={[
                styles.header,
                {
                  top: insets.top + 4,
                  left: insets.left + spacing.xl,
                  right: insets.right + spacing.xl,
                },
              ]}
            >
              <PressableScale
                style={styles.closeButton}
                scaleTo={0.9}
                onPress={onClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Close profile"
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={UI_COLORS.textPrimary}
                />
              </PressableScale>
              <PressableScale
                style={styles.closeButton}
                scaleTo={0.9}
                onPress={() => setShowSettings(true)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Open settings"
              >
                <Ionicons
                  name="settings-outline"
                  size={24}
                  color={UI_COLORS.textPrimary}
                />
              </PressableScale>
            </View>

            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: spacing.xxxxl * 2 + insets.bottom },
              ]}
              contentInsetAdjustmentBehavior="never"
              showsVerticalScrollIndicator={false}
            >
              {/* User Hero Section */}
              <WaveItem index={0} waveKey={String(visible)}>
                <View style={styles.heroCard}>
                  <Text style={styles.heroName}>{displayName}</Text>
                  <Text style={styles.heroSubtitle}>
                    {user?.email ?? "Guest profile"}
                  </Text>

                  <View style={styles.avatarWrapper}>
                    <Avatar
                      imageUri={profile.avatarUrl}
                      size={84}
                      animated={true}
                      showBorder
                      borderColor={UI_COLORS.cmuRed}
                    />
                  </View>

                  <View style={styles.photoActions}>
                    <PressableScale
                      style={[
                        styles.photoButton,
                        isUploading && styles.photoButtonBusy,
                      ]}
                      scaleTo={0.95}
                      onPress={
                        profile.avatarUrl ? handleResetPhoto : handlePickPhoto
                      }
                      disabled={isUploading}
                      accessibilityRole="button"
                      accessibilityLabel={
                        profile.avatarUrl
                          ? "Reset to default Scotty"
                          : "Choose a custom photo"
                      }
                      accessibilityState={{
                        disabled: isUploading,
                        busy: isUploading,
                      }}
                    >
                      {isUploading ? (
                        <ActivityIndicator
                          size="small"
                          color={UI_COLORS.cmuRed}
                        />
                      ) : (
                        <>
                          <Ionicons
                            name={
                              profile.avatarUrl
                                ? "refresh-outline"
                                : "camera-outline"
                            }
                            size={16}
                            color={UI_COLORS.cmuRed}
                          />
                          <Text style={styles.changePhotoText}>
                            {profile.avatarUrl
                              ? "Reset to default"
                              : "Custom photo"}
                          </Text>
                        </>
                      )}
                    </PressableScale>
                    {onUseScotty ? (
                      <PressableScale
                        style={[
                          styles.photoButton,
                          isUploading && styles.photoButtonBusy,
                        ]}
                        scaleTo={0.95}
                        onPress={handleUseScotty}
                        disabled={isUploading}
                        accessibilityRole="button"
                        accessibilityLabel="Use my Scotty with his current hat and glasses"
                        accessibilityState={{ disabled: isUploading }}
                      >
                        <Text style={styles.changePhotoText}>
                          Use my Scotty!
                        </Text>
                      </PressableScale>
                    ) : null}
                  </View>

                  <Text style={styles.photoVisibilityNote}>
                    Your profile photo is visible to other users on the
                    leaderboard.
                  </Text>

                  <View style={styles.xpBarWrapper}>
                    <XPBar totalXP={profile.xp} level={level} />
                  </View>
                </View>
              </WaveItem>

              {/* Stats Grid */}
              <WaveItem
                index={1}
                waveKey={String(visible)}
                style={styles.sectionSpacing}
              >
                <StatsGrid
                  xp={profile.xp}
                  streak={profile.streak}
                  tasksCompleted={profile.tasksCompleted}
                />
              </WaveItem>

              {/* Badges Grid */}
              <WaveItem index={2} waveKey={String(visible)}>
                <Text accessibilityRole="header" style={styles.sectionTitle}>
                  BADGES &amp; ACHIEVEMENTS
                </Text>
                <View style={styles.sectionSpacing}>
                  <BadgesGrid />
                </View>
              </WaveItem>

              {/* Account Settings */}
              <WaveItem index={3} waveKey={String(visible)}>
                <View style={styles.settingsMenu}>
                  <PressableScale
                    style={[styles.settingsItem, styles.logoutItem]}
                    scaleTo={0.985}
                    onPress={onLogout}
                  >
                    <Text style={styles.logoutText}>Log Out</Text>
                    <Ionicons
                      name="log-out-outline"
                      size={18}
                      color={DANGER_RED}
                    />
                  </PressableScale>
                </View>
              </WaveItem>
            </ScrollView>
          </View>
        </>
      )}
    </AnimatedModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_COLORS.bgWarm,
  },
  header: {
    position: "absolute",
    zIndex: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxxl * 2,
  },
  heroCard: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: UI_COLORS.borderLight,
    padding: spacing.xxl,
    paddingTop: 44,
    marginBottom: spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: UI_COLORS.border,
  },
  avatarWrapper: {
    marginBottom: spacing.sm,
  },
  photoActions: {
    flexDirection: "row",
    width: "100%",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  photoButton: {
    flex: 1,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: UI_COLORS.redTint,
    borderColor: UI_COLORS.cmuRed,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  photoButtonBusy: { opacity: 0.6 },
  changePhotoText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.extrabold,
    textAlign: "center",
    flexShrink: 1,
    color: UI_COLORS.cmuRed,
  },
  photoVisibilityNote: {
    fontSize: fontSize.xs,
    color: UI_COLORS.textSecondary,
    textAlign: "center",
    marginBottom: spacing.md,
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
