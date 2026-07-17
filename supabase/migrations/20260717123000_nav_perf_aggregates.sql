-- Aggregates for faster ops page loads (plans counts + payment month stats).

create or replace function public.plan_member_counts (p_gym_id uuid)
returns table (
  plan_id uuid,
  member_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    m.plan_id,
    count(*)::bigint as member_count
  from public.memberships m
  where m.gym_id = p_gym_id
    and m.plan_id is not null
  group by m.plan_id;
$$;

comment on function public.plan_member_counts (uuid) is
  'Per-plan membership counts for a gym (ops Plans page).';

revoke all on function public.plan_member_counts (uuid) from public;
revoke all on function public.plan_member_counts (uuid) from anon;
grant execute on function public.plan_member_counts (uuid) to authenticated;

create or replace function public.gym_payment_stats (
  p_gym_id uuid,
  p_month_start timestamptz,
  p_today_start timestamptz
)
returns table (
  month_total numeric,
  month_count bigint,
  today_total numeric,
  today_count bigint,
  plans_total numeric,
  plans_count bigint,
  day_pass_total numeric,
  day_pass_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce(sum(p.amount), 0)::numeric as month_total,
    count(*)::bigint as month_count,
    coalesce(sum(p.amount) filter (where p.created_at >= p_today_start), 0)::numeric as today_total,
    count(*) filter (where p.created_at >= p_today_start)::bigint as today_count,
    coalesce(sum(p.amount) filter (where p.kind = 'PLAN'), 0)::numeric as plans_total,
    count(*) filter (where p.kind = 'PLAN')::bigint as plans_count,
    coalesce(sum(p.amount) filter (where p.kind = 'DAY_PASS'), 0)::numeric as day_pass_total,
    count(*) filter (where p.kind = 'DAY_PASS')::bigint as day_pass_count
  from public.payments p
  where p.gym_id = p_gym_id
    and p.created_at >= p_month_start;
$$;

comment on function public.gym_payment_stats (uuid, timestamptz, timestamptz) is
  'Month / today / kind totals for a gym (ops Payments page).';

revoke all on function public.gym_payment_stats (uuid, timestamptz, timestamptz) from public;
revoke all on function public.gym_payment_stats (uuid, timestamptz, timestamptz) from anon;
grant execute on function public.gym_payment_stats (uuid, timestamptz, timestamptz) to authenticated;
