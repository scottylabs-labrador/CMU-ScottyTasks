import React, { useState, useEffect } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { UI_COLORS } from "@/constants/gamification";

export type HabitItem = {
  id: string;
  title: string;
  emoji: string;
  streak: number;
  completedToday: boolean;
  weekProgress: boolean[];
  xp: number;
  color: string;
  goal?: number;
  unit?: string;
  step?: number;
  value?: number;
};

interface AddHabitModalProps {
  visible: boolean;
  editingHabit: HabitItem | null;
  onClose: () => void;
  onSave: (habitData: {
    title: string;
    emoji: string;
    color: string;
    goal: number;
    unit: string;
    step: number;
  }) => void;
}

const EMOJI_OPTIONS = ["🏃", "💧", "📵", "📝", "🧘", "📚", "🥗", "😴", "🎯", "🚶", "🎸", "💊"];
const COLOR_OPTIONS = ["#FB923C", "#A855F7", "#38BDF8", "#4ADE80", "#F472B6", "#FFB800", "#C41230"];

export default function AddHabitModal({
  visible,
  editingHabit,
  onClose,
  onSave,
}: AddHabitModalProps) {
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [color, setColor] = useState("#38BDF8");
  const [goal, setGoal] = useState("1");
  const [unit, setUnit] = useState("times");
  const [step, setStep] = useState("1");

  useEffect(() => {
    if (editingHabit) {
      setTitle(editingHabit.title);
      setEmoji(editingHabit.emoji);
      setColor(editingHabit.color);
      setGoal(editingHabit.goal ? editingHabit.goal.toString() : "1");
      setUnit(editingHabit.unit || "times");
      setStep(editingHabit.step ? editingHabit.step.toString() : "1");
    } else {
      setTitle("");
      setEmoji("🎯");
      setColor("#38BDF8");
      setGoal("1");
      setUnit("times");
      setStep("1");
    }
  }, [editingHabit, visible]);

  const handleSave = () => {
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      emoji,
      color,
      goal: parseInt(goal, 10) || 1,
      unit: unit.trim() || "times",
      step: parseInt(step, 10) || 1,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>
            {editingHabit ? "Edit Habit" : "New Daily Habit"}
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Title */}
            <Text style={styles.fieldLabel}>Habit Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Morning Run, Drink Water"
              placeholderTextColor={UI_COLORS.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            {/* Emoji Selector */}
            <Text style={styles.fieldLabel}>Choose Icon</Text>
            <View style={styles.emojiGrid}>
              {EMOJI_OPTIONS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiBtn, emoji === e && styles.emojiBtnActive]}
                  onPress={() => setEmoji(e)}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Color Selector */}
            <Text style={styles.fieldLabel}>Theme Color</Text>
            <View style={styles.colorRow}>
              {COLOR_OPTIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    color === c && styles.colorDotActive,
                  ]}
                  onPress={() => setColor(c)}
                />
              ))}
            </View>

            {/* Goal, Unit & Step */}
            <View style={styles.numericRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Daily Goal</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={goal}
                  onChangeText={setGoal}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Unit</Text>
                <TextInput
                  style={styles.input}
                  placeholder="times, oz, hrs"
                  placeholderTextColor={UI_COLORS.textMuted}
                  value={unit}
                  onChangeText={setUnit}
                />
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>
                  {editingHabit ? "Save Changes" : "Create Habit"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxHeight: "85%",
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: UI_COLORS.textPrimary,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: UI_COLORS.textSecondary,
    marginBottom: 6,
    marginTop: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: UI_COLORS.bgWarm,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: UI_COLORS.textPrimary,
    fontSize: 15,
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: UI_COLORS.bgWarm,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emojiBtnActive: {
    borderColor: UI_COLORS.cmuRed,
    backgroundColor: "rgba(196, 18, 48, 0.2)",
  },
  emojiText: {
    fontSize: 20,
  },
  colorRow: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 4,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorDotActive: {
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  numericRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 8,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: UI_COLORS.bgElevated,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: UI_COLORS.textSecondary,
  },
  saveBtn: {
    flex: 2,
    backgroundColor: UI_COLORS.cmuRed,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
