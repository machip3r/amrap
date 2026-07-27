-- Gym-wide weekly opening hours (one open/close range shared across selected days).

alter table public.gyms
  add column if not exists schedule_enabled_days text[],
  add column if not exists schedule_open_time time,
  add column if not exists schedule_close_time time;

alter table public.gyms
  drop constraint if exists gyms_schedule_days_check;

alter table public.gyms
  add constraint gyms_schedule_days_check check (
    schedule_enabled_days is null
    or (
      cardinality(schedule_enabled_days) >= 1
      and schedule_enabled_days <@ array[
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
        'SUNDAY'
      ]::text[]
    )
  );

alter table public.gyms
  drop constraint if exists gyms_schedule_times_check;

alter table public.gyms
  add constraint gyms_schedule_times_check check (
    (
      schedule_enabled_days is null
      and schedule_open_time is null
      and schedule_close_time is null
    )
    or (
      schedule_enabled_days is not null
      and cardinality(schedule_enabled_days) >= 1
      and schedule_open_time is not null
      and schedule_close_time is not null
      and schedule_open_time < schedule_close_time
    )
  );

comment on column public.gyms.schedule_enabled_days is
  'Weekdays the gym is open (MONDAY..SUNDAY). Null until schedule is set.';

comment on column public.gyms.schedule_open_time is
  'Daily open time (local) for all enabled weekdays.';

comment on column public.gyms.schedule_close_time is
  'Daily close time (local) for all enabled weekdays; must be after open.';
