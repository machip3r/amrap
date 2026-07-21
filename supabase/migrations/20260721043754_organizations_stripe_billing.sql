-- AMRAP org subscription billing (Stripe Customer + Subscription sync).

alter table public.organizations
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_subscription_status text,
  add column if not exists billing_interval text;

comment on column public.organizations.stripe_customer_id is
  'Stripe Customer id (cus_…) for AMRAP platform subscription';
comment on column public.organizations.stripe_subscription_id is
  'Active Stripe Subscription id (sub_…) when on a paid plan';
comment on column public.organizations.stripe_subscription_status is
  'Stripe subscription.status mirror (active, past_due, canceled, …)';
comment on column public.organizations.billing_interval is
  'month | year for the current AMRAP subscription price';

create unique index if not exists organizations_stripe_customer_id_uidx
  on public.organizations (stripe_customer_id)
  where stripe_customer_id is not null;
