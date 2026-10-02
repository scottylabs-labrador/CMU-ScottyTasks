import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Alert, AppState } from "react-native";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "@/contexts/AuthContext";
import { requireSupabase } from "@/config/supabase";

import { useUserShopProfile } from "@/hooks/useUserShopProfile";
import { isTaskDueToday, isTaskUpcoming, localDateKey, parseTaskDate } from "@/utils/taskDates";
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
 * Custom hook for task management, Supabase synchronization, and gamification rewards.
 */
export function useTasks(): UseTasksReturn {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>(() => user ? [] : INITIAL_FALLBACK_TASKS);
  const uid = user?.id;
  const [today, setToday] = useState(() => localDateKey(new Date()));
  useEffect(() => {
    const refreshDay = () => setToday(localDateKey(new Date()));
    const timer = setInterval(refreshDay, 30_000);
    const foreground = AppState.addEventListener('change', state => { if (state === 'active') refreshDay(); });
    return () => { clearInterval(timer); foreground.remove(); };
  }, []);
  const guestRewarded = useRef(new Set<string>());
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [activeFloat, setActiveFloat] = useState<ActiveFloatReward | null>(null);

  const { addGuestReward, completeTask, xpMultiplier } = useUserShopProfile();

  const refreshTasks = useCallback(async () => {
    if (!uid) return;
    const { data, error } = await requireSupabase().from('tasks').select('*').eq('user_id', uid).order('created_at');
    if (error) throw error;
    return data as TaskItem[];
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    let active = true;
    const refresh = () => {
      void refreshTasks().then(data => { if (active && data) setTasks(data); }).catch(() => {
        if (active) Alert.alert('Tasks unavailable', 'Could not load your tasks. Please check your connection.');
      });
    };
    const client = requireSupabase();
    const channel = client.channel(`tasks:${uid}`).on('postgres_changes', {
      event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${uid}`,
    }, refresh).subscribe(status => { if (status === 'SUBSCRIBED') refresh(); });
    refresh();
    const foreground = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    return () => { active = false; foreground.remove(); void client.removeChannel(channel); };
  }, [uid, refreshTasks]);

  const handleToggleComplete = useCallback(
    async (task: TaskItem) => {
      const nextDone = !task.done;
      const earnedXP = Math.round(task.xp * (xpMultiplier ?? 1.0));

      if (!user) {
        // Local fallback for guest user
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, done: nextDone } : t))
        );
        if (nextDone && !guestRewarded.current.has(task.id)) {
          guestRewarded.current.add(task.id);
          setActiveFloat({ xp: earnedXP, coins: 5 });
          addGuestReward(earnedXP, 5, true, 15);
        }
        return;
      }

      try {
        const data = await completeTask(task.id, nextDone);
        if (data.xp > 0) setActiveFloat({ xp: data.xp, coins: data.coins });
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: nextDone } : t));
      } catch {
        Alert.alert("Error", "Could not update task status");
      }
    },
    [user, addGuestReward, completeTask, xpMultiplier]
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
        const client = requireSupabase();
        const result = editingTask
          ? await client.from('tasks').update(taskData).eq('id', editingTask.id).eq('user_id', user.id).select().single()
          : await client.from('tasks').insert({ ...taskData, user_id: user.id }).select().single();
        if (result.error) throw result.error;
        setTasks(prev => editingTask ? prev.map(t => t.id === editingTask.id ? result.data as TaskItem : t) : [...prev.filter(t => t.id !== result.data.id), result.data as TaskItem]);
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
              const { error } = await requireSupabase().from('tasks').delete().eq('id', id).eq('user_id', user.id);
              if (error) throw error;
              setTasks(prev => prev.filter(t => t.id !== id));
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
        .filter((t) => isTaskDueToday(t.dueDate, parseTaskDate(today)!))
        .reduce((sum, t) => sum + t.xp, 0),
    [pending, today]
  );

  const filteredPending = useMemo(() => {
    if (filter === "today") {
      return pending.filter((t) => isTaskDueToday(t.dueDate, parseTaskDate(today)!));
    }
    if (filter === "upcoming") {
      return pending.filter((t) => isTaskUpcoming(t.dueDate, parseTaskDate(today)!));
    }
    return pending;
  }, [pending, filter, today]);

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
