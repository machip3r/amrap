-- Coach care notes (gym-scoped) + per-session athlete results.

create table public.person_gym_care (
  gym_id uuid not null references public.gyms (id) on delete cascade,
  person_id uuid not null references public.persons (id) on delete cascade,
  medical_note text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  primary key (gym_id, person_id),
  constraint person_gym_care_note_len check (
    medical_note is null
    or char_length(medical_note) <= 500
  )
);

create index person_gym_care_person_id_idx on public.person_gym_care (person_id);

comment on table public.person_gym_care is 'Coach-facing care notes per person at a gym (medical/injury adaptations)';

create table public.class_session_results (
  id uuid primary key default gen_random_uuid (),
  session_id uuid not null references public.class_sessions (id) on delete cascade,
  person_id uuid not null references public.persons (id) on delete cascade,
  gym_id uuid not null references public.gyms (id) on delete cascade,
  kind text not null,
  rounds int,
  reps int,
  weight_kg numeric(7, 2),
  time_seconds int,
  note text,
  recorded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint class_session_results_kind_check check (
    kind in ('amrap', 'strength', 'for_time', 'other')
  ),
  constraint class_session_results_rounds_check check (
    rounds is null
    or rounds >= 0
  ),
  constraint class_session_results_reps_check check (reps is null or reps >= 0),
  constraint class_session_results_weight_check check (
    weight_kg is null
    or (
      weight_kg >= 0
      and weight_kg <= 1000
    )
  ),
  constraint class_session_results_time_check check (
    time_seconds is null
    or (
      time_seconds >= 0
      and time_seconds <= 86400
    )
  ),
  constraint class_session_results_note_len check (
    note is null
    or char_length(note) <= 280
  ),
  constraint class_session_results_session_person_key unique (session_id, person_id)
);

create index class_session_results_gym_id_idx on public.class_session_results (gym_id);

create index class_session_results_person_id_idx on public.class_session_results (person_id);

comment on table public.class_session_results is 'Coach-captured workout scores per athlete on a class session';

-- RLS
alter table public.person_gym_care enable row level security;
alter table public.class_session_results enable row level security;

create policy person_gym_care_select on public.person_gym_care for
select using (
  private.is_platform_admin ()
  or private.has_gym_role (gym_id)
);

create policy person_gym_care_manage on public.person_gym_care for all using (
  private.is_platform_admin ()
  or private.can_manage_gym (gym_id)
)
with
  check (
    private.is_platform_admin ()
    or private.can_manage_gym (gym_id)
  );

create policy class_session_results_select on public.class_session_results for
select using (
  private.is_platform_admin ()
  or private.has_gym_role (gym_id)
  or private.person_owned_by_me (person_id)
);

create policy class_session_results_manage on public.class_session_results for all using (
  private.is_platform_admin ()
  or private.has_gym_role (gym_id, array['OWNER', 'STAFF', 'TRAINER'])
)
with
  check (
    private.is_platform_admin ()
    or private.has_gym_role (gym_id, array['OWNER', 'STAFF', 'TRAINER'])
  );

grant select, insert, update, delete on public.person_gym_care to authenticated;
grant select, insert, update, delete on public.class_session_results to authenticated;
