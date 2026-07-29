-- Member online billing: gym-connected PSPs (Mercado Pago first; Stripe/Clip later).
-- Manual CASH/TRANSFER stays available for all tiers; online is gated in app (Starter+).

-- ---------------------------------------------------------------------------
-- payments: ONLINE method + provider linkage
-- ---------------------------------------------------------------------------
alter table public.payments
  drop constraint if exists payments_method_check;

alter table public.payments
  add constraint payments_method_check check (
    method in ('CASH', 'TRANSFER', 'CARD', 'OTHER', 'ONLINE')
  );

alter table public.payments
  add column if not exists provider text;

alter table public.payments
  add column if not exists provider_payment_id text;

alter table public.payments
  add column if not exists checkout_id uuid;

alter table public.payments
  drop constraint if exists payments_provider_check;

alter table public.payments
  add constraint payments_provider_check check (
    provider is null
    or provider in ('MERCADOPAGO', 'STRIPE', 'CLIP')
  );

create unique index if not exists payments_provider_payment_id_uidx
  on public.payments (provider, provider_payment_id)
  where provider is not null and provider_payment_id is not null;

comment on column public.payments.provider is
  'PSP for online charges (null = desk/manual).';
comment on column public.payments.provider_payment_id is
  'Idempotent PSP payment id.';
comment on column public.payments.checkout_id is
  'FK to payment_checkouts when fulfilled from online checkout.';

-- ---------------------------------------------------------------------------
-- gym_payment_accounts
-- ---------------------------------------------------------------------------
create table if not exists public.gym_payment_accounts (
  id uuid primary key default gen_random_uuid (),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  provider text not null,
  status text not null default 'DISCONNECTED',
  external_user_id text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  public_key text,
  live_mode boolean not null default true,
  connected_at timestamptz,
  disconnected_at timestamptz,
  last_error text,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now (),
  constraint gym_payment_accounts_provider_check check (
    provider in ('MERCADOPAGO', 'STRIPE', 'CLIP')
  ),
  constraint gym_payment_accounts_status_check check (
    status in ('CONNECTED', 'DISCONNECTED', 'ERROR')
  ),
  constraint gym_payment_accounts_gym_provider_uidx unique (gym_id, provider)
);

create index if not exists gym_payment_accounts_gym_id_idx
  on public.gym_payment_accounts (gym_id);

comment on table public.gym_payment_accounts is
  'Per-gym connected payment providers (OAuth). Tokens are server-only; never expose to clients.';

-- ---------------------------------------------------------------------------
-- plan_payment_links (catalog sync map)
-- ---------------------------------------------------------------------------
create table if not exists public.plan_payment_links (
  id uuid primary key default gen_random_uuid (),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  plan_id uuid not null references public.plans (id) on delete cascade,
  provider text not null,
  external_product_id text,
  external_price_id text,
  is_enabled boolean not null default true,
  synced_at timestamptz,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now (),
  constraint plan_payment_links_provider_check check (
    provider in ('MERCADOPAGO', 'STRIPE', 'CLIP')
  ),
  constraint plan_payment_links_plan_provider_uidx unique (plan_id, provider)
);

create index if not exists plan_payment_links_gym_provider_idx
  on public.plan_payment_links (gym_id, provider);

comment on table public.plan_payment_links is
  'Maps AMRAP plans to provider catalog ids. Source of truth remains plans.*; sync pushes outward.';

-- ---------------------------------------------------------------------------
-- payment_checkouts (async online attempts)
-- ---------------------------------------------------------------------------
create table if not exists public.payment_checkouts (
  id uuid primary key default gen_random_uuid (),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  membership_id uuid not null references public.memberships (id) on delete cascade,
  plan_id uuid not null references public.plans (id) on delete restrict,
  provider text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  list_amount numeric(12, 2) not null check (list_amount >= 0),
  status text not null default 'PENDING',
  provider_preference_id text,
  provider_payment_id text,
  init_point text,
  created_by uuid references auth.users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now (),
  completed_at timestamptz,
  constraint payment_checkouts_provider_check check (
    provider in ('MERCADOPAGO', 'STRIPE', 'CLIP')
  ),
  constraint payment_checkouts_status_check check (
    status in ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'EXPIRED')
  )
);

