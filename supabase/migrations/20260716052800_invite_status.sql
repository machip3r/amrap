-- Invite accept/decline status for staff/trainer (gym_roles) and members (memberships).

alter table public.gym_roles
  add column if not exists invite_status text not null default 'accepted',
  add column if not exists invite_responded_at timestamptz;

alter table public.gym_roles
  drop constraint if exists gym_roles_invite_status_check;

alter table public.gym_roles
  add constraint gym_roles_invite_status_check check (
    invite_status in ('pending', 'accepted', 'cancelled')
  );

alter table public.memberships
  add column if not exists invite_status text not null default 'accepted',
  add column if not exists invite_responded_at timestamptz;

alter table public.memberships
  drop constraint if exists memberships_invite_status_check;

alter table public.memberships
  add constraint memberships_invite_status_check check (
    invite_status in ('pending', 'accepted', 'cancelled')
  );

-- Existing rows are already active accounts
update public.gym_roles
set invite_status = 'accepted'
where invite_status is distinct from 'accepted';

update public.memberships
set invite_status = 'accepted'
where invite_status is distinct from 'accepted';

create index if not exists gym_roles_gym_invite_status_idx
  on public.gym_roles (gym_id, invite_status);

create index if not exists memberships_gym_invite_status_idx
  on public.memberships (gym_id, invite_status);

comment on column public.gym_roles.invite_status is 'pending | accepted | cancelled — invitee journey for STAFF/TRAINER';
comment on column public.gym_roles.invite_responded_at is 'When invitee accepted or declined';
comment on column public.memberships.invite_status is 'pending | accepted | cancelled — member claim invite';
comment on column public.memberships.invite_responded_at is 'When member accepted or declined account invite';

-- Ops RLS helpers: pending/cancelled invitees must not count as gym staff.
create or replace function private.has_gym_role (p_gym_id uuid, p_roles text[] default null)
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
        gr.role = 'OWNER'
        or gr.invite_status = 'accepted'
      )
      and (
        p_roles is null
        or gr.role = any (p_roles)
        or gr.is_provisional_owner = true
      )
  );
$$;

create or replace function private.user_gym_ids ()
returns setof uuid
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select gr.gym_id
  from public.gym_roles gr
  where
    gr.user_id = auth.uid ()
    and (
      gr.role = 'OWNER'
      or gr.invite_status = 'accepted'
    );
$$;

-- Invitee may accept/decline their own pending row (app may also use service role).
drop policy if exists gym_roles_respond_invite on public.gym_roles;
create policy gym_roles_respond_invite on public.gym_roles for
update using (
  user_id = auth.uid ()
  and invite_status = 'pending'
)
with
  check (
    user_id = auth.uid ()
    and invite_status in ('accepted', 'cancelled')
  );

drop policy if exists memberships_respond_invite on public.memberships;
create policy memberships_respond_invite on public.memberships for
update using (
  private.person_owned_by_me (person_id)
  and invite_status = 'pending'
)
with
  check (
    private.person_owned_by_me (person_id)
    and invite_status in ('accepted', 'cancelled')
  );
