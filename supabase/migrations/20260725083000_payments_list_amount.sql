-- Catalog (list) price vs charged amount for manual desk payments.
-- amount = what was collected (0 = trial / courtesy).
-- list_amount = plan or day-pass catalog price at recording time (audit / discount).

alter table public.payments
  add column if not exists list_amount numeric(12, 2);

alter table public.payments
  drop constraint if exists payments_list_amount_nonneg;

alter table public.payments
  add constraint payments_list_amount_nonneg check (
    list_amount is null
    or list_amount >= 0
  );

comment on column public.payments.list_amount is
  'Catalog price when recorded (plan or day-pass). Null on legacy rows. Charged amount is payments.amount (0 = trial).';
