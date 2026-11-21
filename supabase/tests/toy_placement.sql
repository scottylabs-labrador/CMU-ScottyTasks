-- Run after migrations; all fixtures are rolled back.
\set ON_ERROR_STOP on
begin;
insert into auth.users(id,raw_user_meta_data) values
('33333333-3333-4333-8333-333333333333','{}'),
('44444444-4444-4444-8444-444444444444','{}');
set local role authenticated;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
do $$
declare target text; coordinate double precision;
begin
  perform public.place_toy('toy-tennis',0.1,0.2);
  perform public.purchase_item('toy-frisbee');
  perform public.place_toy('toy-frisbee',0.64,0);
  if (select "toyPositions"->'toy-tennis' from public.profiles) <> '{"x":0.1,"y":0.2}'::jsonb
    or (select "equippedToyId" from public.profiles) <> 'toy-frisbee'
    or (select coins from public.profiles) <> 19 then
    raise exception 'Placement lost position, equipment, or balance';
  end if;
  foreach target in array array['toy-plush','hat-baseball','missing-item'] loop
    begin
      perform public.place_toy(target,0,0);
      raise exception 'Invalid ownership accepted';
    exception when raise_exception then
      if sqlerrm <> 'Toy not owned' then raise; end if;
    end;
  end loop;
  foreach coordinate in array array[-0.1,0.65,'NaN'::double precision,'Infinity'::double precision,null] loop
    begin
      perform public.place_toy('toy-tennis',coordinate,0);
      raise exception 'Invalid coordinate accepted';
    exception when raise_exception then
      if sqlerrm <> 'Invalid toy position' then raise; end if;
    end;
  end loop;
  begin
    update public.profiles set "toyPositions" = '{}';
    raise exception 'Direct placement mutation allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',true);
do $$ begin
  if (select "toyPositions" from public.profiles) <> '{}'::jsonb then
    raise exception 'Other account changed';
  end if;
end $$;
set local role anon;
do $$ begin
  begin
    perform public.place_toy('toy-tennis',0,0);
    raise exception 'Anonymous placement allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
rollback;
