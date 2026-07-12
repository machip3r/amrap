-- Soft-archive for membership plans (activo / archivado).
alter table public.plans
  add column if not exists is_active boolean not null default true;

create index if not exists plans_gym_id_is_active_idx
  on public.plans (gym_id, is_active);
