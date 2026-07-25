-- Auto-generated uppercase enum migration for remaining lowercase status/kind values.
-- Data + constraints first, then recreate functions/policies that embed literals.

-- ---------------------------------------------------------------------------
-- invite_status
-- ---------------------------------------------------------------------------
alter table public.gym_roles drop constraint if exists gym_roles_invite_status_check;
alter table public.memberships drop constraint if exists memberships_invite_status_check;

update public.gym_roles set invite_status = upper(invite_status);
update public.memberships set invite_status = upper(invite_status);

alter table public.gym_roles alter column invite_status set default 'ACCEPTED';
alter table public.memberships alter column invite_status set default 'ACCEPTED';

alter table public.gym_roles
  add constraint gym_roles_invite_status_check check (
    invite_status in ('PENDING', 'ACCEPTED', 'CANCELLED')
  );
alter table public.memberships
  add constraint memberships_invite_status_check check (
    invite_status in ('PENDING', 'ACCEPTED', 'CANCELLED')
  );

comment on column public.gym_roles.invite_status is 'PENDING | ACCEPTED | CANCELLED — invitee journey for STAFF/TRAINER';
comment on column public.memberships.invite_status is 'PENDING | ACCEPTED | CANCELLED — member claim invite';

create or replace function private.has_gym_role (p_gym_id uuid, p_roles text[] default null)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.gym_roles gr
    where
      gr.gym_id = p_gym_id
      and gr.user_id = auth.uid ()
      and (
        gr.role = 'OWNER'
        or gr.invite_status = 'ACCEPTED'
      )
      and (
        p_roles is null
        or gr.role = any (p_roles)
        or gr.is_provisional_owner = true
      )
  );
$$;

create or replace function private.user_gym_ids ()
returns setof uuid
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select gr.gym_id
  from public.gym_roles gr
  where
    gr.user_id = auth.uid ()
    and (
      gr.role = 'OWNER'
      or gr.invite_status = 'ACCEPTED'
    );
$$;

create or replace function private.has_linked_membership_at_gym (p_gym_id uuid)
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
      and m.person_id = private.person_id_for_auth_user ()
      and m.invite_status in ('PENDING', 'ACCEPTED')
  );
$$;

create or replace function private.has_membership_in_organization (p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.gyms g
    inner join public.memberships m on m.gym_id = g.id
    where
      g.organization_id = p_org_id
      and m.person_id = private.person_id_for_auth_user ()
      and m.invite_status in ('PENDING', 'ACCEPTED')
  );
$$;

create or replace function public.update_my_nav_visibility (
  p_gym_id uuid,
  p_nav_visibility jsonb
)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if auth.uid () is null then
    raise exception 'Not authenticated';
  end if;

  if p_nav_visibility is null or jsonb_typeof (p_nav_visibility) <> 'object' then
    raise exception 'Invalid nav_visibility';
  end if;

  update public.gym_roles
  set nav_visibility = p_nav_visibility
  where
    gym_id = p_gym_id
    and user_id = auth.uid ()
    and (
      role = 'OWNER'
      or invite_status = 'ACCEPTED'
    );

  if not found then
    raise exception 'Not allowed';
  end if;
end;
$$;

drop policy if exists gym_roles_respond_invite on public.gym_roles;
create policy gym_roles_respond_invite on public.gym_roles for
update using (
  user_id = auth.uid ()
  and invite_status = 'PENDING'
)
with
  check (
    user_id = auth.uid ()
    and invite_status in ('ACCEPTED', 'CANCELLED')
  );

drop policy if exists memberships_respond_invite on public.memberships;
create policy memberships_respond_invite on public.memberships for
update using (
  private.person_owned_by_me (person_id)
  and invite_status = 'PENDING'
)
with
  check (
    private.person_owned_by_me (person_id)
    and invite_status in ('ACCEPTED', 'CANCELLED')
  );

-- ---------------------------------------------------------------------------
-- class schedules / sessions / bookings
-- ---------------------------------------------------------------------------
-- Drop any CHECK that mentions recurrence (inline enum + shape).
do $$
declare
  cname text;
begin
  for cname in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'class_schedules'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%recurrence%'
  loop
    execute format('alter table public.class_schedules drop constraint %I', cname);
  end loop;
end $$;

update public.class_schedules set recurrence = upper(recurrence);

