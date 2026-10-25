-- Apply once after 202610030001_habits.sql.
-- Extends habits and habit_entries with UI customization, scheduling, archiving, notes,
-- domain-accurate category units (amount for water, time for sleep, time/frequency for activities),
-- priority-scaled rewards, and atomic progress reset while preserving existing rows.
begin;

alter table public.habits
  add column if not exists icon text not null default '',
  add column if not exists color text not null default '',
  add column if not exists goal_condition text not null default 'at_least'
    check (goal_condition in ('at_least', 'less_than', 'exactly')),
  add column if not exists step numeric(12, 2) not null default 1
    check (step > 0 and step <= 100000),
  add column if not exists frequency jsonb not null default '{"type":"daily"}'::jsonb
    check (jsonb_typeof(frequency) = 'object'),
  add column if not exists ends_on date,
  add column if not exists reminder_time text not null default ''
    check (length(reminder_time) <= 20),
  add column if not exists priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high')),
  add column if not exists archived boolean not null default false;

alter table public.habit_entries
  add column if not exists note text not null default ''
    check (length(note) <= 400);

-- Replace the two multi-column table CHECK constraints from 202610030001_habits.sql
-- (locked Water/Sleep titles and 'hours'-only units) with category-appropriate unit checks.
do $$
declare
  r record;
begin
  for r in
    select conname
    from pg_constraint
    where conrelid = 'public.habits'::regclass
      and contype = 'c'
      and cardinality(conkey) > 1
  loop
    execute format('alter table public.habits drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.habits
  add constraint habits_tracking_and_unit_check check (
    (tracking = 'boolean' and goal is null and unit = '') or
    (tracking = 'numeric' and (
      (category = 'water' and unit in ('oz', 'glasses', 'cups', 'mL', 'L', 'bottles')) or
      (category = 'sleep' and unit in ('hours', 'mins')) or
      (category = 'hobbies' and unit in ('mins', 'hours', 'sessions', 'times', 'pages')) or
      (category = 'exercise' and unit in ('mins', 'hours', 'sessions', 'times', 'sets', 'reps', 'miles', 'steps')) or
      (category = 'social' and unit in ('times', 'check-ins', 'meetups', 'mins', 'hours')) or
      (category = 'outdoor' and unit in ('mins', 'hours', 'walks', 'times', 'miles', 'steps')) or
      (category = 'custom' and length(trim(unit)) between 1 and 20)
    ))
  );

grant insert (
  user_id, category, tracking, title, description, unit, goal, starts_on,
  ends_on, icon, color, goal_condition, step, frequency, reminder_time, priority, archived
) on public.habits to authenticated;

grant update (
  category, tracking, title, description, unit, goal, starts_on,
  ends_on, icon, color, goal_condition, step, frequency, reminder_time, priority, archived
) on public.habits to authenticated;

drop function if exists public.record_habit_day(uuid, date, numeric, text);

create or replace function public.record_habit_day(
  p_habit_id uuid,
  p_day date,
  p_value numeric,
  p_timezone text default 'UTC',
  p_note text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  h public.habits;
  e public.habit_entries;
  p public.profiles;
  local_today date;
  daily_goal numeric;
  clean_note text := coalesce(p_note, '');
  is_completed boolean := false;
  base_xp integer;
  cur_h integer;
  claimed integer := 0;
  earned integer := 0;
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = p_timezone) then
    raise exception 'Invalid timezone';
  end if;
  if length(clean_note) > 400 then
    raise exception 'Note too long';
  end if;

  local_today := (now() at time zone p_timezone)::date;

  select * into h
  from public.habits
  where id = p_habit_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Habit not found';
  end if;

  if p_day is null or p_day > local_today or p_day < date '2000-01-01' then
    raise exception 'Invalid entry date';
  end if;

  if p_value is null then
    delete from public.habit_entries
    where habit_id = h.id and day = p_day;
    return jsonb_build_object('entry', null, 'xp', 0, 'coins', 0);
  end if;

  if p_value::text in ('NaN', 'Infinity', '-Infinity')
     or p_value < 0
     or p_value > 100000
     or p_value <> round(p_value, 2)
     or (h.tracking = 'boolean' and p_value not in (0, 1)) then
    raise exception 'Invalid daily value';
  end if;

  if p_day < h.starts_on then
    update public.habits
    set starts_on = p_day
    where id = h.id;
  end if;

  select * into e
  from public.habit_entries
  where habit_id = h.id and day = p_day;

  daily_goal := case when found then e.goal else h.goal end;

  insert into public.habit_entries(habit_id, user_id, day, value, goal, note)
  values (h.id, auth.uid(), p_day, p_value, daily_goal, clean_note)
  on conflict (habit_id, day) do update
    set value = excluded.value,
        note = excluded.note
  returning * into e;

  if h.tracking = 'boolean' then
    is_completed := (p_value = 1);
  elsif daily_goal is null then
    is_completed := (p_value > 0);
  elsif h.goal_condition = 'less_than' then
    is_completed := (p_value < daily_goal);
  elsif h.goal_condition = 'exactly' then
    is_completed := (p_value = daily_goal);
  else
    is_completed := (p_value >= daily_goal);
  end if;

  -- Backfilled history is editable, while only today's completion can earn a daily reward.
  if p_day = local_today and is_completed then
    select * into strict p
    from public.profiles
    where id = auth.uid()
    for update;

    insert into public.activity_claims(user_id, kind, activity_id, period)
    values (auth.uid(), 'habit', h.id::text, p_day::text)
    on conflict do nothing;

    get diagnostics claimed = row_count;
    if claimed > 0 then
      base_xp := case h.priority
        when 'low' then 25
        when 'high' then 60
        else 40
      end;
      cur_h := public.effective_happiness(p);
      earned := round(base_xp * case when cur_h >= 85 then 1.25 else 1 end);

      update public.profiles
      set xp = xp + earned,
          coins = coins + 2,
          happiness = least(100, cur_h + 10),
          "lastFedAt" = (extract(epoch from now()) * 1000)::bigint
      where id = auth.uid()
      returning * into p;
    end if;
  end if;

  return jsonb_build_object(
    'entry', to_jsonb(e),
    'xp', earned,
    'coins', case when earned > 0 then 2 else 0 end,
    'profile', case when p.id is not null then to_jsonb(p) else null end
  );
end;
$$;

create or replace function public.reset_habit_progress(
  p_habit_id uuid,
  p_timezone text default 'UTC'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  h public.habits;
  local_today date;
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = p_timezone) then
    raise exception 'Invalid timezone';
  end if;

  local_today := (now() at time zone p_timezone)::date;

  select * into h
  from public.habits
  where id = p_habit_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Habit not found';
  end if;

  delete from public.habit_entries
  where habit_id = h.id;

  update public.habits
  set starts_on = local_today
  where id = h.id;

  return jsonb_build_object('ok', true, 'starts_on', local_today);
end;
$$;

revoke execute on function public.record_habit_day(uuid, date, numeric, text, text)
  from public, anon, authenticated;
grant execute on function public.record_habit_day(uuid, date, numeric, text, text)
  to authenticated;

revoke execute on function public.reset_habit_progress(uuid, text)
  from public, anon, authenticated;
grant execute on function public.reset_habit_progress(uuid, text)
  to authenticated;

commit;
