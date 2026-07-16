-- Allow gym staff/owners to read person profiles of teammates (other gym_roles
-- at shared gyms), not only members with memberships. Fixes trainer/staff lists
-- showing UUID stubs and null emails under RLS.

create or replace function private.staff_can_view_person (p_person_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    -- Gym member profile at a gym where the caller has any role
    select 1
    from public.memberships m
    join public.gym_roles gr on gr.gym_id = m.gym_id
    where
      m.person_id = p_person_id
      and gr.user_id = auth.uid ()
  )
  or exists (
    -- Teammate profile: person.user_id shares a gym via gym_roles
    select 1
    from public.persons p
    join public.gym_roles peer on peer.user_id = p.user_id
    join public.gym_roles me on me.gym_id = peer.gym_id
    where
      p.id = p_person_id
      and p.user_id is not null
      and me.user_id = auth.uid ()
  );
$$;

revoke all on function private.staff_can_view_person (uuid) from public;
revoke all on function private.staff_can_view_person (uuid) from anon;
grant execute on function private.staff_can_view_person (uuid) to authenticated;
grant execute on function private.staff_can_view_person (uuid) to service_role;