alter table public.class_schedules alter column recurrence set default 'WEEKLY';
alter table public.class_schedules
  add constraint class_schedules_recurrence_check check (
    recurrence in ('NONE', 'WEEKLY')
  );
alter table public.class_schedules
  add constraint class_schedules_recurrence_shape_check check (
    (
      recurrence = 'NONE'
      and cardinality(days_of_week) = 0
    )
    or (
      recurrence = 'WEEKLY'
      and cardinality(days_of_week) > 0
      and days_of_week <@ array[1, 2, 3, 4, 5, 6, 7]
    )
  );

do $$
declare
  cname text;
begin
  for cname in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'class_sessions'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%status%'
  loop
    execute format('alter table public.class_sessions drop constraint %I', cname);
  end loop;
end $$;

update public.class_sessions set status = upper(status);
alter table public.class_sessions alter column status set default 'SCHEDULED';
alter table public.class_sessions
  add constraint class_sessions_status_check check (
    status in ('SCHEDULED', 'CANCELLED')
  );

do $$
declare
  cname text;
begin
  for cname in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'class_bookings'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%status%'
  loop
    execute format('alter table public.class_bookings drop constraint %I', cname);
  end loop;
end $$;

update public.class_bookings set status = upper(status);
alter table public.class_bookings alter column status set default 'CONFIRMED';
alter table public.class_bookings
  add constraint class_bookings_status_check check (
    status in ('CONFIRMED', 'WAITLISTED', 'CANCELLED', 'ATTENDED', 'NO_SHOW')
  );

drop index if exists public.class_bookings_active_person_session_uidx;
create unique index class_bookings_active_person_session_uidx
  on public.class_bookings (session_id, person_id)
  where status <> 'CANCELLED';

drop index if exists public.class_bookings_waitlist_idx;
create index class_bookings_waitlist_idx
  on public.class_bookings (session_id, waitlist_position)
  where status = 'WAITLISTED';

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

  if v_sched.recurrence = 'NONE' then
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
      'SCHEDULED'
    )
    on conflict (class_id, starts_at) do update
    set
      ends_at = excluded.ends_at,
      capacity = excluded.capacity,
      schedule_id = excluded.schedule_id,
      updated_at = now ()
    where
      public.class_sessions.status = 'SCHEDULED'
      and not exists (
        select 1
        from public.class_bookings b
        where
          b.session_id = public.class_sessions.id
          and b.status <> 'CANCELLED'
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
      'SCHEDULED'
    )
    on conflict (class_id, starts_at) do update
    set
      ends_at = excluded.ends_at,
      capacity = excluded.capacity,
      schedule_id = excluded.schedule_id,
      updated_at = now ()
    where
      public.class_sessions.status = 'SCHEDULED'
      and not exists (
        select 1
        from public.class_bookings b
        where
          b.session_id = public.class_sessions.id
          and b.status <> 'CANCELLED'
      );

    if found then
      v_inserted := v_inserted + 1;
    end if;
  end loop;

  return v_inserted;
end;
$$;

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

  if v_session.status <> 'SCHEDULED' then
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
      and b.status <> 'CANCELLED'
  ) then
    raise exception 'Already booked';
  end if;

  select count(*)::int into v_confirmed
  from public.class_bookings b
  where
    b.session_id = v_session.id
    and b.status in ('CONFIRMED', 'ATTENDED', 'NO_SHOW');

  if v_session.capacity is null or v_confirmed < v_session.capacity then
    v_status := 'CONFIRMED';
    v_waitlist_pos := null;
  else
    v_status := 'WAITLISTED';
    select coalesce (max (b.waitlist_position), 0) + 1 into v_waitlist_pos
    from public.class_bookings b
    where
      b.session_id = v_session.id
      and b.status = 'WAITLISTED';
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

  if v_booking.status = 'CANCELLED' then
    return v_booking.id;
  end if;

  if v_booking.status in ('ATTENDED', 'NO_SHOW') then
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

  v_was_confirmed := v_booking.status = 'CONFIRMED';

  update public.class_bookings
  set
    status = 'CANCELLED',
    cancelled_at = now (),
    waitlist_position = null,
    updated_at = now ()
  where id = v_booking.id;

  if v_was_confirmed then
    select * into v_promote
    from public.class_bookings b
    where
      b.session_id = v_session.id
      and b.status = 'WAITLISTED'
    order by b.waitlist_position asc nulls last, b.booked_at asc
    limit 1
    for update skip locked;

    if v_promote.id is not null then
      update public.class_bookings
      set
        status = 'CONFIRMED',
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

  if p_status not in ('CONFIRMED', 'ATTENDED', 'NO_SHOW', 'WAITLISTED') then
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

  if v_booking.status = 'CANCELLED' then
    raise exception 'Booking cancelled';
  end if;

  update public.class_bookings
  set
    status = p_status,
    waitlist_position = case
      when p_status = 'WAITLISTED' then waitlist_position
      else null
    end,
    updated_at = now ()
  where id = v_booking.id;

  return v_booking.id;
