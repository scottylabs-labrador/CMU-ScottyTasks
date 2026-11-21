\set ON_ERROR_STOP on
begin;
insert into auth.users(id,raw_user_meta_data) values
('33333333-3333-4333-8333-333333333333','{}'),('44444444-4444-4444-8444-444444444444','{}');

-- Default happiness on create_profile is 85 (1.25x XP multiplier active: 40 * 1.25 = 50 XP, 60 * 1.25 = 75 XP).
update public.profiles set happiness = 70 where id = '33333333-3333-4333-8333-333333333333';

insert into public.habits(id,user_id,category,tracking,title,unit,goal,goal_condition,priority,starts_on) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','33333333-3333-4333-8333-333333333333','water','numeric','Drink Water','glasses',8,'at_least','medium',(now() at time zone 'UTC')::date - 7),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','33333333-3333-4333-8333-333333333333','hobbies','boolean','Practice Guitar','',null,'at_least','high',(now() at time zone 'UTC')::date),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','33333333-3333-4333-8333-333333333333','sleep','numeric','Sleep 8 Hours','hours',8,'at_least','low',(now() at time zone 'UTC')::date);

set local role authenticated;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);

-- Custom category allows arbitrary 1..20 char units
insert into public.habits(user_id,category,tracking,title,unit,goal,starts_on)
values (auth.uid(),'custom','numeric','Solve Problems','problems',3,current_date);
delete from public.habits where title='Solve Problems';

do $$
declare
  r jsonb;
  d date := (now() at time zone 'UTC')::date;
  water uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
begin
  -- Partial progress logs without awarding XP
  r := public.record_habit_day(water, d, 4, 'UTC', 'Morning hydration');
  if (r->>'xp')::int <> 0 or (r->'entry'->>'value')::numeric <> 4 or (r->'entry'->>'note') <> 'Morning hydration' then
    raise exception 'Partial progress failed';
  end if;

  -- Goal completion awards medium priority XP (40 at happiness 70 -> happiness becomes 80)
  r := public.record_habit_day(water, d, 8, 'UTC', 'Hit 8 glasses');
  if (r->>'xp')::int <> 40 then raise exception 'Goal completion did not award 40 XP'; end if;

  -- Duplicate update does not double-award XP
  r := public.record_habit_day(water, d, 10, 'UTC');
  if (r->>'xp')::int <> 0 then raise exception 'Duplicate reward'; end if;

  -- Editing habit goal preserves snapshotted daily goal on already-logged day
  update public.habits set goal = 12 where id = water;
  r := public.record_habit_day(water, d, 6, 'UTC');
  if (r->'entry'->>'goal')::numeric <> 8 then raise exception 'History goal was overwritten'; end if;

  -- Backfill before starts_on updates starts_on and awards 0 XP
  r := public.record_habit_day(water, d - 10, 8, 'UTC');
  if (r->>'xp')::int <> 0 then raise exception 'Backfill incorrectly awarded XP'; end if;
  if (select starts_on from public.habits where id = water) <> d - 10 then
    raise exception 'Backfill did not extend starts_on';
  end if;

  -- Clearing and relogging does not reset daily reward claim
  r := public.record_habit_day(water, d, null, 'UTC');
  if exists (select 1 from public.habit_entries where habit_id = water and day = d) then
    raise exception 'Clear failed';
  end if;
  r := public.record_habit_day(water, d, 12, 'UTC');
  if (r->>'xp')::int <> 0 then raise exception 'Clear reset the reward claim'; end if;

  -- Boolean high-priority habit (happiness is 80 -> +60 XP, happiness becomes 90)
  r := public.record_habit_day('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', d, 1, 'UTC');
  if (r->>'xp')::int <> 60 then raise exception 'High-priority boolean reward failed'; end if;

  -- Low-priority sleep habit with happiness >= 85 gets 1.25x buff: round(25 * 1.25) = 31 XP
  r := public.record_habit_day('cccccccc-cccc-4ccc-8ccc-cccccccccccc', d, 8.5, 'UTC');
  if (r->>'xp')::int <> 31 then raise exception 'Buffed sleep reward failed'; end if;

  -- Reset progress clears entries and resets starts_on
  perform public.reset_habit_progress(water, 'UTC');
  if exists (select 1 from public.habit_entries where habit_id = water) then
    raise exception 'reset_habit_progress did not clear entries';
  end if;

  -- Reject invalid category/unit pairings (e.g. time unit 'hours' on 'water')
  begin
    insert into public.habits(user_id,category,tracking,title,unit,goal)
    values (auth.uid(),'water','numeric','Bad Water','hours',2);
    raise exception 'Time unit allowed on water category';
  exception when check_violation then null; end;

  -- Reject volume unit 'oz' on 'sleep'
  begin
    insert into public.habits(user_id,category,tracking,title,unit,goal)
    values (auth.uid(),'sleep','numeric','Bad Sleep','oz',8);
    raise exception 'Volume unit allowed on sleep category';
  exception when check_violation then null; end;

  -- Reject future entry
  begin
    perform public.record_habit_day(water, d + 1, 8, 'UTC');
    raise exception 'Future entry allowed';
  exception when raise_exception then
    if sqlerrm <> 'Invalid entry date' then raise; end if;
  end;

  -- Reject direct entry insert
  begin
    insert into public.habit_entries(habit_id,user_id,day,value,goal) values (water,auth.uid(),d-2,8,8);
    raise exception 'Direct entry mutation allowed';
  exception when insufficient_privilege then null; end;
end;
$$;

-- Cross-user isolation
select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',true);
do $$
begin
  if exists(select 1 from public.habits) or exists(select 1 from public.habit_entries) then
    raise exception 'Cross-user read allowed';
  end if;
  begin
    perform public.record_habit_day('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',(now() at time zone 'UTC')::date,8,'UTC');
    raise exception 'Foreign habit logged';
  exception when raise_exception then
    if sqlerrm <> 'Habit not found' then raise; end if;
  end;
end;
$$;

set local role anon;
do $$
begin
  begin
    perform public.record_habit_day('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',current_date,1,'UTC');
    raise exception 'Anonymous RPC allowed';
  exception when insufficient_privilege then null; end;
end;
$$;
rollback;
