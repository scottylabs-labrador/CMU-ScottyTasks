import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  onConfirm: () => void
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

export function useHabits() {
  const { user } = useAuth();
  const uid = user?.id ?? null;

  const [todayKey, setTodayKey] = useState(() => localDateKey(new Date()));
  const today = useMemo(
    () => parseTaskDate(todayKey) ?? new Date(),
    [todayKey]
  );

  const [habits, setHabits] = useState<HabitItem[]>(() =>
    uid ? [] : createInitialHabits(new Date())
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

  const {
    addGuestReward,
    recordHabitDay,
    resetHabitProgress,
    xpMultiplier,
  } = useUserShopProfile();

  // Header controls: Search, Category Filter, Archive Toggle
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<"all" | HabitCategoryId>("all");
  const [showArchived, setShowArchived] = useState(false);

  // Modals state
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
    [uid]
  );

  // Signed-in Supabase fetch
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
        client
          .from("habits")
          .select("*")
          .eq("user_id", uid)
          .order("created_at", { ascending: false }),
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
        return mapDbHabitToItem(
          row,
          entriesByHabit.get(id) ?? [],
          metaMap?.[id],
          now
        );
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

  // Day rollover + Supabase Realtime subscription OR Guest hydration
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
              .map((x) => normalizeHabit(x, now))
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

    void refresh();

    const foreground = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refreshDay();
        void refresh();
      }
    });

    const client = requireSupabase();
    const channel = client
      .channel(`habits:${uid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "habits", filter: `user_id=eq.${uid}` },
        () => {
          void refresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "habit_entries", filter: `user_id=eq.${uid}` },
        () => {
          void refresh();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void refresh();
      });

    return () => {
      invalidate();
      clearInterval(timer);
      foreground.remove();
      void client.removeChannel(channel);
    };
  }, [uid, refresh, invalidate]);

  // Persist guest habits locally
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
    [addGuestReward, todayKey, xpMultiplier]
  );

  const handlePressDay = useCallback(
    async (habit: HabitItem, dateKey: string) => {
      if (dateKey > todayKey) return;

      if (habit.evaluationType === "numeric") {
        setNumericLogTarget({ habitId: habit.id, dateKey });
        return;
      }

      const wasCompleted = isDayCompleted(habit, dateKey);
      const nextCompleted = !wasCompleted;
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
          const nextStartDate =
            nextCompleted && dateKey < h.startDate ? dateKey : h.startDate;
          return { ...h, startDate: nextStartDate, history: nextHistory };
        })
      );

      if (!uid) {
        if (nextCompleted && dateKey === todayKey) {
          awardGuestTodayIfEligible(habit);
        }
        return;
      }

      try {
        requestRef.current++;
        const res = await recordHabitDay(
          habit.id,
          dateKey,
          nextCompleted ? 1 : null,
          ""
        );
        if (res?.xp > 0) {
          setActiveFloat({ xp: res.xp, coins: res.coins ?? 2 });
        }
      } catch (err: unknown) {
        setHabits(previousHabits);
        const msg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: unknown }).message ?? "")
            : "";
        if (msg.includes("Invalid entry date")) {
          Alert.alert(
            "Date Before Habit Start",
            "Run migration 202610240001_habits_integrated.sql in Supabase (or move this habit's Start Date earlier) to backfill days before creation."
          );
        } else {
          Alert.alert("Error", "Could not save your habit check-in. Please try again.");
        }
      }
    },
    [awardGuestTodayIfEligible, habits, recordHabitDay, todayKey, uid]
  );

  const handleSaveNumericValue = useCallback(
    async (habit: HabitItem, dateKey: string, value: number | null, note: string) => {
      if (dateKey > todayKey) return;

      const roundedValue =
        value === null ? null : Math.round(Math.max(0, value) * 100) / 100;
      const wasCompleted = isDayCompleted(habit, dateKey);
      const existingSnapGoal = habit.history[dateKey]?.goal;
      const effectiveGoal =
        typeof existingSnapGoal === "number" && existingSnapGoal > 0
          ? existingSnapGoal
          : habit.goal;

      const nextCompleted =
        roundedValue !== null &&
        evaluateNumericValue(roundedValue, habit.goalCondition, effectiveGoal);

      const previousHabits = habits;

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
        })
      );

      if (!uid) {
        if (!wasCompleted && nextCompleted && dateKey === todayKey) {
          awardGuestTodayIfEligible(habit);
        }
        return;
      }

      try {
        requestRef.current++;
        const res = await recordHabitDay(habit.id, dateKey, roundedValue, note);
        if (res?.xp > 0) {
          setActiveFloat({ xp: res.xp, coins: res.coins ?? 2 });
        }
      } catch (err: unknown) {
        setHabits(previousHabits);
        const msg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: unknown }).message ?? "")
            : "";
        if (msg.includes("Invalid entry date")) {
          Alert.alert(
            "Date Before Habit Start",
            "Run migration 202610240001_habits_integrated.sql in Supabase (or move this habit's Start Date earlier) to backfill days before creation."
          );
        } else {
          Alert.alert("Error", "Could not save your numeric entry. Please try again.");
        }
      }
    },
    [awardGuestTodayIfEligible, habits, recordHabitDay, todayKey, uid]
  );

  const handleSaveHabit = useCallback(
    async (data: HabitSaveData): Promise<boolean> => {
      const validationError = validateHabitSaveData(data);
      if (validationError) {
        Alert.alert("Check Habit Details", validationError);
        return false;
      }

      const xp = HABIT_PRIORITY_XP[data.priority];

      if (!uid) {
        if (editingHabit) {
          setHabits((prev) =>
            prev.map((h) => {
              if (h.id !== editingHabit.id) return h;
              const updatedHistory = { ...h.history };
              if (data.evaluationType === "numeric") {
                for (const [k, entry] of Object.entries(updatedHistory)) {
                  if (typeof entry.value === "number") {
                    const g =
                      typeof entry.goal === "number" && entry.goal > 0
                        ? entry.goal
                        : data.goal;
                    updatedHistory[k] = {
                      ...entry,
                      completed: evaluateNumericValue(
                        entry.value,
                        data.goalCondition,
                        g
                      ),
                    };
                  }
                }
              }
              return { ...h, ...data, xp, history: updatedHistory };
            })
          );
        } else {
          const newHabit: HabitItem = {
            id: `guest-habit-${Date.now()}`,
            ...data,
            xp,
            archived: false,
            history: {},
          };
          setHabits((prev) => [newHabit, ...prev]);
        }
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

        if (editingHabit) {
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
            // Fallback for databases that only have 202610030001_habits.sql applied
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
                  value:
                    typeof e.value === "number"
                      ? e.value
                      : e.completed
                      ? 1
                      : 0,
                  goal: e.goal,
                  note: e.note,
                })
              );
              return mapDbHabitToItem(
                updatedRow!,
                existingEntries,
                { ...data, archived: h.archived },
                new Date()
              );
            })
          );
        } else {
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
          const createdItem = mapDbHabitToItem(
            insertedRow,
            [],
            metaOverride,
            new Date()
          );
          setHabits((prev) => [createdItem, ...prev.filter((h) => h.id !== newId)]);
        }

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
    [editingHabit, saveLocalMeta, uid]
  );

  const handleToggleArchive = useCallback(
    async (habit: HabitItem) => {
      const nextArchived = !habit.archived;
      const previousHabits = habits;
      setHabits((prev) =>
        prev.map((h) => (h.id === habit.id ? { ...h, archived: nextArchived } : h))
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
    [habits, saveLocalMeta, uid]
  );

  const handleResetProgress = useCallback(
    (habit: HabitItem) => {
      confirmAction(
        "Reset Habit Progress",
        `Clear all recorded history for "${habit.title}"?`,
        "Reset",
        async () => {
          const previousHabits = habits;
          const resetStart = localDateKey(new Date());
          setHabits((prev) =>
            prev.map((h) =>
              h.id === habit.id ? { ...h, history: {}, startDate: resetStart } : h
            )
          );

          if (!uid) return;

          try {
            requestRef.current++;
            await resetHabitProgress(habit.id);
          } catch (err: unknown) {
            if (isLegacySchemaError(err)) {
              try {
                const days = Object.keys(habit.history);
                await Promise.all(
                  days.map((day) => recordHabitDay(habit.id, day, null, ""))
                );
                await saveLocalMeta(habit.id, { startDate: resetStart });
                return;
              } catch {
                // Fall through to rollback
              }
            }
            setHabits(previousHabits);
            Alert.alert("Error", "Could not reset habit history.");
          }
        }
      );
    },
    [habits, recordHabitDay, resetHabitProgress, saveLocalMeta, uid]
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
        }
      );
    },
    [habits, saveLocalMeta, uid]
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

  const toggleSearch = useCallback(() => {
    setSearchVisible((prev) => {
      if (prev) setSearchQuery("");
      return !prev;
    });
  }, []);

  const toggleFilterBar = useCallback(() => {
    setFilterVisible((prev) => !prev);
  }, []);

  const toggleArchivedView = useCallback(() => {
    setShowArchived((prev) => !prev);
  }, []);

  const archivedCount = useMemo(
    () => habits.filter((h) => h.archived).length,
    [habits]
  );

  const filteredHabits = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return habits.filter((h) => {
      if (Boolean(h.archived) !== showArchived) return false;
      if (categoryFilter !== "all" && h.categoryId !== categoryFilter) {
        return false;
      }
      if (query) {
        const matchesTitle = h.title.toLowerCase().includes(query);
        const matchesDesc = h.description.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }
      return true;
    });
  }, [habits, showArchived, categoryFilter, searchQuery]);

  const numericLogHabit = useMemo(
    () =>
      numericLogTarget
        ? habits.find((h) => h.id === numericLogTarget.habitId) ?? null
        : null,
    [habits, numericLogTarget]
  );

  const calendarHabit = useMemo(
    () =>
      calendarHabitId
        ? habits.find((h) => h.id === calendarHabitId) ?? null
        : null,
    [habits, calendarHabitId]
  );

  const statsHabit = useMemo(
    () =>
      statsHabitId ? habits.find((h) => h.id === statsHabitId) ?? null : null,
    [habits, statsHabitId]
  );

  const actionsHabit = useMemo(
    () =>
      actionsHabitId
        ? habits.find((h) => h.id === actionsHabitId) ?? null
        : null,
    [habits, actionsHabitId]
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

    // Header bar state
    searchVisible,
    searchQuery,
    setSearchQuery,
    toggleSearch,
    filterVisible,
    categoryFilter,
    setCategoryFilter,
    toggleFilterBar,
    showArchived,
    toggleArchivedView,

    // Create / Edit modal
    modalVisible,
    editingHabit,
    openNewHabit,
    openEditHabit,
    closeModal,
    handleSaveHabit,

    // Card interactions & detail modals
    handlePressDay,
    handleSaveNumericValue,
    handleToggleArchive,
    handleResetProgress,
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

    // Gamification reward popup
    activeFloat,
    setActiveFloat,
  };
}
