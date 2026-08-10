-- Stage 5-2: condition and care records for plants owned by authenticated users.
-- The composite key guarantees that every record owner matches the parent plant owner.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_plants_id_user_id_key'
      and conrelid = 'public.user_plants'::regclass
  ) then
    alter table public.user_plants
      add constraint user_plants_id_user_id_key unique (id, user_id);
  end if;
end;
$$;

create table if not exists public.plant_care_records (
  id uuid primary key default gen_random_uuid(),
  user_plant_id uuid not null,
  user_id uuid not null,
  record_date date not null,
  -- Store changeable UI option identifiers as text; 'other' enables its free-text field.
  plant_condition text not null check (
    char_length(btrim(plant_condition)) between 1 and 100
    and plant_condition ~ '^[a-z][a-z0-9_-]*$'
  ),
  condition_other text check (
    condition_other is null
    or char_length(btrim(condition_other)) between 1 and 200
  ),
  work_types text[] not null check (
    array_ndims(work_types) = 1
    and cardinality(work_types) between 1 and 20
    and array_position(work_types, null) is null
    and array_position(work_types, '') is null
    and char_length(array_to_string(work_types, '')) between 1 and 1000
    and array_to_string(work_types, '') !~ ','
    and array_to_string(work_types, ',')
      ~ '^[a-z][a-z0-9_-]*(,[a-z][a-z0-9_-]*)*$'
  ),
  work_other text check (
    work_other is null
    or char_length(btrim(work_other)) between 1 and 200
  ),
  memo text check (
    memo is null
    or char_length(btrim(memo)) between 1 and 2000
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plant_care_records_condition_other_matches_check check (
    (plant_condition = 'other' and condition_other is not null)
    or (plant_condition <> 'other' and condition_other is null)
  ),
  constraint plant_care_records_work_other_matches_check check (
    ('other' = any(work_types) and work_other is not null)
    or (not ('other' = any(work_types)) and work_other is null)
  ),
  constraint plant_care_records_user_plant_owner_fkey
    foreign key (user_plant_id, user_id)
    references public.user_plants (id, user_id)
    on delete restrict
);

-- One index supports owner filtering, a single plant's records, newest-record ordering,
-- and foreign-key checks. PostgreSQL does not create an index on referencing columns.
create index if not exists plant_care_records_user_plant_date_idx
  on public.plant_care_records (
    user_id,
    user_plant_id,
    record_date desc,
    created_at desc
  );

create or replace function public.set_plant_care_records_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_plant_care_records_updated_at()
  from public, anon, authenticated;

drop trigger if exists set_plant_care_records_updated_at
  on public.plant_care_records;
create trigger set_plant_care_records_updated_at
  before update on public.plant_care_records
  for each row execute function public.set_plant_care_records_updated_at();

alter table public.plant_care_records enable row level security;

revoke all on table public.plant_care_records from anon, authenticated;
grant select, insert on table public.plant_care_records to authenticated;

drop policy if exists "Users can view their own plant care records"
  on public.plant_care_records;
create policy "Users can view their own plant care records"
  on public.plant_care_records
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own plant care records"
  on public.plant_care_records;
create policy "Users can insert their own plant care records"
  on public.plant_care_records
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.user_plants as owned_plant
      where owned_plant.id = user_plant_id
        and owned_plant.user_id = (select auth.uid())
    )
  );
