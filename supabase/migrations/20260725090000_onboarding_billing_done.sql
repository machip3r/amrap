-- Optional AMRAP subscription step during owner onboarding.

alter table public.organizations
  add column if not exists onboarding_billing_done boolean not null default false;

comment on column public.organizations.onboarding_billing_done is
  'True after owner skips or completes the optional AMRAP plan step in onboarding.';

-- Existing completed orgs should not re-enter the billing step if they resume mid-setup edge cases.
update public.organizations
set onboarding_billing_done = true
where onboarding_completed_at is not null
  and onboarding_billing_done = false;

create or replace function public.onboarding_mark_billing_done ()
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
    onboarding_billing_done = true,
    updated_at = now()
  where
    created_by = auth.uid ()
    and deleted_at is null;
end;
$$;

revoke all on function public.onboarding_mark_billing_done () from public;
revoke all on function public.onboarding_mark_billing_done () from anon;
grant execute on function public.onboarding_mark_billing_done () to authenticated;
grant execute on function public.onboarding_mark_billing_done () to service_role;

-- Keep finish path consistent: completing onboarding implies billing step resolved.
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
    onboarding_billing_done = true,
    onboarding_completed_at = coalesce (onboarding_completed_at, now()),
    updated_at = now()
  where
    created_by = auth.uid ()
    and deleted_at is null;

  update public.persons
  set
    profile_completed_at = coalesce (profile_completed_at, now()),
    updated_at = now()
  where
    user_id = auth.uid ();
end;
$$;

revoke all on function public.onboarding_complete () from public;
revoke all on function public.onboarding_complete () from anon;
grant execute on function public.onboarding_complete () to authenticated;
grant execute on function public.onboarding_complete () to service_role;
