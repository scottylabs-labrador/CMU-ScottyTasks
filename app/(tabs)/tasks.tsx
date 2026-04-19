import React, { useState, useEffect } from "react";
import {
  Button,
  FlatList,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Modal,
  Platform,
  TextInput,
  StyleSheet,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import type { User } from "firebase/auth";
import { auth, database, signOut } from "@/config/firebase";
import {
  ref,
  push,
  remove,
  onValue,
  query,
  orderByChild,
  equalTo,
  update,
  get,
  set,
} from "firebase/database";
import { SafeAreaView } from "react-native-safe-area-context";
import ScottyHeader from "@/components/ScottyHeader";

type Task = {
  id: string;
  text: string;
  userId: string;
  dueDate: string;
  dueTime: string;
  done: boolean;
  createdAt?: number;
  updatedAt?: number;
};

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

const formatTime = (date: Date) =>
  date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<User | null>(null);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskText, setTaskText] = useState("");
  const [dateValue, setDateValue] = useState(new Date());
  const [timeValue, setTimeValue] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [tempTime, setTempTime] = useState(new Date());
  const [celebratingId, setCelebratingId] = useState<string | null>(null);

  useEffect(() => {
    let tasksUnsubscribe: null | (() => void) = null;
    const authUnsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (tasksUnsubscribe) tasksUnsubscribe();

      if (currentUser) {
        const tasksRef = ref(database, "tasks");
        const userTasksQuery = query(
          tasksRef,
          orderByChild("userId"),
          equalTo(currentUser.uid),
        );
        tasksUnsubscribe = onValue(userTasksQuery, (snapshot) => {
          const data = snapshot.val() as Record<
            string,
            Omit<Task, "id">
          > | null;
          if (data) {
            const userTasks = Object.entries(data).map(([id, task]) => ({
              id,
              ...task,
            }));
            setTasks(userTasks);
          } else {
            setTasks([]);
          }
        });
      }
    });
    return () => {
      authUnsubscribe();
      if (tasksUnsubscribe) tasksUnsubscribe();
    };
  }, []);

  const openAddTaskModal = () => {
    const now = new Date();
    setSelectedTaskId(null);
    setTempDate(now);
    setTempTime(now);
    setDateValue(now);
    setTimeValue(now);
    setIsModalVisible(true);
  };

  const openEditTaskModal = (task: Task) => {
    if (task.done) return;
    // Parse MM/DD/YYYY manually
    const [month, day, year] = task.dueDate.split("/");
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    // Parse HH:MM time
    const [hours, minutes] = (task.dueTime || "00:00").split(":");
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes));

    setSelectedTaskId(task.id);
    setTaskText(task.text);
    setDateValue(date);
    setTempDate(date);
    setTimeValue(time);
    setTempTime(time);
    setIsModalVisible(true);
  };

  const handleSaveTask = async () => {
    if (taskText.trim().length === 0 || !user) {
      Alert.alert("Error", "Task description cannot be empty.");
      return;
    }

    const taskData = {
      text: taskText.trim(),
      userId: user.uid,
      dueDate: formatDate(dateValue),
      dueTime: formatTime(timeValue),
      updatedAt: Date.now(),
    };

    try {
      if (selectedTaskId) {
        const taskRef = ref(database, `tasks/${selectedTaskId}`);
        await update(taskRef, taskData);
      } else {
        const tasksRef = ref(database, "tasks");
        await push(tasksRef, {
          ...taskData,
          done: false,
          createdAt: Date.now(),
        });
      }
      closeModal();
    } catch {
      Alert.alert("Error", "Failed to save task");
    }
  };

  const handleDeleteTask = async (id: string) => {
    Alert.alert("Delete Task", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await remove(ref(database, `tasks/${id}`));
          } catch {
            Alert.alert("Error", "Could not delete");
          }
        },
      },
    ]);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setShowDatePicker(false);
    setShowTimePicker(false);
    // Delay state reset until after fade animation completes
    setTimeout(() => {
      setSelectedTaskId(null);
      setTaskText("");
      setDateValue(new Date());
      setTimeValue(new Date());
      setTempDate(new Date());
      setTempTime(new Date());
    }, 300); // matches fade animation duration
  };

  const toggleDone = async (task: Task) => {
    const taskRef = ref(database, `tasks/${task.id}`);
    await update(taskRef, { done: !task.done });

    if (!task.done && user) {
      setCelebratingId(task.id);
      setTimeout(() => setCelebratingId(null), 1500);

      const coinsRef = ref(database, `users/${user.uid}/coins`);
      const snapshot = await get(coinsRef);
      const currentCoins = snapshot.val() ?? 0;
      await set(coinsRef, currentCoins + 5);
    }
  };

  const onChangeDate = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDateValue(selectedDate);
  };

  const onChangeTime = (_event: DateTimePickerEvent, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) setTimeValue(selectedTime);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#f7f3ed" }}
      edges={["top"]}
    >
      <View style={{ flex: 1, padding: 10 }}>
        <ScottyHeader />

        <Button title="Add Task" onPress={openAddTaskModal} color="#C41230" />

        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.taskCard}>
              {celebratingId === item.id && (
                <Text style={styles.celebrate}>+5 🪙</Text>
              )}
              <TouchableOpacity
                onPress={() => toggleDone(item)}
                style={{ marginRight: 15 }}
              >
                <Text style={{ fontSize: 20 }}>{item.done ? "✅" : "⬜"}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => openEditTaskModal(item)}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "500",
                    textDecorationLine: item.done ? "line-through" : "none",
                  }}
                >
                  {item.text}
                </Text>
                <Text style={{ fontSize: 12, color: "#888" }}>
                  {item.dueDate} @ {item.dueTime}
                </Text>
              </TouchableOpacity>

              {/* Delete button on the card */}
              <TouchableOpacity
                onPress={() => handleDeleteTask(item.id)}
                style={{ paddingLeft: 12 }}
              >
                <Text style={{ fontSize: 20 }}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
        />

        <Modal animationType="fade" transparent={true} visible={isModalVisible}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {selectedTaskId ? "Edit Task" : "New Task"}
              </Text>
              {!showDatePicker && !showTimePicker && (
                <TextInput
                  placeholder="What needs to be done?"
                  value={taskText}
                  onChangeText={setTaskText}
                  style={styles.modalInput}
                />
              )}

              <TouchableOpacity
                onPress={() => {
                  setTempDate(dateValue);
                  setShowDatePicker(true);
                  setShowTimePicker(false);
                }}
                style={[
                  styles.pickerBtn,
                  (showDatePicker || showTimePicker) && {
                    height: 0,
                    padding: 0,
                    overflow: "hidden",
                    marginBottom: 0,
                  },
                ]}
              >
                <Text>📅 {formatDate(dateValue)}</Text>
              </TouchableOpacity>

              <View
                style={
                  showDatePicker
                    ? { alignItems: "center" }
                    : { height: 0, overflow: "hidden" }
                }
              >
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  minuteInterval={5}
                  onChange={(_event, date) => {
                    if (date) setTempDate(date);
                  }}
                />
                <TouchableOpacity
                  onPress={() => {
                    setDateValue(tempDate);
                    setShowDatePicker(false);
                  }}
                >
                  <Text
                    style={{
                      color: "#C41230",
                      textAlign: "center",
                      fontWeight: "700",
                    }}
                  >
                    Done
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setTempTime(timeValue);
                  setShowTimePicker(true);
                  setShowDatePicker(false);
                }}
                style={[
                  styles.pickerBtn,
                  (showTimePicker || showDatePicker) && {
                    height: 0,
                    padding: 0,
                    overflow: "hidden",
                    marginBottom: 0,
                  },
                ]}
              >
                <Text>⏰ {formatTime(timeValue)}</Text>
              </TouchableOpacity>

              <View
                style={
                  showTimePicker
                    ? { alignItems: "center" }
                    : { height: 0, overflow: "hidden" }
                }
              >
                <DateTimePicker
                  value={tempTime}
                  mode="time"
                  display="spinner"
                  minuteInterval={5}
                  onChange={(_event, time) => {
                    if (time) setTempTime(time);
                  }}
                />
                <TouchableOpacity
                  onPress={() => {
                    setTimeValue(tempTime);
                    setShowTimePicker(false);
                  }}
                >
                  <Text
                    style={{
                      color: "#C41230",
                      textAlign: "center",
                      fontWeight: "700",
                    }}
                  >
                    Done
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Only show Update Task when no picker is open */}
              {!showDatePicker && !showTimePicker && (
                <Button
                  title={selectedTaskId ? "Update Task" : "Create Task"}
                  onPress={handleSaveTask}
                  color="#C41230"
                />
              )}

              <TouchableOpacity onPress={closeModal} style={{ marginTop: 12 }}>
                <Text style={{ color: "#666", textAlign: "center" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  quickInput: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  taskCard: {
    marginTop: 10,
    padding: 15,
    backgroundColor: "white",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
  },
  celebrate: {
    position: "absolute",
    top: -10,
    right: 10,
    fontSize: 14,
    fontWeight: "700",
    color: "#C41230",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "white",
    padding: 25,
    borderRadius: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 15 },
  modalInput: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  pickerBtn: {
    marginBottom: 10,
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
});
