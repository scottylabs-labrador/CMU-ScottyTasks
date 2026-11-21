import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text } from "@/components/ScottyText";
import { UI_COLORS } from "@/constants/gamification";
import { fontSize, fontWeight, radii, spacing } from "@/constants/tokens";
import { useAuth } from "@/contexts/AuthContext";
import { useScottyChat } from "@/hooks/useScottyChat";
import { useOptionalSettings } from "@/hooks/useSettings";
import DressedScotty from "@/components/profile/DressedScotty";
import type { ChatMessage } from "@/types/chat";

function ThinkingDot({ index, progress }: { index: number; progress: SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => {
    const emphasis = Math.max(0, 1 - Math.abs(progress.value - index));
    return { opacity: 0.35 + emphasis * 0.65, transform: [{ translateY: -3 * emphasis }] };
  });
  return <Animated.View style={[styles.thinkingDot, animatedStyle]} />;
}

function ThinkingIndicator() {
  const { settings } = useOptionalSettings();
  const osReducedMotion = useReducedMotion();
  const reducedMotion = osReducedMotion || settings.reduceMotion;
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = reducedMotion ? 1 : 0;
    if (!reducedMotion) {
      progress.value = withRepeat(withTiming(2, { duration: 750, easing: Easing.inOut(Easing.quad) }), -1, true);
    }
    return () => cancelAnimation(progress);
  }, [progress, reducedMotion]);

  return (
    <View style={styles.typingRow} accessible accessibilityLabel="Scotty is thinking" accessibilityLiveRegion="polite">
      <View style={styles.scottyAvatar}>
        <DressedScotty hideToy />
      </View>
      <View style={styles.thinkingBubble}>
        {[0, 1, 2].map(index => <ThinkingDot key={index} index={index} progress={progress} />)}
      </View>
    </View>
  );
}

function getQuickPrompts(activeTab: string): string[] {
  if (activeTab === "habits") {
    return [
      "What habits do I still have today?",
      "How are my streaks looking?",
      "I'm feeling tired today",
      "Pet Scotty",
    ];
  }
  if (activeTab === "tasks") {
    return [
      "What's due today?",
      "What should I tackle first?",
      "I'm overwhelmed by my workload",
      "How much pending XP do I have?",
    ];
  }
  return [
    "What's due today?",
    "How is Scotty doing?",
    "I'm feeling stressed",
    "What can I buy in the shop?",
  ];
}

function formatToolBadge(toolsUsed: string[]): string {
  const labels = toolsUsed.map((name) => {
    if (name === "search_tasks") return "Searched tasks";
    if (name === "query_shop_inventory") return "Checked shop";
    if (name === "propose_action") return "Prepared action";
    return name;
  });
  return Array.from(new Set(labels)).join(" · ");
}

