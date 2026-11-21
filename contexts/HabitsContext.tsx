import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { Alert, AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  HABIT_PRIORITY_XP,
  createInitialHabits,
  type HabitCategoryId,
  type HabitItem,
  type HabitSaveData,
} from "@/constants/habits";
import { requireSupabase } from "@/config/supabase";
import { realtimeTopic } from "@/utils/realtimeTopic";
import { useAuth } from "@/contexts/AuthContext";
import { useUserShopProfile } from "@/hooks/useUserShopProfile";
import { localDateKey, parseTaskDate } from "@/utils/taskDates";
import {
  evaluateNumericValue,
  isDayCompleted,
  mapDbHabitToItem,
  normalizeHabit,
  validateHabitSaveData,
  type DbHabitEntryRow,
} from "@/utils/habitLogic";

export interface ActiveFloatReward {
  xp: number;
  coins: number;
}

export interface NumericLogTarget {
  habitId: string;
  dateKey: string;
}

const GUEST_STORAGE_KEY = "scotty_habits_guest_v3";
const META_STORAGE_PREFIX = "scotty_habit_meta_v1:";

type HabitMetaMap = Record<string, Record<string, unknown>>;

async function readStorageJson<T>(key: string): Promise<T | null> {
  try {
    const raw =
      Platform.OS === "web"
        ? typeof window !== "undefined"
          ? window.localStorage.getItem(key)
          : null
        : await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeStorageJson(key: string, value: unknown): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, serialized);
      }
    } else {
      await AsyncStorage.setItem(key, serialized);
    }
  } catch {
    // Non-fatal local persistence failure
  }
}

function confirmAction(
  title: string,
  message: string,
  confirmText: string,
  onConfirm: () => void,
) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: confirmText, style: "destructive", onPress: onConfirm },
  ]);
}

function isLegacySchemaError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = "code" in err ? String((err as { code?: unknown }).code ?? "") : "";
  const msg = "message" in err ? String((err as { message?: unknown }).message ?? "") : "";
  return (
    code === "PGRST204" ||
    code === "PGRST202" ||
    code === "42703" ||
    code === "42501" ||
    code === "23514" ||
    msg.includes("schema cache") ||
    msg.includes("column")
  );
}

function buildLegacyCompatibleInsert(data: HabitSaveData, uid: string) {
  const trimmedTitle = data.title.trim();
  const isNumeric = data.evaluationType === "numeric";
  const trimmedUnit = isNumeric ? data.unit.trim() : "";

  const fitsLegacyCategoryRules =
    data.categoryId === "custom" ||
    (data.categoryId === "water" &&
      trimmedTitle === "Water" &&
      (!isNumeric || trimmedUnit === "oz")) ||
    (data.categoryId === "sleep" &&
      trimmedTitle === "Sleep" &&
      (!isNumeric || trimmedUnit === "hours")) ||
    (["hobbies", "exercise", "social", "outdoor"].includes(data.categoryId) &&
      (!isNumeric || trimmedUnit === "hours"));

  return {
    user_id: uid,
    category: fitsLegacyCategoryRules ? data.categoryId : "custom",
    tracking: data.evaluationType,
    title: trimmedTitle,
    description: data.description.trim(),
    unit: trimmedUnit,
    goal: isNumeric ? data.goal : null,
    starts_on: data.startDate,
  };
}

export interface UseHabitsReturn {
  habits: HabitItem[];
  filteredHabits: HabitItem[];
  today: Date;
  loading: boolean;
  error: string | null;
  saving: boolean;
  refresh: () => Promise<void>;
  archivedCount: number;

  filterVisible: boolean;
  categoryFilter: "all" | HabitCategoryId;
  setCategoryFilter: (cat: "all" | HabitCategoryId) => void;
  toggleFilterBar: () => void;
  showArchived: boolean;
  toggleArchivedView: () => void;

