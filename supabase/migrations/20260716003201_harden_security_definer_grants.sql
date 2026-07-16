-- Harden SECURITY DEFINER surface + public storage listing.
-- - Pin search_path on storage_gym_id_from_path
-- - Drop broad SELECT on public bucket gym-logos (URL access does not need listing)
-- - Move RLS / storage helpers to private schema (not exposed via PostgREST)
-- - Revoke EXECUTE from PUBLIC + anon on remaining public SECURITY DEFINER RPCs

-- ---------------------------------------------------------------------------
-- 1) search_path on path parser
-- ---------------------------------------------------------------------------

create or replace function public.storage_gym_id_from_path (p_name text)
returns uuid
language plpgsql
immutable
set search_path = public
as $$
declare
  v_part text := nullif (split_part (p_name, '/', 1), '');
begin
  if v_part is null or v_part !~ '^[0-9a-fA-F-]{36}$' then
    return null;
  end if;
  return v_part::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2) Public bucket: no listing policy (objects still readable via public URL)
-- ---------------------------------------------------------------------------

drop policy if exists gym_logos_select on storage.objects;

-- ---------------------------------------------------------------------------
-- 3) private schema for SECURITY DEFINER helpers (not in Data API schemas)
-- ---------------------------------------------------------------------------

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- Move helpers (OID preserved — existing RLS policies keep working)
alter function public.is_platform_admin () set schema private;
alter function public.user_gym_ids () set schema private;
alter function public.has_gym_role (uuid, text[]) set schema private;
alter function public.can_manage_gym (uuid) set schema private;
alter function public.is_provisional_owner_of_gym (uuid) set schema private;
alter function public.user_in_organization (uuid) set schema private;
alter function public.user_can_manage_organization (uuid) set schema private;
alter function public.person_owned_by_me (uuid) set schema private;
alter function public.staff_can_view_person (uuid) set schema private;
alter function public.staff_can_manage_person (uuid) set schema private;
alter function public.storage_gym_id_from_path (text) set schema private;
alter function public.can_manage_gym_branding_storage (text) set schema private;
alter function public.enforce_branch_assignment_same_gym () set schema private;

