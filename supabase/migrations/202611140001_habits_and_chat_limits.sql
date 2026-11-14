-- Habits persistence and server-enforced AI chat rate limits.
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 200),
  emoji text not null default '🎯' check (length(trim(emoji)) between 1 and 16),
  color text not null default '#356575' check (length(trim(color)) between 1 and 32),
  goal integer not null default 1 check (goal >= 1),
  unit text not null default 'times' check (length(trim(unit)) between 1 and 40),
  step integer not null default 1 check (step >= 1),
  xp integer not null default 40 check (xp between 0 and 60),
  created_at timestamptz not null default now()
);
create index habits_user_id on public.habits(user_id);

create table public.habit_completions (
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  completed_date date not null,
  created_at timestamptz not null default now(),
  primary key (habit_id, completed_date)
);
create index habit_completions_user_date on public.habit_completions(user_id, completed_date desc);

create table public.chat_rate_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0)
);

alter table public.habits enable row level security;
alter table public.habit_completions enable row level security;
alter table public.chat_rate_limits enable row level security;

create policy own_habits on public.habits
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy own_habit_completions on public.habit_completions
  for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.habits, public.habit_completions, public.chat_rate_limits from public, anon, authenticated;
grant select, delete on public.habits to authenticated;
grant insert (user_id, title, emoji, color, goal, unit, step, xp) on public.habits to authenticated;
grant update (title, emoji, color, goal, unit, step, xp) on public.habits to authenticated;
grant select on public.habit_completions to authenticated;

create function public.toggle_habit_completion(
  p_habit_id uuid,
  p_local_date date,
  p_done boolean
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  h public.habits;
  p public.profiles;
  earned integer := 0;
  earned_coins integer := 0;
  inserted integer := 0;
  utc_today date := (now() at time zone 'UTC')::date;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_local_date is null or p_done is null then
    raise exception 'Habit completion date and status required';
  end if;
  if p_local_date < (utc_today - 1) or p_local_date > (utc_today + 1) then
    raise exception 'Habit date out of allowed window';
  end if;

  select * into h from public.habits
    where id = p_habit_id and user_id = auth.uid() for update;
  if not found then raise exception 'Habit not found'; end if;

  select * into strict p from public.profiles
    where id = auth.uid() for update;

  if p_done then
    insert into public.habit_completions(habit_id, user_id, completed_date)
      values (h.id, auth.uid(), p_local_date)
      on conflict do nothing;

    insert into public.activity_claims(user_id, kind, activity_id, period)
      values (auth.uid(), 'habit', h.id::text, p_local_date::text)
      on conflict do nothing;
    get diagnostics inserted = row_count;

    if inserted > 0 then
      earned := h.xp;
      earned_coins := 2;
      update public.profiles set
        xp = xp + earned,
        coins = profiles.coins + earned_coins,
        happiness = least(100, public.effective_happiness(p) + 10),
        "lastFedAt" = (extract(epoch from now()) * 1000)::bigint
        where id = auth.uid() returning * into p;
    end if;
  else
    delete from public.habit_completions
      where habit_id = h.id and user_id = auth.uid() and completed_date = p_local_date;
  end if;

  return jsonb_build_object(
    'xp', earned,
    'coins', earned_coins,
    'completedToday', p_done,
    'profile', to_jsonb(p)
  );
end;
$$;

create function public.check_chat_rate_limit(
  p_max_requests integer default 30,
  p_window_seconds integer default 3600
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  now_ts timestamptz := now();
  lim public.chat_rate_limits;
  retry_after integer := 0;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_max_requests is null or p_max_requests not between 1 and 500 then
    raise exception 'Invalid max requests';
  end if;
  if p_window_seconds is null or p_window_seconds not between 10 and 86400 then
    raise exception 'Invalid window seconds';
  end if;

  insert into public.chat_rate_limits(user_id, window_start, request_count)
    values (auth.uid(), now_ts, 0)
    on conflict do nothing;

  select * into strict lim from public.chat_rate_limits
    where user_id = auth.uid() for update;

  if lim.request_count = 0 or lim.window_start + make_interval(secs => p_window_seconds) <= now_ts then
    update public.chat_rate_limits
      set window_start = now_ts, request_count = 1
      where user_id = auth.uid();
    return jsonb_build_object('allowed', true, 'remaining', p_max_requests - 1, 'retryAfterSeconds', 0);
  end if;

  if lim.request_count >= p_max_requests then
    retry_after := greatest(1, ceil(extract(epoch from (lim.window_start + make_interval(secs => p_window_seconds) - now_ts)))::integer);
    return jsonb_build_object('allowed', false, 'remaining', 0, 'retryAfterSeconds', retry_after);
  end if;

  update public.chat_rate_limits
    set request_count = lim.request_count + 1
    where user_id = auth.uid();

  return jsonb_build_object(
    'allowed', true,
    'remaining', p_max_requests - (lim.request_count + 1),
    'retryAfterSeconds', 0
  );
end;
$$;

revoke execute on function public.toggle_habit_completion(uuid, date, boolean), public.check_chat_rate_limit(integer, integer) from public, anon, authenticated;
grant execute on function public.toggle_habit_completion(uuid, date, boolean), public.check_chat_rate_limit(integer, integer) to authenticated;

alter publication supabase_realtime add table public.habits, public.habit_completions;
