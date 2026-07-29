-- Members can browse active plans at gyms where they have a membership.

drop policy if exists plans_select_member on public.plans;
create policy plans_select_member on public.plans for
select using (
  private.is_platform_admin ()
  or private.has_gym_role (gym_id)
  or exists (
    select 1
    from public.memberships m
    join public.persons p on p.id = m.person_id
    where
      m.gym_id = plans.gym_id
      and p.user_id = auth.uid ()
      and m.invite_status = 'ACCEPTED'
  )
);

comment on policy plans_select_member on public.plans is
  'Gym staff or members with an accepted membership at the gym can SELECT plans (catalog).';