  modalVisible: boolean;
  editingHabit: HabitItem | null;
  openNewHabit: () => void;
  openEditHabit: (habit: HabitItem) => void;
  closeModal: () => void;
  handleSaveHabit: (data: HabitSaveData) => Promise<boolean>;
  createHabit: (data: HabitSaveData) => Promise<HabitItem | null>;
  setHabitCompletedById: (habitId: string, done: boolean) => Promise<boolean>;

  handlePressDay: (habit: HabitItem, dateKey: string) => Promise<void>;
  handleSaveNumericValue: (
    habit: HabitItem,
    dateKey: string,
    value: number | null,
    note: string,
  ) => Promise<void>;
  handleToggleArchive: (habit: HabitItem) => Promise<void>;
  handleResetDailyProgress: (habit: HabitItem, dateKey: string) => void;
  handleDeleteHabit: (id: string) => void;

  numericLogTarget: NumericLogTarget | null;
  numericLogHabit: HabitItem | null;
  closeNumericLog: () => void;

  calendarHabit: HabitItem | null;
  openCalendar: (h: HabitItem) => void;
  closeCalendar: () => void;

  statsHabit: HabitItem | null;
  openStats: (h: HabitItem) => void;
  closeStats: () => void;

  actionsHabit: HabitItem | null;
  openActions: (h: HabitItem) => void;
  closeActions: () => void;

  activeFloat: ActiveFloatReward | null;
  setActiveFloat: (f: ActiveFloatReward | null) => void;
}

