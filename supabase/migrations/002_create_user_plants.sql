-- Stage 5-1: plants owned by authenticated users.
create table if not exists public.user_plants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plant_id text not null check (char_length(plant_id) between 1 and 100),
  nickname text check (
    nickname is null
    or char_length(btrim(nickname)) between 1 and 100
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- There is intentionally no unique constraint on (user_id, plant_id):
-- one user may own multiple plants of the same species.
create index if not exists user_plants_user_created_at_idx
  on public.user_plants (user_id, created_at desc);

create or replace function public.set_user_plants_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_user_plants_updated_at() from public, anon, authenticated;

drop trigger if exists set_user_plants_updated_at on public.user_plants;
create trigger set_user_plants_updated_at
  before update on public.user_plants
  for each row execute function public.set_user_plants_updated_at();

alter table public.user_plants enable row level security;

revoke all on table public.user_plants from anon, authenticated;
grant select, insert, update, delete on table public.user_plants to authenticated;

drop policy if exists "Users can view their own plants" on public.user_plants;
create policy "Users can view their own plants"
  on public.user_plants
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own plants" on public.user_plants;
create policy "Users can insert their own plants"
  on public.user_plants
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own plants" on public.user_plants;
create policy "Users can update their own plants"
  on public.user_plants
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own plants" on public.user_plants;
create policy "Users can delete their own plants"
  on public.user_plants
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

