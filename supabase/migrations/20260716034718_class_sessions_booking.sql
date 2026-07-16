-- Class schedules, sessions, bookings, waitlist auto-promote, inbox, check-in link.

-- ---------------------------------------------------------------------------
-- Extend catalog
-- ---------------------------------------------------------------------------

alter table public.classes
  add column if not exists duration_minutes int not null default 60
    check (duration_minutes > 0 and duration_minutes <= 24 * 60);

alter table public.classes
  add column if not exists tags text[] not null default '{}';

-- ---------------------------------------------------------------------------
-- Schedules
-- ---------------------------------------------------------------------------

create table public.class_schedules (
  id uuid primary key default gen_random_uuid (),
  class_id uuid not null references public.classes (id) on delete cascade,
  gym_id uuid not null references public.gyms (id) on delete cascade,
  recurrence text not null default 'weekly'
    check (recurrence in ('none', 'weekly')),
  -- ISO day of week: 1=Mon … 7=Sun (matches extract(isodow))
  days_of_week int[] not null default '{}',
  local_time time not null,
  timezone text not null default 'America/Mexico_City',
  valid_from date not null,
  valid_until date,
  capacity int check (capacity is null or capacity > 0),
  duration_minutes int check (
    duration_minutes is null
    or (duration_minutes > 0 and duration_minutes <= 24 * 60)
  ),
  is_active boolean not null default true,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now (),
  check (
    valid_until is null
    or valid_until >= valid_from
  ),
  check (
    (
      recurrence = 'none'
      and cardinality (days_of_week) = 0
    )
    or (
      recurrence = 'weekly'
      and cardinality (days_of_week) > 0
      and days_of_week <@ array[1, 2, 3, 4, 5, 6, 7]
    )
  )
);

create index class_schedules_gym_id_idx on public.class_schedules (gym_id);

create index class_schedules_class_id_idx on public.class_schedules (class_id);

create index class_schedules_active_idx on public.class_schedules (gym_id, is_active);

-- ---------------------------------------------------------------------------
-- Sessions (materialised occurrences)
-- ---------------------------------------------------------------------------

