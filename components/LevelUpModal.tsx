import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import ScottyDog from "./ScottyDog";
import { AnimatedModal, PressableScale } from "@/components/ui/Motion";
import { UI_COLORS } from "@/constants/gamification";

interface LevelUpModalProps {
  visible: boolean;
  level: number;
  onClose: () => void;
}

export default function LevelUpModal({
  visible,
  level,
  onClose,
}: LevelUpModalProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  return (
    <AnimatedModal
      visible={visible}
      variant="dialog"
      dismissOnBackdropPress
      onClose={onClose}
      cardStyle={styles.card}
    >
      <Text style={styles.emoji}>🎉</Text>
      <Text style={styles.title}>Level Up!</Text>
      <Text style={styles.subtitle}>You reached Level</Text>
      <Text style={styles.levelNumber}>{level}</Text>

      <View style={styles.dogWrapper}>
        <ScottyDog size={80} animated={true} />
      </View>

      <Text style={styles.encouragement}>Scotty is super proud of you! 🐾</Text>

      <PressableScale
        style={styles.buttonWrap}
        scaleTo={0.96}
        haptic="light"
        onPress={onClose}
      >
        <View style={styles.button}>
          <Text style={styles.buttonText}>Keep Crushing It!</Text>
        </View>
      </PressableScale>
    </AnimatedModal>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "88%",
    maxWidth: 340,
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.cmuRed,
    borderWidth: 2,
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
  },
  emoji: {
    fontSize: 48,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: UI_COLORS.cmuGold,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: UI_COLORS.textSecondary,
  },
  levelNumber: {
    fontSize: 56,
    fontWeight: "900",
    color: UI_COLORS.textPrimary,
    marginVertical: 6,
  },
  dogWrapper: {
    marginVertical: 10,
  },
  encouragement: {
    fontSize: 14,
    color: UI_COLORS.textPrimary,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  buttonWrap: {
    width: "100%",
  },
  button: {
    backgroundColor: UI_COLORS.cmuRed,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: UI_COLORS.textOnAccent,
    fontSize: 15,
    fontWeight: "800",
  },
});
