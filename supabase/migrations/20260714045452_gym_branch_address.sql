-- Physical addresses for gym brand and branch locations.
alter table public.gyms
  add column if not exists address text;

alter table public.branches
  add column if not exists address text;

-- Recreate onboarding gym RPC with optional addresses.
drop function if exists public.onboarding_create_gym (text, text);

create or replace function public.onboarding_create_gym (
  p_gym_name text,
  p_branch_name text default null,
  p_gym_address text default null,
  p_branch_address text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_gym_id uuid;
  v_branch_id uuid;
  v_gym_name text;
  v_branch_name text;
  v_gym_address text;
  v_branch_address text;
  v_provisional boolean;
begin
  if auth.uid () is null then
    raise exception 'Not authenticated';
  end if;

  v_gym_name := nullif (trim (p_gym_name), '');
  if v_gym_name is null then
    raise exception 'Gym name required';
  end if;

  v_branch_name := coalesce (nullif (trim (p_branch_name), ''), 'Principal');
  v_gym_address := nullif (trim (p_gym_address), '');
  v_branch_address := nullif (trim (p_branch_address), '');

  select o.id, o.pending_as_provisional
  into v_org_id, v_provisional
  from public.organizations o
  where
    o.created_by = auth.uid ()
    and o.deleted_at is null
  order by o.created_at asc
  limit 1;

  if v_org_id is null then
    raise exception 'Organization not found';
  end if;

  if exists (
    select 1
    from public.gym_roles gr
    where gr.user_id = auth.uid ()
  ) then
    select gr.gym_id into v_gym_id
    from public.gym_roles gr
    where gr.user_id = auth.uid ()
    limit 1;
    return v_gym_id;
  end if;

  if not exists (
    select 1
    from public.persons p
    where
      p.user_id = auth.uid ()
      and nullif (trim (p.full_name), '') is not null
  ) then
    raise exception 'Complete profile first';
  end if;

  insert into public.gyms (
    organization_id,
    name,
    address,
    owner_user_id
  )
  values (
    v_org_id,
    v_gym_name,
    v_gym_address,
    case when v_provisional then null else auth.uid () end
  )
  returning id into v_gym_id;

  insert into public.branches (gym_id, name, address)
  values (v_gym_id, v_branch_name, v_branch_address)
  returning id into v_branch_id;

  if v_provisional then
    insert into public.gym_roles (
      gym_id,
      user_id,
      role,
      is_provisional_owner
    )
    values (
      v_gym_id,
      auth.uid (),
      'STAFF',
      true
    );
  else
    insert into public.gym_roles (gym_id, user_id, role, is_provisional_owner)
    values (
      v_gym_id,
      auth.uid (),
      'OWNER',
      false
    );
  end if;

  insert into public.branch_assignments (branch_id, user_id)
  values (v_branch_id, auth.uid ())
  on conflict do nothing;

  return v_gym_id;
end;
$$;

revoke all on function public.onboarding_create_gym (text, text, text, text) from public;
grant execute on function public.onboarding_create_gym (text, text, text, text) to authenticated;
