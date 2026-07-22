-- Feedback: gym vs AMRAP target; only owners/provisional (and platform admins) can read.

alter table public.feedback_messages
  add column if not exists target text not null default 'gym';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'feedback_messages_target_check'
      and conrelid = 'public.feedback_messages'::regclass
  ) then
    alter table public.feedback_messages
      add constraint feedback_messages_target_check
      check (target in ('gym', 'amrap'));
  end if;
end $$;

create index if not exists feedback_messages_gym_target_created_idx
  on public.feedback_messages (gym_id, target, created_at desc);

drop policy if exists feedback_select on public.feedback_messages;

create policy feedback_select on public.feedback_messages for
select using (
  private.is_platform_admin ()
  or (
    target = 'gym'
    and (
      private.has_gym_role (gym_id, array['OWNER'])
      or private.is_provisional_owner_of_gym (gym_id)
    )
  )
);
