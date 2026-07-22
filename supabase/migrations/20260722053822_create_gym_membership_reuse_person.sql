-- Reuse global `persons` by email when adding a membership at another gym
-- (multi-gym). Unique email stays; we no longer insert a duplicate person.

create or replace function public.create_gym_membership (
  p_gym_id uuid,
  p_full_name text,
  p_expires_at timestamptz,
  p_phone text default null,
  p_email text default null,
  p_branch_id uuid default null,
  p_plan_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_person_id uuid;
  v_membership_id uuid;
  v_status text;
  v_email text;
  v_phone text;
  v_name text;
begin
  if auth.uid () is null then
    raise exception 'Not authenticated';
  end if;

  if not private.can_manage_gym (p_gym_id) then
    raise exception 'Not allowed';
  end if;

  if p_branch_id is not null and not exists (
    select 1 from public.branches b
    where b.id = p_branch_id and b.gym_id = p_gym_id
  ) then
    raise exception 'Invalid branch';
  end if;

  v_name := nullif (btrim (p_full_name), '');
  if v_name is null then
    raise exception 'Full name is required';
  end if;

  v_email := nullif (lower (btrim (coalesce (p_email, ''))), '');
  v_phone := nullif (btrim (coalesce (p_phone, '')), '');

  v_status := case
    when p_expires_at < now() then 'EXPIRED'
    else 'ACTIVE'
  end;

  -- Prefer existing person by email (platform-wide identity).
  if v_email is not null then
    select p.id
    into v_person_id
    from public.persons p
    where p.email is not null
      and lower (p.email) = v_email
    order by (p.user_id is not null) desc, p.created_at asc
    limit 1;
  end if;

  if v_person_id is not null then
    if exists (
      select 1
      from public.memberships m
      where
        m.gym_id = p_gym_id
        and m.person_id = v_person_id
    ) then
      raise exception 'Person already has membership at this gym'
        using errcode = 'unique_violation';
    end if;

    -- Fill blank contact fields only; never overwrite claimed identity contact.
    update public.persons p
    set
      phone = case
        when p.phone is null and v_phone is not null then v_phone
        else p.phone
      end,
      full_name = case
        when p.user_id is null
        and v_name is not null
        and btrim (p.full_name) is distinct from v_name then v_name
        else p.full_name
      end
    where p.id = v_person_id;
  else
    insert into public.persons (full_name, phone, email)
    values (v_name, v_phone, v_email)
    returning id into v_person_id;
  end if;

  insert into public.memberships (
    gym_id,
    branch_id,
    person_id,
    plan_id,
    status,
    expires_at
  )
  values (
    p_gym_id,
    p_branch_id,
    v_person_id,
    p_plan_id,
    v_status,
    p_expires_at
  )
  returning id into v_membership_id;

  return v_membership_id;
end;
$$;

comment on function public.create_gym_membership (
  uuid,
  text,
  timestamptz,
  text,
  text,
  uuid,
  uuid
) is
  'Creates membership at gym. Reuses persons row when email already exists (multi-gym); otherwise inserts a new person.';

revoke all on function public.create_gym_membership (uuid, text, timestamptz, text, text, uuid, uuid) from public;
revoke all on function public.create_gym_membership (uuid, text, timestamptz, text, text, uuid, uuid) from anon;
grant execute on function public.create_gym_membership (uuid, text, timestamptz, text, text, uuid, uuid) to authenticated;
grant execute on function public.create_gym_membership (uuid, text, timestamptz, text, text, uuid, uuid) to service_role;
