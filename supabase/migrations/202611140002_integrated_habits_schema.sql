-- Align Supabase habits schema with the redesigned Habits tab (categories,
-- boolean + numeric entries, custom frequencies, archives, notes, and history)
-- while keeping chat_rate_limits / check_chat_rate_limit from 202611140001 intact.
begin;

create temp table _legacy_habits_backup on commit drop as
select id, user_id, title, color, goal, unit, step, xp, created_at
from public.habits;

create temp table _legacy_completions_backup on commit drop as
select habit_id, user_id, completed_date
from public.habit_completions;

drop function if exists public.toggle_habit_completion(uuid, date, boolean);
drop table if exists public.habit_completions;
drop table if exists public.habits cascade;

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('water','sleep','hobbies','exercise','social','outdoor','custom')),
  tracking text not null check (tracking in ('boolean','numeric')),
  title text not null check (length(trim(title)) between 1 and 80),
  description text not null default '' check (length(description) <= 400),
  unit text not null default '',
  goal numeric(12,2) check (goal > 0 and goal <= 100000),
  starts_on date not null default current_date,
  created_at timestamptz not null default now(),
  icon text not null default '',
  color text not null default '',
  goal_condition text not null default 'at_least'
    check (goal_condition in ('at_least', 'less_than', 'exactly')),
  step numeric(12,2) not null default 1
    check (step > 0 and step <= 100000),
  frequency jsonb not null default '{"type":"daily"}'::jsonb
    check (jsonb_typeof(frequency) = 'object'),
  ends_on date,
  reminder_time text not null default ''
    check (length(reminder_time) <= 20),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high')),
  archived boolean not null default false,
  unique (id, user_id),
  constraint habits_tracking_and_unit_check check (
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
  )
);
create index habits_user on public.habits(user_id);

create table public.habit_entries (
  habit_id uuid not null,
  user_id uuid not null,
  day date not null,
  value numeric(12,2) not null check (value >= 0 and value <= 100000),
  -- Snapshot the goal on the first check-in so later goal edits preserve history.
  goal numeric(12,2) check (goal > 0 and goal <= 100000),
  note text not null default '' check (length(note) <= 400),
  primary key (habit_id, day),
  foreign key (habit_id, user_id) references public.habits(id, user_id) on delete cascade
);
create index habit_entries_user_day on public.habit_entries(user_id, day);

-- Preserve any habits & completions already created under 202611140001.
insert into public.habits (
  id, user_id, category, tracking, title, description, unit, goal, starts_on, created_at,
  icon, color, goal_condition, step, frequency, ends_on, reminder_time, priority, archived
)
select
  b.id,
  b.user_id,
  'custom',
  case when b.goal > 1 or b.unit <> 'times' then 'numeric' else 'boolean' end,
  left(trim(b.title), 80),
  '',
  case when b.goal > 1 or b.unit <> 'times' then coalesce(nullif(left(trim(b.unit), 20), ''), 'times') else '' end,
  case when b.goal > 1 or b.unit <> 'times' then greatest(1, least(100000, b.goal::numeric)) else null end,
  (b.created_at at time zone 'UTC')::date,
  b.created_at,
  'sparkles-outline',
  left(trim(b.color), 32),
  'at_least',
  greatest(1, least(100000, b.step::numeric)),
  '{"type":"daily"}'::jsonb,
  null,
  '',
  case when b.xp >= 60 then 'high' when b.xp <= 25 then 'low' else 'medium' end,
  false
from _legacy_habits_backup b
where length(trim(b.title)) > 0;

insert into public.habit_entries (habit_id, user_id, day, value, goal, note)
select
  c.habit_id,
  c.user_id,
  c.completed_date,
  case when h.tracking = 'numeric' then coalesce(h.goal, 1) else 1 end,
  h.goal,
  ''
from _legacy_completions_backup c
join public.habits h on h.id = c.habit_id and h.user_id = c.user_id
on conflict do nothing;

alter table public.habits enable row level security;
alter table public.habit_entries enable row level security;

create policy own_habits on public.habits
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy own_habit_entries on public.habit_entries
  for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.habits, public.habit_entries from public, anon, authenticated;
grant select, delete on public.habits to authenticated;
grant insert (
  user_id, category, tracking, title, description, unit, goal, starts_on,
  ends_on, icon, color, goal_condition, step, frequency, reminder_time, priority, archived
) on public.habits to authenticated;
grant update (
  category, tracking, title, description, unit, goal, starts_on,
  ends_on, icon, color, goal_condition, step, frequency, reminder_time, priority, archived
) on public.habits to authenticated;
grant select on public.habit_entries to authenticated;

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

alter publication supabase_realtime add table public.habits, public.habit_entries;

commit;
