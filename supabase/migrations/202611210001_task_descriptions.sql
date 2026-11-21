-- Keep course/tag metadata for imported and existing tasks; notes are separate.
alter table public.tasks
  add column if not exists description text not null default ''
  check (length(description) <= 4000);

grant insert (description), update (description) on public.tasks to authenticated;
pri