-- Onboarding columns + RPCs for DBs that already applied an older 001

alter table public.organizations
add column if not exists pending_as_provisional boolean not null default false;

alter table public.organizations
add column if not exists onboarding_plans_done boolean not null default false;

alter table public.organizations
add column if not exists onboarding_completed_at timestamptz;

-- Functions are defined in 001_initial.sql; re-apply via create or replace
-- by running the same bodies here for upgrade path.

create or replace function public.register_organization_account (p_organization_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_name text;
begin
  if auth.uid () is null then
    raise exception 'Not authenticated';
  end if;

  v_name := nullif (trim (p_organization_name), '');
  if v_name is null then
    raise exception 'Organization name required';
  end if;

  if exists (
    select 1
    from public.organizations o
    where
      o.created_by = auth.uid ()
      and o.deleted_at is null
  ) then
    select o.id into v_org_id
    from public.organizations o
    where
      o.created_by = auth.uid ()
      and o.deleted_at is null
    order by o.created_at asc
    limit 1;
    return v_org_id;
  end if;

  insert into public.organizations (name, plan_tier, created_by)
  values (v_name, 'FREEMIUM', auth.uid ())
  returning id into v_org_id;

  insert into public.persons (user_id, full_name, email)
  values (
    auth.uid (),
    '',
    (select u.email::text from auth.users u where u.id = auth.uid ())
  )
  on conflict (user_id) do update
    set
      email = coalesce (excluded.email, public.persons.email),
      updated_at = now();

  return v_org_id;
end;
$$;

create or replace function public.onboarding_save_profile (
  p_full_name text,
  p_as_provisional_owner boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  if auth.uid () is null then
    raise exception 'Not authenticated';
  end if;

  v_name := nullif (trim (p_full_name), '');
  if v_name is null then
    raise exception 'Full name required';
  end if;

  insert into public.persons (user_id, full_name, email)
  values (
    auth.uid (),
    v_name,
    (select u.email::text from auth.users u where u.id = auth.uid ())
  )
  on conflict (user_id) do update
    set
      full_name = excluded.full_name,
      updated_at = now();

  update public.organizations
  set
    pending_as_provisional = coalesce (p_as_provisional_owner, false),
    updated_at = now()
  where
    created_by = auth.uid ()
    and deleted_at is null;
end;
$$;

create or replace function public.onboarding_create_gym (
  p_gym_name text,
  p_branch_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_gym_id uuid;
  v_branch_id uuid;
  v_gym_name text;
  v_branch_name text;
  v_provisional boolean;
begin
  if auth.uid () is null then
    raise exception 'Not authenticated';
  end if;

  v_gym_name := nullif (trim (p_gym_name), '');
  if v_gym_name is null then
    raise exception 'Gym name required';
  end if;

  v_branch_name := coalesce (nullif (trim (p_branch_name), ''), 'Principal');

  select o.id, o.pending_as_provisional
  into v_org_id, v_provisional
  from public.organizations o
  where
    o.created_by = auth.uid ()
    and o.deleted_at is null
  order by o.created_at asc
  limit 1;

  if v_org_id is null then
    raise exception 'Organization not found';
  end if;

  if exists (
    select 1
    from public.gym_roles gr
    where gr.user_id = auth.uid ()
  ) then
    select gr.gym_id into v_gym_id
    from public.gym_roles gr
    where gr.user_id = auth.uid ()
    limit 1;
    return v_gym_id;
  end if;

  if not exists (
    select 1
    from public.persons p
    where
      p.user_id = auth.uid ()
      and nullif (trim (p.full_name), '') is not null
  ) then
    raise exception 'Complete profile first';
  end if;

  insert into public.gyms (
    organization_id,
    name,
    owner_user_id
  )
  values (
    v_org_id,
    v_gym_name,
    case when v_provisional then null else auth.uid () end
  )
  returning id into v_gym_id;

  insert into public.branches (gym_id, name)
  values (v_gym_id, v_branch_name)
  returning id into v_branch_id;

  if v_provisional then
    insert into public.gym_roles (
      gym_id,
      user_id,
      role,
      is_provisional_owner
    )
    values (
      v_gym_id,
      auth.uid (),
      'STAFF',
      true
    );
  else
    insert into public.gym_roles (gym_id, user_id, role, is_provisional_owner)
    values (
      v_gym_id,
      auth.uid (),
      'OWNER',
      false
    );
  end if;

  insert into public.branch_assignments (branch_id, user_id)
  values (v_branch_id, auth.uid ())
  on conflict do nothing;

  return v_gym_id;
end;
$$;

create or replace function public.onboarding_mark_plans_done ()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid () is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.gym_roles gr where gr.user_id = auth.uid ()
  ) then
    raise exception 'Create a gym first';
  end if;

  update public.organizations
  set
    onboarding_plans_done = true,
    updated_at = now()
  where
    created_by = auth.uid ()
    and deleted_at is null;
end;
$$;

create or replace function public.onboarding_complete ()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid () is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.gym_roles gr where gr.user_id = auth.uid ()
  ) then
    raise exception 'Create a gym first';
  end if;

  update public.organizations
  set
    onboarding_plans_done = true,
    onboarding_completed_at = coalesce (onboarding_completed_at, now()),
    updated_at = now()
  where
    created_by = auth.uid ()
    and deleted_at is null;
end;
$$;

grant
execute on function public.register_organization_account (text) to authenticated;

grant
execute on function public.onboarding_save_profile (text, boolean) to authenticated;

grant
execute on function public.onboarding_create_gym (text, text) to authenticated;

grant
execute on function public.onboarding_mark_plans_done () to authenticated;

grant
execute on function public.onboarding_complete () to authenticated;

-- Allow org creator to read org before gym roles exist (onboarding)
drop policy if exists organizations_select on public.organizations;

create policy organizations_select on public.organizations for
select using (
  public.is_platform_admin ()
  or created_by = auth.uid ()
  or exists (
    select 1
    from public.gyms g
    join public.gym_roles gr on gr.gym_id = g.id
    where
      g.organization_id = organizations.id
      and gr.user_id = auth.uid ()
  )
);
