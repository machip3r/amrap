-- Fix list_class_sessions_for_week: PL/pgSQL OUT-param name collisions can
-- silently yield empty/null rows. Use distinct output names + positional map.

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

  if p_to > p_from + interval '31 days' then
    raise exception 'Range too large';
  end if;

  return query
  select
    q.sid,
    q.s_class_id,
    q.s_gym_id,
    q.s_schedule_id,
    q.s_starts_at,
    q.s_ends_at,
    q.s_capacity,
    q.s_status,
    q.s_class_name,
    q.s_confirmed_count,
    q.s_waitlist_count
  from (
    select
      s.id as sid,
      s.class_id as s_class_id,
      s.gym_id as s_gym_id,
      s.schedule_id as s_schedule_id,
      s.starts_at as s_starts_at,
      s.ends_at as s_ends_at,
      s.capacity as s_capacity,
      s.status::text as s_status,
      c.name as s_class_name,
      coalesce(bc.confirmed_count, 0)::int as s_confirmed_count,
      coalesce(bc.waitlist_count, 0)::int as s_waitlist_count
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
  ) q
  order by q.s_starts_at asc;
end;
$$;
