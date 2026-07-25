-- Store AMRAP billing enums in uppercase (MONTH/YEAR, ACTIVE/…).

update public.organizations
set billing_interval = upper(billing_interval)
where billing_interval is not null
  and billing_interval <> upper(billing_interval);

update public.organizations
set stripe_subscription_status = upper(stripe_subscription_status)
where stripe_subscription_status is not null
  and stripe_subscription_status <> upper(stripe_subscription_status);

comment on column public.organizations.stripe_subscription_status is
  'Uppercase mirror of Stripe subscription.status (ACTIVE, PAST_DUE, CANCELED, …)';
comment on column public.organizations.billing_interval is
  'MONTH | YEAR for the current AMRAP subscription price';
