-- Stage 5-7: one private photo for each plant care record.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'plant_care_records_id_user_plant_id_user_id_key'
      and conrelid = 'public.plant_care_records'::regclass
  ) then
    alter table public.plant_care_records
      add constraint plant_care_records_id_user_plant_id_user_id_key
      unique (id, user_plant_id, user_id);
  end if;
end;
$$;

create table if not exists public.plant_care_record_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  user_plant_id uuid not null,
  plant_care_record_id uuid not null,
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null,
  width integer not null,
  height integer not null,
  created_at timestamptz not null default now(),
  constraint plant_care_record_photos_record_key
    unique (plant_care_record_id),
  constraint plant_care_record_photos_storage_path_key
    unique (storage_path),
  constraint plant_care_record_photos_mime_type_check
    check (mime_type in ('image/webp', 'image/jpeg')),
  constraint plant_care_record_photos_size_bytes_check
    check (size_bytes between 1 and 5242880),
  constraint plant_care_record_photos_dimensions_check
    check (width between 1 and 1600 and height between 1 and 1600),
  constraint plant_care_record_photos_storage_path_check
    check (
      array_length(string_to_array(storage_path, '/'), 1) = 4
      and split_part(storage_path, '/', 1) = user_id::text
      and split_part(storage_path, '/', 2) = user_plant_id::text
      and split_part(storage_path, '/', 3) = plant_care_record_id::text
      and split_part(storage_path, '/', 4)
        ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg)$'
      and (
        (mime_type = 'image/webp' and storage_path like '%.webp')
        or (mime_type = 'image/jpeg' and storage_path like '%.jpg')
      )
    ),
  constraint plant_care_record_photos_record_owner_fkey
    foreign key (plant_care_record_id, user_plant_id, user_id)
    references public.plant_care_records (id, user_plant_id, user_id)
    on delete cascade
);

create index if not exists plant_care_record_photos_user_plant_idx
  on public.plant_care_record_photos (user_id, user_plant_id);

alter table public.plant_care_record_photos enable row level security;

revoke all on table public.plant_care_record_photos from anon, authenticated;
grant select, insert, delete on table public.plant_care_record_photos
  to authenticated;

drop policy if exists "Users can view their own plant care record photos"
  on public.plant_care_record_photos;
create policy "Users can view their own plant care record photos"
  on public.plant_care_record_photos
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own plant care record photos"
  on public.plant_care_record_photos;
create policy "Users can insert their own plant care record photos"
  on public.plant_care_record_photos
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.plant_care_records as owned_record
      where owned_record.id = plant_care_record_photos.plant_care_record_id
        and owned_record.user_plant_id = plant_care_record_photos.user_plant_id
        and owned_record.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can delete their own plant care record photos"
  on public.plant_care_record_photos;
create policy "Users can delete their own plant care record photos"
  on public.plant_care_record_photos
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Keep the bucket private and make repeated migration application converge on
-- the required restrictions instead of failing when the bucket already exists.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'plant-care-photos',
  'plant-care-photos',
  false,
  5242880,
  array['image/webp', 'image/jpeg']::text[]
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload their own plant care photos"
  on storage.objects;
create policy "Users can upload their own plant care photos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'plant-care-photos'
    and array_length(storage.foldername(name), 1) = 3
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and storage.extension(name) in ('webp', 'jpg')
    and storage.filename(name)
      ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg)$'
    and exists (
      select 1
      from public.plant_care_records as owned_record
      where owned_record.user_id = (select auth.uid())
        and owned_record.user_plant_id::text = (storage.foldername(name))[2]
        and owned_record.id::text = (storage.foldername(name))[3]
    )
  );

drop policy if exists "Users can view their own plant care photos"
  on storage.objects;
create policy "Users can view their own plant care photos"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'plant-care-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can delete their own plant care photos"
  on storage.objects;
create policy "Users can delete their own plant care photos"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'plant-care-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
