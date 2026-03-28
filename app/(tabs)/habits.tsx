import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import ProgressRing from "@/components/ProgressRing";

interface Habit {
  id: string;
  label: string;
  icon: string;
  color: string;
  value: number;
  goal: number;
}

const DEFAULT_HABITS: Habit[] = [
  { id: "1", label: "Water", icon: "💧", color: "#4FC3F7", value: 0, goal: 8 },
  { id: "2", label: "Sleep", icon: "😴", color: "#66BB6A", value: 0, goal: 8 },
];

export default function HabitsScreen() {
  const insets = useSafeAreaInsets();
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);
  const [modalVisible, setModalVisible] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [newIcon, setNewIcon] = useState("");

  const increment = (id: string) => {
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id ? { ...h, value: Math.min(h.value + 1, h.goal) } : h,
      ),
    );
  };

  const addHabit = () => {
    if (!newLabel || !newGoal) return;
    const colors = ["#FFB300", "#EF5350", "#AB47BC", "#26A69A", "#EC407A"];
    setHabits((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        label: newLabel,
        icon: newIcon || "⭐",
        color: colors[prev.length % colors.length],
        value: 0,
        goal: parseInt(newGoal, 10),
      },
    ]);
    setNewLabel("");
    setNewGoal("");
    setNewIcon("");
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 80 }, // clears persistent tab bar
        ]}
      >
        <Text style={styles.heading}>My Habits</Text>

        {habits.map((habit) => (
          <ProgressRing
            key={habit.id}
            value={habit.value}
            goal={habit.goal}
            onPress={() => increment(habit.id)}
            color={habit.color}
            icon={habit.icon}
            label={habit.label}
          />
        ))}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Add Habit</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Habit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Habit</Text>

            <TextInput
              style={styles.input}
              placeholder="Name (e.g. Water)"
              value={newLabel}
              onChangeText={setNewLabel}
            />
            <TextInput
              style={styles.input}
              placeholder="Icon emoji (e.g. 💧)"
              value={newIcon}
              onChangeText={setNewIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Daily goal (e.g. 8)"
              value={newGoal}
              onChangeText={setNewGoal}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmBtn]}
                onPress={addHabit}
              >
                <Text style={styles.confirmText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { alignItems: "center", paddingTop: 16 },
  heading: { fontSize: 24, fontWeight: "700", color: "#222", marginBottom: 16 },
  addButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: "#C41230", // CMU red
    borderRadius: 24,
  },
  addButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: "center" },
  cancelBtn: { backgroundColor: "#f0f0f0" },
  confirmBtn: { backgroundColor: "#C41230" },
  cancelText: { color: "#444", fontWeight: "600" },
  confirmText: { color: "#fff", fontWeight: "700" },
});
