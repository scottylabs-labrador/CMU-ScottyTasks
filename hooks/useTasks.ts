import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Alert, AppState } from "react-native";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "@/contexts/AuthContext";
import { requireSupabase } from "@/config/supabase";

import { useUserShopProfile } from "@/hooks/useUserShopProfile";
import {
  addDaysToDateKey,
  compareTasksBySchedule,
  formatCalendarDayHeading,
  getTaskDateKey,
  isTaskDueToday,
  isTaskUpcoming,
  localDateKey,
  parseTaskDate,
} from "@/utils/taskDates";
import type { TaskItem } from "@/components/AddTaskModal";

export type TaskFilter = "all" | "today" | "upcoming";
export type TaskViewMode = "day" | "agenda";
export type TaskPriorityFilter = "all" | "high" | "medium" | "low";

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

export interface DayTaskSummary {
  pendingCount: number;
  completedCount: number;
  priorities: ("high" | "medium" | "low")[];
  hasOverdue: boolean;
}

export interface AgendaSection {
  key: string;
  dateKey: string | null;
  title: string;
  subtitle: string;
  isOverdue: boolean;
  isToday: boolean;
  tasks: TaskItem[];
}

export function createInitialFallbackTasks(now = new Date()): TaskItem[] {
  const todayKey = localDateKey(now);
  return [
    {
      id: "demo-overdue-1",
      text: "15-213 Cache Lab Checkpoint",
      course: "15-213",
      dueDate: addDaysToDateKey(todayKey, -1, now),
      dueTime: "11:59 PM",
      xp: 120,
      priority: "high",
      done: false,
      tag: "CS",
    },
    {
      id: "demo-1",
      text: "15-112 HW5 — Recursion",
      course: "15-112",
      dueDate: todayKey,
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
      dueDate: addDaysToDateKey(todayKey, 1, now),
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
      dueDate: addDaysToDateKey(todayKey, 3, now),
      dueTime: "11:59 PM",
      xp: 120,
      priority: "high",
      done: false,
      tag: "Math",
    },
    {
      id: "demo-4",
      text: "76-101 Essay Draft",
      course: "76-101",
      dueDate: todayKey,
      dueTime: "2:00 PM",
      xp: 80,
      priority: "medium",
      done: true,
      tag: "Writing",
    },
  ];
}

export const INITIAL_FALLBACK_TASKS: TaskItem[] = createInitialFallbackTasks();

const DEFAULT_TAG_FILTERS = ["CS", "Math", "ML", "Writing", "Stats", "General"];

export interface UseTasksReturn {
  tasks: TaskItem[];
  user: User | null;
  todayKey: string;
  todayDate: Date;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;

  // Legacy compatibility fields
  filter: TaskFilter;
  setFilter: (f: TaskFilter) => void;
  filteredPending: TaskItem[];
  pendingCount: number;
  dueTodayCount: number;
  overdueCount: number;
  completedTasks: TaskItem[];
  totalXpToday: number;

  // Calendar + Agenda state
  viewMode: TaskViewMode;
  setViewMode: (mode: TaskViewMode) => void;
  selectedDateKey: string;
  selectDate: (dateKey: string) => void;
  jumpToToday: () => void;
  calendarExpanded: boolean;
  toggleCalendarExpanded: () => void;
  viewYear: number;
  viewMonth: number;
  stepCalendarPeriod: (delta: -1 | 1) => void;
  daySummaries: Record<string, DayTaskSummary>;

  // Search & Filter state
  searchVisible: boolean;
  toggleSearch: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterVisible: boolean;
  toggleFilterBar: () => void;
  priorityFilter: TaskPriorityFilter;
  setPriorityFilter: (p: TaskPriorityFilter) => void;
  tagFilter: string;
  setTagFilter: (t: string) => void;
  availableTags: string[];
  hasActiveFilter: boolean;
  clearFilters: () => void;

