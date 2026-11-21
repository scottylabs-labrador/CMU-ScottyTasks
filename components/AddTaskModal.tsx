import { Text } from "@/components/ScottyText";
import React, { useRef, useState } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { AnimatedModal, PressableScale } from "@/components/ui/Motion";
import TaskDueDatePicker from "@/components/tasks/TaskDueDatePicker";
import { UI_COLORS } from "@/constants/gamification";

import {
  formatTaskDate,
  localDateKey,
  parseTaskDate,
  parseTaskTime,
} from "@/utils/taskDates";

export type TaskItem = {
  id: string;
  text: string;
  course?: string;
  description?: string;
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
  initialDueDate?: string;
  onClose: () => void;
  onSave: (taskData: {
    text: string;
    course: string;
    description?: string;
    priority: "high" | "medium" | "low";
    tag: string;
    dueDate: string;
    dueTime: string;
    xp: number;
  }) => void | Promise<void>;
}

function AddTaskForm({
  editingTask,
  initialDueDate,
  onClose,
  onSave,
}: Omit<AddTaskModalProps, "visible">) {
  const nameInputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const formScrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [text, setText] = useState(editingTask?.text ?? "");
  const nameError = submitted && !text.trim();
  const [description, setDescription] = useState(editingTask?.description ?? "");
  const [priority, setPriority] = useState<"high" | "medium" | "low">(
    editingTask?.priority ?? "medium"
  );
  const [dateValue, setDateValue] = useState(
    () =>
      parseTaskDate(editingTask?.dueDate ?? initialDueDate ?? "Today") ??
      new Date(),
  );
  const [timeValue, setTimeValue] = useState<Date | null>(() =>
    editingTask?.dueTime ? parseTaskTime(editingTask.dueTime) : null,
  );
  const [draftTime, setDraftTime] = useState(() => timeValue ?? parseTaskTime("9:00 AM"));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const confirmTime = () => {
    setTimeValue(draftTime);
    setShowTimePicker(false);
  };
  const toggleTimePicker = () => {
    if (showTimePicker) {
      confirmTime();
    } else {
      setDraftTime(timeValue ?? parseTaskTime("9:00 AM"));
      setShowDatePicker(false);
      setShowTimePicker(true);
    }
  };

  const defaultXP = priority === "high" ? 120 : priority === "medium" ? 80 : 40;
  const dateButtonLabel = (() => {
    const key = localDateKey(dateValue);
    const friendly = formatTaskDate(key);
    const shortCal = dateValue.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return friendly === "Today" ||
      friendly === "Tomorrow" ||
      friendly === "Yesterday"
      ? `${friendly} (${shortCal})`
      : dateValue.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
  })();

  const handleSave = async () => {
    if (saving) return;
    setSubmitted(true);
    if (!text.trim()) {
      formScrollRef.current?.scrollTo({ y: 0, animated: true });
      nameInputRef.current?.focus();
      return;
    }

    const formattedTime = (showTimePicker ? draftTime : timeValue)?.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }) ?? "";

    setSaving(true);
    try {
      await onSave({
        text: text.trim(),
        course: editingTask?.course ?? "",
        ...(description.trim() || editingTask?.description
          ? { description: description.trim() }
          : {}),
        priority,
        tag: editingTask?.tag ?? "General",
        dueDate: localDateKey(dateValue),
        dueTime: formattedTime,
        xp: defaultXP,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Text style={styles.modalTitle}>
        {editingTask ? "Edit Task" : "New Task"}
      </Text>

      <ScrollView
        ref={formScrollRef}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name */}
        <Text style={styles.fieldLabel}>Name <Text style={styles.requiredMark}>*</Text></Text>
        <TextInput
          ref={nameInputRef}
          style={[styles.input, nameError && styles.inputError]}
          placeholder="What do you need to do?"
          maxLength={1000}
          accessibilityLabel="Task name (required)"
          placeholderTextColor={UI_COLORS.textMuted}
          value={text}
          onChangeText={setText}
        />

        {nameError && (
          <Text style={styles.errorText} accessibilityRole="alert" accessibilityLiveRegion="polite">
            Enter a task name.
          </Text>
        )}
        <Text style={styles.fieldLabel}>Description</Text>
        <TextInput
          style={[styles.input, styles.descriptionInput]}
          placeholder="Add any optional details or notes"
          placeholderTextColor={UI_COLORS.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={4000}
          textAlignVertical="top"
          accessibilityLabel="Description (optional)"
        />

        {/* Priority Selection */}
        <Text style={styles.fieldLabel}>Priority Level <Text style={styles.requiredMark}>*</Text></Text>
        <View style={styles.priorityRow}>
          {(["low", "medium", "high"] as const).map((p) => {
            const isSelected = priority === p;
            const pColor =
              p === "high"
                ? UI_COLORS.priorityHigh
                : p === "medium"
                  ? UI_COLORS.priorityMedium
                  : UI_COLORS.priorityLow;
            return (
              <PressableScale
                key={p}
                scaleTo={0.95}
                haptic="selection"
                style={[
                  styles.priorityBtn,
                  isSelected && {
                    borderColor: pColor,
                    backgroundColor: `${pColor}20`,
                  },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={`${p} priority`}
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
              </PressableScale>
            );
          })}
        </View>

        {/* Date & Time Picker Triggers */}
        <View style={styles.dateTimeRow}>
          <View style={styles.pickerBtnWrap}>
          <Text style={styles.fieldLabel}>Due date <Text style={styles.requiredMark}>*</Text></Text>
          <PressableScale
            scaleTo={0.96}
            onPress={() => { setShowTimePicker(false); setShowDatePicker((shown) => !shown); }}
          >
            <View style={styles.pickerBtn}>
              <Text style={styles.pickerBtnText} numberOfLines={1}>
                📅 {dateButtonLabel}
              </Text>
            </View>
          </PressableScale>
          </View>

          <View style={styles.pickerBtnWrap}>
          <Text style={styles.fieldLabel}>Time</Text>
          <PressableScale
            scaleTo={0.96}
            onPress={toggleTimePicker}
            accessibilityRole="button"
            accessibilityState={{ expanded: showTimePicker }}
            accessibilityLabel={showTimePicker ? "Confirm time and close picker" : "Choose optional time"}
          >
            <View style={styles.pickerBtn}>
              <Text style={styles.pickerBtnText}>
                ⏰{" "}
                {(showTimePicker ? draftTime : timeValue) ? (showTimePicker ? draftTime : timeValue)!.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }) : "Add optional time"}
              </Text>
            </View>
          </PressableScale>
          {timeValue && !showTimePicker && (
            <PressableScale onPress={() => { setTimeValue(null); setShowTimePicker(false); }} accessibilityRole="button" accessibilityLabel="Remove due time">
              <Text style={styles.removeTime}>Remove time</Text>
            </PressableScale>
          )}
          </View>
        </View>

        {showDatePicker && (
          <TaskDueDatePicker
            value={dateValue}
            onSelect={(date) => {
              setDateValue(date);
              setShowDatePicker(false);
            }}
          />
        )}

        {showTimePicker && (
          <View>
            {Platform.OS === "ios" && (
              <PressableScale style={styles.timeDoneButton} onPress={confirmTime} accessibilityRole="button" accessibilityLabel="Confirm time and close picker">
                <Text style={styles.removeTime}>Done</Text>
                <Ionicons name="chevron-up" size={16} color={UI_COLORS.cmuRed} />
              </PressableScale>
            )}
            <DateTimePicker
              themeVariant="light"
              accentColor={UI_COLORS.cmuRed}
              value={draftTime}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event: DateTimePickerEvent, time?: Date) => {
                if (Platform.OS === "ios") {
                  if (time) setDraftTime(time);
                } else {
                  // Android's native dialog already has explicit OK/Cancel actions.
                  setShowTimePicker(false);
                  if (event.type !== "dismissed" && time) setTimeValue(time);
                }
              }}
            />
          </View>
        )}

        {/* Reward Preview */}
        <View style={styles.rewardPreview}>
          <Text style={styles.rewardPreviewText}>
            Reward:{" "}
            <Text style={{ color: UI_COLORS.cmuGold, fontWeight: "800" }}>
              {defaultXP} XP
            </Text>{" "}
            +{" "}
            <Text style={{ color: UI_COLORS.cmuGold, fontWeight: "800" }}>
              5 bones
            </Text>
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <PressableScale
            style={styles.cancelBtnWrap}
            scaleTo={0.96}
            onPress={onClose}
          >
            <View style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </View>
          </PressableScale>

          <PressableScale
            style={styles.saveBtnWrap}
            scaleTo={0.96}
            haptic="light"
            disabled={saving}
            accessibilityState={{ disabled: saving, busy: saving }}
            onPress={handleSave}
          >
            <View style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>
                {saving ? "Saving…" : editingTask ? "Save Changes" : "Create Task"}
              </Text>
            </View>
          </PressableScale>
        </View>
      </ScrollView>
    </>
  );
}

