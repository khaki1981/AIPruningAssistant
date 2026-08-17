-- Stage 5-8B: allow owners to replace only mutable photo metadata.
revoke update on table public.plant_care_record_photos
  from PUBLIC, anon, authenticated;
revoke update (
  id,
  user_id,
  user_plant_id,
  plant_care_record_id,
  storage_path,
  mime_type,
  size_bytes,
  width,
  height,
  created_at
) on table public.plant_care_record_photos
  from PUBLIC, anon, authenticated;

grant update (
  storage_path,
  mime_type,
  size_bytes,
  width,
  height
) on table public.plant_care_record_photos to authenticated;

drop policy if exists "Users can update their own plant care record photos"
  on public.plant_care_record_photos;
create policy "Users can update their own plant care record photos"
  on public.plant_care_record_photos
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
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

-- Storage objects are replaced with the existing INSERT and DELETE policies.
-- Do not grant UPDATE on storage.objects.
