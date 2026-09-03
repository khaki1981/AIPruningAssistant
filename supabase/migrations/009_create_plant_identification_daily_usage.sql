create table public.plant_identification_daily_usage (
  user_id uuid not null,
  usage_date date not null,
  request_count smallint not null,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint plant_identification_daily_usage_pkey
    primary key (user_id, usage_date),
  constraint plant_identification_daily_usage_user_id_fkey
    foreign key (user_id) references auth.users (id) on delete cascade,
  constraint plant_identification_daily_usage_request_count_check
    check (request_count between 1 and 5)
);

alter table public.plant_identification_daily_usage enable row level security;

revoke all on table public.plant_identification_daily_usage
  from PUBLIC, anon, authenticated, service_role;

grant select, insert, update on table public.plant_identification_daily_usage
  to service_role;

create or replace function public.reserve_plant_identification_request(
  p_user_id uuid
)
returns table (
  allowed boolean,
  request_count smallint,
  remaining_count smallint,
  usage_date date
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_usage_date date := (pg_catalog.now() at time zone 'Asia/Tokyo')::date;
  v_request_count smallint;
begin
  if p_user_id is null then
    return query
    select false, 0::smallint, 0::smallint, v_usage_date;
    return;
  end if;

  insert into public.plant_identification_daily_usage as daily_usage (
    user_id,
    usage_date,
    request_count,
    created_at,
    updated_at
  )
  values (
    p_user_id,
    v_usage_date,
    1,
    pg_catalog.now(),
    pg_catalog.now()
  )
  on conflict on constraint plant_identification_daily_usage_pkey do update
  set
    request_count = (daily_usage.request_count + 1)::smallint,
    updated_at = pg_catalog.now()
  where daily_usage.request_count < 5
  returning daily_usage.request_count into v_request_count;

  if found then
    return query
    select
      true,
      v_request_count,
      (5 - v_request_count)::smallint,
      v_usage_date;
    return;
  end if;

  return query
  select false, 5::smallint, 0::smallint, v_usage_date;
end;
$$;

revoke execute on function public.reserve_plant_identification_request(uuid)
  from PUBLIC, anon, authenticated, service_role;

grant execute on function public.reserve_plant_identification_request(uuid)
  to service_role;
