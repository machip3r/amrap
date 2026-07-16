-- Per-user nav visibility on gym_roles (replaces gym-level gyms.nav_visibility).

alter table public.gym_roles
add column if not exists nav_visibility jsonb not null default '{}'::jsonb;

comment on column public.gym_roles.nav_visibility is
  'Per-user ops chrome prefs for this gym. Shape: { "hidden": ["timers", "plans", ...] }. Empty = show all role-allowed items.';

-- Drop gym-level prefs from the previous migration.
drop function if exists public.update_gym_nav_visibility (uuid, jsonb);

alter table public.gyms
drop column if exists nav_visibility;

create or replace function public.update_my_nav_visibility (
  p_gym_id uuid,
  p_nav_visibility jsonb
)
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

  if p_nav_visibility is null or jsonb_typeof (p_nav_visibility) <> 'object' then
    raise exception 'Invalid nav_visibility';
  end if;

  update public.gym_roles
  set nav_visibility = p_nav_visibility
  where
    gym_id = p_gym_id
    and user_id = auth.uid ()
    and (
      role = 'OWNER'
      or invite_status = 'accepted'
    );

  if not found then
    raise exception 'Not allowed';
  end if;
end;
$$;

revoke all on function public.update_my_nav_visibility (uuid, jsonb) from public;
revoke all on function public.update_my_nav_visibility (uuid, jsonb) from anon;
grant execute on function public.update_my_nav_visibility (uuid, jsonb) to authenticated;