export default function AddTaskModal({
  visible,
  editingTask,
  initialDueDate,
  onClose,
  onSave,
}: AddTaskModalProps) {
  const [wasVisible, setWasVisible] = useState(visible);
  const [sessionId, setSessionId] = useState(0);
  const [activeEditingTask, setActiveEditingTask] = useState<TaskItem | null>(
    editingTask,
  );
  const [activeInitialDueDate, setActiveInitialDueDate] = useState<
    string | undefined
  >(initialDueDate);

  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setSessionId((n) => n + 1);
      setActiveEditingTask(editingTask);
      setActiveInitialDueDate(initialDueDate);
    }
  } else if (visible) {
    if (editingTask !== activeEditingTask) {
      setActiveEditingTask(editingTask);
    }
    if (initialDueDate !== activeInitialDueDate) {
      setActiveInitialDueDate(initialDueDate);
    }
  }

  return (
    <AnimatedModal
      visible={visible}
      variant="dialog"
      dismissOnBackdropPress
      onClose={onClose}
      cardStyle={styles.modalCard}
    >
      <AddTaskForm
        key={`${sessionId}:${activeEditingTask?.id ?? "new"}:${activeInitialDueDate ?? ""}`}
        editingTask={activeEditingTask}
        initialDueDate={activeInitialDueDate}
        onClose={onClose}
        onSave={onSave}
      />
    </AnimatedModal>
  );
}

const styles = StyleSheet.create({
  modalCard: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "85%",
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
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
  requiredMark: { color: UI_COLORS.cmuRed },
  inputError: { borderColor: UI_COLORS.cmuRed },
  errorText: { color: UI_COLORS.cmuRed, fontSize: 13, marginTop: 6 },
  timeDoneButton: { alignSelf: "flex-end", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, minHeight: 40 },
  removeTime: { color: UI_COLORS.cmuRed, fontSize: 12, paddingVertical: 8, textAlign: "center" },
  descriptionInput: {
    minHeight: 76,
    maxHeight: 140,
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
    paddingHorizontal: 10,
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
  pickerBtnWrap: {
    flex: 1,
  },
  pickerBtn: {
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
  cancelBtnWrap: {
    flex: 1,
  },
  cancelBtn: {
    backgroundColor: UI_COLORS.bgElevated,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: UI_COLORS.textSecondary,
  },
  saveBtnWrap: {
    flex: 2,
  },
  saveBtn: {
    backgroundColor: UI_COLORS.cmuRed,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: UI_COLORS.textOnAccent,
  },
});