function useHabitsState(): UseHabitsReturn {
  const { user } = useAuth();
  const uid = user?.id ?? null;

  const [todayKey, setTodayKey] = useState(() => localDateKey(new Date()));
  const today = useMemo(() => parseTaskDate(todayKey) ?? new Date(), [todayKey]);

  const [habits, setHabits] = useState<HabitItem[]>(() =>
    uid ? [] : createInitialHabits(new Date()),
  );
  const [loading, setLoading] = useState<boolean>(Boolean(uid));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [prevUid, setPrevUid] = useState<string | null>(uid);

  const requestRef = useRef(0);
  const guestHydratedRef = useRef(false);
  const guestRewardedRef = useRef<Set<string>>(new Set());

  if (prevUid !== uid) {
    setPrevUid(uid);
    setLoading(Boolean(uid));
    setError(null);
    setHabits(uid ? [] : createInitialHabits(new Date()));
  }

  const invalidate = useCallback(() => {
    requestRef.current++;
  }, []);

  const { addGuestReward, recordHabitDay, xpMultiplier } =
    useUserShopProfile();

  const [filterVisible, setFilterVisible] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<"all" | HabitCategoryId>("all");
  const [showArchived, setShowArchived] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitItem | null>(null);
  const [numericLogTarget, setNumericLogTarget] = useState<NumericLogTarget | null>(null);
  const [calendarHabitId, setCalendarHabitId] = useState<string | null>(null);
  const [statsHabitId, setStatsHabitId] = useState<string | null>(null);
  const [actionsHabitId, setActionsHabitId] = useState<string | null>(null);
  const [activeFloat, setActiveFloat] = useState<ActiveFloatReward | null>(null);

  const saveLocalMeta = useCallback(
    async (habitId: string, meta: Record<string, unknown> | null) => {
      if (!uid) return;
      const key = `${META_STORAGE_PREFIX}${uid}`;
      const existing = (await readStorageJson<HabitMetaMap>(key)) ?? {};
      if (meta === null) {
        delete existing[habitId];
      } else {
        existing[habitId] = { ...(existing[habitId] ?? {}), ...meta };
      }
      await writeStorageJson(key, existing);
    },
    [uid],
  );

  const refresh = useCallback(async () => {
    if (!uid) return;
    const version = ++requestRef.current;
    try {
      const client = requireSupabase();
      const loadAllEntries = async (): Promise<DbHabitEntryRow[]> => {
        const all: DbHabitEntryRow[] = [];
        for (let offset = 0; ; offset += 500) {
          const res = await client
            .from("habit_entries")
            .select("*")
            .eq("user_id", uid)
            .order("day", { ascending: false })
            .order("habit_id")
            .range(offset, offset + 499);
          if (res.error) throw res.error;
          all.push(...(res.data as DbHabitEntryRow[]));
          if (res.data.length < 500 || version !== requestRef.current) {
            return all;
          }
        }
      };

      const [habitsRes, allEntries, metaMap] = await Promise.all([
        client.from("habits").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
        loadAllEntries(),
        readStorageJson<HabitMetaMap>(`${META_STORAGE_PREFIX}${uid}`),
      ]);

      if (habitsRes.error) throw habitsRes.error;
      if (version !== requestRef.current) return;

      const entriesByHabit = new Map<string, DbHabitEntryRow[]>();
      for (const entry of allEntries) {
        const list = entriesByHabit.get(entry.habit_id);
        if (list) list.push(entry);
        else entriesByHabit.set(entry.habit_id, [entry]);
      }

      const now = new Date();
      const mapped = (habitsRes.data as Record<string, unknown>[]).map((row) => {
        const id = String(row.id ?? "");
        return mapDbHabitToItem(row, entriesByHabit.get(id) ?? [], metaMap?.[id], now);
      });

      setHabits(mapped);
      setError(null);
    } catch {
      if (version === requestRef.current) {
        setError("Could not load your habits. Check your connection and try again.");
      }
    } finally {
      if (version === requestRef.current) {
        setLoading(false);
      }
    }
  }, [uid]);

  useEffect(() => {
    const refreshDay = () => setTodayKey(localDateKey(new Date()));
    const timer = setInterval(refreshDay, 30_000);

    if (!uid) {
      let active = true;
      guestHydratedRef.current = false;
      void readStorageJson<unknown[]>(GUEST_STORAGE_KEY).then((stored) => {
        if (!active) return;
        const now = new Date();
        if (Array.isArray(stored)) {
          setHabits(
            stored
              .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"))
              .map((x) => normalizeHabit(x, now)),
          );
        } else {
          setHabits(createInitialHabits(now));
        }
        setError(null);
        setLoading(false);
        guestHydratedRef.current = true;
      });

      const sub = AppState.addEventListener("change", (state) => {
        if (state === "active") refreshDay();
      });
      return () => {
        active = false;
        clearInterval(timer);
        sub.remove();
      };
    }

    let active = true;
    const syncFromRemote = () => {
      if (active) void refresh();
    };
    syncFromRemote();

    const foreground = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refreshDay();
        syncFromRemote();
      }
    });

    const client = requireSupabase();
    const channel = client
      .channel(realtimeTopic("habits", uid))
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "habits", filter: `user_id=eq.${uid}` },
        () => {
          syncFromRemote();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "habit_entries", filter: `user_id=eq.${uid}` },
        () => {
          syncFromRemote();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") syncFromRemote();
      });

    return () => {
      active = false;
      invalidate();
      clearInterval(timer);
      foreground.remove();
      void client.removeChannel(channel);
    };
  }, [uid, refresh, invalidate]);

  useEffect(() => {
    if (uid || !guestHydratedRef.current) return;
    void writeStorageJson(GUEST_STORAGE_KEY, habits);
  }, [habits, uid]);

  const awardGuestTodayIfEligible = useCallback(
    (habit: HabitItem) => {
      const claimKey = `${habit.id}:${todayKey}`;
      if (guestRewardedRef.current.has(claimKey)) return;
      guestRewardedRef.current.add(claimKey);
      const earnedXp = Math.round(habit.xp * (xpMultiplier ?? 1));
      addGuestReward(earnedXp, 2, false, 10);
      setActiveFloat({ xp: earnedXp, coins: 2 });
    },
    [addGuestReward, todayKey, xpMultiplier],
  );

  const commitBooleanDay = useCallback(
    async (habit: HabitItem, dateKey: string, nextCompleted: boolean): Promise<boolean> => {
      const previousHabits = habits;

      setHabits((prev) =>
        prev.map((h) => {
          if (h.id !== habit.id) return h;
          const nextHistory = { ...h.history };
          if (nextCompleted) {
            nextHistory[dateKey] = {
              ...nextHistory[dateKey],
              completed: true,
              value: 1,
            };
          } else {
            delete nextHistory[dateKey];
          }
          const nextStartDate = nextCompleted && dateKey < h.startDate ? dateKey : h.startDate;
          return { ...h, startDate: nextStartDate, history: nextHistory };
        }),
      );

      if (!uid) {
        if (nextCompleted && dateKey === todayKey) {
          awardGuestTodayIfEligible(habit);
        }
        return true;
      }

      try {
        requestRef.current++;
        const res = await recordHabitDay(habit.id, dateKey, nextCompleted ? 1 : null, "");
        if (res?.xp > 0) {
          setActiveFloat({ xp: res.xp, coins: res.coins ?? 2 });
        }
        return true;
      } catch (err: unknown) {
        setHabits(previousHabits);
        throw err;
      }
    },
    [awardGuestTodayIfEligible, habits, recordHabitDay, todayKey, uid],
  );

  const commitNumericDay = useCallback(
    async (
      habit: HabitItem,
      dateKey: string,
      value: number | null,
      note: string,
    ): Promise<boolean> => {
      const roundedValue = value === null ? null : Math.round(Math.max(0, value) * 100) / 100;
      const wasCompleted = isDayCompleted(habit, dateKey);
      const existingSnapGoal = habit.history[dateKey]?.goal;
      const effectiveGoal =
        typeof existingSnapGoal === "number" && existingSnapGoal > 0
          ? existingSnapGoal
          : habit.goal;

      const nextCompleted =
        roundedValue !== null &&
        evaluateNumericValue(roundedValue, habit.goalCondition, effectiveGoal);

      setHabits((prev) =>
        prev.map((h) => {
          if (h.id !== habit.id) return h;
          const nextHistory = { ...h.history };
          if (roundedValue === null) {
            delete nextHistory[dateKey];
          } else {
            nextHistory[dateKey] = {
              completed: nextCompleted,
              value: roundedValue,
              goal: effectiveGoal,
              ...(note ? { note } : {}),
            };
          }
          const nextStartDate =
            roundedValue !== null && dateKey < h.startDate ? dateKey : h.startDate;
          return { ...h, startDate: nextStartDate, history: nextHistory };
        }),
      );

      if (!uid) {
        if (!wasCompleted && nextCompleted && dateKey === todayKey) {
          awardGuestTodayIfEligible(habit);
        }
        return true;
      }

      try {
        requestRef.current++;
        const res = await recordHabitDay(habit.id, dateKey, roundedValue, note);
        if (res?.xp > 0) {
          setActiveFloat({ xp: res.xp, coins: res.coins ?? 2 });
        }
        return true;
      } catch (err: unknown) {
        setHabits((prev) => prev.map((h) => {
          if (h.id !== habit.id) return h;
          const history = { ...h.history };
          if (habit.history[dateKey]) history[dateKey] = habit.history[dateKey];
          else delete history[dateKey];
          return { ...h, history };
        }));
        throw err;
      }
    },
    [awardGuestTodayIfEligible, recordHabitDay, todayKey, uid],
  );

  // Serialize taps per habit/day so rapid taps cannot overwrite the same total.
  const incrementQueues = useRef(new Map<string, { habit: HabitItem; pending: number; tail: Promise<void> }>());

  const handlePressDay = useCallback(
    async (habit: HabitItem, dateKey: string) => {
      if (dateKey > todayKey) return;

      if (habit.evaluationType === "numeric") {
        if (dateKey !== todayKey) {
          setNumericLogTarget({ habitId: habit.id, dateKey });
          return;
        }
        if (habit.archived) return;
        const key = `${uid ?? "guest"}:${habit.id}:${dateKey}`;
        let queue = incrementQueues.current.get(key);
        if (!queue) {
          queue = { habit, pending: 0, tail: Promise.resolve() };
          incrementQueues.current.set(key, queue);
        }
        const activeQueue = queue;
        activeQueue.pending++;
        activeQueue.tail = activeQueue.tail.then(async () => {
          const current = activeQueue.habit;
          const entry = current.history[dateKey];
          const value = Math.round(((entry?.value ?? 0) + habit.step) * 100) / 100;
          try {
            await commitNumericDay(current, dateKey, value, entry?.note ?? "");
            activeQueue.habit = {
              ...current,
              history: { ...current.history, [dateKey]: { ...entry, value } },
            };
          } catch {
            Alert.alert("Error", "Could not save this increment. Please try again.");
          } finally {
            activeQueue.pending--;
            if (activeQueue.pending === 0) incrementQueues.current.delete(key);
          }
        });
        await activeQueue.tail;
        return;
      }

      const wasCompleted = isDayCompleted(habit, dateKey);
      try {
        await commitBooleanDay(habit, dateKey, !wasCompleted);
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: unknown }).message ?? "")
            : "";
        if (msg.includes("Invalid entry date")) {
          Alert.alert(
            "Date Before Habit Start",
            "Run the latest habits migration in Supabase (or move this habit's Start Date earlier) to backfill days before creation.",
          );
        } else {
          Alert.alert("Error", "Could not save your habit check-in. Please try again.");
        }
      }
    },
    [commitBooleanDay, commitNumericDay, todayKey, uid],
  );

  const handleSaveNumericValue = useCallback(
    async (habit: HabitItem, dateKey: string, value: number | null, note: string) => {
      if (dateKey > todayKey) return;
      try {
        await commitNumericDay(habit, dateKey, value, note);
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: unknown }).message ?? "")
            : "";
        if (msg.includes("Invalid entry date")) {
          Alert.alert(
            "Date Before Habit Start",
            "Run the latest habits migration in Supabase (or move this habit's Start Date earlier) to backfill days before creation.",
          );
        } else {
          Alert.alert("Error", "Could not save your numeric entry. Please try again.");
        }
      }
    },
    [commitNumericDay, todayKey],
  );

  const setHabitCompletedById = useCallback(
    async (habitId: string, done: boolean): Promise<boolean> => {
      const target = habits.find((h) => h.id === habitId);
      if (!target) return false;

      const currentlyDone = isDayCompleted(target, todayKey);
      if (currentlyDone === done) return true;

      try {
        if (target.evaluationType === "boolean") {
          return await commitBooleanDay(target, todayKey, done);
        }
        if (!done) {
          return await commitNumericDay(target, todayKey, null, "");
        }
        const existingSnapGoal = target.history[todayKey]?.goal;
        const effectiveGoal =
          typeof existingSnapGoal === "number" && existingSnapGoal > 0
            ? existingSnapGoal
            : target.goal;
        const completionValue = target.goalCondition === "less_than" ? 0 : effectiveGoal;
        const existingNote = target.history[todayKey]?.note ?? "";
        return await commitNumericDay(target, todayKey, completionValue, existingNote);
      } catch {
        return false;
      }
    },
    [commitBooleanDay, commitNumericDay, habits, todayKey],
  );

  const createHabit = useCallback(
    async (data: HabitSaveData): Promise<HabitItem | null> => {
      const validationError = validateHabitSaveData(data);
      if (validationError) {
        throw new Error(validationError);
      }

      const xp = HABIT_PRIORITY_XP[data.priority];

      if (!uid) {
        const newHabit: HabitItem = {
          id: `guest-habit-${Date.now()}`,
          ...data,
          xp,
          archived: false,
          history: {},
        };
        setHabits((prev) => [newHabit, ...prev]);
        return newHabit;
      }

      const client = requireSupabase();
      const isNumeric = data.evaluationType === "numeric";
      const fullPayload = {
        category: data.categoryId,
        tracking: data.evaluationType,
        title: data.title.trim(),
        description: data.description.trim(),
        unit: isNumeric ? data.unit.trim() : "",
        goal: isNumeric ? data.goal : null,
        starts_on: data.startDate,
        ends_on: data.endDate,
        icon: data.icon,
        color: data.color,
        goal_condition: data.goalCondition,
        step: isNumeric ? data.step : 1,
        frequency: data.frequency,
        reminder_time: data.reminderTime,
        priority: data.priority,
      };

      requestRef.current++;

      let insertedRow: Record<string, unknown> | null = null;
      let usedLegacy = false;

      const res = await client
        .from("habits")
        .insert({ ...fullPayload, user_id: uid, archived: false })
        .select()
        .single();

      if (res.error) {
        if (!isLegacySchemaError(res.error)) throw res.error;
        usedLegacy = true;
        const legacyPayload = buildLegacyCompatibleInsert(data, uid);
        const fallbackRes = await client
          .from("habits")
          .insert(legacyPayload)
          .select()
          .single();
        if (fallbackRes.error) throw fallbackRes.error;
        insertedRow = fallbackRes.data as Record<string, unknown>;
      } else {
        insertedRow = res.data as Record<string, unknown>;
      }

      const newId = String(insertedRow.id);
      const metaOverride = usedLegacy ? { ...data, xp, archived: false } : undefined;
      if (usedLegacy) {
        await saveLocalMeta(newId, metaOverride!);
      }
      const createdItem = mapDbHabitToItem(insertedRow, [], metaOverride, new Date());
      setHabits((prev) => [createdItem, ...prev.filter((h) => h.id !== newId)]);
      return createdItem;
    },
    [saveLocalMeta, uid],
  );

  const handleSaveHabit = useCallback(
    async (data: HabitSaveData): Promise<boolean> => {
      const validationError = validateHabitSaveData(data);
      if (validationError) {
        Alert.alert("Check Habit Details", validationError);
        return false;
      }

      const xp = HABIT_PRIORITY_XP[data.priority];

      if (!editingHabit) {
        if (!uid) {
          await createHabit(data);
          setModalVisible(false);
          setEditingHabit(null);
          return true;
        }
        setSaving(true);
        try {
          await createHabit(data);
          setModalVisible(false);
          setEditingHabit(null);
          return true;
        } catch {
          Alert.alert("Error", "Could not save this habit. Please try again.");
          return false;
        } finally {
          setSaving(false);
        }
      }

      if (!uid) {
        setHabits((prev) =>
          prev.map((h) => {
            if (h.id !== editingHabit.id) return h;
            const updatedHistory = { ...h.history };
            if (data.evaluationType === "numeric") {
              for (const [k, entry] of Object.entries(updatedHistory)) {
                if (typeof entry.value === "number") {
                  const g =
                    typeof entry.goal === "number" && entry.goal > 0 ? entry.goal : data.goal;
                  updatedHistory[k] = {
                    ...entry,
                    completed: evaluateNumericValue(entry.value, data.goalCondition, g),
                  };
                }
              }
            }
            return { ...h, ...data, xp, history: updatedHistory };
          }),
        );
        setModalVisible(false);
        setEditingHabit(null);
        return true;
      }

      setSaving(true);
      try {
        const client = requireSupabase();
        const isNumeric = data.evaluationType === "numeric";
        const fullPayload = {
          category: data.categoryId,
          tracking: data.evaluationType,
          title: data.title.trim(),
          description: data.description.trim(),
          unit: isNumeric ? data.unit.trim() : "",
          goal: isNumeric ? data.goal : null,
          starts_on: data.startDate,
          ends_on: data.endDate,
          icon: data.icon,
          color: data.color,
          goal_condition: data.goalCondition,
          step: isNumeric ? data.step : 1,
          frequency: data.frequency,
          reminder_time: data.reminderTime,
          priority: data.priority,
        };

        requestRef.current++;

        let updatedRow: Record<string, unknown> | null = null;
        const res = await client
          .from("habits")
          .update(fullPayload)
          .eq("id", editingHabit.id)
          .eq("user_id", uid)
          .select()
          .single();

        if (res.error) {
          if (!isLegacySchemaError(res.error)) throw res.error;
          const legacyUpdate: Record<string, unknown> = {
            description: data.description.trim(),
          };
          if (editingHabit.evaluationType === "numeric" && isNumeric) {
            legacyUpdate.goal = data.goal;
          }
          if (editingHabit.categoryId !== "water" && editingHabit.categoryId !== "sleep") {
            legacyUpdate.title = data.title.trim();
          }
          const fallbackRes = await client
            .from("habits")
            .update(legacyUpdate)
            .eq("id", editingHabit.id)
            .eq("user_id", uid)
            .select()
            .single();
          if (fallbackRes.error && !isLegacySchemaError(fallbackRes.error)) {
            throw fallbackRes.error;
          }
          updatedRow = (fallbackRes.data as Record<string, unknown> | null) ?? {
            id: editingHabit.id,
            ...fullPayload,
          };
          await saveLocalMeta(editingHabit.id, { ...data, xp, archived: editingHabit.archived });
        } else {
          updatedRow = res.data as Record<string, unknown>;
          await saveLocalMeta(editingHabit.id, null);
        }

        setHabits((prev) =>
          prev.map((h) => {
            if (h.id !== editingHabit.id) return h;
            const existingEntries: DbHabitEntryRow[] = Object.entries(h.history).map(
              ([day, e]) => ({
                habit_id: h.id,
                day,
                value: typeof e.value === "number" ? e.value : e.completed ? 1 : 0,
                goal: e.goal,
                note: e.note,
              }),
            );
            return mapDbHabitToItem(
              updatedRow!,
              existingEntries,
              { ...data, archived: h.archived },
              new Date(),
            );
          }),
        );

        setModalVisible(false);
        setEditingHabit(null);
        return true;
      } catch {
        Alert.alert("Error", "Could not save this habit. Please try again.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [createHabit, editingHabit, saveLocalMeta, uid],
  );

  const handleToggleArchive = useCallback(
    async (habit: HabitItem) => {
      const nextArchived = !habit.archived;
      const previousHabits = habits;
      setHabits((prev) =>
        prev.map((h) => (h.id === habit.id ? { ...h, archived: nextArchived } : h)),
      );

      if (!uid) return;

      try {
        requestRef.current++;
        const { error: updateErr } = await requireSupabase()
          .from("habits")
          .update({ archived: nextArchived })
          .eq("id", habit.id)
          .eq("user_id", uid);
        if (updateErr) {
          if (isLegacySchemaError(updateErr)) {
            await saveLocalMeta(habit.id, { archived: nextArchived });
            return;
          }
          throw updateErr;
        }
      } catch {
        setHabits(previousHabits);
        Alert.alert("Error", "Could not update archive status.");
      }
    },
    [habits, saveLocalMeta, uid],
  );

  const handleResetDailyProgress = useCallback(
    (habit: HabitItem, dateKey: string) => {
      if (dateKey > todayKey) return;
      confirmAction(
        "Reset Daily Progress",
        `Reset "${habit.title}" for ${dateKey} to zero? Other days will stay unchanged.`,
        "Reset",
        async () => {
          // Let any queued increments finish before clearing this day.
          const key = `${uid ?? "guest"}:${habit.id}:${dateKey}`;
          const queue = incrementQueues.current.get(key);
          if (queue) await queue.tail;
          try {
            await commitNumericDay(queue?.habit ?? habit, dateKey, null, "");
          } catch {
            Alert.alert("Error", "Could not reset this day’s progress. Please try again.");
          }
        },
      );
    },
    [commitNumericDay, todayKey, uid],
  );

  const handleDeleteHabit = useCallback(
    (id: string) => {
      confirmAction(
        "Delete Habit",
        "Are you sure you want to permanently delete this habit?",
        "Delete",
        async () => {
          const previousHabits = habits;
          setHabits((prev) => prev.filter((h) => h.id !== id));

          if (!uid) return;

          try {
            requestRef.current++;
            const { error: delErr } = await requireSupabase()
              .from("habits")
              .delete()
              .eq("id", id)
              .eq("user_id", uid);
            if (delErr) throw delErr;
            await saveLocalMeta(id, null);
          } catch {
            setHabits(previousHabits);
            Alert.alert("Error", "Could not delete this habit.");
          }
        },
      );
    },
    [habits, saveLocalMeta, uid],
  );

  const openNewHabit = useCallback(() => {
    setEditingHabit(null);
    setModalVisible(true);
  }, []);

  const openEditHabit = useCallback((habit: HabitItem) => {
    setEditingHabit(habit);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setEditingHabit(null);
  }, []);

  const toggleFilterBar = useCallback(() => {
    setFilterVisible((prev) => !prev);
  }, []);

  const toggleArchivedView = useCallback(() => {
    setShowArchived((prev) => !prev);
  }, []);

  const archivedCount = useMemo(() => habits.filter((h) => h.archived).length, [habits]);

  const filteredHabits = useMemo(() => {
    return habits.filter((h) => {
      if (Boolean(h.archived) !== showArchived) return false;
      if (categoryFilter !== "all" && h.categoryId !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [habits, showArchived, categoryFilter]);

  const numericLogHabit = useMemo(
    () => (numericLogTarget ? habits.find((h) => h.id === numericLogTarget.habitId) ?? null : null),
    [habits, numericLogTarget],
  );

  const calendarHabit = useMemo(
    () => (calendarHabitId ? habits.find((h) => h.id === calendarHabitId) ?? null : null),
    [habits, calendarHabitId],
  );

  const statsHabit = useMemo(
    () => (statsHabitId ? habits.find((h) => h.id === statsHabitId) ?? null : null),
    [habits, statsHabitId],
  );

  const actionsHabit = useMemo(
    () => (actionsHabitId ? habits.find((h) => h.id === actionsHabitId) ?? null : null),
    [habits, actionsHabitId],
  );

  return {
    habits,
    filteredHabits,
    today,
    loading,
    error,
    saving,
    refresh,
    archivedCount,

    filterVisible,
    categoryFilter,
    setCategoryFilter,
    toggleFilterBar,
    showArchived,
    toggleArchivedView,

    modalVisible,
    editingHabit,
    openNewHabit,
    openEditHabit,
    closeModal,
    handleSaveHabit,
    createHabit,
    setHabitCompletedById,

    handlePressDay,
    handleSaveNumericValue,
    handleToggleArchive,
    handleResetDailyProgress,
    handleDeleteHabit,

    numericLogTarget,
    numericLogHabit,
    closeNumericLog: () => setNumericLogTarget(null),

    calendarHabit,
    openCalendar: (h: HabitItem) => setCalendarHabitId(h.id),
    closeCalendar: () => setCalendarHabitId(null),

    statsHabit,
    openStats: (h: HabitItem) => setStatsHabitId(h.id),
    closeStats: () => setStatsHabitId(null),

    actionsHabit,
    openActions: (h: HabitItem) => setActionsHabitId(h.id),
    closeActions: () => setActionsHabitId(null),

    activeFloat,
    setActiveFloat,
  };
}

const HabitsContext = createContext<UseHabitsReturn | null>(null);

function HabitsSession({ children }: PropsWithChildren) {
  const value = useHabitsState();
  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>;
}

/** Provides session-isolated habit state shared with tabs and Scotty Companion. */
export function HabitsProvider({ children }: PropsWithChildren) {
  const { user, guest } = useAuth();
  return <HabitsSession key={user?.id ?? (guest ? "guest" : "signed-out")}>{children}</HabitsSession>;
}

/** Hook for habit tracking, category filtering, numeric logging, and Supabase sync. */
export function useHabits(): UseHabitsReturn {
  const value = useContext(HabitsContext);
  if (!value) throw new Error("useHabits requires HabitsProvider");
  return value;
}
