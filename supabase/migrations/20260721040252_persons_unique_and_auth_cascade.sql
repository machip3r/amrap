-- Unique persons.email / persons.phone (when present) + auth.users delete cascades
-- claimed persons rows (and person-scoped children via existing FKs).

-- ---------------------------------------------------------------------------
-- Normalize empty strings and email casing before uniqueness
-- ---------------------------------------------------------------------------

update public.persons
set
  email = null
where
  email is not null
  and btrim(email) = '';

update public.persons
set
  phone = null
where
  phone is not null
  and btrim(phone) = '';

update public.persons
set
  email = lower(btrim(email))
where
  email is not null;

-- ---------------------------------------------------------------------------
-- Fail loudly if two *claimed* accounts share the same email or phone
-- (cannot pick a keeper without merging identities).
-- ---------------------------------------------------------------------------

do $$
declare
  v_dup text;
begin
  select lower(email) into v_dup
  from public.persons
  where
    email is not null
    and user_id is not null
  group by lower(email)
  having count(*) > 1
  limit 1;

  if v_dup is not null then
    raise exception
      'Cannot enforce unique persons.email: multiple claimed users share email %',
      v_dup;
  end if;

  select phone into v_dup
  from public.persons
  where
    phone is not null
    and user_id is not null
  group by phone
  having count(*) > 1
  limit 1;

  if v_dup is not null then
    raise exception
      'Cannot enforce unique persons.phone: multiple claimed users share phone %',
      v_dup;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Clear conflicting email/phone on non-keeper rows (prefer claimed, else oldest)
-- ---------------------------------------------------------------------------

with ranked as (
  select
    id,
    row_number() over (
      partition by lower(email)
      order by
        (user_id is not null) desc,
        created_at asc,
        id asc
    ) as rn
  from public.persons
  where
    email is not null
)
update public.persons p
set
  email = null
from ranked r
where
  p.id = r.id
  and r.rn > 1;

with ranked as (
  select
    id,
    row_number() over (
      partition by phone
      order by
        (user_id is not null) desc,
        created_at asc,
        id asc
    ) as rn
  from public.persons
  where
    phone is not null
)
update public.persons p
set
  phone = null
from ranked r
where
  p.id = r.id
  and r.rn > 1;

-- ---------------------------------------------------------------------------
-- Unique indexes (NULL allowed many times; non-null values unique)
-- ---------------------------------------------------------------------------

drop index if exists public.persons_email_idx;

drop index if exists public.persons_phone_idx;

create unique index persons_email_unique_idx on public.persons (lower(email))
where
  email is not null;

create unique index persons_phone_unique_idx on public.persons (phone)
where
  phone is not null;

comment on index public.persons_email_unique_idx is
  'Platform-wide unique email when set (case-insensitive). Multiple NULLs allowed.';

comment on index public.persons_phone_unique_idx is
  'Platform-wide unique phone when set. Multiple NULLs allowed.';

-- ---------------------------------------------------------------------------
-- persons.user_id: SET NULL → CASCADE (delete claimed person with auth user)
-- user_id / qr_code uniqueness already enforced by table definition.
-- ---------------------------------------------------------------------------

alter table public.persons
drop constraint if exists persons_user_id_fkey;

alter table public.persons
add constraint persons_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade;

comment on column public.persons.user_id is
  'Optional link to auth.users. Unique. ON DELETE CASCADE removes the person (and person-scoped rows) when the auth user is deleted. Unclaimed persons (null user_id) are unaffected.';
