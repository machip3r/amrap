-- Members must be able to SELECT their gym (name, branding) for /me and
-- post-auth routing. Previously gyms_select only allowed gym_roles, so
-- membership embeds of gyms came back null and getMemberContext treated
-- the user as having no gym → /no-access after invite/welcome.

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
      and m.invite_status in ('pending', 'accepted')
  );
$$;

comment on function private.has_linked_membership_at_gym (uuid) is
  'True when the signed-in person has a pending or accepted membership at the gym (for gyms SELECT).';

revoke all on function private.has_linked_membership_at_gym (uuid) from public;
revoke all on function private.has_linked_membership_at_gym (uuid) from anon;
grant execute on function private.has_linked_membership_at_gym (uuid) to authenticated;
grant execute on function private.has_linked_membership_at_gym (uuid) to service_role;

drop policy if exists gyms_select on public.gyms;

create policy gyms_select on public.gyms for
select using (
  private.is_platform_admin ()
  or private.has_gym_role (id)
  or private.has_linked_membership_at_gym (id)
);