function MessageBubble({
  item,
  onConfirmAction,
  onDismissAction,
}: {
  item: ChatMessage;
  onConfirmAction: (id: string) => void;
  onDismissAction: (id: string) => void;
}) {
  const isUser = item.role === "user";
  const isCrisis = item.intent === "crisis";

  return (
    <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowBot]}>
      {!isUser ? (
        <View style={styles.scottyAvatar} accessible accessibilityRole="image" accessibilityLabel="Your Scotty">
          <DressedScotty hideToy />
        </View>
      ) : null}
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleBot,
          isCrisis && styles.bubbleCrisis,
        ]}
      >
        {!isUser && item.toolSummary?.toolsUsed?.length ? (
          <Text style={styles.toolBadge}>{formatToolBadge(item.toolSummary.toolsUsed)}</Text>
        ) : null}

        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextBot]}>
          {item.content}
        </Text>

        {item.pendingAction ? (
          <View style={styles.actionCard}>
            <Text style={styles.actionTitle}>{item.pendingAction.summaryLabel}</Text>
            {item.actionStatus === "pending" ? (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => onConfirmAction(item.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmBtnText}>Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dismissBtn}
                  onPress={() => onDismissAction(item.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dismissBtnText}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.actionDoneText}>
                {item.actionStatus === "confirmed" ? "Confirmed ✓" : "Dismissed"}
              </Text>
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function ChatOverlay() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuth();
  const { settings, theme } = useOptionalSettings();
  const {
    isAuthenticated,
    isOpen,
    closeChat,
    activeTab,
    messages,
    isSending,
    error,
    clearError,
    sendMessage,
    clearChat,
    confirmPendingAction,
    dismissPendingAction,
  } = useScottyChat();

  const [draft, setDraft] = useState("");
  const listRef = useRef<FlatList<ChatMessage> | null>(null);
  const quickPrompts = useMemo(() => getQuickPrompts(activeTab), [activeTab]);

  const handleSend = async (textToSend = draft) => {
    const cleaned = textToSend.trim();
    if (!cleaned || isSending) return;
    if (textToSend === draft) setDraft("");
    await sendMessage(cleaned);
  };

  const handleNavigateAuth = async (target: "/login" | "/signup") => {
    closeChat();
    try {
      await logout();
    } catch {
      // Guest logout clears local state synchronously; fallback still navigates cleanly.
    }
    router.replace(target);
  };

  return (
    <Modal visible={isOpen} animationType="slide" presentationStyle="fullScreen" onRequestClose={closeChat}>
      {/* Use the screen's insets explicitly: this modal is a separate native surface on iOS. */}
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.card,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
        ]}
      >
        <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <View style={styles.headerCopy}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]} numberOfLines={1}>Scotty Companion</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textMuted }]} numberOfLines={1}>
              {isAuthenticated ? "Session chat · Not saved across restarts" : "Sign in required"}
            </Text>
          </View>

          <View style={styles.headerActions}>
            {isAuthenticated ? (
              <TouchableOpacity
                style={styles.headerTextBtn}
                onPress={clearChat}
                accessibilityRole="button"
                accessibilityLabel="Start a new chat"
              >
                <Text style={styles.headerTextBtnLabel}>New Chat</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={closeChat}
              accessibilityRole="button"
              accessibilityLabel="Close Scotty chat"
            >
              <Ionicons name="close" size={20} color={UI_COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {!isAuthenticated ? (
          <View style={styles.guestGateWrapper}>
            <View style={styles.guestGateCard}>
              <Text style={styles.guestGateTitle}>Sign in to chat with Scotty</Text>
              <Text style={styles.guestGateBody}>
                Scotty Companion answers questions from your saved tasks, habits, XP, and shop
                inventory, and isn&apos;t available in Guest Mode. Sign in or create an account to
                unlock AI chat.
              </Text>
              <View style={styles.guestGateButtons}>
                <TouchableOpacity
                  style={styles.primaryGateBtn}
                  onPress={() => void handleNavigateAuth("/login")}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryGateBtnText}>Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryGateBtn}
                  onPress={() => void handleNavigateAuth("/signup")}
                  activeOpacity={0.85}
                >
                  <Text style={styles.secondaryGateBtnText}>Create Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <KeyboardAvoidingView
            style={[styles.chatBody, { backgroundColor: theme.bg }]}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={0}
          >
            <FlatList
              ref={listRef}
              style={styles.messageList}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <MessageBubble
                  item={item}
                  onConfirmAction={(id) => void confirmPendingAction(id)}
                  onDismissAction={dismissPendingAction}
                />
              )}
              contentContainerStyle={styles.listContent}
              contentInsetAdjustmentBehavior="never"
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
              showsVerticalScrollIndicator={false}
            />

            {isSending ? <ThinkingIndicator /> : null}

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={clearError}>
                  <Text style={styles.errorDismiss}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {settings.showChatQuickPrompts ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentInsetAdjustmentBehavior="never"
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.promptChipsRow}
                style={styles.promptChipsScroll}
              >
                {quickPrompts.map((prompt) => (
                  <TouchableOpacity
                    key={prompt}
                    style={[styles.promptChip, { backgroundColor: theme.card, borderColor: theme.border }]}
                    onPress={() => void handleSend(prompt)}
                    disabled={isSending}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.promptChipText, { color: theme.textPrimary }]}>{prompt}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : null}

            <View style={[styles.inputBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
              <TextInput
                style={styles.textInput}
                placeholder="Ask about tasks, habits, or how you feel..."
                placeholderTextColor={UI_COLORS.textMuted}
                value={draft}
                onChangeText={setDraft}
                multiline
                maxLength={1500}
                editable={!isSending}
                onSubmitEditing={() => void handleSend()}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!draft.trim() || isSending) && styles.sendBtnDisabled]}
                onPress={() => void handleSend()}
                disabled={!draft.trim() || isSending}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Send message"
              >
                <Ionicons name="send" size={16} color={UI_COLORS.textOnAccent} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </View>
    </Modal>
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: UI_COLORS.border,
    backgroundColor: UI_COLORS.bgCard,
    gap: spacing.sm,
  },
  headerCopy: { flex: 1, minWidth: 0, marginRight: spacing.sm },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.black,
    color: UI_COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: fontSize.xs,
    color: UI_COLORS.textMuted,
    marginTop: 2,
  },
  headerActions: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerTextBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.md,
    backgroundColor: UI_COLORS.bgSubtle,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
  },
  headerTextBtnLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textPrimary,
  },
  closeBtn: {
    padding: spacing.xs + 2,
    borderRadius: radii.md,
    backgroundColor: UI_COLORS.bgSubtle,
  },
  guestGateWrapper: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xxl,
  },
  guestGateCard: {
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.xxl,
    gap: spacing.md,
  },
  guestGateTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.black,
    color: UI_COLORS.textPrimary,
  },
  guestGateBody: {
    fontSize: fontSize.base,
    color: UI_COLORS.textSecondary,
    lineHeight: 20,
  },
  guestGateButtons: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  primaryGateBtn: {
    flex: 1,
    backgroundColor: UI_COLORS.cmuRed,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: "center",
  },
  primaryGateBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textOnAccent,
  },
  secondaryGateBtn: {
    flex: 1,
    backgroundColor: UI_COLORS.bgSubtle,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: "center",
  },
  secondaryGateBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textPrimary,
  },
  chatBody: {
    flex: 1,
    minHeight: 0,
  },
  messageList: { flex: 1, minHeight: 0 },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  messageRow: {
    flexDirection: "row",
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
  messageRowBot: {
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  scottyAvatar: {
    width: 38,
    height: 38,
    flexShrink: 0,
    borderRadius: 19,
    backgroundColor: UI_COLORS.bgCard,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
  },
  bubble: {
    maxWidth: "85%",
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  bubbleUser: {
    backgroundColor: UI_COLORS.cmuRed,
  },
  bubbleBot: {
    flexShrink: 1,
    backgroundColor: UI_COLORS.bgCard,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
  },
  bubbleCrisis: {
    borderColor: UI_COLORS.cmuRed,
    backgroundColor: UI_COLORS.redTint,
  },
  toolBadge: {
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  bubbleText: {
    fontSize: fontSize.base + 1,
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: UI_COLORS.textOnAccent,
  },
  bubbleTextBot: {
    color: UI_COLORS.textPrimary,
  },
  actionCard: {
    marginTop: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: UI_COLORS.bgSubtle,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    gap: spacing.sm,
  },
  actionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textPrimary,
  },
  actionButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  confirmBtn: {
    backgroundColor: UI_COLORS.xpGreen,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.md,
  },
  confirmBtnText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textOnAccent,
  },
  dismissBtn: {
    backgroundColor: UI_COLORS.bgCard,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.md,
  },
  dismissBtnText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textSecondary,
  },
  actionDoneText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.textMuted,
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  thinkingBubble: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 38,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: UI_COLORS.bgCard,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
  },
  thinkingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: UI_COLORS.textMuted,
  },
  errorBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: UI_COLORS.redTint,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: UI_COLORS.cmuRed,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: UI_COLORS.cmuRedDark,
    fontWeight: fontWeight.semibold,
  },
  errorDismiss: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.extrabold,
    color: UI_COLORS.cmuRed,
  },
  promptChipsScroll: {
    flexGrow: 0,
    flexShrink: 0,
    borderTopWidth: 1,
    borderTopColor: UI_COLORS.border,
    backgroundColor: UI_COLORS.bgWarm,
  },
  promptChipsRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    alignItems: "center",
  },
  promptChip: {
    minHeight: 44,
    justifyContent: "center",
    flexShrink: 0,
    backgroundColor: UI_COLORS.bgCard,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
  },
  promptChipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: UI_COLORS.textSecondary,
  },
  inputBar: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: UI_COLORS.border,
    backgroundColor: UI_COLORS.bgCard,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 110,
    backgroundColor: UI_COLORS.bgWarm,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.base + 1,
    color: UI_COLORS.textPrimary,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.lg,
    backgroundColor: UI_COLORS.cmuRed,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
});
