-- AMRAP MVP schema: Organization → Gym → Branch
-- Multi-role users, global person + QR, gym-scoped operations.
-- Fresh install / reset required if an older 001 was already applied.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums (text + check for simpler client mapping)
-- ---------------------------------------------------------------------------

-- organizations.plan_tier: FREEMIUM | STARTER | GROWTH | PRO
-- gym_roles.role: OWNER | STAFF | TRAINER
-- memberships.status: ACTIVE | INACTIVE | EXPIRED | CANCELLED
-- payments.method: CASH | TRANSFER | CARD | OTHER
-- check_ins.source: QR | MANUAL | KIOSK

-- ---------------------------------------------------------------------------
-- Core identity (QR is unique across the platform)
-- ---------------------------------------------------------------------------

create table public.persons (
  id uuid primary key default gen_random_uuid (),
  user_id uuid unique references auth.users (id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  qr_code text not null unique default gen_random_uuid ()::text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index persons_user_id_idx on public.persons (user_id);

create index persons_email_idx on public.persons (email)
where
  email is not null;

create index persons_phone_idx on public.persons (phone)
where
  phone is not null;

create index persons_qr_code_idx on public.persons (qr_code);

-- ---------------------------------------------------------------------------
-- Billing account (pays AMRAP)
-- ---------------------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid (),
  name text not null,
  plan_tier text not null default 'FREEMIUM' check (
    plan_tier in ('FREEMIUM', 'STARTER', 'GROWTH', 'PRO')
  ),
  created_by uuid references auth.users (id) on delete set null,
  pending_as_provisional boolean not null default false,
  onboarding_plans_done boolean not null default false,
  onboarding_completed_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index organizations_created_by_idx on public.organizations (created_by);

-- ---------------------------------------------------------------------------
-- Gyms & branches
-- ---------------------------------------------------------------------------

create table public.gyms (
  id uuid primary key default gen_random_uuid (),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  owner_user_id uuid references auth.users (id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index gyms_organization_id_idx on public.gyms (organization_id);

create index gyms_owner_user_id_idx on public.gyms (owner_user_id);

create table public.branches (
  id uuid primary key default gen_random_uuid (),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index branches_gym_id_idx on public.branches (gym_id);

-- ---------------------------------------------------------------------------
-- Staff / owner / trainer roles (contextual; one user → many gyms)
-- ---------------------------------------------------------------------------

create table public.gym_roles (
  id uuid primary key default gen_random_uuid (),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('OWNER', 'STAFF', 'TRAINER')),
  is_provisional_owner boolean not null default false,
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (gym_id, user_id)
);

create index gym_roles_user_id_idx on public.gym_roles (user_id);

create index gym_roles_gym_id_idx on public.gym_roles (gym_id);

-- At most one OWNER role per gym
create unique index gym_roles_one_owner_idx on public.gym_roles (gym_id)
where
  role = 'OWNER';

-- At most one provisional owner per gym
create unique index gym_roles_one_provisional_idx on public.gym_roles (gym_id)
where
  is_provisional_owner = true;

-- Staff ↔ branches (same gym only; enforced in app + trigger below)
create table public.branch_assignments (
  id uuid primary key default gen_random_uuid (),
  branch_id uuid not null references public.branches (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (branch_id, user_id)
);

create index branch_assignments_user_id_idx on public.branch_assignments (user_id);

create or replace function public.enforce_branch_assignment_same_gym ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gym_id uuid;
begin
  select b.gym_id into v_gym_id from public.branches b where b.id = new.branch_id;
  if v_gym_id is null then
    raise exception 'Branch not found';
  end if;
  if not exists (
    select 1 from public.gym_roles gr
    where gr.gym_id = v_gym_id and gr.user_id = new.user_id
  ) then
    raise exception 'User has no role at this gym';
  end if;
  return new;
end;
$$;

create trigger branch_assignments_same_gym
before insert or update on public.branch_assignments
for each row
execute function public.enforce_branch_assignment_same_gym ();

-- ---------------------------------------------------------------------------
-- Plans (gym-wide or per branch)
-- ---------------------------------------------------------------------------

create table public.plans (
  id uuid primary key default gen_random_uuid (),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  branch_id uuid references public.branches (id) on delete cascade,
  name text not null,
  price numeric(12, 2) not null check (price >= 0),
  duration_days int not null check (duration_days > 0),
  created_at timestamptz not null default now()
);

create index plans_gym_id_idx on public.plans (gym_id);

create index plans_branch_id_idx on public.plans (branch_id);

-- ---------------------------------------------------------------------------
-- Client memberships (person may train at many gyms)
-- ---------------------------------------------------------------------------

create table public.memberships (
  id uuid primary key default gen_random_uuid (),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  branch_id uuid references public.branches (id) on delete set null,
  person_id uuid not null references public.persons (id) on delete cascade,
  plan_id uuid references public.plans (id) on delete set null,
  status text not null default 'ACTIVE' check (
    status in ('ACTIVE', 'INACTIVE', 'EXPIRED', 'CANCELLED')
  ),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gym_id, person_id)
);

create index memberships_gym_id_idx on public.memberships (gym_id);

create index memberships_person_id_idx on public.memberships (person_id);

create index memberships_expires_at_idx on public.memberships (expires_at);

-- ---------------------------------------------------------------------------
-- Payments & check-ins
-- ---------------------------------------------------------------------------

create table public.payments (
  id uuid primary key default gen_random_uuid (),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  membership_id uuid not null references public.memberships (id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  method text not null check (
    method in ('CASH', 'TRANSFER', 'CARD', 'OTHER')
  ),
  recorded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index payments_gym_id_idx on public.payments (gym_id);

create index payments_membership_id_idx on public.payments (membership_id);

create index payments_created_at_idx on public.payments (created_at);

create table public.check_ins (
  id uuid primary key default gen_random_uuid (),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  branch_id uuid references public.branches (id) on delete set null,
  membership_id uuid not null references public.memberships (id) on delete cascade,
  person_id uuid not null references public.persons (id) on delete cascade,
  source text not null default 'QR' check (source in ('QR', 'MANUAL', 'KIOSK')),
  checked_in_at timestamptz not null default now(),
  session_expires_at timestamptz not null,
  recorded_by uuid references auth.users (id) on delete set null
);

create index check_ins_gym_id_idx on public.check_ins (gym_id);

create index check_ins_person_id_idx on public.check_ins (person_id);

create index check_ins_checked_in_at_idx on public.check_ins (checked_in_at);

create index check_ins_active_session_idx on public.check_ins (person_id, session_expires_at);

-- ---------------------------------------------------------------------------
-- Feedback inbox (MVP: internal text only)
-- ---------------------------------------------------------------------------

create table public.feedback_messages (
  id uuid primary key default gen_random_uuid (),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  author_person_id uuid references public.persons (id) on delete set null,
  created_at timestamptz not null default now()
);

create index feedback_messages_gym_id_idx on public.feedback_messages (gym_id);

-- ---------------------------------------------------------------------------
-- Platform operators (AMRAP admin app)
-- ---------------------------------------------------------------------------

create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'OWNER' check (role in ('OWNER', 'SUPPORT', 'SALES', 'BILLING')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS helpers (security definer; locked down)
-- ---------------------------------------------------------------------------

create or replace function public.is_platform_admin ()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.platform_admins pa where pa.user_id = auth.uid ()
  );
$$;

create or replace function public.user_gym_ids ()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select gr.gym_id
  from public.gym_roles gr
  where gr.user_id = auth.uid ();
$$;

create or replace function public.has_gym_role (p_gym_id uuid, p_roles text[] default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.gym_roles gr
    where
      gr.gym_id = p_gym_id
      and gr.user_id = auth.uid ()
      and (
        p_roles is null
        or gr.role = any (p_roles)
        or gr.is_provisional_owner = true
      )
  );
$$;

create or replace function public.can_manage_gym (p_gym_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_gym_role (p_gym_id, array['OWNER', 'STAFF']);
$$;

revoke all on function public.is_platform_admin () from public;

revoke all on function public.user_gym_ids () from public;

revoke all on function public.has_gym_role (uuid, text[]) from public;

revoke all on function public.can_manage_gym (uuid) from public;

grant
execute on function public.is_platform_admin () to authenticated;

grant
execute on function public.user_gym_ids () to authenticated;

grant
execute on function public.has_gym_role (uuid, text[]) to authenticated;

grant
execute on function public.can_manage_gym (uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Signup: organization + person only (gym comes in onboarding)
-- ---------------------------------------------------------------------------

create or replace function public.register_organization_account (p_organization_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_name text;
begin
  if auth.uid () is null then
    raise exception 'Not authenticated';
  end if;

  v_name := nullif (trim (p_organization_name), '');
  if v_name is null then
    raise exception 'Organization name required';
  end if;

  if exists (
    select 1
    from public.organizations o
    where
      o.created_by = auth.uid ()
      and o.deleted_at is null
  ) then
    select o.id into v_org_id
    from public.organizations o
    where
      o.created_by = auth.uid ()
      and o.deleted_at is null
    order by o.created_at asc
    limit 1;
    return v_org_id;
  end if;

  insert into public.organizations (name, plan_tier, created_by)
  values (v_name, 'FREEMIUM', auth.uid ())
  returning id into v_org_id;

  insert into public.persons (user_id, full_name, email)
  values (
    auth.uid (),
    '',
    (select u.email::text from auth.users u where u.id = auth.uid ())
  )
  on conflict (user_id) do update
    set
      email = coalesce (excluded.email, public.persons.email),
      updated_at = now();

  return v_org_id;
end;
$$;

create or replace function public.onboarding_save_profile (
  p_full_name text,
  p_as_provisional_owner boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  if auth.uid () is null then
    raise exception 'Not authenticated';
  end if;

  v_name := nullif (trim (p_full_name), '');
  if v_name is null then
    raise exception 'Full name required';
  end if;

  insert into public.persons (user_id, full_name, email)
  values (
    auth.uid (),
    v_name,
    (select u.email::text from auth.users u where u.id = auth.uid ())
  )
  on conflict (user_id) do update
    set
      full_name = excluded.full_name,
      updated_at = now();

  update public.organizations
  set
    pending_as_provisional = coalesce (p_as_provisional_owner, false),
    updated_at = now()
  where
    created_by = auth.uid ()
    and deleted_at is null;
end;
$$;

create or replace function public.onboarding_create_gym (
  p_gym_name text,
  p_branch_name text default null
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
    owner_user_id
  )
  values (
    v_org_id,
    v_gym_name,
    case when v_provisional then null else auth.uid () end
  )
  returning id into v_gym_id;

  insert into public.branches (gym_id, name)
  values (v_gym_id, v_branch_name)
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

create or replace function public.onboarding_mark_plans_done ()
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
    updated_at = now()
  where
    created_by = auth.uid ()
    and deleted_at is null;
end;
$$;

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
    onboarding_completed_at = coalesce (onboarding_completed_at, now()),
    updated_at = now()
  where
    created_by = auth.uid ()
    and deleted_at is null;
end;
$$;

-- Legacy wrappers
create or replace function public.register_organization (
  p_organization_name text,
  p_gym_name text default null,
  p_full_name text default null,
  p_as_provisional_owner boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gym_id uuid;
begin
  perform public.register_organization_account (p_organization_name);
  perform public.onboarding_save_profile (
    coalesce (nullif (trim (p_full_name), ''), 'Owner'),
    p_as_provisional_owner
  );
  v_gym_id := public.onboarding_create_gym (
    coalesce (nullif (trim (p_gym_name), ''), p_organization_name),
    'Principal'
  );
  perform public.onboarding_complete ();
  return v_gym_id;
end;
$$;

create or replace function public.register_tenant (
  p_tenant_name text,
  p_full_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.register_organization (
    p_tenant_name,
    p_tenant_name,
    p_full_name,
    false
  );
end;
$$;

grant usage on schema public to anon, authenticated;

grant
execute on function public.register_organization_account (text) to authenticated;

grant
execute on function public.onboarding_save_profile (text, boolean) to authenticated;

grant
execute on function public.onboarding_create_gym (text, text) to authenticated;

grant
execute on function public.onboarding_mark_plans_done () to authenticated;

grant
execute on function public.onboarding_complete () to authenticated;

grant
execute on function public.register_organization (text, text, text, boolean) to authenticated;

grant
execute on function public.register_tenant (text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Check-in helper: enforce 4h anti-share + session expiry
-- ---------------------------------------------------------------------------

create or replace function public.record_check_in (
  p_gym_id uuid,
  p_qr_code text default null,
  p_membership_id uuid default null,
  p_branch_id uuid default null,
  p_source text default 'QR'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_membership public.memberships%rowtype;
  v_person_id uuid;
  v_check_in_id uuid;
  v_session_end timestamptz;
begin
  if auth.uid () is null then
    raise exception 'Not authenticated';
  end if;

  if not public.can_manage_gym (p_gym_id)
     and not public.has_gym_role (p_gym_id, array['OWNER', 'STAFF', 'TRAINER']) then
    raise exception 'Not allowed';
  end if;

  if p_membership_id is not null then
    select * into v_membership
    from public.memberships m
    where m.id = p_membership_id and m.gym_id = p_gym_id;
  elsif p_qr_code is not null then
    select m.* into v_membership
    from public.memberships m
    join public.persons p on p.id = m.person_id
    where
      p.qr_code = p_qr_code
      and m.gym_id = p_gym_id;
  else
    raise exception 'membership_id or qr_code required';
  end if;

  if v_membership.id is null then
    raise exception 'Membership not found';
  end if;

  if v_membership.status <> 'ACTIVE' or v_membership.expires_at < now() then
    raise exception 'Membership inactive or expired';
  end if;

  v_person_id := v_membership.person_id;
  v_session_end := now() + interval '4 hours';

  -- Block simultaneous use at another gym within an active session
  if exists (
    select 1
    from public.check_ins c
    where
      c.person_id = v_person_id
      and c.gym_id <> p_gym_id
      and c.session_expires_at > now()
  ) then
    raise exception 'QR already in use at another gym';
  end if;

  insert into public.check_ins (
    gym_id,
    branch_id,
    membership_id,
    person_id,
    source,
    session_expires_at,
    recorded_by
  )
  values (
    p_gym_id,
    coalesce (p_branch_id, v_membership.branch_id),
    v_membership.id,
    v_person_id,
    coalesce (p_source, 'QR'),
    v_session_end,
    auth.uid ()
  )
  returning id into v_check_in_id;

  return v_check_in_id;
end;
$$;

grant
execute on function public.record_check_in (uuid, text, uuid, uuid, text) to authenticated;

-- Create person + membership in one step (staff)
create or replace function public.create_gym_membership (
  p_gym_id uuid,
  p_full_name text,
  p_expires_at timestamptz,
  p_phone text default null,
  p_email text default null,
  p_branch_id uuid default null,
  p_plan_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_person_id uuid;
  v_membership_id uuid;
  v_status text;
begin
  if auth.uid () is null then
    raise exception 'Not authenticated';
  end if;

  if not public.can_manage_gym (p_gym_id) then
    raise exception 'Not allowed';
  end if;

  if p_branch_id is not null and not exists (
    select 1 from public.branches b
    where b.id = p_branch_id and b.gym_id = p_gym_id
  ) then
    raise exception 'Invalid branch';
  end if;

  v_status := case
    when p_expires_at < now() then 'EXPIRED'
    else 'ACTIVE'
  end;

  insert into public.persons (full_name, phone, email)
  values (
    trim (p_full_name),
    nullif (trim (p_phone), ''),
    nullif (trim (lower (p_email)), '')
  )
  returning id into v_person_id;

  insert into public.memberships (
    gym_id,
    branch_id,
    person_id,
    plan_id,
    status,
    expires_at
  )
  values (
    p_gym_id,
    p_branch_id,
    v_person_id,
    p_plan_id,
    v_status,
    p_expires_at
  )
  returning id into v_membership_id;

  return v_membership_id;
end;
$$;

grant
execute on function public.create_gym_membership (
  uuid,
  text,
  timestamptz,
  text,
  text,
  uuid,
  uuid
) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.persons enable row level security;

alter table public.organizations enable row level security;

alter table public.gyms enable row level security;

alter table public.branches enable row level security;

alter table public.gym_roles enable row level security;

alter table public.branch_assignments enable row level security;

alter table public.plans enable row level security;

alter table public.memberships enable row level security;

alter table public.payments enable row level security;

alter table public.check_ins enable row level security;

alter table public.feedback_messages enable row level security;

alter table public.platform_admins enable row level security;

-- Persons: self, or staff at a gym where person has membership
create policy persons_select on public.persons for
select using (
  user_id = auth.uid ()
  or public.is_platform_admin ()
  or exists (
    select 1
    from public.memberships m
    where
      m.person_id = persons.id
      and public.has_gym_role (m.gym_id)
  )
);

create policy persons_insert_staff on public.persons for
insert
to authenticated
with
  check (
    user_id is null
    or user_id = auth.uid ()
  );

create policy persons_update on public.persons for
update using (
  user_id = auth.uid ()
  or public.is_platform_admin ()
  or exists (
    select 1
    from public.memberships m
    where
      m.person_id = persons.id
      and public.can_manage_gym (m.gym_id)
  )
);

-- Organizations
create policy organizations_select on public.organizations for
select using (
  public.is_platform_admin ()
  or created_by = auth.uid ()
  or exists (
    select 1
    from public.gyms g
    join public.gym_roles gr on gr.gym_id = g.id
    where
      g.organization_id = organizations.id
      and gr.user_id = auth.uid ()
  )
);

create policy organizations_insert on public.organizations for
insert
to authenticated
with
  check (created_by = auth.uid ());

create policy organizations_update on public.organizations for
update using (
  public.is_platform_admin ()
  or exists (
    select 1
    from public.gyms g
    join public.gym_roles gr on gr.gym_id = g.id
    where
      g.organization_id = organizations.id
      and gr.user_id = auth.uid ()
      and (
        gr.role = 'OWNER'
        or gr.is_provisional_owner = true
      )
  )
);

-- Gyms
create policy gyms_select on public.gyms for
select using (
  public.is_platform_admin ()
  or public.has_gym_role (id)
);

create policy gyms_insert on public.gyms for
insert
to authenticated
with
  check (
    exists (
      select 1
      from public.organizations o
      where
        o.id = organization_id
        and o.created_by = auth.uid ()
    )
  );

create policy gyms_update on public.gyms for
update using (
  public.is_platform_admin ()
  or public.has_gym_role (id, array['OWNER'])
  or exists (
    select 1
    from public.gym_roles gr
    where
      gr.gym_id = gyms.id
      and gr.user_id = auth.uid ()
      and gr.is_provisional_owner = true
  )
);

-- Branches
create policy branches_all on public.branches for all using (
  public.is_platform_admin ()
  or public.has_gym_role (gym_id)
)
with
  check (
    public.is_platform_admin ()
    or public.can_manage_gym (gym_id)
  );

-- Gym roles
create policy gym_roles_select on public.gym_roles for
select using (
  user_id = auth.uid ()
  or public.is_platform_admin ()
  or public.has_gym_role (gym_id)
);

create policy gym_roles_manage on public.gym_roles for all using (
  public.is_platform_admin ()
  or public.has_gym_role (gym_id, array['OWNER'])
  or exists (
    select 1
    from public.gym_roles gr
    where
      gr.gym_id = gym_roles.gym_id
      and gr.user_id = auth.uid ()
      and gr.is_provisional_owner = true
  )
)
with
  check (
    public.is_platform_admin ()
    or public.has_gym_role (gym_id, array['OWNER'])
    or exists (
      select 1
      from public.gym_roles gr
      where
        gr.gym_id = gym_roles.gym_id
        and gr.user_id = auth.uid ()
        and gr.is_provisional_owner = true
    )
  );

-- Branch assignments
create policy branch_assignments_all on public.branch_assignments for all using (
  user_id = auth.uid ()
  or public.is_platform_admin ()
  or exists (
    select 1
    from public.branches b
    where
      b.id = branch_assignments.branch_id
      and public.can_manage_gym (b.gym_id)
  )
)
with
  check (
    public.is_platform_admin ()
    or exists (
      select 1
      from public.branches b
      where
        b.id = branch_assignments.branch_id
        and public.can_manage_gym (b.gym_id)
    )
  );

-- Plans
create policy plans_all on public.plans for all using (
  public.is_platform_admin ()
  or public.has_gym_role (gym_id)
)
with
  check (
    public.is_platform_admin ()
    or public.can_manage_gym (gym_id)
  );

-- Memberships
create policy memberships_all on public.memberships for all using (
  public.is_platform_admin ()
  or public.has_gym_role (gym_id)
  or exists (
    select 1
    from public.persons p
    where
      p.id = memberships.person_id
      and p.user_id = auth.uid ()
  )
)
with
  check (
    public.is_platform_admin ()
    or public.can_manage_gym (gym_id)
  );

-- Payments
create policy payments_all on public.payments for all using (
  public.is_platform_admin ()
  or public.has_gym_role (gym_id)
)
with
  check (
    public.is_platform_admin ()
    or public.can_manage_gym (gym_id)
  );

-- Check-ins
create policy check_ins_all on public.check_ins for all using (
  public.is_platform_admin ()
  or public.has_gym_role (gym_id)
  or exists (
    select 1
    from public.persons p
    where
      p.id = check_ins.person_id
      and p.user_id = auth.uid ()
  )
)
with
  check (
    public.is_platform_admin ()
    or public.can_manage_gym (gym_id)
    or public.has_gym_role (gym_id, array['TRAINER'])
  );

-- Feedback
create policy feedback_select on public.feedback_messages for
select using (
  public.is_platform_admin ()
  or public.has_gym_role (gym_id)
);

create policy feedback_insert on public.feedback_messages for
insert
to authenticated
with
  check (
    public.has_gym_role (gym_id)
    or exists (
      select 1
      from public.memberships m
      join public.persons p on p.id = m.person_id
      where
        m.gym_id = feedback_messages.gym_id
        and p.user_id = auth.uid ()
    )
  );

-- Platform admins: only self-read; writes via service role
create policy platform_admins_select on public.platform_admins for
select using (user_id = auth.uid ());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant select, insert, update, delete on public.persons to authenticated;

grant select, insert, update on public.organizations to authenticated;

grant select, insert, update on public.gyms to authenticated;

grant select, insert, update, delete on public.branches to authenticated;

grant select, insert, update, delete on public.gym_roles to authenticated;

grant select, insert, update, delete on public.branch_assignments to authenticated;

grant select, insert, update, delete on public.plans to authenticated;

grant select, insert, update, delete on public.memberships to authenticated;

grant select, insert, update, delete on public.payments to authenticated;

grant select, insert, update, delete on public.check_ins to authenticated;

grant select, insert on public.feedback_messages to authenticated;

grant select on public.platform_admins to authenticated;

comment on table public.organizations is 'Billing account; pays AMRAP subscription';

comment on table public.gyms is 'Gym unit under an organization; one owner_user_id when claimed';

comment on table public.persons is 'Global identity; qr_code unique platform-wide';

comment on table public.gym_roles is 'Contextual staff/owner/trainer roles per gym';

comment on table public.memberships is 'Client membership of a person at a gym';

comment on column public.check_ins.session_expires_at is 'Check-in session end (default +4h); blocks other-gym use while active';