create table public.class_sessions (
  id uuid primary key default gen_random_uuid (),
  class_id uuid not null references public.classes (id) on delete cascade,
  gym_id uuid not null references public.gyms (id) on delete cascade,
  schedule_id uuid references public.class_schedules (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity int check (capacity is null or capacity > 0),
  status text not null default 'scheduled'
    check (status in ('scheduled', 'cancelled')),
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now (),
  check (ends_at > starts_at),
  unique (class_id, starts_at)
);

create index class_sessions_gym_starts_idx on public.class_sessions (gym_id, starts_at);

create index class_sessions_schedule_id_idx on public.class_sessions (schedule_id);

create index class_sessions_class_id_idx on public.class_sessions (class_id);

-- ---------------------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------------------

create table public.class_bookings (
  id uuid primary key default gen_random_uuid (),
  session_id uuid not null references public.class_sessions (id) on delete cascade,
  person_id uuid not null references public.persons (id) on delete cascade,
  membership_id uuid not null references public.memberships (id) on delete cascade,
  status text not null default 'confirmed'
    check (
      status in (
        'confirmed',
        'waitlisted',
        'cancelled',
        'attended',
        'no_show'
      )
    ),
  waitlist_position int check (waitlist_position is null or waitlist_position > 0),
  booked_at timestamptz not null default now (),
  cancelled_at timestamptz,
  promoted_at timestamptz,
  booked_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now ()
);

create index class_bookings_session_id_idx on public.class_bookings (session_id);

create index class_bookings_person_id_idx on public.class_bookings (person_id);

create index class_bookings_membership_id_idx on public.class_bookings (membership_id);

create unique index class_bookings_active_person_session_uidx
on public.class_bookings (session_id, person_id)
where
  status <> 'cancelled';

create index class_bookings_waitlist_idx on public.class_bookings (session_id, waitlist_position)
where
  status = 'waitlisted';

-- ---------------------------------------------------------------------------
-- Inbox (waitlist promote + future channels)
-- ---------------------------------------------------------------------------

create table public.inbox_messages (
  id uuid primary key default gen_random_uuid (),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  recipient_person_id uuid not null references public.persons (id) on delete cascade,
  kind text not null default 'general',
  title text not null,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now ()
);

create index inbox_messages_recipient_idx on public.inbox_messages (recipient_person_id, created_at desc);

create index inbox_messages_gym_unread_idx on public.inbox_messages (gym_id, recipient_person_id)
where
  read_at is null;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function private.person_id_for_auth_user ()
returns uuid
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select p.id
  from public.persons p
  where
    p.user_id = auth.uid ()
  limit 1;
$$;

create or replace function private.has_active_membership_at_gym (p_gym_id uuid, p_person_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.memberships m
    where
      m.gym_id = p_gym_id
      and m.person_id = p_person_id
      and m.status = 'ACTIVE'
      and m.expires_at >= now()
  );
$$;

revoke all on function private.person_id_for_auth_user () from public;
revoke all on function private.person_id_for_auth_user () from anon;
grant execute on function private.person_id_for_auth_user () to authenticated;
grant execute on function private.person_id_for_auth_user () to service_role;

revoke all on function private.has_active_membership_at_gym (uuid, uuid) from public;
revoke all on function private.has_active_membership_at_gym (uuid, uuid) from anon;
grant execute on function private.has_active_membership_at_gym (uuid, uuid) to authenticated;
grant execute on function private.has_active_membership_at_gym (uuid, uuid) to service_role;

-- ---------------------------------------------------------------------------
-- Generate sessions from a schedule (rolling window)
-- ---------------------------------------------------------------------------

create or replace function public.generate_class_sessions (
  p_schedule_id uuid,
  p_weeks int default 12
)
returns int
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_sched public.class_schedules%rowtype;
  v_class public.classes%rowtype;
  v_weeks int := greatest (1, least (coalesce (p_weeks, 12), 52));
  v_window_end date;
  v_day date;
  v_starts timestamptz;
  v_ends timestamptz;
  v_duration int;
  v_capacity int;
  v_inserted int := 0;
begin
  if auth.uid () is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_sched
  from public.class_schedules
  where id = p_schedule_id;

  if v_sched.id is null then
    raise exception 'Schedule not found';
  end if;

  if not (
    private.is_platform_admin ()
    or private.can_manage_gym (v_sched.gym_id)
  ) then
    raise exception 'Not allowed';
  end if;

  select * into v_class
  from public.classes
  where id = v_sched.class_id;

  if v_class.id is null or not v_class.is_active then
    raise exception 'Class not found or inactive';
  end if;

  v_duration := coalesce (v_sched.duration_minutes, v_class.duration_minutes, 60);
  v_capacity := coalesce (v_sched.capacity, v_class.capacity);

  if v_sched.recurrence = 'none' then
    v_starts := ((v_sched.valid_from::text || ' ' || v_sched.local_time::text)::timestamp
      at time zone v_sched.timezone);
    v_ends := v_starts + make_interval (mins => v_duration);

    insert into public.class_sessions (
      class_id,
      gym_id,
      schedule_id,
      starts_at,
      ends_at,
      capacity,
      status
    )
    values (
      v_sched.class_id,
      v_sched.gym_id,
      v_sched.id,
      v_starts,
      v_ends,
      v_capacity,
      'scheduled'
    )
    on conflict (class_id, starts_at) do update
    set
      ends_at = excluded.ends_at,
      capacity = excluded.capacity,
      schedule_id = excluded.schedule_id,
      updated_at = now ()
    where
      public.class_sessions.status = 'scheduled'
      and not exists (
        select 1
        from public.class_bookings b
        where
          b.session_id = public.class_sessions.id
          and b.status <> 'cancelled'
      );

    get diagnostics v_inserted = row_count;
    return v_inserted;
  end if;

  v_window_end := least (
    coalesce (v_sched.valid_until, (current_date + (v_weeks || ' weeks')::interval)::date),
    (v_sched.valid_from + (v_weeks || ' weeks')::interval)::date
  );

  if v_sched.valid_until is not null then
    v_window_end := least (v_window_end, v_sched.valid_until);
  else
    v_window_end := (current_date + (v_weeks || ' weeks')::interval)::date;
    if v_window_end < v_sched.valid_from then
      v_window_end := (v_sched.valid_from + (v_weeks || ' weeks')::interval)::date;
    end if;
  end if;

  for v_day in
    select d::date
    from generate_series(
      v_sched.valid_from::timestamp,
      v_window_end::timestamp,
      interval '1 day'
    ) as g (d)
    where extract(isodow from d)::int = any (v_sched.days_of_week)
  loop
    v_starts := ((v_day::text || ' ' || v_sched.local_time::text)::timestamp
      at time zone v_sched.timezone);
    v_ends := v_starts + make_interval (mins => v_duration);

    insert into public.class_sessions (
      class_id,
      gym_id,
      schedule_id,
      starts_at,
      ends_at,
      capacity,
      status
    )
    values (
      v_sched.class_id,
      v_sched.gym_id,
      v_sched.id,
      v_starts,
      v_ends,
      v_capacity,
      'scheduled'
    )
    on conflict (class_id, starts_at) do update
    set
      ends_at = excluded.ends_at,
      capacity = excluded.capacity,
      schedule_id = excluded.schedule_id,
      updated_at = now ()
    where
      public.class_sessions.status = 'scheduled'
      and not exists (
        select 1
        from public.class_bookings b
        where
          b.session_id = public.class_sessions.id
          and b.status <> 'cancelled'
      );

    if found then
      v_inserted := v_inserted + 1;
    end if;
  end loop;

  return v_inserted;
end;
$$;

revoke all on function public.generate_class_sessions (uuid, int) from public;
revoke all on function public.generate_class_sessions (uuid, int) from anon;
grant execute on function public.generate_class_sessions (uuid, int) to authenticated;

-- ---------------------------------------------------------------------------
-- Book (confirmed or waitlist)
-- ---------------------------------------------------------------------------

create or replace function public.book_class_session (
  p_session_id uuid,
  p_person_id uuid default null,
  p_membership_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_session public.class_sessions%rowtype;
  v_person_id uuid;
  v_membership public.memberships%rowtype;
  v_confirmed int;
  v_status text;
  v_waitlist_pos int;
  v_booking_id uuid;
  v_is_staff boolean;
begin
  if auth.uid () is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_session
  from public.class_sessions
  where id = p_session_id
  for update;

  if v_session.id is null then
    raise exception 'Session not found';
  end if;

  if v_session.status <> 'scheduled' then
    raise exception 'Session not bookable';
  end if;

  if v_session.starts_at <= now() then
    raise exception 'Session already started';
  end if;

  v_is_staff := private.can_manage_gym (v_session.gym_id)
    or private.has_gym_role (v_session.gym_id, array['OWNER', 'STAFF', 'TRAINER']);

  if p_person_id is not null then
    if not v_is_staff then
      raise exception 'Not allowed';
    end if;
    v_person_id := p_person_id;
  else
    v_person_id := private.person_id_for_auth_user ();
    if v_person_id is null then
      raise exception 'Person not linked';
    end if;
    if not private.has_active_membership_at_gym (v_session.gym_id, v_person_id)
       and not v_is_staff then
      raise exception 'No active membership';
    end if;
  end if;

  if p_membership_id is not null then
    select * into v_membership
    from public.memberships
    where
      id = p_membership_id
      and gym_id = v_session.gym_id
      and person_id = v_person_id;
  else
    select * into v_membership
    from public.memberships
    where
      gym_id = v_session.gym_id
      and person_id = v_person_id
      and status = 'ACTIVE'
      and expires_at >= now()
    order by expires_at desc
    limit 1;
  end if;

  if v_membership.id is null
     or v_membership.status <> 'ACTIVE'
     or v_membership.expires_at < now() then
    raise exception 'Membership inactive or expired';
  end if;

  if exists (
    select 1
    from public.class_bookings b
    where
      b.session_id = v_session.id
      and b.person_id = v_person_id
      and b.status <> 'cancelled'
  ) then
    raise exception 'Already booked';
  end if;

  select count(*)::int into v_confirmed
  from public.class_bookings b
  where
    b.session_id = v_session.id
    and b.status in ('confirmed', 'attended', 'no_show');

  if v_session.capacity is null or v_confirmed < v_session.capacity then
    v_status := 'confirmed';
    v_waitlist_pos := null;
  else
    v_status := 'waitlisted';
    select coalesce (max (b.waitlist_position), 0) + 1 into v_waitlist_pos
    from public.class_bookings b
    where
      b.session_id = v_session.id
      and b.status = 'waitlisted';
  end if;

  insert into public.class_bookings (
    session_id,
    person_id,
    membership_id,
    status,
    waitlist_position,
    booked_by
  )
  values (
    v_session.id,
    v_person_id,
    v_membership.id,
    v_status,
    v_waitlist_pos,
    auth.uid ()
  )
  returning id into v_booking_id;

  return v_booking_id;
end;
$$;

revoke all on function public.book_class_session (uuid, uuid, uuid) from public;
revoke all on function public.book_class_session (uuid, uuid, uuid) from anon;
grant execute on function public.book_class_session (uuid, uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Cancel + waitlist auto-promote
-- ---------------------------------------------------------------------------

create or replace function public.cancel_class_booking (p_booking_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_booking public.class_bookings%rowtype;
  v_session public.class_sessions%rowtype;
  v_person_id uuid;
  v_is_staff boolean;
  v_was_confirmed boolean;
  v_promote public.class_bookings%rowtype;
  v_class_name text;
begin
  if auth.uid () is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_booking
  from public.class_bookings
  where id = p_booking_id
  for update;

  if v_booking.id is null then
    raise exception 'Booking not found';
  end if;

  if v_booking.status = 'cancelled' then
    return v_booking.id;
  end if;

  if v_booking.status in ('attended', 'no_show') then
    raise exception 'Cannot cancel completed booking';
  end if;

  select * into v_session
  from public.class_sessions
  where id = v_booking.session_id
  for update;

  if v_session.starts_at <= now() then
    raise exception 'Cancel window closed';
  end if;

  v_person_id := private.person_id_for_auth_user ();
  v_is_staff := private.can_manage_gym (v_session.gym_id)
    or private.has_gym_role (v_session.gym_id, array['OWNER', 'STAFF', 'TRAINER']);

  if not v_is_staff and (v_person_id is null or v_person_id <> v_booking.person_id) then
    raise exception 'Not allowed';
  end if;

  v_was_confirmed := v_booking.status = 'confirmed';

  update public.class_bookings
  set
    status = 'cancelled',
    cancelled_at = now (),
    waitlist_position = null,
    updated_at = now ()
  where id = v_booking.id;

  if v_was_confirmed then
    select * into v_promote
    from public.class_bookings b
    where
      b.session_id = v_session.id
      and b.status = 'waitlisted'
    order by b.waitlist_position asc nulls last, b.booked_at asc
    limit 1
    for update skip locked;

    if v_promote.id is not null then
      update public.class_bookings
      set
        status = 'confirmed',
        waitlist_position = null,
        promoted_at = now (),
        updated_at = now ()
      where id = v_promote.id;

      select c.name into v_class_name
      from public.classes c
      where c.id = v_session.class_id;

      insert into public.inbox_messages (
        gym_id,
        recipient_person_id,
        kind,
        title,
        body,
        metadata
      )
      values (
        v_session.gym_id,
        v_promote.person_id,
        'waitlist_promoted',
        'Spot available',
        coalesce (v_class_name, 'Class')
          || ' — you moved off the waitlist for '
          || to_char (v_session.starts_at at time zone 'UTC', 'YYYY-MM-DD HH24:MI')
          || ' UTC.',
        jsonb_build_object(
          'booking_id',
          v_promote.id,
          'session_id',
          v_session.id,
          'class_id',
          v_session.class_id
        )
      );
    end if;
  end if;

  return v_booking.id;
end;
$$;

revoke all on function public.cancel_class_booking (uuid) from public;
revoke all on function public.cancel_class_booking (uuid) from anon;
grant execute on function public.cancel_class_booking (uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Staff: mark attended / no_show
-- ---------------------------------------------------------------------------

create or replace function public.set_class_booking_status (
  p_booking_id uuid,
  p_status text
)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_booking public.class_bookings%rowtype;
  v_session public.class_sessions%rowtype;
begin
  if auth.uid () is null then
    raise exception 'Not authenticated';
  end if;

  if p_status not in ('confirmed', 'attended', 'no_show', 'waitlisted') then
    raise exception 'Invalid status';
  end if;

  select * into v_booking
  from public.class_bookings
  where id = p_booking_id
  for update;

  if v_booking.id is null then
    raise exception 'Booking not found';
  end if;

  select * into v_session
  from public.class_sessions
  where id = v_booking.session_id;

  if not (
    private.is_platform_admin ()
    or private.can_manage_gym (v_session.gym_id)
    or private.has_gym_role (v_session.gym_id, array['OWNER', 'STAFF', 'TRAINER'])
  ) then
    raise exception 'Not allowed';
  end if;

  if v_booking.status = 'cancelled' then
    raise exception 'Booking cancelled';
  end if;

  update public.class_bookings
  set
    status = p_status,
    waitlist_position = case
      when p_status = 'waitlisted' then waitlist_position
      else null
    end,
    updated_at = now ()
  where id = v_booking.id;

  return v_booking.id;
end;
$$;

revoke all on function public.set_class_booking_status (uuid, text) from public;
revoke all on function public.set_class_booking_status (uuid, text) from anon;
grant execute on function public.set_class_booking_status (uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Walk-in enroll + attended
-- ---------------------------------------------------------------------------

create or replace function public.walk_in_enroll_class_session (
  p_session_id uuid,
  p_person_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_session public.class_sessions%rowtype;
  v_booking_id uuid;
  v_existing uuid;
  v_confirmed int;
begin
  if auth.uid () is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_session
  from public.class_sessions
  where id = p_session_id
  for update;

  if v_session.id is null then
    raise exception 'Session not found';
  end if;

  if not (
    private.can_manage_gym (v_session.gym_id)
    or private.has_gym_role (v_session.gym_id, array['OWNER', 'STAFF', 'TRAINER'])
  ) then
    raise exception 'Not allowed';
  end if;

  if v_session.status <> 'scheduled' then
    raise exception 'Session not bookable';
  end if;

  select b.id into v_existing
  from public.class_bookings b
  where
    b.session_id = v_session.id
    and b.person_id = p_person_id
    and b.status <> 'cancelled'
  limit 1;

  if v_existing is not null then
    update public.class_bookings
    set
      status = 'attended',
      waitlist_position = null,
      updated_at = now ()
    where id = v_existing;
    return v_existing;
  end if;

  select count(*)::int into v_confirmed
  from public.class_bookings b
  where
    b.session_id = v_session.id
    and b.status in ('confirmed', 'attended', 'no_show');

  if v_session.capacity is not null and v_confirmed >= v_session.capacity then
    raise exception 'Session full';
  end if;

  v_booking_id := public.book_class_session (p_session_id, p_person_id, null);

  update public.class_bookings
  set
    status = 'attended',
    waitlist_position = null,
    updated_at = now ()
  where id = v_booking_id;

  return v_booking_id;
end;
$$;

revoke all on function public.walk_in_enroll_class_session (uuid, uuid) from public;
revoke all on function public.walk_in_enroll_class_session (uuid, uuid) from anon;
grant execute on function public.walk_in_enroll_class_session (uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Mark attendance when checking in (window: -15m … ends_at)
-- ---------------------------------------------------------------------------

create or replace function private.mark_class_attendance_on_check_in (
  p_gym_id uuid,
  p_person_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_booking_id uuid;
begin
  select b.id into v_booking_id
  from public.class_bookings b
  join public.class_sessions s on s.id = b.session_id
  where
    s.gym_id = p_gym_id
    and b.person_id = p_person_id
    and b.status = 'confirmed'
    and s.status = 'scheduled'
    and s.starts_at <= now() + interval '15 minutes'
    and s.ends_at >= now()
  order by s.starts_at asc
  limit 1
  for update of b skip locked;

  if v_booking_id is null then
    return null;
  end if;

  update public.class_bookings
  set
    status = 'attended',
    updated_at = now ()
  where id = v_booking_id;

  return v_booking_id;
end;
$$;

revoke all on function private.mark_class_attendance_on_check_in (uuid, uuid) from public;
revoke all on function private.mark_class_attendance_on_check_in (uuid, uuid) from anon;
revoke all on function private.mark_class_attendance_on_check_in (uuid, uuid) from authenticated;
grant execute on function private.mark_class_attendance_on_check_in (uuid, uuid) to service_role;

-- Replace record_check_in to also mark class attendance; returns check_in id (unchanged).
create or replace function public.record_check_in (
  p_gym_id uuid,
  p_qr_code text default null,
  p_membership_id uuid default null,
  p_branch_id uuid default null,
  p_source text default 'QR'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_membership public.memberships%rowtype;
  v_person_id uuid;
  v_check_in_id uuid;
  v_session_end timestamptz;
begin
  if auth.uid () is null then
    raise exception 'Not authenticated';
  end if;

  if not private.can_manage_gym (p_gym_id)
     and not private.has_gym_role (p_gym_id, array['OWNER', 'STAFF', 'TRAINER']) then
    raise exception 'Not allowed';
  end if;

  if p_membership_id is not null then
    select * into v_membership
    from public.memberships m
    where m.id = p_membership_id and m.gym_id = p_gym_id;
  elsif p_qr_code is not null then
    select m.* into v_membership
    from public.memberships m
    join public.persons p on p.id = m.person_id
    where
      p.qr_code = p_qr_code
      and m.gym_id = p_gym_id;
  else
    raise exception 'membership_id or qr_code required';
  end if;

  if v_membership.id is null then
    raise exception 'Membership not found';
  end if;

  if v_membership.status <> 'ACTIVE' or v_membership.expires_at < now() then
    raise exception 'Membership inactive or expired';
  end if;

  v_person_id := v_membership.person_id;
  v_session_end := now() + interval '4 hours';

  if exists (
    select 1
    from public.check_ins c
    where
      c.person_id = v_person_id
      and c.gym_id <> p_gym_id
      and c.session_expires_at > now()
  ) then
    raise exception 'QR already in use at another gym';
  end if;

  insert into public.check_ins (
    gym_id,
    branch_id,
    membership_id,
    person_id,
    source,
    session_expires_at,
    recorded_by
  )
  values (
    p_gym_id,
    coalesce (p_branch_id, v_membership.branch_id),
    v_membership.id,
    v_person_id,
    coalesce (p_source, 'QR'),
    v_session_end,
    auth.uid ()
  )
  returning id into v_check_in_id;

  perform private.mark_class_attendance_on_check_in (p_gym_id, v_person_id);

  return v_check_in_id;
end;
$$;

revoke all on function public.record_check_in (uuid, text, uuid, uuid, text) from public;
revoke all on function public.record_check_in (uuid, text, uuid, uuid, text) from anon;
grant execute on function public.record_check_in (uuid, text, uuid, uuid, text) to authenticated;

-- Upcoming open sessions for walk-in UI (same person, gym, now window)
create or replace function public.list_open_class_sessions_for_check_in (
  p_gym_id uuid,
  p_person_id uuid
)
returns table (
  session_id uuid,
  class_id uuid,
  class_name text,
  starts_at timestamptz,
  ends_at timestamptz,
  capacity int,
  confirmed_count int,
  has_booking boolean,
  booking_status text
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

  return query
  select
    s.id as session_id,
    s.class_id,
    c.name as class_name,
    s.starts_at,
    s.ends_at,
    s.capacity,
    (
      select count(*)::int
      from public.class_bookings b
      where
        b.session_id = s.id
        and b.status in ('confirmed', 'attended', 'no_show')
    ) as confirmed_count,
    exists (
      select 1
      from public.class_bookings b
      where
        b.session_id = s.id
        and b.person_id = p_person_id
        and b.status <> 'cancelled'
    ) as has_booking,
    (
      select b.status
      from public.class_bookings b
      where
        b.session_id = s.id
        and b.person_id = p_person_id
        and b.status <> 'cancelled'
      limit 1
    ) as booking_status
  from public.class_sessions s
  join public.classes c on c.id = s.class_id
  where
    s.gym_id = p_gym_id
    and s.status = 'scheduled'
    and s.starts_at <= now() + interval '15 minutes'
    and s.ends_at >= now()
  order by s.starts_at asc;
end;
$$;

revoke all on function public.list_open_class_sessions_for_check_in (uuid, uuid) from public;
revoke all on function public.list_open_class_sessions_for_check_in (uuid, uuid) from anon;
grant execute on function public.list_open_class_sessions_for_check_in (uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Duplicate class (+ schedules) to another gym — no trainers/bookings
-- ---------------------------------------------------------------------------

create or replace function public.duplicate_class_to_gym (
  p_class_id uuid,
  p_target_gym_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_src public.classes%rowtype;
  v_new_id uuid;
  v_sched public.class_schedules%rowtype;
  v_new_sched_id uuid;
begin
  if auth.uid () is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_src
  from public.classes
  where id = p_class_id;

  if v_src.id is null then
    raise exception 'Class not found';
  end if;

  if not private.can_manage_gym (v_src.gym_id)
     or not private.can_manage_gym (p_target_gym_id) then
    raise exception 'Not allowed';
  end if;

  if v_src.gym_id = p_target_gym_id then
    raise exception 'Same gym';
  end if;

  insert into public.classes (
    gym_id,
    name,
    description,
    capacity,
    duration_minutes,
    tags,
    is_active
  )
  values (
    p_target_gym_id,
    v_src.name,
    v_src.description,
    v_src.capacity,
    v_src.duration_minutes,
    v_src.tags,
    true
  )
  returning id into v_new_id;

  for v_sched in
    select *
    from public.class_schedules s
    where
      s.class_id = v_src.id
      and s.is_active
  loop
    insert into public.class_schedules (
      class_id,
      gym_id,
      recurrence,
      days_of_week,
      local_time,
      timezone,
      valid_from,
      valid_until,
      capacity,
      duration_minutes,
      is_active
    )
    values (
      v_new_id,
      p_target_gym_id,
      v_sched.recurrence,
      v_sched.days_of_week,
      v_sched.local_time,
      v_sched.timezone,
      greatest (v_sched.valid_from, current_date),
      v_sched.valid_until,
      v_sched.capacity,
      v_sched.duration_minutes,
      true
    )
    returning id into v_new_sched_id;

    perform public.generate_class_sessions (v_new_sched_id, 12);
  end loop;

  return v_new_id;
end;
$$;

revoke all on function public.duplicate_class_to_gym (uuid, uuid) from public;
revoke all on function public.duplicate_class_to_gym (uuid, uuid) from anon;
grant execute on function public.duplicate_class_to_gym (uuid, uuid) to authenticated;

-- Members need to read class catalog for booking
drop policy if exists classes_all on public.classes;

create policy classes_select on public.classes for
select using (
  private.is_platform_admin ()
  or private.has_gym_role (gym_id)
  or private.has_active_membership_at_gym (gym_id, private.person_id_for_auth_user ())
);

create policy classes_manage on public.classes for all using (
  private.is_platform_admin ()
  or private.can_manage_gym (gym_id)
)
with
  check (
    private.is_platform_admin ()
    or private.can_manage_gym (gym_id)
  );

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.class_schedules enable row level security;
alter table public.class_sessions enable row level security;
alter table public.class_bookings enable row level security;
alter table public.inbox_messages enable row level security;

create policy class_schedules_select on public.class_schedules for
select using (
  private.is_platform_admin ()
  or private.has_gym_role (gym_id)
  or private.has_active_membership_at_gym (gym_id, private.person_id_for_auth_user ())
);

create policy class_schedules_manage on public.class_schedules for all using (
  private.is_platform_admin ()
  or private.can_manage_gym (gym_id)
)
with
  check (
    private.is_platform_admin ()
    or private.can_manage_gym (gym_id)
  );

create policy class_sessions_select on public.class_sessions for
select using (
  private.is_platform_admin ()
  or private.has_gym_role (gym_id)
  or private.has_active_membership_at_gym (gym_id, private.person_id_for_auth_user ())
);

create policy class_sessions_manage on public.class_sessions for all using (
  private.is_platform_admin ()
  or private.can_manage_gym (gym_id)
)
with
  check (
    private.is_platform_admin ()
    or private.can_manage_gym (gym_id)
  );

create policy class_bookings_select on public.class_bookings for
select using (
  private.is_platform_admin ()
  or exists (
    select 1
    from public.class_sessions s
    where
      s.id = class_bookings.session_id
      and (
        private.has_gym_role (s.gym_id)
        or private.has_active_membership_at_gym (
          s.gym_id,
          private.person_id_for_auth_user ()
        )
      )
  )
  or person_id = private.person_id_for_auth_user ()
);

-- Mutations go through RPCs; block direct writes from clients
create policy class_bookings_no_direct_write on public.class_bookings for insert
with
  check (false);

create policy class_bookings_no_direct_update on public.class_bookings for update using (false);

create policy class_bookings_no_direct_delete on public.class_bookings for delete using (false);

create policy inbox_messages_select on public.inbox_messages for
select using (
  private.is_platform_admin ()
  or private.has_gym_role (gym_id)
  or recipient_person_id = private.person_id_for_auth_user ()
);

create policy inbox_messages_update_own on public.inbox_messages for
update using (recipient_person_id = private.person_id_for_auth_user ())
with
  check (recipient_person_id = private.person_id_for_auth_user ());

create policy inbox_messages_no_direct_insert on public.inbox_messages for insert
with
  check (false);

create policy inbox_messages_no_direct_delete on public.inbox_messages for delete using (false);

grant select, insert, update, delete on public.class_schedules to authenticated;
grant select, insert, update, delete on public.class_sessions to authenticated;
grant select on public.class_bookings to authenticated;
grant select, update on public.inbox_messages to authenticated;

comment on table public.class_schedules is 'Recurrence rules for gym class catalog entries';
comment on table public.class_sessions is 'Materialised class occurrences';
comment on table public.class_bookings is 'Reservations and waitlist for class sessions';
comment on table public.inbox_messages is 'Internal alerts (e.g. waitlist promotion)';
