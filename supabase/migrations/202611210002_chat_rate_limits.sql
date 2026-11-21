-- Add chat limits without replacing existing habits or their history.
begin;

create table if not exists public.chat_rate_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0)
);

alter table public.chat_rate_limits enable row level security;
revoke all on public.chat_rate_limits from public, anon, authenticated;

create or replace function public.check_chat_rate_limit(
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

revoke execute on function public.check_chat_rate_limit(integer, integer) from public, anon, authenticated;
grant execute on function public.check_chat_rate_limit(integer, integer) to authenticated;

commit;
