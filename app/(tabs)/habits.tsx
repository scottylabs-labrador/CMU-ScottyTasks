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
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import ProgressRing from "@/components/ProgressRing";
import ScottyHeader from "@/components/ScottyHeader";

interface Habit {
  id: string;
  label: string;
  icon: string;
  color: string;
  value: number;
  goal: number;
  unit: string;
  step: number;
  isDefault?: boolean;
}

const DEFAULT_HABITS: Habit[] = [
  {
    id: "water",
    label: "Water",
    icon: "💧",
    color: "#4FC3F7",
    value: 0,
    goal: 64,
    unit: "oz",
    step: 8,
    isDefault: true,
  },
  {
    id: "sleep",
    label: "Sleep",
    icon: "😴",
    color: "#66BB6A",
    value: 0,
    goal: 8,
    unit: "hrs",
    step: 0.5,
    isDefault: true,
  },
  {
    id: "exercise",
    label: "Exercise",
    icon: "🏃",
    color: "#FF7043",
    value: 0,
    goal: 30,
    unit: "mins",
    step: 5,
    isDefault: true,
  },
];

const COLORS = ["#FFB300", "#EF5350", "#AB47BC", "#26A69A", "#EC407A"];

export default function HabitsScreen() {
  const insets = useSafeAreaInsets();
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);

  // Add/Edit modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newStep, setNewStep] = useState("");

  const increment = (id: string) => {
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id ? { ...h, value: Math.min(h.value + h.step, h.goal) } : h,
      ),
    );
  };

  const deleteHabit = (id: string) => {
    Alert.alert("Delete Habit", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => setHabits((prev) => prev.filter((h) => h.id !== id)),
      },
    ]);
  };

  const openAddModal = () => {
    setEditingHabit(null);
    setNewLabel("");
    setNewGoal("");
    setNewUnit("");
    setNewStep("");
    setModalVisible(true);
  };

  const openEditModal = (habit: Habit) => {
    setEditingHabit(habit);
    setNewLabel(habit.label);
    setNewGoal(habit.goal.toString());
    setNewUnit(habit.unit);
    setNewStep(habit.step.toString());
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!newLabel.trim()) {
      Alert.alert("Error", "Please enter a habit name.");
      return;
    }
    const goalNumber = parseInt(newGoal, 10);
    if (isNaN(goalNumber) || goalNumber <= 0) {
      Alert.alert("Error", "Please enter a valid goal number greater than 0.");
      return;
    }
    const stepNumber = parseInt(newStep, 10);
    if (isNaN(stepNumber) || stepNumber <= 0) {
      Alert.alert("Error", "Please enter a valid increment greater than 0.");
      return;
    }

    if (editingHabit) {
      setHabits((prev) =>
        prev.map((h) =>
          h.id === editingHabit.id
            ? {
                ...h,
                label: newLabel.trim(),
                goal: goalNumber,
                unit: newUnit.trim(),
                step: stepNumber,
              }
            : h,
        ),
      );
    } else {
      setHabits((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          label: newLabel.trim(),
          icon: "🎯",
          color: COLORS[prev.length % COLORS.length],
          value: 0,
          goal: goalNumber,
          unit: newUnit.trim() || "times",
          step: stepNumber,
        },
      ]);
    }
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 10,
          paddingTop: 10,
          paddingBottom: insets.bottom + 80,
          alignItems: "center",
        }}
      >
        <View style={{ width: "100%" }}>
          <ScottyHeader />
        </View>

        {habits.map((habit) => (
          <View key={habit.id} style={{ alignItems: "center" }}>
            <ProgressRing
              value={habit.value}
              goal={habit.goal}
              onPress={() => increment(habit.id)}
              color={habit.color}
              icon={habit.icon}
              label={habit.label}
              unit={habit.unit}
            />
            {/* Tappable label to edit */}
            <TouchableOpacity onPress={() => openEditModal(habit)}>
              <Text style={styles.editLabel}>✏️ Edit</Text>
            </TouchableOpacity>

            {!habit.isDefault && (
              <TouchableOpacity onPress={() => deleteHabit(habit.id)}>
                <Text style={styles.deleteLabel}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Add Habit</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingHabit ? `Edit ${editingHabit.label}` : "New Habit"}
            </Text>

            {/* Name only for custom habits */}
            {!editingHabit?.isDefault && (
              <>
                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Water"
                    value={newLabel}
                    onChangeText={setNewLabel}
                  />
                </View>
              </>
            )}

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Goal</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 64"
                value={newGoal}
                onChangeText={setNewGoal}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Unit</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. oz, hrs, mins"
                value={newUnit}
                onChangeText={setNewUnit}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Increment</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 8"
                value={newStep}
                onChangeText={setNewStep}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmBtn]}
                onPress={handleSave}
              >
                <Text style={styles.confirmText}>
                  {editingHabit ? "Save" : "Add"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f3ed" },
  editLabel: { color: "#888", fontSize: 12, marginTop: -6, marginBottom: 4 },
  deleteLabel: { color: "#ff4444", fontSize: 13, marginBottom: 8 },
  addButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: "#C41230",
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
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  inputLabel: {
    width: 72,
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
  },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: "center" },
  cancelBtn: { backgroundColor: "#f0f0f0" },
  confirmBtn: { backgroundColor: "#C41230" },
  cancelText: { color: "#444", fontWeight: "600" },
  confirmText: { color: "#fff", fontWeight: "700" },
});
