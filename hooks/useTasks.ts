import { useState, useEffect, useMemo, useCallback } from "react";
import { Alert } from "react-native";
import type { User } from "firebase/auth";

import {
  auth,
  database,
  onAuthStateChanged,
  ref,
  push,
  remove,
  onValue,
  query,
  orderByChild,
  equalTo,
  update,
} from "@/config/firebase";
import { useUserShopProfile } from "@/hooks/useUserShopProfile";
import type { TaskItem } from "@/components/AddTaskModal";

export type TaskFilter = "all" | "today" | "upcoming";

export interface TaskSaveData {
  text: string;
  course: string;
  priority: "high" | "medium" | "low";
  tag: string;
  dueDate: string;
  dueTime: string;
  xp: number;
}

export interface ActiveFloatReward {
  xp: number;
  coins: number;
}

export interface UseTasksReturn {
  tasks: TaskItem[];
  user: User | null;
  filter: TaskFilter;
  setFilter: (f: TaskFilter) => void;
  filteredPending: TaskItem[];
  pendingCount: number;
  completedTasks: TaskItem[];
  totalXpToday: number;
  modalVisible: boolean;
  setModalVisible: (v: boolean) => void;
  editingTask: TaskItem | null;
  setEditingTask: (t: TaskItem | null) => void;
  activeFloat: ActiveFloatReward | null;
  setActiveFloat: (f: ActiveFloatReward | null) => void;
  handleToggleComplete: (task: TaskItem) => Promise<void>;
  handleSaveTask: (taskData: TaskSaveData) => Promise<void>;
  handleDeleteTask: (id: string) => void;
  openNewTask: () => void;
  openEditTask: (task: TaskItem) => void;
  closeModal: () => void;
}

export const INITIAL_FALLBACK_TASKS: TaskItem[] = [
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

/**
 * Custom hook for task management, Firebase synchronization, and gamification rewards.
 */
export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_FALLBACK_TASKS);
  const [user, setUser] = useState<User | null>(null);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [activeFloat, setActiveFloat] = useState<ActiveFloatReward | null>(null);

  const { addXPAndCoins, feedScotty, xpMultiplier } = useUserShopProfile();

  useEffect(() => {
    let tasksUnsubscribe: null | (() => void) = null;

    const authUnsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (tasksUnsubscribe) {
        tasksUnsubscribe();
        tasksUnsubscribe = null;
      }

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
            const userTasks: TaskItem[] = Object.entries(data).map(([id, task]) => ({
              id,
              text: task.text || task.title || "Untitled Task",
              course: task.course,
              priority: (task.priority || "medium") as "high" | "medium" | "low",
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
      } else {
        setTasks(INITIAL_FALLBACK_TASKS);
      }
    });

    return () => {
      authUnsubscribe();
      if (tasksUnsubscribe) tasksUnsubscribe();
    };
  }, []);

  const handleToggleComplete = useCallback(
    async (task: TaskItem) => {
      const nextDone = !task.done;
      const earnedXP = Math.round(task.xp * (xpMultiplier ?? 1.0));

      if (!user) {
        // Local fallback for guest user
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, done: nextDone } : t))
        );
        if (nextDone) {
          setActiveFloat({ xp: earnedXP, coins: 5 });
          await addXPAndCoins(earnedXP, 5, true);
          await feedScotty(15);
        }
        return;
      }

      try {
        const taskRef = ref(database, `tasks/${task.id}`);
        await update(taskRef, { done: nextDone, updatedAt: Date.now() });

        if (nextDone) {
          setActiveFloat({ xp: earnedXP, coins: 5 });
          await addXPAndCoins(earnedXP, 5, true);
          await feedScotty(15);
        }
      } catch {
        Alert.alert("Error", "Could not update task status");
      }
    },
    [user, addXPAndCoins, feedScotty, xpMultiplier]
  );

  const handleSaveTask = useCallback(
    async (taskData: TaskSaveData) => {
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
      } catch {
        Alert.alert("Error", "Failed to save task");
      }
    },
    [user, editingTask]
  );

  const handleDeleteTask = useCallback(
    (id: string) => {
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
    },
    [user]
  );

  const openNewTask = useCallback(() => {
    setEditingTask(null);
    setModalVisible(true);
  }, []);

  const openEditTask = useCallback((task: TaskItem) => {
    setEditingTask(task);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setEditingTask(null);
  }, []);

  const pending = useMemo(() => tasks.filter((t) => !t.done), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((t) => t.done), [tasks]);
  const pendingCount = pending.length;

  const totalXpToday = useMemo(
    () =>
      pending
        .filter((t) => t.dueDate.toLowerCase().includes("today"))
        .reduce((sum, t) => sum + t.xp, 0),
    [pending]
  );

  const filteredPending = useMemo(() => {
    if (filter === "today") {
      return pending.filter((t) => t.dueDate.toLowerCase().includes("today"));
    }
    if (filter === "upcoming") {
      return pending.filter((t) => !t.dueDate.toLowerCase().includes("today"));
    }
    return pending;
  }, [pending, filter]);

  return {
    tasks,
    user,
    filter,
    setFilter,
    filteredPending,
    pendingCount,
    completedTasks,
    totalXpToday,
    modalVisible,
    setModalVisible,
    editingTask,
    setEditingTask,
    activeFloat,
    setActiveFloat,
    handleToggleComplete,
    handleSaveTask,
    handleDeleteTask,
    openNewTask,
    openEditTask,
    closeModal,
  };
}