create index if not exists payment_checkouts_gym_status_idx
  on public.payment_checkouts (gym_id, status);

create index if not exists payment_checkouts_membership_idx
  on public.payment_checkouts (membership_id);

create unique index if not exists payment_checkouts_provider_preference_uidx
  on public.payment_checkouts (provider, provider_preference_id)
  where provider_preference_id is not null;

comment on table public.payment_checkouts is
  'Online checkout attempts. On success, a payments row is inserted and membership renewed.';

alter table public.payments
  drop constraint if exists payments_checkout_id_fkey;

alter table public.payments
  add constraint payments_checkout_id_fkey
  foreign key (checkout_id) references public.payment_checkouts (id) on delete set null;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.gym_payment_accounts enable row level security;
alter table public.plan_payment_links enable row level security;
alter table public.payment_checkouts enable row level security;

-- Accounts: staff can read non-secret shape via select; tokens still in row —
-- app load must omit token columns. Only managers mutate via app (service role for webhooks).
drop policy if exists gym_payment_accounts_select on public.gym_payment_accounts;
create policy gym_payment_accounts_select on public.gym_payment_accounts for
select using (
  private.is_platform_admin ()
  or private.has_gym_role (gym_id)
);

drop policy if exists gym_payment_accounts_write on public.gym_payment_accounts;
create policy gym_payment_accounts_write on public.gym_payment_accounts for all using (
  private.is_platform_admin ()
  or private.can_manage_gym (gym_id)
)
with
  check (
    private.is_platform_admin ()
    or private.can_manage_gym (gym_id)
  );

drop policy if exists plan_payment_links_select on public.plan_payment_links;
create policy plan_payment_links_select on public.plan_payment_links for
select using (
  private.is_platform_admin ()
  or private.has_gym_role (gym_id)
  or exists (
    select 1
    from public.memberships m
    join public.persons p on p.id = m.person_id
    where
      m.gym_id = plan_payment_links.gym_id
      and p.user_id = auth.uid ()
  )
);

drop policy if exists plan_payment_links_write on public.plan_payment_links;
create policy plan_payment_links_write on public.plan_payment_links for all using (
  private.is_platform_admin ()
  or private.can_manage_gym (gym_id)
)
with
  check (
    private.is_platform_admin ()
    or private.can_manage_gym (gym_id)
  );

drop policy if exists payment_checkouts_select on public.payment_checkouts;
create policy payment_checkouts_select on public.payment_checkouts for
select using (
  private.is_platform_admin ()
  or private.has_gym_role (gym_id)
  or exists (
    select 1
    from public.memberships m
    join public.persons p on p.id = m.person_id
    where
      m.id = payment_checkouts.membership_id
      and p.user_id = auth.uid ()
  )
);

drop policy if exists payment_checkouts_insert on public.payment_checkouts;
create policy payment_checkouts_insert on public.payment_checkouts for insert
with
  check (
    private.is_platform_admin ()
    or private.can_manage_gym (gym_id)
    or exists (
      select 1
      from public.memberships m
      join public.persons p on p.id = m.person_id
      where
        m.id = payment_checkouts.membership_id
        and m.gym_id = payment_checkouts.gym_id
        and p.user_id = auth.uid ()
    )
  );

drop policy if exists payment_checkouts_update on public.payment_checkouts;
create policy payment_checkouts_update on public.payment_checkouts for
update using (
  private.is_platform_admin ()
  or private.can_manage_gym (gym_id)
)
with
  check (
    private.is_platform_admin ()
    or private.can_manage_gym (gym_id)
  );

grant select, insert, update, delete on public.gym_payment_accounts to authenticated;
grant select, insert, update, delete on public.plan_payment_links to authenticated;
grant select, insert, update, delete on public.payment_checkouts to authenticated;
