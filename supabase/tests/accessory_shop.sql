-- Run after migrations. Fixtures are isolated and rolled back.
\set ON_ERROR_STOP on
begin;
insert into auth.users(id,raw_user_meta_data) values
('33333333-3333-4333-8333-333333333333','{"name":"Accessory test"}'),
('44444444-4444-4444-8444-444444444444','{"name":"Other account"}');
update public.profiles set coins = 250 where id = '33333333-3333-4333-8333-333333333333';
set local role authenticated;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
do $$
declare result jsonb;
begin
  begin
    perform public.equip_item('hat-baseball');
    raise exception 'Unowned hat equipped';
  exception when raise_exception then
    if sqlerrm <> 'Item not owned' then raise; end if;
  end;
  result := public.purchase_item('hat-baseball');
  if result->>'reason' <> 'purchased' then raise exception 'Hat purchase failed'; end if;
  perform public.purchase_item('hat-baseball');
  if (select coins from public.profiles) <> 150 then raise exception 'Duplicate purchase charged twice'; end if;
  perform public.equip_item('hat-baseball');
  perform public.purchase_item('glasses-clear');
  perform public.equip_item('glasses-clear');
  if (select "equippedHatId" from public.profiles) <> 'hat-baseball' then raise exception 'Hat not saved'; end if;
  if (select "equippedGlassesId" from public.profiles) <> 'glasses-clear' then raise exception 'Glasses not saved'; end if;
  if (select "equippedToyId" from public.profiles) <> 'toy-tennis' then raise exception 'Toy lost'; end if;
  result := public.purchase_item('hat-graduation');
  if result->>'reason' <> 'not-enough-coins' then raise exception 'Overspending allowed'; end if;
  if (select coins from public.profiles) <> 50 then raise exception 'Wrong balance'; end if;
  begin
    update public.profiles set "equippedHatId" = 'hat-graduation';
    raise exception 'Direct equipment mutation allowed';
  exception when insufficient_privilege then null;
  end;
end;
$$;
select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',true);
do $$ begin
  if (select coins from public.profiles) <> 25 or (select "equippedHatId" from public.profiles) is not null then
    raise exception 'Other account changed';
  end if;
end $$;
rollback;
