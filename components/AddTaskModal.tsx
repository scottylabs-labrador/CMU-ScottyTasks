import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Platform,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { UI_COLORS } from "@/constants/gamification";

import { localDateKey, parseTaskDate, parseTaskTime } from "@/utils/taskDates";

export type TaskItem = {
  id: string;
  text: string;
  course?: string;
  priority: "high" | "medium" | "low";
  tag: string;
  dueDate: string;
  dueTime: string;
  xp: number;
  done: boolean;
};

interface AddTaskModalProps {
  visible: boolean;
  editingTask: TaskItem | null;
  onClose: () => void;
  onSave: (taskData: {
    text: string;
    course: string;
    priority: "high" | "medium" | "low";
    tag: string;
    dueDate: string;
    dueTime: string;
    xp: number;
  }) => void;
}

const TAG_OPTIONS = ["CS", "Math", "ML", "Writing", "Stats", "General"];

export default function AddTaskModal({
  visible,
  editingTask,
  onClose,
  onSave,
}: AddTaskModalProps) {
  const [text, setText] = useState(editingTask?.text ?? "");
  const [course, setCourse] = useState(editingTask?.course ?? "");
  const [tag, setTag] = useState(editingTask?.tag ?? "CS");
  const [priority, setPriority] = useState<"high" | "medium" | "low">(editingTask?.priority ?? "high");
  const [dateValue, setDateValue] = useState(() => parseTaskDate(editingTask?.dueDate ?? "Today") ?? new Date());
  const [timeValue, setTimeValue] = useState(() => parseTaskTime(editingTask?.dueTime ?? ""));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const defaultXP = priority === "high" ? 120 : priority === "medium" ? 80 : 40;

  const handleSave = () => {
    if (!text.trim()) return;

    const formattedTime = timeValue.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    onSave({
      text: text.trim(),
      course: course.trim(),
      priority,
      tag,
      dueDate: localDateKey(dateValue),
      dueTime: formattedTime,
      xp: defaultXP,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>
            {editingTask ? "Edit Task" : "New Task"}
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Task Description */}
            <Text style={styles.fieldLabel}>Task Description</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 15-112 HW5 — Recursion"
              placeholderTextColor={UI_COLORS.textMuted}
              value={text}
              onChangeText={setText}
            />

            {/* Course Code */}
            <Text style={styles.fieldLabel}>Course / Subject (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 15-112, 10-601"
              placeholderTextColor={UI_COLORS.textMuted}
              value={course}
              onChangeText={setCourse}
            />

            {/* Tag Selection */}
            <Text style={styles.fieldLabel}>Category Tag</Text>
            <View style={styles.pillRow}>
              {TAG_OPTIONS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tagPill, tag === t && styles.tagPillActive]}
                  onPress={() => setTag(t)}
                >
                  <Text
                    style={[
                      styles.tagPillText,
                      tag === t && styles.tagPillTextActive,
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Priority Selection */}
            <Text style={styles.fieldLabel}>Priority Level</Text>
            <View style={styles.priorityRow}>
              {(["high", "medium", "low"] as const).map((p) => {
                const isSelected = priority === p;
                const pColor =
                  p === "high"
                    ? UI_COLORS.priorityHigh
                    : p === "medium"
                    ? UI_COLORS.priorityMedium
                    : UI_COLORS.priorityLow;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityBtn,
                      isSelected && {
                        borderColor: pColor,
                        backgroundColor: `${pColor}20`,
                      },
                    ]}
                    onPress={() => setPriority(p)}
                  >
                    <View
                      style={[styles.priorityDot, { backgroundColor: pColor }]}
                    />
                    <Text
                      style={[
                        styles.priorityText,
                        isSelected && { color: pColor, fontWeight: "800" },
                      ]}
                    >
                      {p.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Date & Time Picker Triggers */}
            <Text style={styles.fieldLabel}>Due Date & Time</Text>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.pickerBtnText}>
                  📅 {dateValue.toLocaleDateString()}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.pickerBtnText}>
                  ⏰{" "}
                  {timeValue.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                themeVariant="light"
                accentColor={UI_COLORS.cmuRed}
                value={dateValue}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_event: DateTimePickerEvent, d?: Date) => {
                  setShowDatePicker(false);
                  if (d) setDateValue(d);
                }}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                themeVariant="light"
                accentColor={UI_COLORS.cmuRed}
                value={timeValue}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_event: DateTimePickerEvent, t?: Date) => {
                  setShowTimePicker(false);
                  if (t) setTimeValue(t);
                }}
              />
            )}

            {/* Reward Preview */}
            <View style={styles.rewardPreview}>
              <Text style={styles.rewardPreviewText}>
                Reward upon completion:{" "}
                <Text style={{ color: UI_COLORS.cmuGold, fontWeight: "800" }}>
                  +{defaultXP} XP ⚡
                </Text>{" "}
                +{" "}
                <Text style={{ color: UI_COLORS.cmuGold, fontWeight: "800" }}>
                  +5 🪙
                </Text>
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>
                  {editingTask ? "Save Changes" : "Create Task"}
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
    backgroundColor: UI_COLORS.overlay,
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
    borderRadius: 12,
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
    marginTop: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: UI_COLORS.bgWarm,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: UI_COLORS.textPrimary,
    fontSize: 15,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagPill: {
    backgroundColor: UI_COLORS.bgWarm,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tagPillActive: {
    backgroundColor: UI_COLORS.cmuRed,
    borderColor: UI_COLORS.cmuRed,
  },
  tagPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: UI_COLORS.textSecondary,
  },
  tagPillTextActive: {
    color: UI_COLORS.textOnAccent,
  },
  priorityRow: {
    flexDirection: "row",
    gap: 8,
  },
  priorityBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: UI_COLORS.bgWarm,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 10,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "600",
    color: UI_COLORS.textSecondary,
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: 10,
  },
  pickerBtn: {
    flex: 1,
    backgroundColor: UI_COLORS.bgWarm,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  pickerBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: UI_COLORS.textPrimary,
  },
  rewardPreview: {
    backgroundColor: UI_COLORS.goldTint,
    borderColor: UI_COLORS.borderLight,
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginTop: 16,
    alignItems: "center",
  },
  rewardPreviewText: {
    fontSize: 13,
    color: UI_COLORS.textPrimary,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    marginBottom: 8,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: UI_COLORS.bgElevated,
    borderRadius: 6,
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
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: UI_COLORS.textOnAccent,
  },
});
