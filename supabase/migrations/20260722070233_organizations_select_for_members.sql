-- Members need organization.plan_tier (white-label gating) when they have a
-- membership at any gym in the org. Without this, gyms.organizations embed
-- is null and /me stays on AMRAP branding for Starter+ gyms.

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
      and m.invite_status in ('pending', 'accepted')
  );
$$;

comment on function private.has_membership_in_organization (uuid) is
  'True when the signed-in person has a pending or accepted membership at a gym in the organization.';

revoke all on function private.has_membership_in_organization (uuid) from public;
revoke all on function private.has_membership_in_organization (uuid) from anon;
grant execute on function private.has_membership_in_organization (uuid) to authenticated;
grant execute on function private.has_membership_in_organization (uuid) to service_role;

drop policy if exists organizations_select on public.organizations;

create policy organizations_select on public.organizations for
select using (
  private.is_platform_admin ()
  or created_by = auth.uid ()
  or private.user_in_organization (id)
  or private.has_membership_in_organization (id)
);