  // Derived view data
  overdueTasks: TaskItem[];
  selectedDayPending: TaskItem[];
  selectedDayCompleted: TaskItem[];
  agendaSections: AgendaSection[];
  completedTodayTasks: TaskItem[];

  // Modals & Rewards
  modalVisible: boolean;
  setModalVisible: (v: boolean) => void;
  editingTask: TaskItem | null;
  setEditingTask: (t: TaskItem | null) => void;
  newTaskDefaultDate: string;
  activeFloat: ActiveFloatReward | null;
  setActiveFloat: (f: ActiveFloatReward | null) => void;

  // Actions
  handleToggleComplete: (task: TaskItem) => Promise<void>;
  handleSaveTask: (taskData: TaskSaveData) => Promise<void>;
  handleDeleteTask: (id: string) => void;
  handleRescheduleToToday: (task: TaskItem) => Promise<void>;
  handleRescheduleAllOverdue: () => Promise<void>;
  openNewTask: (forDateKey?: string) => void;
  openEditTask: (task: TaskItem) => void;
  closeModal: () => void;
}

/**
 * Custom hook for task management, calendar/agenda scheduling, Supabase sync, and rewards.
 */
export function useTasks(): UseTasksReturn {
  const { user } = useAuth();
  const uid = user?.id ?? null;

  const [todayKey, setTodayKey] = useState(() => localDateKey(new Date()));
  const todayDate = useMemo(
    () => parseTaskDate(todayKey) ?? new Date(),
    [todayKey]
  );

  const [tasks, setTasks] = useState<TaskItem[]>(() =>
    uid ? [] : createInitialFallbackTasks(new Date())
  );
  const [loading, setLoading] = useState<boolean>(Boolean(uid));
  const [error, setError] = useState<string | null>(null);
  const [prevUid, setPrevUid] = useState<string | null>(uid);

  const requestRef = useRef(0);
  const guestRewarded = useRef(new Set<string>());

  // Calendar & View Mode state
  const [viewMode, setViewMode] = useState<TaskViewMode>("day");
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() =>
    localDateKey(new Date())
  );
  const [prevTodayKey, setPrevTodayKey] = useState<string>(todayKey);
  const [calendarExpanded, setCalendarExpanded] = useState<boolean>(false);
  const [viewYear, setViewYear] = useState<number>(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => new Date().getMonth());

  // Search & Filter state
  const [searchVisible, setSearchVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterVisible, setFilterVisible] = useState<boolean>(false);
  const [priorityFilter, setPriorityFilter] = useState<TaskPriorityFilter>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");

  // Legacy filter + Modal & Reward state
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [newTaskDefaultDate, setNewTaskDefaultDate] = useState<string>(() =>
    localDateKey(new Date())
  );
  const [activeFloat, setActiveFloat] = useState<ActiveFloatReward | null>(null);

  const { addGuestReward, completeTask, xpMultiplier } = useUserShopProfile();

  // Reset state cleanly on auth transitions without synchronous setState in useEffect
  if (prevUid !== uid) {
    setPrevUid(uid);
    setLoading(Boolean(uid));
    setError(null);
    setTasks(uid ? [] : createInitialFallbackTasks(new Date()));
  }

  // Advance selected date across midnight if user was viewing Today
  if (prevTodayKey !== todayKey) {
    const wasOnToday = selectedDateKey === prevTodayKey;
    setPrevTodayKey(todayKey);
    if (wasOnToday) {
      const nextDate = parseTaskDate(todayKey) ?? new Date();
      setSelectedDateKey(todayKey);
      setViewYear(nextDate.getFullYear());
      setViewMonth(nextDate.getMonth());
    }
  }

  const invalidate = useCallback(() => {
    requestRef.current++;
  }, []);

  const fetchTasks = useCallback(async (): Promise<TaskItem[] | null> => {
    if (!uid) return null;
    const { data, error: dbErr } = await requireSupabase()
      .from("tasks")
      .select("*")
      .eq("user_id", uid)
      .order("created_at");
    if (dbErr) throw dbErr;
    return (data ?? []) as TaskItem[];
  }, [uid]);

  const refresh = useCallback(async () => {
    if (!uid) return;
    const version = ++requestRef.current;
    try {
      const data = await fetchTasks();
      if (version !== requestRef.current || !data) return;
      setTasks(data);
      setError(null);
    } catch {
      if (version === requestRef.current) {
        setError("Could not load your tasks. Check your connection and try again.");
      }
    } finally {
      if (version === requestRef.current) {
        setLoading(false);
      }
    }
  }, [uid, fetchTasks]);

  useEffect(() => {
    const refreshDay = () => setTodayKey(localDateKey(new Date()));
    const timer = setInterval(refreshDay, 30_000);

    if (!uid) {
      const sub = AppState.addEventListener("change", (state) => {
        if (state === "active") refreshDay();
      });
      return () => {
        clearInterval(timer);
        sub.remove();
      };
    }

    const syncFromRemote = () => {
      const version = ++requestRef.current;
      void fetchTasks()
        .then((data) => {
          if (version === requestRef.current && data) {
            setTasks(data);
            setError(null);
          }
        })
        .catch(() => {
          if (version === requestRef.current) {
            setError("Could not load your tasks. Check your connection and try again.");
          }
        })
        .finally(() => {
          if (version === requestRef.current) {
            setLoading(false);
          }
        });
    };

    syncFromRemote();

    const client = requireSupabase();
    const channel = client
      .channel(`tasks:${uid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${uid}` },
        syncFromRemote
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") syncFromRemote();
      });

    const foreground = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refreshDay();
        syncFromRemote();
      }
    });

    return () => {
      invalidate();
      clearInterval(timer);
      foreground.remove();
      void client.removeChannel(channel);
    };
  }, [uid, fetchTasks, invalidate]);

  // Calendar actions
  const selectDate = useCallback(
    (dateKey: string) => {
      setSelectedDateKey(dateKey);
      const parsed = parseTaskDate(dateKey, todayDate);
      if (parsed) {
        setViewYear(parsed.getFullYear());
        setViewMonth(parsed.getMonth());
      }
    },
    [todayDate]
  );

  const jumpToToday = useCallback(() => {
    setSelectedDateKey(todayKey);
    setViewYear(todayDate.getFullYear());
    setViewMonth(todayDate.getMonth());
  }, [todayKey, todayDate]);

  const toggleCalendarExpanded = useCallback(() => {
    setCalendarExpanded((prev) => {
      const next = !prev;
      if (!next) {
        // Sync month back to selected date when collapsing to week strip
        const parsed = parseTaskDate(selectedDateKey, todayDate);
        if (parsed) {
          setViewYear(parsed.getFullYear());
          setViewMonth(parsed.getMonth());
        }
      }
      return next;
    });
  }, [selectedDateKey, todayDate]);

  const stepCalendarPeriod = useCallback(
    (delta: -1 | 1) => {
      if (!calendarExpanded) {
        const nextKey = addDaysToDateKey(selectedDateKey, delta * 7, todayDate);
        setSelectedDateKey(nextKey);
        const parsed = parseTaskDate(nextKey, todayDate);
        if (parsed) {
          setViewYear(parsed.getFullYear());
          setViewMonth(parsed.getMonth());
        }
      } else {
        setViewMonth((prevMonth) => {
          const next = prevMonth + delta;
          if (next < 0) {
            setViewYear((y) => y - 1);
            return 11;
          }
          if (next > 11) {
            setViewYear((y) => y + 1);
            return 0;
          }
          return next;
        });
      }
    },
    [calendarExpanded, selectedDateKey, todayDate]
  );

  // Search & Filter toggles
  const toggleSearch = useCallback(() => {
    setSearchVisible((prev) => {
      if (prev) setSearchQuery("");
      return !prev;
    });
  }, []);

  const toggleFilterBar = useCallback(() => {
    setFilterVisible((prev) => !prev);
  }, []);

  const clearFilters = useCallback(() => {
    setPriorityFilter("all");
    setTagFilter("all");
    setSearchQuery("");
  }, []);

  const hasActiveFilter = priorityFilter !== "all" || tagFilter !== "all";

  const availableTags = useMemo(() => {
    const seen = new Set<string>(DEFAULT_TAG_FILTERS);
    for (const t of tasks) {
      if (t.tag?.trim()) seen.add(t.tag.trim());
    }
    return Array.from(seen);
  }, [tasks]);

  // CRUD & Gamification handlers
  const handleToggleComplete = useCallback(
    async (task: TaskItem) => {
      const nextDone = !task.done;
      const earnedXP = Math.round(task.xp * (xpMultiplier ?? 1.0));

      if (!user) {
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
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, done: nextDone } : t))
        );
      } catch {
        Alert.alert("Error", "Could not update task status");
      }
    },
    [user, addGuestReward, completeTask, xpMultiplier]
  );

  const handleSaveTask = useCallback(
    async (taskData: TaskSaveData) => {
      if (!user) {
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
          ? await client
              .from("tasks")
              .update(taskData)
              .eq("id", editingTask.id)
              .eq("user_id", user.id)
              .select()
              .single()
          : await client
              .from("tasks")
              .insert({ ...taskData, user_id: user.id })
              .select()
              .single();
        if (result.error) throw result.error;
        const saved = result.data as TaskItem;
        setTasks((prev) =>
          editingTask
            ? prev.map((t) => (t.id === editingTask.id ? saved : t))
            : [...prev.filter((t) => t.id !== saved.id), saved]
        );
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
              const { error: delErr } = await requireSupabase()
                .from("tasks")
                .delete()
                .eq("id", id)
                .eq("user_id", user.id);
              if (delErr) throw delErr;
              setTasks((prev) => prev.filter((t) => t.id !== id));
            } catch {
              Alert.alert("Error", "Could not delete task");
            }
          },
        },
      ]);
    },
    [user]
  );

  const handleRescheduleToToday = useCallback(
    async (task: TaskItem) => {
      const previousDueDate = task.dueDate;
      if (getTaskDateKey(previousDueDate, todayDate) === todayKey) return;

      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, dueDate: todayKey } : t))
      );

      if (!user) return;

      try {
        const { error: updErr } = await requireSupabase()
          .from("tasks")
          .update({ dueDate: todayKey })
          .eq("id", task.id)
          .eq("user_id", user.id);
        if (updErr) throw updErr;
      } catch {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, dueDate: previousDueDate } : t
          )
        );
        Alert.alert("Error", "Could not reschedule task to today.");
      }
    },
    [todayDate, todayKey, user]
  );

  const openNewTask = useCallback(
    (forDateKey?: string) => {
      setEditingTask(null);
      const targetDate =
        forDateKey ?? (viewMode === "day" ? selectedDateKey : todayKey);
      setNewTaskDefaultDate(targetDate);
      setModalVisible(true);
    },
    [selectedDateKey, todayKey, viewMode]
  );

  const openEditTask = useCallback((task: TaskItem) => {
    setEditingTask(task);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setEditingTask(null);
  }, []);

  // Global stats (unfiltered, for top Scotty summary banner)
  const pending = useMemo(() => tasks.filter((t) => !t.done), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((t) => t.done), [tasks]);
  const pendingCount = pending.length;

  const { dueTodayCount, overdueCount, totalXpToday } = useMemo(() => {
    let dueToday = 0;
    let overdue = 0;
    let xpToday = 0;
    for (const t of pending) {
      const key = getTaskDateKey(t.dueDate, todayDate);
      if (key === todayKey) {
        dueToday++;
        xpToday += t.xp;
      } else if (key !== null && key < todayKey) {
        overdue++;
      }
    }
    return {
      dueTodayCount: dueToday,
      overdueCount: overdue,
      totalXpToday: xpToday,
    };
  }, [pending, todayDate, todayKey]);

  // Search + Priority + Tag filtered tasks
  const matchingTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tasks.filter((t) => {
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (tagFilter !== "all" && t.tag !== tagFilter) return false;
      if (q) {
        const hay = `${t.text} ${t.course ?? ""} ${t.tag ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tasks, priorityFilter, tagFilter, searchQuery]);

  // Per-day summaries for calendar dot indicators
  const daySummaries = useMemo(() => {
    const map: Record<
      string,
      {
        pendingCount: number;
        completedCount: number;
        rawPriorities: ("high" | "medium" | "low")[];
      }
    > = {};

    for (const t of matchingTasks) {
      const key = getTaskDateKey(t.dueDate, todayDate);
      if (!key) continue;
      if (!map[key]) {
        map[key] = { pendingCount: 0, completedCount: 0, rawPriorities: [] };
      }
      if (t.done) {
        map[key].completedCount++;
      } else {
        map[key].pendingCount++;
        map[key].rawPriorities.push(t.priority);
      }
    }

    const rank: Record<"high" | "medium" | "low", number> = {
      high: 0,
      medium: 1,
      low: 2,
    };
    const result: Record<string, DayTaskSummary> = {};
    for (const [key, entry] of Object.entries(map)) {
      const sortedPrios = [...entry.rawPriorities]
        .sort((a, b) => rank[a] - rank[b])
        .slice(0, 3);
      result[key] = {
        pendingCount: entry.pendingCount,
        completedCount: entry.completedCount,
        priorities: sortedPrios,
        hasOverdue: entry.pendingCount > 0 && key < todayKey,
      };
    }
    return result;
  }, [matchingTasks, todayDate, todayKey]);

  // Overdue pending tasks (sorted chronologically)
  const allOverdueMatching = useMemo(() => {
    return matchingTasks
      .filter((t) => {
        if (t.done) return false;
        const key = getTaskDateKey(t.dueDate, todayDate);
        return key !== null && key < todayKey;
      })
      .sort((a, b) => compareTasksBySchedule(a, b, todayDate));
  }, [matchingTasks, todayDate, todayKey]);

  const handleRescheduleAllOverdue = useCallback(async () => {
    if (allOverdueMatching.length === 0) return;
    const ids = new Set(allOverdueMatching.map((t) => t.id));
    const snapshot = tasks;

    setTasks((prev) =>
      prev.map((t) => (ids.has(t.id) ? { ...t, dueDate: todayKey } : t))
    );

    if (!user) return;

    try {
      const { error: updErr } = await requireSupabase()
        .from("tasks")
        .update({ dueDate: todayKey })
        .in("id", Array.from(ids))
        .eq("user_id", user.id);
      if (updErr) throw updErr;
    } catch {
      setTasks(snapshot);
      Alert.alert("Error", "Could not reschedule overdue tasks.");
    }
  }, [allOverdueMatching, tasks, todayKey, user]);

  // Day view lists (for `selectedDateKey`)
  const overdueTasks = useMemo(
    () => (selectedDateKey === todayKey ? allOverdueMatching : []),
    [selectedDateKey, todayKey, allOverdueMatching]
  );

  const selectedDayPending = useMemo(() => {
    return matchingTasks
      .filter((t) => {
        if (t.done) return false;
        const key = getTaskDateKey(t.dueDate, todayDate);
        if (key === null) return selectedDateKey === todayKey;
        return key === selectedDateKey;
      })
      .sort((a, b) => compareTasksBySchedule(a, b, todayDate));
  }, [matchingTasks, selectedDateKey, todayDate, todayKey]);

  const selectedDayCompleted = useMemo(() => {
    return matchingTasks
      .filter((t) => {
        if (!t.done) return false;
        const key = getTaskDateKey(t.dueDate, todayDate);
        if (key === null) return selectedDateKey === todayKey;
        return key === selectedDateKey;
      })
      .sort((a, b) => compareTasksBySchedule(a, b, todayDate));
  }, [matchingTasks, selectedDateKey, todayDate, todayKey]);

  // Agenda view chronological sections
  const agendaSections = useMemo<AgendaSection[]>(() => {
    const sections: AgendaSection[] = [];

    if (allOverdueMatching.length > 0) {
      sections.push({
        key: "overdue",
        dateKey: null,
        title: "Overdue",
        subtitle: `${allOverdueMatching.length} past due`,
        isOverdue: true,
        isToday: false,
        tasks: allOverdueMatching,
      });
    }

    const byDate = new Map<string, TaskItem[]>();
    const unscheduled: TaskItem[] = [];

    for (const t of matchingTasks) {
      if (t.done) continue;
      const key = getTaskDateKey(t.dueDate, todayDate);
      if (!key) {
        unscheduled.push(t);
        continue;
      }
      if (key < todayKey) continue; // Already in Overdue
      const list = byDate.get(key);
      if (list) list.push(t);
      else byDate.set(key, [t]);
    }

    const sortedDateKeys = Array.from(byDate.keys()).sort();
    for (const dateKey of sortedDateKeys) {
      const items = (byDate.get(dateKey) ?? []).sort((a, b) =>
        compareTasksBySchedule(a, b, todayDate)
      );
      const heading = formatCalendarDayHeading(dateKey, todayDate);
      sections.push({
        key: `date:${dateKey}`,
        dateKey,
        title: heading.primary,
        subtitle: heading.secondary,
        isOverdue: false,
        isToday: heading.isToday,
        tasks: items,
      });
    }

    if (unscheduled.length > 0) {
      sections.push({
        key: "unscheduled",
        dateKey: null,
        title: "Unscheduled",
        subtitle: `${unscheduled.length} tasks`,
        isOverdue: false,
        isToday: false,
        tasks: unscheduled,
      });
    }

    return sections;
  }, [allOverdueMatching, matchingTasks, todayDate, todayKey]);

  const completedTodayTasks = useMemo(() => {
    return matchingTasks
      .filter((t) => t.done && getTaskDateKey(t.dueDate, todayDate) === todayKey)
      .sort((a, b) => compareTasksBySchedule(a, b, todayDate));
  }, [matchingTasks, todayDate, todayKey]);

  // Legacy filteredPending for backwards compatibility
  const filteredPending = useMemo(() => {
    if (filter === "today") {
      return pending.filter((t) => isTaskDueToday(t.dueDate, todayDate));
    }
    if (filter === "upcoming") {
      return pending.filter((t) => isTaskUpcoming(t.dueDate, todayDate));
    }
    return pending;
  }, [pending, filter, todayDate]);

  return {
    tasks,
    user,
    todayKey,
    todayDate,
    loading,
    error,
    refresh,

    filter,
    setFilter,
    filteredPending,
    pendingCount,
    dueTodayCount,
    overdueCount,
    completedTasks,
    totalXpToday,

    viewMode,
    setViewMode,
    selectedDateKey,
    selectDate,
    jumpToToday,
    calendarExpanded,
    toggleCalendarExpanded,
    viewYear,
    viewMonth,
    stepCalendarPeriod,
    daySummaries,

    searchVisible,
    toggleSearch,
    searchQuery,
    setSearchQuery,
    filterVisible,
    toggleFilterBar,
    priorityFilter,
    setPriorityFilter,
    tagFilter,
    setTagFilter,
    availableTags,
    hasActiveFilter,
    clearFilters,

    overdueTasks,
    selectedDayPending,
    selectedDayCompleted,
    agendaSections,
    completedTodayTasks,

    modalVisible,
    setModalVisible,
    editingTask,
    setEditingTask,
    newTaskDefaultDate,
    activeFloat,
    setActiveFloat,

    handleToggleComplete,
    handleSaveTask,
    handleDeleteTask,
    handleRescheduleToToday,
    handleRescheduleAllOverdue,
    openNewTask,
    openEditTask,
    closeModal,
  };
}
