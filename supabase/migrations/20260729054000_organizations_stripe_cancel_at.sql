-- Store Stripe scheduled cancellation on organizations for billing UI.

alter table public.organizations
  add column if not exists stripe_cancel_at_period_end boolean not null default false,
  add column if not exists stripe_cancel_at timestamptz;

comment on column public.organizations.stripe_cancel_at_period_end is
  'Mirror of Stripe subscription.cancel_at_period_end — true while cancel is scheduled for period end';

comment on column public.organizations.stripe_cancel_at is
  'When the subscription will end (Stripe subscription.cancel_at as timestamptz); null if not scheduled';
