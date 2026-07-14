-- Day-pass / single-visit price for a gym (optional; used when recording a visit payment).
alter table public.gyms
  add column if not exists day_pass_price numeric(12, 2)
  check (day_pass_price is null or day_pass_price >= 0);

comment on column public.gyms.day_pass_price is
  'Price for a single day pass / visit. Null means not configured.';
