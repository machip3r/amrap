-- Fix infinite RLS recursion between gym_roles, organizations, persons, memberships.
-- Policies must not query the same (or mutually dependent) tables under RLS;
-- use SECURITY DEFINER helpers with row_security = off instead.

-- ---------------------------------------------------------------------------
-- Helpers (recreate with row_security off)
-- ---------------------------------------------------------------------------

create or replace function public.is_platform_admin ()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1 from public.platform_admins pa where pa.user_id = auth.uid ()
  );
$$;

create or replace function public.user_gym_ids ()
returns setof uuid
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select gr.gym_id
  from public.gym_roles gr
  where gr.user_id = auth.uid ();
$$;

create or replace function public.has_gym_role (p_gym_id uuid, p_roles text[] default null)
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
        p_roles is null
        or gr.role = any (p_roles)
        or gr.is_provisional_owner = true
      )
  );
$$;

create or replace function public.can_manage_gym (p_gym_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select public.has_gym_role (p_gym_id, array['OWNER', 'STAFF']);
$$;

create or replace function public.is_provisional_owner_of_gym (p_gym_id uuid)
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
      and gr.is_provisional_owner = true
  );
$$;

create or replace function public.user_in_organization (p_org_id uuid)
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
    join public.gym_roles gr on gr.gym_id = g.id
    where
      g.organization_id = p_org_id
      and gr.user_id = auth.uid ()
  );
$$;

create or replace function public.user_can_manage_organization (p_org_id uuid)
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
    join public.gym_roles gr on gr.gym_id = g.id
    where
      g.organization_id = p_org_id
      and gr.user_id = auth.uid ()
      and (
        gr.role = 'OWNER'
        or gr.is_provisional_owner = true
      )
  );
$$;

create or replace function public.person_owned_by_me (p_person_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.persons p
    where
      p.id = p_person_id
      and p.user_id = auth.uid ()
  );
$$;

create or replace function public.staff_can_view_person (p_person_id uuid)
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
    join public.gym_roles gr on gr.gym_id = m.gym_id
    where
      m.person_id = p_person_id
      and gr.user_id = auth.uid ()
  );
$$;

create or replace function public.staff_can_manage_person (p_person_id uuid)
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
    join public.gym_roles gr on gr.gym_id = m.gym_id
    where
      m.person_id = p_person_id
      and gr.user_id = auth.uid ()
      and (
        gr.role in ('OWNER', 'STAFF')
        or gr.is_provisional_owner = true
      )
  );
$$;

revoke all on function public.is_provisional_owner_of_gym (uuid) from public;
revoke all on function public.user_in_organization (uuid) from public;
revoke all on function public.user_can_manage_organization (uuid) from public;
revoke all on function public.person_owned_by_me (uuid) from public;
revoke all on function public.staff_can_view_person (uuid) from public;
revoke all on function public.staff_can_manage_person (uuid) from public;

grant execute on function public.is_provisional_owner_of_gym (uuid) to authenticated;
grant execute on function public.user_in_organization (uuid) to authenticated;
grant execute on function public.user_can_manage_organization (uuid) to authenticated;
grant execute on function public.person_owned_by_me (uuid) to authenticated;
grant execute on function public.staff_can_view_person (uuid) to authenticated;
grant execute on function public.staff_can_manage_person (uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------

drop policy if exists gym_roles_select on public.gym_roles;
create policy gym_roles_select on public.gym_roles for
select using (
  user_id = auth.uid ()
  or public.is_platform_admin ()
  or public.has_gym_role (gym_id)
);

drop policy if exists gym_roles_manage on public.gym_roles;
create policy gym_roles_manage on public.gym_roles for all using (
  public.is_platform_admin ()
  or public.has_gym_role (gym_id, array['OWNER'])
  or public.is_provisional_owner_of_gym (gym_id)
)
with
  check (
    public.is_platform_admin ()
    or public.has_gym_role (gym_id, array['OWNER'])
    or public.is_provisional_owner_of_gym (gym_id)
  );

drop policy if exists organizations_select on public.organizations;
create policy organizations_select on public.organizations for
select using (
  public.is_platform_admin ()
  or created_by = auth.uid ()
  or public.user_in_organization (id)
);

drop policy if exists organizations_update on public.organizations;
create policy organizations_update on public.organizations for
update using (
  public.is_platform_admin ()
  or public.user_can_manage_organization (id)
);

drop policy if exists persons_select on public.persons;
create policy persons_select on public.persons for
select using (
  user_id = auth.uid ()
  or public.is_platform_admin ()
  or public.staff_can_view_person (id)
);

drop policy if exists persons_update on public.persons;
create policy persons_update on public.persons for
update using (
  user_id = auth.uid ()
  or public.is_platform_admin ()
  or public.staff_can_manage_person (id)
);

drop policy if exists memberships_all on public.memberships;
create policy memberships_all on public.memberships for all using (
  public.is_platform_admin ()
  or public.has_gym_role (gym_id)
  or public.person_owned_by_me (person_id)
)
with
  check (
    public.is_platform_admin ()
    or public.can_manage_gym (gym_id)
  );

drop policy if exists gyms_update on public.gyms;
create policy gyms_update on public.gyms for
update using (
  public.is_platform_admin ()
  or public.has_gym_role (id, array['OWNER'])
  or public.is_provisional_owner_of_gym (id)
);

drop policy if exists check_ins_all on public.check_ins;
create policy check_ins_all on public.check_ins for all using (
  public.is_platform_admin ()
  or public.has_gym_role (gym_id)
  or public.person_owned_by_me (person_id)
)
with
  check (
    public.is_platform_admin ()
    or public.can_manage_gym (gym_id)
    or public.has_gym_role (gym_id, array['TRAINER'])
  );
