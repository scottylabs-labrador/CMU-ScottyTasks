-- Fresh development database. Apply with Supabase migrations or the SQL editor.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  coins integer not null default 25 check (coins >= 0),
  xp integer not null default 0 check (xp >= 0),
  streak integer not null default 0,
  "tasksCompleted" integer not null default 0,
  "avatarUrl" text,
  happiness integer not null default 85 check (happiness between 15 and 100),
  "lastFedAt" bigint not null default (extract(epoch from now()) * 1000)::bigint,
  "ownedItems" jsonb not null default '{"background-default":true,"blue-house":true,"toy-tennis":true}',
  "equippedBackgroundId" text not null default 'background-default',
  "equippedDogHouseId" text not null default 'blue-house',
  "equippedToyId" text not null default 'toy-tennis'
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null check (length(trim(text)) between 1 and 1000),
  course text not null default '',
  priority text not null default 'medium' check (priority in ('high','medium','low')),
  tag text not null default 'General',
  "dueDate" text not null,
  "dueTime" text not null default '',
  xp integer not null default 80 check (xp between 0 and 1000),
  done boolean not null default false,
  rewarded boolean not null default false,
  created_at timestamptz not null default now()
);
create index tasks_user_id on public.tasks(user_id);
create table public.shop_items (
  id text primary key,
  category text not null check (category in ('backgrounds','dogHouses','toys')),
  price integer not null check (price >= 0)
);
insert into public.shop_items values
('blue-house','dogHouses',0),('green-house','dogHouses',5),('brown-house','dogHouses',5),
('yellow-house','dogHouses',8),('white-house','dogHouses',8),('red-house','dogHouses',12),
('toy-tennis','toys',0),('toy-bone','toys',3),('toy-rope','toys',4),('toy-frisbee','toys',6),('toy-squeaky','toys',7),('toy-plush','toys',10),
('background-default','backgrounds',0),('background-sunset','backgrounds',5),('background-night','backgrounds',6),
('background-park','backgrounds',8),('background-dorm','backgrounds',10),('background-festival','backgrounds',12);

-- Demo activity claims are deduplicated; actual habit/quest progress remains local.
create table public.activity_claims (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('habit','quest')),
  activity_id text not null,
  period text not null,
  primary key (user_id, kind, activity_id, period)
);
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.shop_items enable row level security;
alter table public.activity_claims enable row level security;
create policy own_profile on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy edit_profile on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy own_tasks on public.tasks for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy read_shop on public.shop_items for select to authenticated using (true);
create policy own_claims on public.activity_claims for select to authenticated using (user_id = (select auth.uid()));
-- Column grants prevent direct changes to balances, ownership and reward flags.
revoke all on public.profiles, public.tasks, public.shop_items, public.activity_claims from anon, authenticated;
grant select on public.profiles, public.tasks, public.shop_items, public.activity_claims to authenticated;
grant update (name, "avatarUrl") on public.profiles to authenticated;
grant insert (user_id, text, course, priority, tag, "dueDate", "dueTime", xp) on public.tasks to authenticated;
grant update (text, course, priority, tag, "dueDate", "dueTime", xp) on public.tasks to authenticated;
grant delete on public.tasks to authenticated;

create function public.create_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, name) values (new.id, coalesce(new.raw_user_meta_data->>'name', ''));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.create_profile();

create function public.effective_happiness(p public.profiles) returns integer language sql stable set search_path = '' as $$
  select greatest(15, least(100, p.happiness - floor(greatest(0, extract(epoch from now()) * 1000 - p."lastFedAt") / 3600000 * 0.833)::integer));
$$;

create function public.complete_task(p_task_id uuid, p_done boolean) returns jsonb language plpgsql security definer set search_path = '' as $$
declare t public.tasks; p public.profiles; earned integer := 0; coins integer := 0; h integer;
begin
  if p_done is null then raise exception 'Completion status required'; end if;
  select * into t from public.tasks where id = p_task_id and user_id = auth.uid() for update;
  if not found then raise exception 'Task not found'; end if;
  select * into strict p from public.profiles where id = auth.uid() for update;
  h := public.effective_happiness(p);
  if p_done and not t.rewarded then
    earned := round(t.xp * case when h >= 85 then 1.25 else 1 end);
    coins := 5;
    update public.profiles set xp = xp + earned, coins = profiles.coins + 5,
      "tasksCompleted" = "tasksCompleted" + 1, happiness = least(100, h + 15),
      "lastFedAt" = (extract(epoch from now()) * 1000)::bigint where id = auth.uid() returning * into p;
  end if;
  update public.tasks set done = p_done, rewarded = rewarded or p_done where id = t.id;
  return jsonb_build_object('xp',earned,'coins',coins,'profile',to_jsonb(p));
