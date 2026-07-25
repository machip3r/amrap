-- Rename persons.sex → gender; store enum values UPPERCASE only.

alter table public.persons
  drop constraint if exists persons_sex_check;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where
      table_schema = 'public'
      and table_name = 'persons'
      and column_name = 'sex'
  ) and not exists (
    select 1
    from information_schema.columns
    where
      table_schema = 'public'
      and table_name = 'persons'
      and column_name = 'gender'
  ) then
    alter table public.persons rename column sex to gender;
  end if;
end $$;

update public.persons
set gender = upper(gender)
where gender is not null
  and gender is distinct from upper(gender);

alter table public.persons
  drop constraint if exists persons_gender_check;

alter table public.persons
  add constraint persons_gender_check check (
    gender is null
    or gender in ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT')
  );

comment on column public.persons.gender is
  'Member profile: MALE | FEMALE | OTHER | PREFER_NOT';
