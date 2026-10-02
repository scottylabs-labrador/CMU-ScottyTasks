-- Run with psql against a local Supabase database after applying migrations.
-- All fixtures roll back; never uses existing users.
\set ON_ERROR_STOP on
begin;
insert into auth.users(id,raw_user_meta_data) values
('11111111-1111-4111-8111-111111111111','{"name":"Migration test A"}'),
('22222222-2222-4222-8222-222222222222','{"name":"Migration test B"}');
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
insert into public.tasks(user_id,text,"dueDate",xp) values
('11111111-1111-4111-8111-111111111111','Test task','Today',80);
do $$
declare t uuid; reward jsonb;
begin
  if (select count(*) from public.profiles) <> 1 then raise exception 'Profile isolation failed'; end if;
  select id into strict t from public.tasks where text = 'Test task';
  perform set_config('test.task_id',t::text,true);
  reward := public.complete_task(t,true);
  if (reward->>'xp')::int <> 100 then raise exception 'Expected server-calculated XP buff'; end if;
  reward := public.complete_task(t,true);
  if (reward->>'xp')::int <> 0 then raise exception 'Duplicate completion paid twice'; end if;
  perform public.complete_task(t,false);
  reward := public.complete_task(t,true);
  if (reward->>'xp')::int <> 0 then raise exception 'Reopening task reset reward'; end if;
  if (select "tasksCompleted" from public.profiles) <> 1 then raise exception 'Completion count wrong'; end if;
  reward := public.purchase_item('red-house');
  if reward->>'reason' <> 'purchased' then raise exception 'Purchase failed'; end if;
  reward := public.purchase_item('red-house');
  if reward->>'reason' <> 'owned' then raise exception 'Duplicate purchase charged twice'; end if;
  if (select coins from public.profiles) <> 18 then raise exception 'Incorrect balance'; end if;
  perform public.equip_item('red-house');
  if (select "equippedDogHouseId" from public.profiles) <> 'red-house' then raise exception 'Equip failed'; end if;
  begin
    perform public.equip_item('toy-plush');
    raise exception 'Unowned item was equipped';
  exception when raise_exception then
    if sqlerrm <> 'Item not owned' then raise; end if;
  end;
  perform public.purchase_item('background-festival');
  reward := public.purchase_item('toy-plush');
  if reward->>'reason' <> 'not-enough-coins' then raise exception 'Overspending allowed'; end if;
  reward := public.claim_activity('habit','h-1',40);
  if (reward->>'xp')::int <> 40 then raise exception 'Habit reward failed'; end if;
  reward := public.claim_activity('habit','h-1',40);
  if (reward->>'xp')::int <> 0 then raise exception 'Habit paid twice'; end if;
  reward := public.claim_activity('quest','1',99999);
  if (reward->>'xp')::int <> 500 then raise exception 'Quest did not use server reward'; end if;
  reward := public.claim_activity('quest','1',500);
  if (reward->>'xp')::int <> 0 then raise exception 'Quest paid twice'; end if;
  insert into storage.objects(bucket_id,name) values ('avatars','11111111-1111-4111-8111-111111111111/test.jpg');
  begin
    insert into storage.objects(bucket_id,name) values ('avatars','22222222-2222-4222-8222-222222222222/foreign.jpg');
    raise exception 'Foreign avatar upload allowed';
  exception when insufficient_privilege then null; end;
  perform public.pet_scotty();
  begin
    update public.profiles set coins = 999999;
    raise exception 'Direct balance editing allowed';
  exception when insufficient_privilege then null; end;
  begin
    update public.tasks set rewarded = false;
    raise exception 'Direct reward reset allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.tasks(user_id,text,"dueDate") values ('22222222-2222-4222-8222-222222222222','Foreign task','Today');
    raise exception 'Foreign task creation allowed';
  exception when insufficient_privilege then null; end;
end;
$$;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
do $$
begin
  if (select count(*) from public.tasks) <> 0 then raise exception 'Cross-user task read allowed'; end if;
  if (select count(*) from public.activity_claims) <> 0 then raise exception 'Cross-user claims read allowed'; end if;
  if (select xp from public.profiles) <> 0 then raise exception 'Rewards affected another user'; end if;
  begin
    perform public.complete_task(current_setting('test.task_id')::uuid,true);
    raise exception 'Foreign task completion allowed';
  exception when raise_exception then
    if sqlerrm <> 'Task not found' then raise; end if;
  end;
  if (select count(*) from storage.objects) <> 0 then raise exception 'Foreign storage metadata read allowed'; end if;
  delete from storage.objects;
  delete from public.tasks;
  update public.profiles set name = 'Unauthorized' where id = '11111111-1111-4111-8111-111111111111';
end;
$$;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
do $$
begin
  if (select count(*) from storage.objects) <> 1 then raise exception 'Foreign avatar delete allowed'; end if;
  if (select count(*) from public.tasks) <> 1 then raise exception 'Cross-user task delete allowed'; end if;
  if (select name from public.profiles) <> 'Migration test A' then raise exception 'Cross-user profile write allowed'; end if;
end;
$$;
set local role anon;
do $$
begin
  begin
    perform public.purchase_item('toy-bone');
    raise exception 'Anonymous RPC access allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform * from public.tasks;
    raise exception 'Anonymous task read allowed';
  exception when insufficient_privilege then null; end;
end;
$$;
rollback;
