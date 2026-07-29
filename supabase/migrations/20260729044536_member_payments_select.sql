-- Members can read their own payment history (via membership → person).

drop policy if exists payments_select_own on public.payments;
create policy payments_select_own on public.payments for
select using (
  private.is_platform_admin ()
  or private.has_gym_role (gym_id)
  or exists (
    select 1
    from public.memberships m
    join public.persons p on p.id = m.person_id
    where
      m.id = payments.membership_id
      and p.user_id = auth.uid ()
  )
);

comment on policy payments_select_own on public.payments is
  'Gym staff (via has_gym_role) or the member who owns the membership can SELECT payments.';
