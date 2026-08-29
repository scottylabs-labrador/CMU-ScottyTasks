import React, { useState, useEffect } from "react";
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { User } from "firebase/auth";

import { auth, database } from "@/config/firebase";
import {
  ref,
  push,
  remove,
  onValue,
  query,
  orderByChild,
  equalTo,
  update,
} from "firebase/database";
import { UI_COLORS } from "@/constants/gamification";
import { useUserShopProfile } from "@/hooks/useUserShopProfile";
import ScottyHeader from "@/components/ScottyHeader";
import ScottyDog from "@/components/ScottyDog";
import XPFloat from "@/components/XPFloat";
import AddTaskModal, { TaskItem } from "@/components/AddTaskModal";

const INITIAL_FALLBACK_TASKS: TaskItem[] = [
  {
    id: "demo-1",
    text: "15-112 HW5 — Recursion",
    course: "15-112",
    dueDate: "Today",
    dueTime: "11:59 PM",
    xp: 120,
    priority: "high",
    done: false,
    tag: "CS",
  },
  {
    id: "demo-2",
    text: "Read Chapter 7 — Neural Nets",
    course: "10-601",
    dueDate: "Tomorrow",
    dueTime: "5:00 PM",
    xp: 80,
    priority: "medium",
    done: false,
    tag: "ML",
  },
  {
    id: "demo-3",
    text: "21-241 Matrix Algebra Problem Set",
    course: "21-241",
    dueDate: "Thu Nov 14",
    dueTime: "11:59 PM",
    xp: 100,
    priority: "high",
    done: false,
    tag: "Math",
  },
  {
    id: "demo-4",
    text: "76-101 Essay Draft",
    course: "76-101",
    dueDate: "Fri Nov 15",
    dueTime: "2:00 PM",
    xp: 90,
    priority: "medium",
    done: true,
    tag: "Writing",
  },
];

