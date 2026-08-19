-- Stage 5-9A: grant the SECURITY INVOKER account-deletion function only the
-- table privileges required when it runs as service_role.
grant delete on table
  public.plant_care_record_photos,
  public.plant_care_records,
  public.user_plants,
  public.profiles
to service_role;

-- PostgreSQL DELETE also requires SELECT privilege on columns referenced by
-- its WHERE clause. Keep this column-scoped instead of granting table SELECT.
grant select (user_id)
on table public.plant_care_record_photos
to service_role;

grant select (user_id)
on table public.plant_care_records
to service_role;

grant select (user_id)
on table public.user_plants
to service_role;

grant select (id)
on table public.profiles
to service_role;