-- Fix internal references after the move
create or replace function private.can_manage_gym (p_gym_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select private.has_gym_role (p_gym_id, array['OWNER', 'STAFF']);
$$;

create or replace function private.can_manage_gym_branding_storage (p_object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select
    private.is_platform_admin ()
    or private.has_gym_role (
      private.storage_gym_id_from_path (p_object_name),
      array['OWNER']
    )
    or private.is_provisional_owner_of_gym (
      private.storage_gym_id_from_path (p_object_name)
    );
$$;

revoke all on all functions in schema private from public;
revoke all on all functions in schema private from anon;
grant execute on all functions in schema private to authenticated;
grant execute on all functions in schema private to service_role;

-- Trigger helper must not be callable via RPC
revoke all on function private.enforce_branch_assignment_same_gym () from public;
revoke all on function private.enforce_branch_assignment_same_gym () from anon;
revoke all on function private.enforce_branch_assignment_same_gym () from authenticated;

-- Path parser is only used inside other DEFINER functions
revoke all on function private.storage_gym_id_from_path (text) from public;
revoke all on function private.storage_gym_id_from_path (text) from anon;
revoke all on function private.storage_gym_id_from_path (text) from authenticated;

-- ---------------------------------------------------------------------------
-- 4) Public RPCs: point at private helpers + lock down EXECUTE
-- ---------------------------------------------------------------------------

create or replace function public.update_gym_branding (
  p_gym_id uuid,
  p_theme_light jsonb default null,
  p_theme_dark jsonb default null,
  p_logo_url_light text default null,
  p_logo_url_dark text default null,
  p_clear_logo_light boolean default false,
  p_clear_logo_dark boolean default false
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

  if not (
    private.is_platform_admin ()
    or private.has_gym_role (p_gym_id, array['OWNER'])
    or private.is_provisional_owner_of_gym (p_gym_id)
  ) then
    raise exception 'Not allowed';
  end if;

  update public.gyms
  set
    theme_light = coalesce (p_theme_light, theme_light),
    theme_dark = coalesce (p_theme_dark, theme_dark),
    logo_url_light = case
      when p_clear_logo_light then null
      when p_logo_url_light is not null then nullif (trim (p_logo_url_light), '')
      else logo_url_light
    end,
    logo_url_dark = case
      when p_clear_logo_dark then null
      when p_logo_url_dark is not null then nullif (trim (p_logo_url_dark), '')
      else logo_url_dark
    end,
    updated_at = now()
  where
    id = p_gym_id
    and deleted_at is null;

  if not found then
    raise exception 'Gym not found';
  end if;
end;
$$;

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

  return v_check_in_id;
end;
$$;

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
as $$
declare
  v_person_id uuid;
  v_membership_id uuid;
  v_status text;
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

  v_status := case
    when p_expires_at < now() then 'EXPIRED'
    else 'ACTIVE'
  end;

  insert into public.persons (full_name, phone, email)
  values (
    trim (p_full_name),
    nullif (trim (p_phone), ''),
    nullif (trim (lower (p_email)), '')
  )
  returning id into v_person_id;

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

-- Explicit PUBLIC + anon revoke on every public SECURITY DEFINER RPC
-- (Postgres defaults EXECUTE to PUBLIC; prior migrations only revoked some.)

revoke all on function public.update_gym_branding (uuid, jsonb, jsonb, text, text, boolean, boolean) from public;
revoke all on function public.update_gym_branding (uuid, jsonb, jsonb, text, text, boolean, boolean) from anon;
grant execute on function public.update_gym_branding (uuid, jsonb, jsonb, text, text, boolean, boolean) to authenticated;

revoke all on function public.record_check_in (uuid, text, uuid, uuid, text) from public;
revoke all on function public.record_check_in (uuid, text, uuid, uuid, text) from anon;
grant execute on function public.record_check_in (uuid, text, uuid, uuid, text) to authenticated;

revoke all on function public.create_gym_membership (uuid, text, timestamptz, text, text, uuid, uuid) from public;
revoke all on function public.create_gym_membership (uuid, text, timestamptz, text, text, uuid, uuid) from anon;
grant execute on function public.create_gym_membership (uuid, text, timestamptz, text, text, uuid, uuid) to authenticated;

revoke all on function public.register_organization_account (text) from public;
revoke all on function public.register_organization_account (text) from anon;
grant execute on function public.register_organization_account (text) to authenticated;

revoke all on function public.onboarding_save_profile (text, boolean) from public;
revoke all on function public.onboarding_save_profile (text, boolean) from anon;
grant execute on function public.onboarding_save_profile (text, boolean) to authenticated;

revoke all on function public.onboarding_create_gym (text, text, text, text) from public;
revoke all on function public.onboarding_create_gym (text, text, text, text) from anon;
grant execute on function public.onboarding_create_gym (text, text, text, text) to authenticated;

revoke all on function public.onboarding_mark_plans_done () from public;
revoke all on function public.onboarding_mark_plans_done () from anon;
grant execute on function public.onboarding_mark_plans_done () to authenticated;

revoke all on function public.onboarding_complete () from public;
revoke all on function public.onboarding_complete () from anon;
grant execute on function public.onboarding_complete () to authenticated;

revoke all on function public.register_organization (text, text, text, boolean) from public;
revoke all on function public.register_organization (text, text, text, boolean) from anon;
grant execute on function public.register_organization (text, text, text, boolean) to authenticated;

revoke all on function public.register_tenant (text, text) from public;
revoke all on function public.register_tenant (text, text) from anon;
grant execute on function public.register_tenant (text, text) to authenticated;
