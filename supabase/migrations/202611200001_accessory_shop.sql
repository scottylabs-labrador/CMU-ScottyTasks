-- Bones reuse the existing balance. Preserve legacy ownership and equipment.
alter table public.profiles add column "equippedHatId" text;
alter table public.profiles add column "equippedGlassesId" text;
alter table public.shop_items drop constraint shop_items_category_check;
alter table public.shop_items add constraint shop_items_category_check
  check (category in ('backgrounds','dogHouses','toys','hats','glasses'));
insert into public.shop_items (id, category, price) values
  ('hat-baseball','hats',100), ('hat-graduation','hats',100),
  ('glasses-clear','glasses',100), ('glasses-dark','glasses',100);

create or replace function public.equip_item(p_item_id text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare p public.profiles; item public.shop_items;
begin
  select * into strict p from public.profiles where id = auth.uid() for update;
  select * into item from public.shop_items where id = p_item_id;
  if not found or coalesce(p."ownedItems"->>p_item_id,'false') <> 'true' then raise exception 'Item not owned'; end if;
  update public.profiles set
    "equippedBackgroundId" = case when item.category = 'backgrounds' then item.id else "equippedBackgroundId" end,
    "equippedDogHouseId" = case when item.category = 'dogHouses' then item.id else "equippedDogHouseId" end,
    "equippedToyId" = case when item.category = 'toys' then item.id else "equippedToyId" end,
    "equippedHatId" = case when item.category = 'hats' then item.id else "equippedHatId" end,
    "equippedGlassesId" = case when item.category = 'glasses' then item.id else "equippedGlassesId" end
    where id = auth.uid() returning * into p;
  return jsonb_build_object('profile',to_jsonb(p));
end;
$$;
revoke all on function public.equip_item(text) from public, anon;
grant execute on function public.equip_item(text) to authenticated;
