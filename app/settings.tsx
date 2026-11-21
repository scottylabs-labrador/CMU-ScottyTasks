import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  BackHandler,
  ScrollView,
  StyleSheet,
  Switch,
  View,
  type LayoutChangeEvent,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeOutDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "@/components/ScottyText";
import { PressableScale, WaveItem } from "@/components/ui/Motion";
import { MOTION_DURATION, MOTION_EASING, MOTION_SPRING } from "@/constants/motion";
import {
  APP_FONTS,
  APP_FONTS_BY_ID,
  APP_THEMES,
  APP_THEMES_BY_ID,
  type AppSettings,
  type AppThemePalette,
} from "@/constants/settings";
import { useAuth } from "@/contexts/AuthContext";
import { useScottyChat } from "@/hooks/useScottyChat";
import { useSettings } from "@/hooks/useSettings";

type SettingsSectionId =
  | "general"
  | "appearance"
  | "scotty_ai"
  | "notifications"
  | "account";

interface SectionItem {
  id: SettingsSectionId;
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const SECTIONS: readonly SectionItem[] = [
  {
    id: "general",
    label: "General",
    subtitle: "Calendar and haptics",
    icon: "options-outline",
  },
  {
    id: "appearance",
    label: "Appearance",
    subtitle: "Theme and font style",
    icon: "color-palette-outline",
  },
  {
    id: "scotty_ai",
    label: "Scotty AI",
    subtitle: "Quick prompts and session chat",
    icon: "sparkles-outline",
  },
  {
    id: "notifications",
    label: "Notifications",
    subtitle: "Study, deadline, and habit nudges",
    icon: "notifications-outline",
  },
  {
    id: "account",
    label: "Account",
    subtitle: "Profile and session",
    icon: "person-circle-outline",
  },
];

function settingsEqual(a: AppSettings, b: AppSettings): boolean {
  return (
    a.defaultTab === b.defaultTab &&
    a.weekStartsOn === b.weekStartsOn &&
    a.timeFormat === b.timeFormat &&
    a.hapticsEnabled === b.hapticsEnabled &&
    a.confirmBeforeDelete === b.confirmBeforeDelete &&
    a.fontId === b.fontId &&
    a.textSize === b.textSize &&
    a.themeId === b.themeId &&
    a.reduceMotion === b.reduceMotion &&
    a.defaultTasksView === b.defaultTasksView &&
    a.defaultTaskPriority === b.defaultTaskPriority &&
    a.showXpPopups === b.showXpPopups &&
    a.showChatQuickPrompts === b.showChatQuickPrompts &&
    a.studyReminders === b.studyReminders &&
    a.deadlineAlerts === b.deadlineAlerts &&
    a.habitNudges === b.habitNudges
  );
}

/** Animated segmented control with a smoothly sliding active pill indicator. */
function SegmentedChoice<T extends string>({
  options,
  value,
  onChange,
  theme,
  reducedMotion,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
  theme: AppThemePalette;
  reducedMotion: boolean;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const selectedIndex = Math.max(
    0,
    options.findIndex((opt) => opt.value === value),
  );
  const inset = 3;
  const innerWidth = Math.max(0, trackWidth - inset * 2);
  const segmentWidth = options.length > 0 ? innerWidth / options.length : 0;

  const indicatorX = useSharedValue(0);

  useEffect(() => {
    const targetX = selectedIndex * segmentWidth;
    if (segmentWidth <= 0) return;
    indicatorX.value = reducedMotion
      ? targetX
      : withSpring(targetX, MOTION_SPRING.press);
  }, [indicatorX, reducedMotion, segmentWidth, selectedIndex]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const handleLayout = (e: LayoutChangeEvent) => {
    const nextW = e.nativeEvent.layout.width;
    if (Math.abs(nextW - trackWidth) > 0.5) {
      setTrackWidth(nextW);
    }
  };

  return (
    <View
      onLayout={handleLayout}
      style={[styles.segmentedTrack, { backgroundColor: theme.subtle, borderColor: theme.border }]}
    >
      {segmentWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.segmentedIndicator,
            {
              width: segmentWidth,
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
            indicatorStyle,
          ]}
        />
      ) : null}

      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <PressableScale
            key={opt.value}
            scaleTo={0.97}
            haptic="selection"
            style={styles.segmentedBtn}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text
              style={[
                styles.segmentedText,
                { color: active ? theme.accent : theme.textSecondary },
                active && styles.segmentedTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

/** Subtle pop-in animation when an option checkmark activates. */
function AnimatedCheckmark({
  active,
  color,
  inactiveColor,
  reducedMotion,
}: {
  active: boolean;
  color: string;
  inactiveColor: string;
  reducedMotion: boolean;
}) {
  const scale = useSharedValue(active ? 1 : 0.9);

  useEffect(() => {
    if (reducedMotion) {
      scale.value = 1;
      return;
    }
    if (active) {
      scale.value = 0.72;
      scale.value = withSpring(1, MOTION_SPRING.pop);
    } else {
      scale.value = withTiming(0.92, { duration: MOTION_DURATION.fast });
    }
  }, [active, reducedMotion, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Ionicons
        name={active ? "checkmark-circle" : "ellipse-outline"}
        size={20}
        color={active ? color : inactiveColor}
      />
    </Animated.View>
  );
}

function ToggleRow({
  label,
  hint,
  value,
  onValueChange,
  theme,
  reducedMotion,
  isLast = false,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  theme: AppThemePalette;
  reducedMotion: boolean;
  isLast?: boolean;
}) {
  const pulse = useSharedValue(1);

  const handleChange = (next: boolean) => {
    if (!reducedMotion) {
      pulse.value = 0.985;
      pulse.value = withSpring(1, MOTION_SPRING.press);
    }
    onValueChange(next);
  };

  const rowAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.row,
        !isLast && { borderBottomWidth: 1, borderBottomColor: theme.border },
        rowAnimStyle,
      ]}
    >
      <View style={styles.rowTextGroup}>
        <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>{label}</Text>
        {hint ? <Text style={[styles.rowHint, { color: theme.textMuted }]}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={handleChange}
        trackColor={{ false: theme.border, true: theme.accent }}
        thumbColor="#FFFFFF"
      />
    </Animated.View>
  );
}

function ControlBlock({
  label,
  hint,
  theme,
  isLast = false,
  children,
}: {
  label: string;
  hint?: string;
  theme: AppThemePalette;
  isLast?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.controlBlock, !isLast && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
      <View style={styles.controlHeader}>
        <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>{label}</Text>
        {hint ? <Text style={[styles.rowHint, { color: theme.textMuted }]}>{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}

/** Isolated live preview card — uses draft font/size/theme without changing other Settings text. */
function AppearancePreviewWindow({
  draft,
  chromeTheme,
  reducedMotion,
}: {
  draft: AppSettings;
  chromeTheme: AppThemePalette;
  reducedMotion: boolean;
}) {
  const previewTheme = APP_THEMES_BY_ID[draft.themeId];
  const previewFont = APP_FONTS_BY_ID[draft.fontId];

  const cardScale = useSharedValue(1);
  const cardOpacity = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) {
      cardScale.value = 1;
      cardOpacity.value = 1;
      return;
    }
    cardScale.value = 0.97;
    cardOpacity.value = 0.65;
    cardScale.value = withSpring(1, MOTION_SPRING.press);
    cardOpacity.value = withTiming(1, {
      duration: MOTION_DURATION.fast,
      easing: MOTION_EASING.outCubic,
    });
  }, [cardOpacity, cardScale, draft.fontId, draft.textSize, draft.themeId, reducedMotion]);

  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  return (
    <View
      style={[
        styles.previewWindow,
        {
          backgroundColor: chromeTheme.subtle,
          borderColor: chromeTheme.border,
        },
      ]}
    >
      {/* Outer chrome metadata uses committed Settings font & theme */}
      <View style={styles.previewMetaRow}>
        <Text style={[styles.previewLabel, { color: chromeTheme.textMuted }]}>PREVIEW</Text>
        <Text style={[styles.previewMetaValue, { color: chromeTheme.textSecondary }]}>
          {previewFont.label} · {previewTheme.label}
        </Text>
      </View>

      {/* Inner preview card dynamically reflects draft font, text size, and color theme */}
      <Animated.View
        style={[
          styles.previewCard,
          {
            backgroundColor: previewTheme.card,
            borderColor: previewTheme.border,
          },
          cardAnimStyle,
        ]}
      >
        <View style={styles.previewCardTop}>
          <View style={styles.previewTitleWrap}>
            <Text
              fontIdOverride={draft.fontId}
              textSizeOverride={draft.textSize}
              style={[styles.previewBrandTitle, { color: previewTheme.textPrimary }]}
            >
              Scotty Tasks
            </Text>
            <Text
              fontIdOverride={draft.fontId}
              textSizeOverride={draft.textSize}
              style={[styles.previewSubtitle, { color: previewTheme.textSecondary }]}
            >
              15-213 Lab 4 · 3/5 completed today
            </Text>
          </View>
          <View style={[styles.previewXpChip, { backgroundColor: previewTheme.accentTint }]}>
            <Text
              fontIdOverride={draft.fontId}
              textSizeOverride={draft.textSize}
              style={[styles.previewXpText, { color: previewTheme.accent }]}
            >
              +120 XP
            </Text>
          </View>
        </View>

        <View style={[styles.previewTrack, { backgroundColor: previewTheme.subtle }]}>
          <View style={[styles.previewFill, { backgroundColor: previewTheme.accent }]} />
        </View>
      </Animated.View>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const osReducedMotion = useReducedMotion();

  const { user, guest, logout } = useAuth();
  const { settings, theme, applySettings, resetSettings } = useSettings();
  const { clearChat } = useScottyChat();

  // Committed motion preference governs Settings UI chrome until applied.
  const reducedMotion = osReducedMotion || settings.reduceMotion;

  // Draft overrides: edits preview locally and only take effect app-wide on confirmation.
  const [pendingOverrides, setPendingOverrides] = useState<Partial<AppSettings>>({});
  const [appliedToast, setAppliedToast] = useState(false);

  const draft = useMemo<AppSettings>(
    () => ({ ...settings, ...pendingOverrides }),
    [settings, pendingOverrides],
  );

  const hasPendingChanges = useMemo(
    () => !settingsEqual(draft, settings),
    [draft, settings],
  );

  const updateDraft = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      setPendingOverrides((prev) => {
        if (value === settings[key]) {
          if (!(key in prev)) return prev;
          const next = { ...prev };
          delete next[key];
          return next;
        }
        if (prev[key] === value) return prev;
        return { ...prev, [key]: value };
      });
    },
    [settings],
  );

  // null = Settings Category List; non-null = specific category configuration page
  const [activeSection, setActiveSection] = useState<SettingsSectionId | null>(null);
  const [transitionDir, setTransitionDir] = useState<1 | -1>(1);
  const [chatCleared, setChatCleared] = useState(false);

  const pageOpacity = useSharedValue(1);
  const pageTranslateX = useSharedValue(0);

  const openSection = useCallback((id: SettingsSectionId) => {
    setTransitionDir(1);
    setActiveSection(id);
  }, []);

  const performExit = useCallback(
    (target: "list" | "app") => {
      if (target === "list") {
        setTransitionDir(-1);
        setActiveSection(null);
      } else if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)/scotty");
      }
    },
    [router],
  );

  const handleConfirmApply = useCallback(() => {
    applySettings(draft);
    setPendingOverrides({});
    setAppliedToast(true);
    setTimeout(() => setAppliedToast(false), 1800);
  }, [applySettings, draft]);

  const handleDiscardDraft = useCallback(() => {
    setPendingOverrides({});
  }, []);

  const handleHeaderBack = useCallback(() => {
    const exitTarget = activeSection !== null ? "list" : "app";
    if (!hasPendingChanges) {
      performExit(exitTarget);
      return;
    }
    Alert.alert("Unsaved Changes", "Apply your changes before leaving?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: () => {
          setPendingOverrides({});
          performExit(exitTarget);
        },
      },
      {
        text: "Apply",
        onPress: () => {
          applySettings(draft);
          setPendingOverrides({});
          performExit(exitTarget);
        },
      },
    ]);
  }, [activeSection, applySettings, draft, hasPendingChanges, performExit]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (activeSection !== null || hasPendingChanges) {
        handleHeaderBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [activeSection, handleHeaderBack, hasPendingChanges]);

  useEffect(() => {
    if (reducedMotion) {
      pageOpacity.value = 1;
      pageTranslateX.value = 0;
      return;
    }
    pageOpacity.value = 0;
    pageTranslateX.value = transitionDir * 18;
    pageOpacity.value = withTiming(1, {
      duration: MOTION_DURATION.normal,
      easing: MOTION_EASING.outCubic,
    });
    pageTranslateX.value = withTiming(0, {
      duration: MOTION_DURATION.normal,
      easing: MOTION_EASING.outCubic,
    });
  }, [activeSection, pageOpacity, pageTranslateX, reducedMotion, transitionDir]);

  const pageAnimStyle = useAnimatedStyle(() => ({
    opacity: pageOpacity.value,
    transform: [{ translateX: pageTranslateX.value }],
  }));

  const currentSection = activeSection
    ? SECTIONS.find((s) => s.id === activeSection) ?? null
    : null;

  const displayName =
    typeof user?.user_metadata?.name === "string" && user.user_metadata.name.trim()
      ? user.user_metadata.name.trim()
      : user?.email?.split("@")[0] ?? "Guest Student";

  const handleClearChat = () => {
    clearChat();
    setChatCleared(true);
    setTimeout(() => setChatCleared(false), 2000);
  };

  const handleResetSettings = () => {
    Alert.alert("Reset Preferences", "Restore all settings to their defaults?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => {
          setPendingOverrides({});
          resetSettings();
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            router.replace("/login");
          } catch {
            Alert.alert("Error", "Could not log out right now.");
          }
        },
      },
    ]);
  };

  const handleNavigateAuth = async (target: "/login" | "/signup") => {
    try {
      await logout();
    } catch {
      // Safe fallback for guest session exit.
    }
    router.replace(target);
  };

  const renderCategoryList = () => (
    <View style={styles.sectionStack}>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {SECTIONS.map((sec, index) => {
          const isLast = index === SECTIONS.length - 1;
          return (
            <WaveItem key={sec.id} index={index} waveKey="settings-list" distance={14} stepMs={40}>
              <PressableScale
                scaleTo={0.985}
                haptic="selection"
                onPress={() => openSection(sec.id)}
                style={[
                  styles.categoryRow,
                  !isLast && { borderBottomWidth: 1, borderBottomColor: theme.border },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Open ${sec.label} settings`}
              >
                <View style={[styles.categoryIconBox, { backgroundColor: theme.accentTint }]}>
                  <Ionicons name={sec.icon} size={20} color={theme.accent} />
                </View>
                <View style={styles.rowTextGroup}>
                  <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>{sec.label}</Text>
                  <Text style={[styles.rowHint, { color: theme.textMuted }]}>{sec.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
              </PressableScale>
            </WaveItem>
          );
        })}
      </View>

      <Text style={[styles.footnote, { color: theme.textMuted, textAlign: "center" }]}>
        ScottyTasks v1.0.0 · ScottyLabs
      </Text>
    </View>
  );

  const renderSectionDetail = (sectionId: SettingsSectionId) => {
    switch (sectionId) {
      case "general":
        return (
          <WaveItem index={0} waveKey={sectionId} distance={14}>
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <ControlBlock label="Week Starts On" theme={theme}>
                <SegmentedChoice
                  theme={theme}
                  reducedMotion={reducedMotion}
                  value={draft.weekStartsOn}
                  onChange={(v) => updateDraft("weekStartsOn", v)}
                  options={[
                    { value: "sunday", label: "Sunday" },
                    { value: "monday", label: "Monday" },
                  ]}
                />
              </ControlBlock>

              <ControlBlock label="Time Format" theme={theme}>
                <SegmentedChoice
                  theme={theme}
                  reducedMotion={reducedMotion}
                  value={draft.timeFormat}
                  onChange={(v) => updateDraft("timeFormat", v)}
                  options={[
                    { value: "12h", label: "12-hour" },
                    { value: "24h", label: "24-hour" },
                  ]}
                />
              </ControlBlock>

              <ToggleRow
                label="Haptic Feedback"
                hint="Subtle vibration when tapping buttons and tabs"
                value={draft.hapticsEnabled}
                onValueChange={(v) => updateDraft("hapticsEnabled", v)}
                theme={theme}
                reducedMotion={reducedMotion}
              />

              <ToggleRow
                label="Confirm Before Deleting"
                hint="Ask before removing tasks or habits"
                value={draft.confirmBeforeDelete}
                onValueChange={(v) => updateDraft("confirmBeforeDelete", v)}
                theme={theme}
                reducedMotion={reducedMotion}
                isLast
              />
            </View>
          </WaveItem>
        );

      case "appearance":
        return (
          <View style={styles.sectionStack}>
            {/* Isolated Dynamic "Scotty Tasks" Preview Window */}
            <WaveItem index={0} waveKey={sectionId} distance={14}>
              <AppearancePreviewWindow
                draft={draft}
                chromeTheme={theme}
                reducedMotion={reducedMotion}
              />
            </WaveItem>

            {/* Font Style (updates only the preview window until Apply Changes is confirmed) */}
            <WaveItem index={1} waveKey={sectionId} distance={14}>
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.cardGroupHeader, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
                  <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Font Style</Text>
                  <Text style={[styles.rowHint, { color: theme.textMuted }]}>
                    Preview on Scotty Tasks above, then tap Apply Changes
                  </Text>
                </View>

                {APP_FONTS.map((item, index) => {
                  const active = item.id === draft.fontId;
                  const isLast = index === APP_FONTS.length - 1;
                  return (
                    <PressableScale
                      key={item.id}
                      scaleTo={0.985}
                      haptic="selection"
                      onPress={() => updateDraft("fontId", item.id)}
                      style={[
                        styles.fontRow,
                        !isLast && { borderBottomWidth: 1, borderBottomColor: theme.border },
                        active && { backgroundColor: theme.accentTint },
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <View style={styles.rowTextGroup}>
                        <Text
                          style={[
                            styles.rowLabel,
                            { color: active ? theme.accent : theme.textPrimary },
                          ]}
                        >
                          {item.label}
                        </Text>
                        <Text style={[styles.rowHint, { color: theme.textMuted }]}>
                          {item.description}
                        </Text>
                      </View>
                      <AnimatedCheckmark
                        active={active}
                        color={theme.accent}
                        inactiveColor={theme.border}
                        reducedMotion={reducedMotion}
                      />
                    </PressableScale>
                  );
                })}
              </View>
            </WaveItem>

            {/* Motion */}
            <WaveItem index={2} waveKey={sectionId} distance={14}>
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <ToggleRow
                  label="Reduce Motion"
                  hint="Simplify transitions and press animations"
                  value={draft.reduceMotion}
                  onValueChange={(v) => updateDraft("reduceMotion", v)}
                  theme={theme}
                  reducedMotion={reducedMotion}
                  isLast
                />
              </View>
            </WaveItem>

            {/* Color Themes */}
            <WaveItem index={3} waveKey={sectionId} distance={14}>
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.cardGroupHeader}>
                  <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Color Theme</Text>
                  <Text style={[styles.rowHint, { color: theme.textMuted }]}>
                    Choose a palette that feels comfortable
                  </Text>
                </View>

                <View style={styles.themeGrid}>
                  {APP_THEMES.map((item) => {
                    const active = item.id === draft.themeId;
                    return (
                      <PressableScale
                        key={item.id}
                        scaleTo={0.97}
                        haptic="selection"
                        onPress={() => updateDraft("themeId", item.id)}
                        style={[
                          styles.themeTile,
                          {
                            backgroundColor: active ? theme.accentTint : theme.subtle,
                            borderColor: active ? theme.accent : theme.border,
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={`${item.label} theme`}
                      >
                        <View style={styles.themeTileTop}>
                          <View style={styles.swatchRow}>
                            {item.swatches.map((hex, idx) => (
                              <View
                                key={`${item.id}-${idx}`}
                                style={[
                                  styles.swatchDot,
                                  {
                                    backgroundColor: hex,
                                    borderColor: item.isDark ? "#4B5563" : "#C9C2B6",
                                  },
                                ]}
                              />
                            ))}
                          </View>
                          <AnimatedCheckmark
                            active={active}
                            color={theme.accent}
                            inactiveColor="transparent"
                            reducedMotion={reducedMotion}
                          />
                        </View>
                        <Text style={[styles.themeTitle, { color: theme.textPrimary }]}>
                          {item.label}
                        </Text>
                        <Text style={[styles.themeDesc, { color: theme.textMuted }]} numberOfLines={1}>
                          {item.description}
                        </Text>
                      </PressableScale>
                    );
                  })}
                </View>
              </View>
            </WaveItem>
          </View>
        );

      case "scotty_ai":
        return (
          <View style={styles.sectionStack}>
            <WaveItem index={0} waveKey={sectionId} distance={14}>
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <ToggleRow
                  label="Quick Prompt Chips"
                  hint="Show one-tap starter questions above the chat input"
                  value={draft.showChatQuickPrompts}
                  onValueChange={(v) => updateDraft("showChatQuickPrompts", v)}
                  theme={theme}
                  reducedMotion={reducedMotion}
                />

                <PressableScale
                  scaleTo={0.985}
                  haptic="selection"
                  onPress={handleClearChat}
                  style={styles.actionRow}
                  accessibilityRole="button"
                  accessibilityLabel="Clear current Scotty chat session"
                >
                  <View style={styles.rowTextGroup}>
                    <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Clear Current Chat</Text>
                    <Text style={[styles.rowHint, { color: theme.textMuted }]}>
                      Start fresh with a clean conversation window
                    </Text>
                  </View>
                  <Text style={[styles.actionBadge, { color: theme.accent }]}>
                    {chatCleared ? "Cleared" : "Clear"}
                  </Text>
                </PressableScale>
              </View>
            </WaveItem>

            <WaveItem index={1} waveKey={sectionId} distance={14}>
              <Text style={[styles.footnote, { color: theme.textMuted }]}>
                Scotty Companion chats stay in memory for the current session only and are cleared automatically when you log out or restart.
              </Text>
            </WaveItem>
          </View>
        );

      case "notifications":
        return (
          <WaveItem index={0} waveKey={sectionId} distance={14}>
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <ToggleRow
                label="Study Reminders"
                hint="Daily gentle check-in to review your schedule"
                value={draft.studyReminders}
                onValueChange={(v) => updateDraft("studyReminders", v)}
                theme={theme}
                reducedMotion={reducedMotion}
              />

              <ToggleRow
                label="Task Deadline Alerts"
                hint="Notify before upcoming assignments are due"
                value={draft.deadlineAlerts}
                onValueChange={(v) => updateDraft("deadlineAlerts", v)}
                theme={theme}
                reducedMotion={reducedMotion}
              />

              <ToggleRow
                label="Habit Check-in Nudges"
                hint="Evening reminder for unfinished habits"
                value={draft.habitNudges}
                onValueChange={(v) => updateDraft("habitNudges", v)}
                theme={theme}
                reducedMotion={reducedMotion}
                isLast
              />
            </View>
          </WaveItem>
        );

      case "account":
        return (
          <View style={styles.sectionStack}>
            <WaveItem index={0} waveKey={sectionId} distance={14}>
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.accountCardInner}>
                  <View style={[styles.accountAvatar, { backgroundColor: theme.accentTint }]}>
                    <Ionicons name="person" size={22} color={theme.accent} />
                  </View>
                  <View style={styles.rowTextGroup}>
                    <Text style={[styles.accountName, { color: theme.textPrimary }]}>{displayName}</Text>
                    <Text style={[styles.rowHint, { color: theme.textMuted }]}>
                      {user?.email ?? (guest ? "Guest Mode · Local only" : "Not signed in")}
                    </Text>
                  </View>
                </View>

                {!user ? (
                  <View style={[styles.guestActionsRow, { borderTopColor: theme.border }]}>
                    <PressableScale
                      scaleTo={0.97}
                      haptic="light"
                      style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
                      onPress={() => void handleNavigateAuth("/login")}
                    >
                      <Text style={[styles.primaryBtnText, { color: theme.textOnAccent }]}>Sign In</Text>
                    </PressableScale>
                    <PressableScale
                      scaleTo={0.97}
                      haptic="selection"
                      style={[styles.secondaryBtn, { borderColor: theme.border, backgroundColor: theme.subtle }]}
                      onPress={() => void handleNavigateAuth("/signup")}
                    >
                      <Text style={[styles.secondaryBtnText, { color: theme.textPrimary }]}>Create Account</Text>
                    </PressableScale>
                  </View>
                ) : null}
              </View>
            </WaveItem>

            <WaveItem index={1} waveKey={sectionId} distance={14}>
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>


                <PressableScale
                  scaleTo={0.985}
                  haptic="selection"
                  onPress={handleResetSettings}
                  style={[styles.actionRow, { borderBottomWidth: 1, borderBottomColor: theme.border }]}
                >
                  <View style={styles.rowTextGroup}>
                    <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Reset Preferences</Text>
                    <Text style={[styles.rowHint, { color: theme.textMuted }]}>
                      Restore default theme, font, and options
                    </Text>
                  </View>
                  <Ionicons name="refresh-outline" size={18} color={theme.textMuted} />
                </PressableScale>

                <PressableScale
                  scaleTo={0.985}
                  haptic="selection"
                  onPress={handleLogout}
                  style={styles.actionRow}
                >
                  <View style={styles.rowTextGroup}>
                    <Text style={[styles.rowLabel, { color: theme.accent }]}>Log Out</Text>
                  </View>
                  <Ionicons name="log-out-outline" size={18} color={theme.accent} />
                </PressableScale>
              </View>
            </WaveItem>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={["top", "bottom"]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <PressableScale
          scaleTo={0.92}
          haptic="selection"
          onPress={handleHeaderBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={currentSection ? "Back to settings categories" : "Go back"}
        >
          <Ionicons name="arrow-back" size={22} color={theme.textPrimary} />
        </PressableScale>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {currentSection ? currentSection.label : "Settings"}
        </Text>
        <View style={styles.headerRight}>
          {appliedToast ? (
            <Animated.View
              entering={reducedMotion ? undefined : FadeInDown.duration(180)}
              exiting={reducedMotion ? undefined : FadeOutDown.duration(160)}
              style={[styles.savedBadge, { backgroundColor: theme.accentTint }]}
            >
              <Text style={[styles.savedBadgeText, { color: theme.accent }]}>Saved</Text>
            </Animated.View>
          ) : null}
        </View>
      </View>

      <Animated.View style={[styles.animatedPane, pageAnimStyle]}>
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={[
            styles.contentInner,
            hasPendingChanges && styles.contentInnerWithBar,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {currentSection ? (
            <>
              <Text style={[styles.pageSubtitle, { color: theme.textMuted }]}>
                {currentSection.subtitle}
              </Text>
              {renderSectionDetail(currentSection.id)}
            </>
          ) : (
            renderCategoryList()
          )}
        </ScrollView>
      </Animated.View>

      {/* Animated Confirmation Bar — appears only when unapplied draft changes exist */}
      {hasPendingChanges ? (
        <Animated.View
          entering={reducedMotion ? undefined : FadeInDown.duration(220)}
          exiting={reducedMotion ? undefined : FadeOutDown.duration(180)}
          style={[
            styles.confirmBar,
            {
              backgroundColor: theme.card,
              borderTopColor: theme.border,
            },
          ]}
        >
          <View style={styles.confirmBarInner}>
            <PressableScale
              scaleTo={0.97}
              haptic="selection"
              onPress={handleDiscardDraft}
              style={[
                styles.discardBtn,
                { backgroundColor: theme.subtle, borderColor: theme.border },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Discard unsaved settings changes"
            >
              <Text style={[styles.discardBtnText, { color: theme.textPrimary }]}>Discard</Text>
            </PressableScale>
            <PressableScale
              scaleTo={0.97}
              haptic="light"
              onPress={handleConfirmApply}
              style={[styles.applyBtn, { backgroundColor: theme.accent }]}
              accessibilityRole="button"
              accessibilityLabel="Apply settings changes"
            >
              <Ionicons name="checkmark" size={18} color={theme.textOnAccent} />
              <Text style={[styles.applyBtnText, { color: theme.textOnAccent }]}>
                Apply Changes
              </Text>
            </PressableScale>
          </View>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 48,
    height: 36,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  headerRight: {
    width: 58,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  savedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  savedBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  animatedPane: {
    flex: 1,
  },
  contentScroll: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 48,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
  },
  contentInnerWithBar: {
    paddingBottom: 104,
  },
  pageSubtitle: {
    fontSize: 13,
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  sectionStack: {
    gap: 16,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  categoryIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cardGroupHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowTextGroup: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  rowHint: {
    fontSize: 12,
    lineHeight: 17,
  },
  actionBadge: {
    fontSize: 13,
    fontWeight: "800",
  },
  controlBlock: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  controlHeader: {
    gap: 2,
  },
  segmentedTrack: {
    position: "relative",
    flexDirection: "row",
    padding: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  segmentedIndicator: {
    position: "absolute",
    top: 3,
    bottom: 3,
    left: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  segmentedBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentedText: {
    fontSize: 13,
    fontWeight: "600",
  },
  segmentedTextActive: {
    fontWeight: "800",
  },
  previewWindow: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  previewMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.9,
  },
  previewMetaValue: {
    fontSize: 11,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
  },
  previewCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  previewCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  previewTitleWrap: {
    flex: 1,
    gap: 3,
  },
  previewBrandTitle: {
    fontSize: 22,
    fontWeight: "800",
  },
  previewSubtitle: {
    fontSize: 13,
  },
  previewXpChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  previewXpText: {
    fontSize: 12,
    fontWeight: "800",
  },
  previewTrack: {
    height: 8,
    borderRadius: 6,
    overflow: "hidden",
  },
  previewFill: {
    width: "60%",
    height: "100%",
    borderRadius: 6,
  },
  fontRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  themeTile: {
    minWidth: 140,
    flexGrow: 1,
    flexBasis: "46%",
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    gap: 4,
  },
  themeTileTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  swatchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  swatchDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  themeTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  themeDesc: {
    fontSize: 11,
  },
  accountCardInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  accountAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  accountName: {
    fontSize: 16,
    fontWeight: "800",
  },
  guestActionsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  confirmBar: {
    borderTopWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  confirmBarInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
  },
  discardBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  discardBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  applyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: "800",
  },
  footnote: {
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 4,
  },
});
