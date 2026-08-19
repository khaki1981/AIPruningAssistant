-- Stage 5-9A: delete one user's application data in a single transaction.
-- Storage objects and the Auth user are deleted separately by the Edge Function.
create or replace function public.delete_account_application_data(
  p_user_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_user_id is null then
    raise exception 'user id is required' using errcode = '22004';
  end if;

  -- Serialize database cleanup attempts for the same user. Hash collisions can
  -- only serialize unrelated deletions; they cannot broaden a DELETE filter.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_user_id::text, 0)
  );

  delete from public.plant_care_record_photos
  where user_id = p_user_id;

  delete from public.plant_care_records
  where user_id = p_user_id;

  delete from public.user_plants
  where user_id = p_user_id;

  delete from public.profiles
  where id = p_user_id;
end;
$$;

revoke execute on function public.delete_account_application_data(uuid)
  from PUBLIC, anon, authenticated;
grant execute on function public.delete_account_application_data(uuid)
  to service_role;
