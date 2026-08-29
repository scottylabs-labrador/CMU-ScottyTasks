import React, { useEffect } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ScottyDog from "./ScottyDog";
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

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>Level Up!</Text>
          <Text style={styles.subtitle}>You reached Level</Text>
          <Text style={styles.levelNumber}>{level}</Text>

          <View style={styles.dogWrapper}>
            <ScottyDog size={80} animated={true} />
          </View>

          <Text style={styles.encouragement}>Scotty is super proud of you! 🐾</Text>

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Keep Crushing It!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(10, 10, 15, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "88%",
    maxWidth: 340,
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.cmuRed,
    borderWidth: 2,
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    shadowColor: UI_COLORS.cmuRed,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
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
    color: "#FFFFFF",
    marginVertical: 6,
  },
  dogWrapper: {
    marginVertical: 10,
  },
  encouragement: {
    fontSize: 13,
    fontWeight: "600",
    color: UI_COLORS.textSecondary,
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    backgroundColor: UI_COLORS.cmuRed,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
