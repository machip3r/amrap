-- Week calendar: one round-trip with SQL booking aggregates (no booking-row download).

create or replace function public.list_class_sessions_for_week (
  p_gym_id uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_trainer_user_id uuid default null,
  p_class_id uuid default null
)
returns table (
  id uuid,
  class_id uuid,
  gym_id uuid,
  schedule_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  capacity int,
  status text,
  class_name text,
  confirmed_count int,
  waitlist_count int
)
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if auth.uid () is null then
    raise exception 'Not authenticated';
  end if;

  if not private.can_manage_gym (p_gym_id)
     and not private.has_gym_role (p_gym_id, array['OWNER', 'STAFF', 'TRAINER']) then
    raise exception 'Not allowed';
  end if;

  if p_to <= p_from then
    raise exception 'Invalid range';
  end if;

  -- Cap to 31 days to avoid accidental huge scans.
  if p_to > p_from + interval '31 days' then
    raise exception 'Range too large';
  end if;

  return query
  select
    s.id,
    s.class_id,
    s.gym_id,
    s.schedule_id,
    s.starts_at,
    s.ends_at,
    s.capacity,
    s.status::text,
    c.name as class_name,
    coalesce(bc.confirmed_count, 0)::int as confirmed_count,
    coalesce(bc.waitlist_count, 0)::int as waitlist_count
  from public.class_sessions s
  join public.classes c on c.id = s.class_id
  left join (
    select
      b.session_id,
      count(*) filter (
        where b.status <> 'cancelled' and b.status <> 'waitlisted'
      )::int as confirmed_count,
      count(*) filter (where b.status = 'waitlisted')::int as waitlist_count
    from public.class_bookings b
    where b.session_id in (
      select s2.id
      from public.class_sessions s2
      where
        s2.gym_id = p_gym_id
        and s2.starts_at >= p_from
        and s2.starts_at < p_to
        and (p_class_id is null or s2.class_id = p_class_id)
    )
    group by b.session_id
  ) bc on bc.session_id = s.id
  where
    s.gym_id = p_gym_id
    and s.starts_at >= p_from
    and s.starts_at < p_to
    and (p_class_id is null or s.class_id = p_class_id)
    and (
      p_trainer_user_id is null
      or exists (
        select 1
        from public.class_trainers ct
        where
          ct.class_id = s.class_id
          and ct.user_id = p_trainer_user_id
      )
    )
  order by s.starts_at asc;
end;
$$;

revoke all on function public.list_class_sessions_for_week (
  uuid,
  timestamptz,
  timestamptz,
  uuid,
  uuid
) from public;
revoke all on function public.list_class_sessions_for_week (
  uuid,
  timestamptz,
  timestamptz,
  uuid,
  uuid
) from anon;
grant execute on function public.list_class_sessions_for_week (
  uuid,
  timestamptz,
  timestamptz,
  uuid,
  uuid
) to authenticated;
