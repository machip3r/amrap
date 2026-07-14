-- Gym classes with optional multi-trainer assignment.

create table public.classes (
  id uuid primary key default gen_random_uuid (),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  name text not null,
  description text,
  capacity int check (capacity is null or capacity > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now ()
);

create index classes_gym_id_idx on public.classes (gym_id);

create index classes_gym_active_idx on public.classes (gym_id, is_active);

create table public.class_trainers (
  class_id uuid not null references public.classes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now (),
  primary key (class_id, user_id)
);

create index class_trainers_user_id_idx on public.class_trainers (user_id);

comment on table public.classes is 'Scheduled / catalog class offerings at a gym';

comment on table public.class_trainers is 'Trainers assigned to a class (many-to-many)';

alter table public.classes enable row level security;

alter table public.class_trainers enable row level security;

create policy classes_all on public.classes for all using (
  public.is_platform_admin ()
  or public.has_gym_role (gym_id)
)
with
  check (
    public.is_platform_admin ()
    or public.can_manage_gym (gym_id)
  );

create policy class_trainers_select on public.class_trainers for
select using (
  public.is_platform_admin ()
  or exists (
    select 1
    from public.classes c
    where
      c.id = class_trainers.class_id
      and public.has_gym_role (c.gym_id)
  )
);

create policy class_trainers_manage on public.class_trainers for all using (
  public.is_platform_admin ()
  or exists (
    select 1
    from public.classes c
    where
      c.id = class_trainers.class_id
      and public.can_manage_gym (c.gym_id)
  )
)
with
  check (
    public.is_platform_admin ()
    or exists (
      select 1
      from public.classes c
      where
        c.id = class_trainers.class_id
        and public.can_manage_gym (c.gym_id)
    )
  );

grant select, insert, update, delete on public.classes to authenticated;

grant select, insert, update, delete on public.class_trainers to authenticated;
