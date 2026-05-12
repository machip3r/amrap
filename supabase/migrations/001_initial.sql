-- Gym membership MVP — multi-tenant schema with RLS-ready policies
-- Run in Supabase SQL editor or via CLI after linking project.

create extension if not exists "pgcrypto";

-- Tenants
create table public.tenants (
    id uuid primary key default gen_random_uuid (),
    name text not null,
    created_at timestamptz not null default now()
);

-- Branches (optional; default row per tenant via RPC)
create table public.branches (
    id uuid primary key default gen_random_uuid (),
    tenant_id uuid not null references public.tenants (id) on delete cascade,
    name text not null,
    created_at timestamptz not null default now()
);

-- Staff profile (1:1 with auth.users)
create table public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    tenant_id uuid not null references public.tenants (id) on delete cascade,
    role text not null check (
        role in ('OWNER', 'TRAINER', 'STAFF')
    ),
    full_name text,
    created_at timestamptz not null default now()
);

create index profiles_tenant_id_idx on public.profiles (tenant_id);

-- Plans
create table public.plans (
    id uuid primary key default gen_random_uuid (),
    tenant_id uuid not null references public.tenants (id) on delete cascade,
    name text not null,
    price numeric(12, 2) not null check (price >= 0),
    duration_days int not null check (duration_days > 0),
    created_at timestamptz not null default now()
);

create index plans_tenant_id_idx on public.plans (tenant_id);

-- Members
create table public.members (
    id uuid primary key default gen_random_uuid (),
    tenant_id uuid not null references public.tenants (id) on delete cascade,
    branch_id uuid references public.branches (id) on delete set null,
    name text not null,
    phone text,
    status text not null check (
        status in (
            'ACTIVE',
            'INACTIVE',
            'EXPIRED',
            'CANCELLED'
        )
    ) default 'ACTIVE',
    membership_expires_at timestamptz not null,
    qr_code text not null unique,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index members_tenant_id_idx on public.members (tenant_id);

create index members_qr_code_idx on public.members (qr_code);

-- Payments (manual registration only)
create table public.payments (
    id uuid primary key default gen_random_uuid (),
    tenant_id uuid not null references public.tenants (id) on delete cascade,
    member_id uuid not null references public.members (id) on delete cascade,
    amount numeric(12, 2) not null check (amount >= 0),
    method text not null check (
        method in ('CASH', 'TRANSFER')
    ),
    created_at timestamptz not null default now()
);

create index payments_tenant_id_idx on public.payments (tenant_id);

create index payments_member_id_idx on public.payments (member_id);

create index payments_created_at_idx on public.payments (created_at);

-- Check-ins
create table public.check_ins (
    id uuid primary key default gen_random_uuid (),
    tenant_id uuid not null references public.tenants (id) on delete cascade,
    member_id uuid not null references public.members (id) on delete cascade,
    created_at timestamptz not null default now()
);

create index check_ins_tenant_id_idx on public.check_ins (tenant_id);

-- Tenant resolution for RLS
create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.profiles where id = auth.uid() limit 1;
$$;

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$;

-- First-time gym signup (call right after auth.signUp while session exists)
create or replace function public.register_tenant(
  p_tenant_name text,
  p_full_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_branch_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'Profile already exists';
  end if;

  insert into public.tenants (name)
  values (p_tenant_name)
  returning id into v_tenant_id;

  insert into public.branches (tenant_id, name)
  values (v_tenant_id, 'Principal')
  returning id into v_branch_id;

  insert into public.profiles (id, tenant_id, role, full_name)
  values (auth.uid(), v_tenant_id, 'OWNER', coalesce(p_full_name, ''));

  return v_tenant_id;
end;
$$;

grant usage on schema public to anon, authenticated;

grant
execute on function public.register_tenant (text, text) to authenticated;

-- RLS
alter table public.tenants enable row level security;

alter table public.branches enable row level security;

alter table public.profiles enable row level security;

alter table public.plans enable row level security;

alter table public.members enable row level security;

alter table public.payments enable row level security;

alter table public.check_ins enable row level security;

-- Tenants: users see only their tenant (after onboarding)
create policy tenants_select on public.tenants for
select using (
        id = public.current_tenant_id ()
    );

-- Bootstrap: create first tenant before profile exists
create policy tenants_insert_bootstrap on public.tenants for
insert
    to authenticated
with
    check (
        not exists (
            select 1
            from public.profiles p
            where
                p.id = auth.uid ()
        )
    );

-- Branches: after profile exists, scope by tenant
create policy branches_select on public.branches for
select using (
        tenant_id = public.current_tenant_id ()
    );

create policy branches_insert_bootstrap on public.branches for
insert
    to authenticated
with
    check (
        not exists (
            select 1
            from public.profiles p
            where
                p.id = auth.uid ()
        )
    );

create policy branches_modify on public.branches for all using (
    tenant_id = public.current_tenant_id ()
)
with
    check (
        tenant_id = public.current_tenant_id ()
    );

-- Profiles: read own + same-tenant peers (for future staff list)
create policy profiles_select on public.profiles for
select using (
        tenant_id = public.current_tenant_id ()
    );

create policy profiles_update_self on public.profiles for
update using (id = auth.uid ())
with
    check (id = auth.uid ());

create policy profiles_insert_first on public.profiles for
insert
    to authenticated
with
    check (
        id = auth.uid ()
        and not exists (
            select 1
            from public.profiles p2
            where
                p2.id = auth.uid ()
        )
    );

-- Plans
create policy plans_all on public.plans for all using (
    tenant_id = public.current_tenant_id ()
)
with
    check (
        tenant_id = public.current_tenant_id ()
    );

-- Members
create policy members_all on public.members for all using (
    tenant_id = public.current_tenant_id ()
)
with
    check (
        tenant_id = public.current_tenant_id ()
    );

-- Payments
create policy payments_all on public.payments for all using (
    tenant_id = public.current_tenant_id ()
)
with
    check (
        tenant_id = public.current_tenant_id ()
    );

-- Check-ins
create policy check_ins_all on public.check_ins for all using (
    tenant_id = public.current_tenant_id ()
)
with
    check (
        tenant_id = public.current_tenant_id ()
    );

comment on table public.tenants is 'Gym tenant (multi-tenant root)';

comment on table public.branches is 'Optional branches per tenant';

comment on column public.members.qr_code is 'Opaque token scanned at check-in';

grant select, insert, update, delete on public.tenants to authenticated;

grant select, insert, update, delete on public.branches to authenticated;

grant select, insert, update, delete on public.profiles to authenticated;

grant select, insert, update, delete on public.plans to authenticated;

grant select, insert, update, delete on public.members to authenticated;

grant select, insert, update, delete on public.payments to authenticated;

grant select, insert, update, delete on public.check_ins to authenticated;