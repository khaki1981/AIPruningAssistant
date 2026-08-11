-- Stage 5-4: allow authenticated users to update and delete care records
-- only when the parent plant is still owned by the same authenticated user.
grant update, delete on table public.plant_care_records to authenticated;

drop policy if exists "Users can update their own plant care records"
  on public.plant_care_records;
create policy "Users can update their own plant care records"
  on public.plant_care_records
  for update
  to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.user_plants as owned_plant
      where owned_plant.id = user_plant_id
        and owned_plant.user_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.user_plants as owned_plant
      where owned_plant.id = user_plant_id
        and owned_plant.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can delete their own plant care records"
  on public.plant_care_records;
create policy "Users can delete their own plant care records"
  on public.plant_care_records
  for delete
  to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.user_plants as owned_plant
      where owned_plant.id = user_plant_id
        and owned_plant.user_id = (select auth.uid())
    )
  );
