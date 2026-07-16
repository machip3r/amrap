-- Profile fields for invite / role onboarding (staff, trainer, member).

alter table public.persons
  add column if not exists date_of_birth date,
  add column if not exists sex text,
  add column if not exists height_cm numeric(5, 1),
  add column if not exists weight_kg numeric(5, 1),
  add column if not exists profile_completed_at timestamptz;

alter table public.persons
  drop constraint if exists persons_sex_check;

alter table public.persons
  add constraint persons_sex_check check (
    sex is null
    or sex in ('male', 'female', 'other', 'prefer_not')
  );

alter table public.persons
  drop constraint if exists persons_height_cm_check;

alter table public.persons
  add constraint persons_height_cm_check check (
    height_cm is null
    or (height_cm >= 50 and height_cm <= 250)
  );

alter table public.persons
  drop constraint if exists persons_weight_kg_check;

alter table public.persons
  add constraint persons_weight_kg_check check (
    weight_kg is null
    or (weight_kg >= 20 and weight_kg <= 400)
  );

comment on column public.persons.date_of_birth is 'Optional DOB; required to complete invite profile for staff/trainer/member';
comment on column public.persons.sex is 'Member profile: male | female | other | prefer_not';
comment on column public.persons.height_cm is 'Member profile height in centimeters';
comment on column public.persons.weight_kg is 'Member profile weight in kilograms';
comment on column public.persons.profile_completed_at is 'Set when invite /welcome finishes; also stamped by onboarding_complete() for owners';

-- Existing org creators who already finished owner onboarding skip /welcome
update public.persons p
set
  profile_completed_at = coalesce(p.profile_completed_at, now()),
  updated_at = now()
from public.organizations o
where
  o.created_by = p.user_id
  and o.onboarding_completed_at is not null
  and o.deleted_at is null
  and p.user_id is not null;

-- Stamp person profile complete when owner finishes org onboarding
create or replace function public.onboarding_complete ()
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
