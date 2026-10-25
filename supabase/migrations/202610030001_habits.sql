-- Apply once after 202609190001_initial.sql. Does not alter existing tasks.
begin;
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
  unique (id,user_id),
  check ((tracking = 'boolean' and goal is null and unit = '') or
    (tracking = 'numeric' and ((category = 'water' and unit = 'oz') or
      (category in ('sleep','hobbies','exercise','social','outdoor') and unit = 'hours') or
      (category = 'custom' and length(trim(unit)) between 1 and 20)))),
  check ((category = 'water' and title = 'Water') or (category = 'sleep' and title = 'Sleep') or category not in ('water','sleep'))
);
create index habits_user on public.habits(user_id);
create table public.habit_entries (
  habit_id uuid not null,
  user_id uuid not null,
  day date not null,
  value numeric(12,2) not null check (value >= 0 and value <= 100000),
  -- Snapshot the goal on the first check-in so later goal edits preserve history.
  goal numeric(12,2) check (goal > 0 and goal <= 100000),
  primary key (habit_id,day),
  foreign key (habit_id,user_id) references public.habits(id,user_id) on delete cascade
);
create index habit_entries_user_day on public.habit_entries(user_id,day);
alter table public.habits enable row level security;
alter table public.habit_entries enable row level security;
create policy own_habits on public.habits for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy own_habit_entries on public.habit_entries for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.habits, public.habit_entries from anon,authenticated;
grant select,delete on public.habits to authenticated;
grant insert (user_id,category,tracking,title,description,unit,goal,starts_on) on public.habits to authenticated;
-- Units and tracking style stay fixed so previous values retain their meaning.
grant update (title,description,goal) on public.habits to authenticated;
grant select on public.habit_entries to authenticated;

create function public.record_habit_day(p_habit_id uuid, p_day date, p_value numeric, p_timezone text default 'UTC')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare h public.habits; e public.habit_entries; p public.profiles;
  local_today date; daily_goal numeric; claimed integer := 0; earned integer := 0;
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = p_timezone) then raise exception 'Invalid timezone'; end if;
  local_today := (now() at time zone p_timezone)::date;
  select * into h from public.habits where id = p_habit_id and user_id = auth.uid() for update;
  if not found then raise exception 'Habit not found'; end if;
  if p_day is null or p_day < h.starts_on or p_day > local_today then raise exception 'Invalid entry date'; end if;
  if p_value is not null and (p_value::text in ('NaN','Infinity','-Infinity') or p_value < 0 or p_value > 100000 or p_value <> round(p_value,2)
    or (h.tracking = 'boolean' and p_value not in (0,1))) then raise exception 'Invalid daily value'; end if;
  if p_value is null then
    delete from public.habit_entries where habit_id = h.id and day = p_day;
    return jsonb_build_object('entry',null,'xp',0,'coins',0);
  end if;
  select * into e from public.habit_entries where habit_id = h.id and day = p_day;
  daily_goal := case when found then e.goal else h.goal end;
  insert into public.habit_entries(habit_id,user_id,day,value,goal)
    values (h.id,auth.uid(),p_day,p_value,daily_goal)
    on conflict (habit_id,day) do update set value = excluded.value
    returning * into e;
  -- Backfilled history is editable, but only today's completion can earn a reward.
  if p_day = local_today and ((h.tracking = 'boolean' and p_value = 1) or
    (h.tracking = 'numeric' and ((daily_goal is null and p_value > 0) or p_value >= daily_goal))) then
    select * into strict p from public.profiles where id = auth.uid() for update;
    insert into public.activity_claims(user_id,kind,activity_id,period)
      values (auth.uid(),'habit',h.id::text,p_day::text) on conflict do nothing;
    get diagnostics claimed = row_count;
    if claimed > 0 then
      earned := 40;
      update public.profiles set xp = xp + earned, coins = coins + 2,
        happiness = least(100,public.effective_happiness(p) + 10),
        "lastFedAt" = (extract(epoch from now()) * 1000)::bigint
        where id = auth.uid() returning * into p;
    end if;
  end if;
  return jsonb_build_object('entry',to_jsonb(e),'xp',earned,'coins',case when earned > 0 then 2 else 0 end,'profile',case when p.id is not null then to_jsonb(p) else null end);
end;
$$;
revoke execute on function public.record_habit_day(uuid,date,numeric,text) from public,anon,authenticated;
grant execute on function public.record_habit_day(uuid,date,numeric,text) to authenticated;
alter publication supabase_realtime add table public.habits, public.habit_entries;
commit;
