import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { useHabits } from '@/contexts/HabitsContext';
import { useTasks } from '@/contexts/TasksContext';
import { requireSupabase } from '@/config/supabase';
import { INITIAL_QUESTS } from '@/constants/gamification';
import { isTaskDueToday, localDateKey } from '@/utils/taskDates';
import { isDateScheduled, isDayCompleted, mapDbHabitToItem, type DbHabitEntryRow } from '@/utils/habitLogic';

export type HomeProgress = { done: number; total: number };
type Summary = Record<'tasks' | 'habits' | 'quests', HomeProgress>;

/** Home is a read-only summary. Refresh on return, foreground, and day rollover. */
export function useHomeProgress() {
  const { user } = useAuth();
  const { tasks: contextTasks } = useTasks();
  const { habits: contextHabits } = useHabits();
  const uid = user?.id;
  const request = useRef(0);
  const [state, setState] = useState<{ uid?: string; data?: Summary; error?: boolean; loading?: boolean }>({});
  const refresh = useCallback(async () => {
    if (!uid) return;
    const version = ++request.current;
    setState(previous => ({ ...(previous.uid === uid ? previous : {}), uid, loading: true }));
    try {
      const client = requireSupabase();
      const now = new Date();
      const day = localDateKey(now);
      // Paginate instead of silently truncating accounts at the API row limit.
      const rows = async (table: 'tasks' | 'habits' | 'habit_entries' | 'activity_claims') => {
        const result: Record<string, unknown>[] = [];
        for (let offset = 0; ; offset += 500) {
          let query = client.from(table).select('*').eq('user_id', uid);
          if (table === 'habit_entries') query = query.eq('day', day).order('habit_id');
          else if (table === 'activity_claims') query = query.eq('kind', 'quest').order('activity_id');
          else query = query.order('id');
          const { data, error } = await query.range(offset, offset + 499);
          if (error) throw error;
          result.push(...data);
          if (data.length < 500) return result;
        }
      };
      const [tasks, habits, entries, claims, storedMeta] = await Promise.all([
        rows('tasks'), rows('habits'), rows('habit_entries'), rows('activity_claims'),
        AsyncStorage.getItem(`scotty_habit_meta_v1:${uid}`),
      ]);
      let meta: Record<string, Record<string, unknown>> = {};
      try { meta = storedMeta ? JSON.parse(storedMeta) ?? {} : {}; } catch { /* Ignore invalid optional local metadata. */ }
      const todayTasks = tasks.filter(task => isTaskDueToday(String(task.dueDate ?? ''), now));
      const todayHabits = habits.map(habit => mapDbHabitToItem(
        habit, entries.filter(entry => entry.habit_id === habit.id) as unknown as DbHabitEntryRow[], meta[String(habit.id)], now,
      )).filter(habit => !habit.archived && isDateScheduled(habit, now));
      const claimed = new Set(claims.map(claim => String(claim.activity_id)));
      if (version !== request.current) return;
      setState({ uid, data: {
        tasks: { done: todayTasks.filter(task => task.done).length, total: todayTasks.length },
        habits: { done: todayHabits.filter(habit => isDayCompleted(habit, day)).length, total: todayHabits.length },
        quests: { done: INITIAL_QUESTS.filter(quest => claimed.has(quest.id)).length, total: INITIAL_QUESTS.length },
      } });
    } catch {
      if (version === request.current) setState({ uid, error: true });
    }
  }, [uid]);

  useFocusEffect(useCallback(() => {
    void refresh();
    const foreground = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    const timer = setInterval(() => { void refresh(); }, 60000);
    return () => { request.current++; foreground.remove(); clearInterval(timer); };
  // Shared task/habit changes invalidate this remote summary while Home is focused.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh, contextTasks, contextHabits]));

  const current = state.uid === uid ? state : {};
  return { data: uid ? current.data : undefined, error: !!current.error, loading: !!uid && (!current.data && !current.error || !!current.loading), guest: !uid, refresh };
}