end;
$$;

create function public.purchase_item(p_item_id text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare p public.profiles; item public.shop_items;
begin
  select * into strict p from public.profiles where id = auth.uid() for update;
  select * into item from public.shop_items where id = p_item_id;
  if not found then return jsonb_build_object('ok',false,'reason','invalid-item'); end if;
  if p."ownedItems"->>item.id = 'true' then return jsonb_build_object('ok',true,'reason','owned','profile',to_jsonb(p)); end if;
  if p.coins < item.price then return jsonb_build_object('ok',false,'reason','not-enough-coins','profile',to_jsonb(p)); end if;
  update public.profiles set coins = coins - item.price, "ownedItems" = "ownedItems" || jsonb_build_object(item.id,true)
    where id = auth.uid() returning * into p;
  return jsonb_build_object('ok',true,'reason','purchased','profile',to_jsonb(p));
end;
$$;

create function public.equip_item(p_item_id text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare p public.profiles; item public.shop_items;
begin
  select * into strict p from public.profiles where id = auth.uid() for update;
  select * into item from public.shop_items where id = p_item_id;
  if not found or coalesce(p."ownedItems"->>p_item_id,'false') <> 'true' then raise exception 'Item not owned'; end if;
  update public.profiles set
    "equippedBackgroundId" = case when item.category = 'backgrounds' then item.id else "equippedBackgroundId" end,
    "equippedDogHouseId" = case when item.category = 'dogHouses' then item.id else "equippedDogHouseId" end,
    "equippedToyId" = case when item.category = 'toys' then item.id else "equippedToyId" end
    where id = auth.uid() returning * into p;
  return jsonb_build_object('profile',to_jsonb(p));
end;
$$;

create function public.pet_scotty() returns jsonb language plpgsql security definer set search_path = '' as $$
declare p public.profiles;
begin
  select * into strict p from public.profiles where id = auth.uid() for update;
  update public.profiles set happiness = least(100, public.effective_happiness(p) + 2),
    "lastFedAt" = (extract(epoch from now()) * 1000)::bigint where id = auth.uid() returning * into p;
  return jsonb_build_object('profile',to_jsonb(p));
end;
$$;

create function public.claim_activity(p_kind text, p_id text, p_xp integer) returns jsonb language plpgsql security definer set search_path = '' as $$
declare p public.profiles; earned integer; earned_coins integer; claim_period text; inserted integer;
begin
  select * into strict p from public.profiles where id = auth.uid() for update;
  if p_id is null or length(p_id) not between 1 and 100 then raise exception 'Invalid activity'; end if;
  if p_kind = 'quest' then
    earned := case p_id when '1' then 500 when '2' then 300 when '3' then 250 when '4' then 200 when '5' then 150 when '6' then 100 end;
    earned_coins := case p_id when '1' then 200 when '2' then 100 when '3' then 75 when '4' then 60 when '5' then 50 when '6' then 40 end;
    if earned is null then raise exception 'Unknown quest'; end if;
    claim_period := 'once';
  elsif p_kind = 'habit' then
    if p_xp is null or p_xp not between 0 and 60 then raise exception 'Invalid habit reward'; end if;
    earned := p_xp; earned_coins := 2; claim_period := (now() at time zone 'UTC')::date::text;
  else raise exception 'Invalid activity kind'; end if;
  insert into public.activity_claims values (auth.uid(),p_kind,p_id,claim_period) on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted = 0 then return jsonb_build_object('xp',0,'coins',0,'profile',to_jsonb(p)); end if;
  update public.profiles set xp = xp + earned, coins = profiles.coins + earned_coins,
    happiness = case when p_kind = 'habit' then least(100,public.effective_happiness(p) + 10) else happiness end,
    "lastFedAt" = case when p_kind = 'habit' then (extract(epoch from now()) * 1000)::bigint else "lastFedAt" end
    where id = auth.uid() returning * into p;
  return jsonb_build_object('xp',earned,'coins',earned_coins,'profile',to_jsonb(p));
end;
$$;

revoke execute on function public.create_profile(), public.effective_happiness(public.profiles), public.complete_task(uuid,boolean), public.purchase_item(text), public.equip_item(text), public.pet_scotty(), public.claim_activity(text,text,integer) from public, anon, authenticated;
grant execute on function public.complete_task(uuid,boolean), public.purchase_item(text), public.equip_item(text), public.pet_scotty(), public.claim_activity(text,text,integer) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('avatars','avatars',true,5242880,array['image/jpeg','image/png','image/webp']);
create policy avatar_insert on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatar_delete on storage.objects for delete to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatar_select on storage.objects for select to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
alter publication supabase_realtime add table public.profiles, public.tasks;
