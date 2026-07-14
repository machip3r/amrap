-- Snapshot what a payment was for (membership plan vs day pass / visit).
alter table public.payments
  add column if not exists kind text not null default 'PLAN'
  check (kind in ('PLAN', 'DAY_PASS'));

alter table public.payments
  add column if not exists plan_id uuid references public.plans (id) on delete set null;

create index if not exists payments_plan_id_idx on public.payments (plan_id);

comment on column public.payments.kind is
  'What the payment covers: PLAN (membership) or DAY_PASS (single visit).';

comment on column public.payments.plan_id is
  'Plan paid for when kind = PLAN; null for day pass.';
