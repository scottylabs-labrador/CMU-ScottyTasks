alter table public.profiles add column "toyPositions" jsonb not null default '{}';

-- Equipment and location commit together, without granting direct profile writes.
create function public.place_toy(p_item_id text, p_x double precision, p_y double precision)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare p public.profiles; item public.shop_items;
begin
  if p_x is null or p_y is null or not (p_x between 0 and 0.64) or not (p_y between 0 and 0.64) then
    raise exception 'Invalid toy position';
  end if;
  select * into strict p from public.profiles where id = auth.uid() for update;
  select * into item from public.shop_items where id = p_item_id;
  if not found or item.category <> 'toys' or coalesce(p."ownedItems"->>p_item_id,'false') <> 'true' then
    raise exception 'Toy not owned';
  end if;
  update public.profiles set "equippedToyId" = p_item_id,
    "toyPositions" = "toyPositions" || jsonb_build_object(p_item_id, jsonb_build_object('x', p_x, 'y', p_y))
    where id = auth.uid() returning * into p;
  return jsonb_build_object('profile',to_jsonb(p));
end;
$$;
revoke all on function public.place_toy(text,double precision,double precision) from public, anon;
grant execute on function public.place_toy(text,double precision,double precision) to authenticated;
