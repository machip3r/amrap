-- Gym nav visibility: owners choose which ops pages appear in sidebar / mobile nav.

alter table public.gyms
add column if not exists nav_visibility jsonb not null default '{}'::jsonb;

comment on column public.gyms.nav_visibility is
  'Ops chrome prefs. Shape: { "hidden": ["timers", "plans", ...] }. Empty = all role-allowed items shown.';

create or replace function public.update_gym_nav_visibility (
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

  if not (
    private.is_platform_admin ()
    or private.has_gym_role (p_gym_id, array['OWNER'])
    or private.is_provisional_owner_of_gym (p_gym_id)
  ) then
    raise exception 'Not allowed';
  end if;

  if p_nav_visibility is null or jsonb_typeof (p_nav_visibility) <> 'object' then
    raise exception 'Invalid nav_visibility';
  end if;

  update public.gyms
  set
    nav_visibility = p_nav_visibility,
    updated_at = now()
  where
    id = p_gym_id
    and deleted_at is null;

  if not found then
    raise exception 'Gym not found';
  end if;
end;
$$;

revoke all on function public.update_gym_nav_visibility (uuid, jsonb) from public;
revoke all on function public.update_gym_nav_visibility (uuid, jsonb) from anon;
grant execute on function public.update_gym_nav_visibility (uuid, jsonb) to authenticated;