end;
$$;

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

  if v_session.status <> 'SCHEDULED' then
    raise exception 'Session not bookable';
  end if;

  select b.id into v_existing
  from public.class_bookings b
  where
    b.session_id = v_session.id
    and b.person_id = p_person_id
    and b.status <> 'CANCELLED'
  limit 1;

  if v_existing is not null then
    update public.class_bookings
    set
      status = 'ATTENDED',
      waitlist_position = null,
      updated_at = now ()
    where id = v_existing;
    return v_existing;
  end if;

  select count(*)::int into v_confirmed
  from public.class_bookings b
  where
    b.session_id = v_session.id
    and b.status in ('CONFIRMED', 'ATTENDED', 'NO_SHOW');

  if v_session.capacity is not null and v_confirmed >= v_session.capacity then
    raise exception 'Session full';
  end if;

  v_booking_id := public.book_class_session (p_session_id, p_person_id, null);

  update public.class_bookings
  set
    status = 'ATTENDED',
    waitlist_position = null,
    updated_at = now ()
  where id = v_booking_id;

  return v_booking_id;
end;
$$;

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
    and b.status = 'CONFIRMED'
    and s.status = 'SCHEDULED'
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
    status = 'ATTENDED',
    updated_at = now ()
  where id = v_booking_id;

  return v_booking_id;
end;
$$;

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
        and b.status in ('CONFIRMED', 'ATTENDED', 'NO_SHOW')
    ) as confirmed_count,
    exists (
      select 1
      from public.class_bookings b
      where
        b.session_id = s.id
        and b.person_id = p_person_id
        and b.status <> 'CANCELLED'
    ) as has_booking,
    (
      select b.status
      from public.class_bookings b
      where
        b.session_id = s.id
        and b.person_id = p_person_id
        and b.status <> 'CANCELLED'
      limit 1
    ) as booking_status
  from public.class_sessions s
  join public.classes c on c.id = s.class_id
  where
    s.gym_id = p_gym_id
    and s.status = 'SCHEDULED'
    and s.starts_at <= now() + interval '15 minutes'
    and s.ends_at >= now()
  order by s.starts_at asc;
end;
$$;

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
          where b.status <> 'CANCELLED' and b.status <> 'WAITLISTED'
        )::int as confirmed_count,
        count(*) filter (where b.status = 'WAITLISTED')::int as waitlist_count
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

-- ---------------------------------------------------------------------------
-- class_session_results.kind
-- ---------------------------------------------------------------------------
alter table public.class_session_results drop constraint if exists class_session_results_kind_check;
update public.class_session_results set kind = upper(kind);
alter table public.class_session_results
  add constraint class_session_results_kind_check check (
    kind in ('AMRAP', 'STRENGTH', 'FOR_TIME', 'OTHER')
  );

-- ---------------------------------------------------------------------------
-- feedback_messages.target
-- ---------------------------------------------------------------------------
alter table public.feedback_messages drop constraint if exists feedback_messages_target_check;
update public.feedback_messages set target = upper(target);
alter table public.feedback_messages alter column target set default 'GYM';
alter table public.feedback_messages
  add constraint feedback_messages_target_check check (
    target in ('GYM', 'AMRAP')
  );

drop policy if exists feedback_select on public.feedback_messages;
create policy feedback_select on public.feedback_messages for
select using (
  private.is_platform_admin ()
  or (
    target = 'GYM'
    and (
      private.has_gym_role (gym_id, array['OWNER'])
      or private.is_provisional_owner_of_gym (gym_id)
    )
  )
);
