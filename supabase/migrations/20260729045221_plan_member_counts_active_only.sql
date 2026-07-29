-- Count only active memberships per plan (expires_at in the future).

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
    and m.expires_at > now()
  group by m.plan_id;
$$;

comment on function public.plan_member_counts (uuid) is
  'Per-plan active membership counts for a gym (ops Plans page). Active = expires_at > now().';
