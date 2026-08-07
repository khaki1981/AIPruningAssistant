-- Stage 4: minimum authenticated-user profile used to verify RLS.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Browser clients only need to read their own row at this stage.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, created_at)
  values (new.id, coalesce(new.created_at, now()))
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user_profile() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

-- Safely add a profile for users created before this migration.
insert into public.profiles (id, created_at)
select id, created_at
from auth.users
on conflict (id) do nothing;