export default function TasksScreen() {
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_FALLBACK_TASKS);
  const [user, setUser] = useState<User | null>(null);
  const [filter, setFilter] = useState<"all" | "today" | "upcoming">("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [activeFloat, setActiveFloat] = useState<{ xp: number; coins: number } | null>(null);

  const { addXPAndCoins } = useUserShopProfile();

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
          equalTo(currentUser.uid)
        );
        tasksUnsubscribe = onValue(userTasksQuery, (snapshot) => {
          const data = snapshot.val() as Record<string, any> | null;
          if (data) {
            const userTasks = Object.entries(data).map(([id, task]) => ({
              id,
              text: task.text || task.title || "Untitled Task",
              course: task.course,
              priority: task.priority || "medium",
              tag: task.tag || "CS",
              dueDate: task.dueDate || "Today",
              dueTime: task.dueTime || "11:59 PM",
              xp: task.xp || 80,
              done: !!task.done,
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

  const handleToggleComplete = async (task: TaskItem) => {
    const nextDone = !task.done;

    if (!user) {
      // Local fallback
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, done: nextDone } : t))
      );
      if (nextDone) {
        setActiveFloat({ xp: task.xp, coins: 5 });
        addXPAndCoins(task.xp, 5, true);
      }
      return;
    }

    try {
      const taskRef = ref(database, `tasks/${task.id}`);
      await update(taskRef, { done: nextDone, updatedAt: Date.now() });

      if (nextDone) {
        setActiveFloat({ xp: task.xp, coins: 5 });
        await addXPAndCoins(task.xp, 5, true);
      }
    } catch (e) {
      Alert.alert("Error", "Could not update task status");
    }
  };

  const handleSaveTask = async (taskData: {
    text: string;
    course: string;
    priority: "high" | "medium" | "low";
    tag: string;
    dueDate: string;
    dueTime: string;
    xp: number;
  }) => {
    if (!user) {
      // Local guest fallback
      if (editingTask) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === editingTask.id ? { ...t, ...taskData } : t
          )
        );
      } else {
        setTasks((prev) => [
          ...prev,
          {
            id: `task-${Date.now()}`,
            ...taskData,
            done: false,
          },
        ]);
      }
      setModalVisible(false);
      setEditingTask(null);
      return;
    }

    try {
      if (editingTask) {
        const taskRef = ref(database, `tasks/${editingTask.id}`);
        await update(taskRef, { ...taskData, updatedAt: Date.now() });
      } else {
        const tasksRef = ref(database, "tasks");
        await push(tasksRef, {
          ...taskData,
          userId: user.uid,
          done: false,
          createdAt: Date.now(),
        });
      }
      setModalVisible(false);
      setEditingTask(null);
    } catch (e) {
      Alert.alert("Error", "Failed to save task");
    }
  };

  const handleDeleteTask = (id: string) => {
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (!user) {
            setTasks((prev) => prev.filter((t) => t.id !== id));
            return;
          }
          try {
            await remove(ref(database, `tasks/${id}`));
          } catch {
            Alert.alert("Error", "Could not delete task");
          }
        },
      },
    ]);
  };

  const pending = tasks.filter((t) => !t.done);
  const completed = tasks.filter((t) => t.done);
  const totalXpToday = pending
    .filter((t) => t.dueDate.toLowerCase().includes("today"))
    .reduce((s, t) => s + t.xp, 0);

  const filteredPending =
    filter === "today"
      ? pending.filter((t) => t.dueDate.toLowerCase().includes("today"))
      : filter === "upcoming"
      ? pending.filter((t) => !t.dueDate.toLowerCase().includes("today"))
      : pending;

  const renderTaskCard = (task: TaskItem) => {
    const priorityColor =
      task.priority === "high"
        ? UI_COLORS.priorityHigh
        : task.priority === "medium"
        ? UI_COLORS.priorityMedium
        : UI_COLORS.priorityLow;

    return (
      <View
        key={task.id}
        style={[
          styles.taskCard,
          task.done && styles.taskCardDone,
          { borderLeftColor: priorityColor },
        ]}
      >
        <View style={styles.cardHeader}>
          {/* Checkbox */}
          <TouchableOpacity
            onPress={() => handleToggleComplete(task)}
            style={[
              styles.checkbox,
              task.done && styles.checkboxDone,
              { borderColor: task.done ? UI_COLORS.xpGreen : priorityColor },
            ]}
          >
            {task.done && (
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          {/* Title & Info */}
          <TouchableOpacity
            style={styles.taskInfo}
            onPress={() => {
              if (!task.done) {
                setEditingTask(task);
                setModalVisible(true);
              }
            }}
          >
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.taskTitle,
                  task.done && styles.taskTitleDone,
                ]}
                numberOfLines={2}
              >
                {task.text}
              </Text>
              {task.tag ? (
                <View style={styles.tagBadge}>
                  <Text style={styles.tagBadgeText}>{task.tag}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.metaRow}>
              {task.course ? (
                <Text style={styles.courseText}>{task.course} · </Text>
              ) : null}
              <Text style={styles.dueText}>
                {task.dueDate} {task.dueTime ? `@ ${task.dueTime}` : ""}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Delete Action */}
          <TouchableOpacity
            onPress={() => handleDeleteTask(task.id)}
            style={styles.deleteBtn}
          >
            <Ionicons name="trash-outline" size={18} color={UI_COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Footer with Priority & XP Reward */}
        <View style={styles.cardFooter}>
          <View style={styles.priorityIndicator}>
            <View
              style={[styles.priorityDot, { backgroundColor: priorityColor }]}
            />
            <Text style={styles.priorityLabel}>
              {task.priority.toUpperCase()}
            </Text>
          </View>

          <View style={styles.xpBadge}>
            <Text style={styles.xpText}>⚡ +{task.xp} XP</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScottyHeader title="My Tasks" />

      <FlatList
        data={filteredPending}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            {/* Hero Summary Banner */}
            <View style={styles.heroBanner}>
              <ScottyDog size={48} animated={true} />
              <View style={styles.heroTextWrapper}>
                <Text style={styles.heroSub}>Outstanding</Text>
                <Text style={styles.heroMain}>
                  {pending.length} {pending.length === 1 ? "task" : "tasks"}
                </Text>
                <Text style={styles.heroXp}>
                  ⚡ {totalXpToday} XP available today
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => {
                  setEditingTask(null);
                  setModalVisible(true);
                }}
              >
                <Ionicons name="add" size={26} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterRow}>
              {(["all", "today", "upcoming"] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.filterTab,
                    filter === f && styles.filterTabActive,
                  ]}
                  onPress={() => setFilter(f)}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      filter === f && styles.filterTabTextActive,
                    ]}
                  >
                    {f.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => renderTaskCard(item)}
        ListFooterComponent={
          completed.length > 0 ? (
            <View style={styles.completedSection}>
              <Text style={styles.completedHeader}>
                COMPLETED TODAY ({completed.length})
              </Text>
              {completed.map((t) => renderTaskCard(t))}
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <AddTaskModal
        visible={modalVisible}
        editingTask={editingTask}
        onClose={() => {
          setModalVisible(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
      />

      {activeFloat && (
        <XPFloat
          amount={activeFloat.xp}
          coins={activeFloat.coins}
          onDone={() => setActiveFloat(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_COLORS.bgWarm,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  headerSection: {
    paddingTop: 16,
  },
  heroBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: UI_COLORS.bgCard,
    borderColor: "rgba(196, 18, 48, 0.4)",
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    gap: 14,
  },
  heroTextWrapper: {
    flex: 1,
  },
  heroSub: {
    fontSize: 12,
    fontWeight: "700",
    color: UI_COLORS.textMuted,
    textTransform: "uppercase",
  },
  heroMain: {
    fontSize: 22,
    fontWeight: "900",
    color: UI_COLORS.textPrimary,
  },
  heroXp: {
    fontSize: 12,
    fontWeight: "700",
    color: UI_COLORS.cmuGold,
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: UI_COLORS.cmuRed,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: "center",
  },
  filterTabActive: {
    backgroundColor: UI_COLORS.cmuRed,
    borderColor: UI_COLORS.cmuRed,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: "800",
    color: UI_COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: "#FFFFFF",
  },
  taskCard: {
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  taskCardDone: {
    opacity: 0.5,
    backgroundColor: "rgba(28, 28, 46, 0.5)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  checkboxDone: {
    backgroundColor: UI_COLORS.xpGreen,
  },
  taskInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  taskTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: UI_COLORS.textPrimary,
    lineHeight: 20,
  },
  taskTitleDone: {
    textDecorationLine: "line-through",
    color: UI_COLORS.textMuted,
  },
  tagBadge: {
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: UI_COLORS.cyan,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  courseText: {
    fontSize: 12,
    fontWeight: "700",
    color: UI_COLORS.textMuted,
  },
  dueText: {
    fontSize: 12,
    fontWeight: "600",
    color: UI_COLORS.textSecondary,
  },
  deleteBtn: {
    padding: 4,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  priorityIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: UI_COLORS.textMuted,
  },
  xpBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  xpText: {
    fontSize: 12,
    fontWeight: "800",
    color: UI_COLORS.cmuGold,
  },
  completedSection: {
    marginTop: 16,
  },
  completedHeader: {
    fontSize: 12,
    fontWeight: "800",
    color: UI_COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
  },
});
