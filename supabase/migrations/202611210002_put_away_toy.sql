-- Remove only the selected toy from the scene; ownership and other toys stay intact.
create or replace function public.put_away_toy(p_item_id text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare p public.profiles; item public.shop_items;
begin
  select * into strict p from public.profiles where id = auth.uid() for update;
  select * into item from public.shop_items where id = p_item_id;
  if not found or item.category <> 'toys' or coalesce(p."ownedItems"->>p_item_id,'false') <> 'true' then
    raise exception 'Toy not owned';
  end if;
  update public.profiles set
    "equippedToyId" = case when "equippedToyId" = p_item_id then '' else "equippedToyId" end,
    "toyPositions" = "toyPositions" - p_item_id
  where id = auth.uid() returning * into p;
  return jsonb_build_object('profile',to_jsonb(p));
end;
$$;
revoke all on function public.put_away_toy(text) from public, anon;
grant execute on function public.put_away_toy(text) to authenticated;
