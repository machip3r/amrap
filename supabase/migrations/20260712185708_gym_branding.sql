-- Gym branding: logo + light/dark theme tokens for dashboard personalization.

alter table public.gyms
add column if not exists logo_url text;

alter table public.gyms
add column if not exists theme_light jsonb not null default '{}'::jsonb;

alter table public.gyms
add column if not exists theme_dark jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- Update branding (owner / provisional)
-- ---------------------------------------------------------------------------

create or replace function public.update_gym_branding (
  p_gym_id uuid,
  p_theme_light jsonb default null,
  p_theme_dark jsonb default null,
  p_logo_url text default null,
  p_clear_logo boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if auth.uid () is null then
    raise exception 'Not authenticated';
  end if;

  if not (
    public.is_platform_admin ()
    or public.has_gym_role (p_gym_id, array['OWNER'])
    or public.is_provisional_owner_of_gym (p_gym_id)
  ) then
    raise exception 'Not allowed';
  end if;

  update public.gyms
  set
    theme_light = coalesce (p_theme_light, theme_light),
    theme_dark = coalesce (p_theme_dark, theme_dark),
    logo_url = case
      when p_clear_logo then null
      when p_logo_url is not null then nullif (trim (p_logo_url), '')
      else logo_url
    end,
    updated_at = now()
  where
    id = p_gym_id
    and deleted_at is null;

  if not found then
    raise exception 'Gym not found';
  end if;
end;
$$;

revoke all on function public.update_gym_branding (uuid, jsonb, jsonb, text, boolean) from public;

grant
execute on function public.update_gym_branding (uuid, jsonb, jsonb, text, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: gym logos (public read; owner write under {gym_id}/…)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gym-logos',
  'gym-logos',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.storage_gym_id_from_path (p_name text)
returns uuid
language plpgsql
immutable
as $$
declare
  v_part text := nullif (split_part (p_name, '/', 1), '');
begin
  if v_part is null or v_part !~ '^[0-9a-fA-F-]{36}$' then
    return null;
  end if;
  return v_part::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

create or replace function public.can_manage_gym_branding_storage (p_object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select
    public.is_platform_admin ()
    or public.has_gym_role (
      public.storage_gym_id_from_path (p_object_name),
      array['OWNER']
    )
    or public.is_provisional_owner_of_gym (
      public.storage_gym_id_from_path (p_object_name)
    );
$$;

revoke all on function public.storage_gym_id_from_path (text) from public;
revoke all on function public.can_manage_gym_branding_storage (text) from public;

grant
execute on function public.can_manage_gym_branding_storage (text) to authenticated;

drop policy if exists gym_logos_select on storage.objects;
create policy gym_logos_select on storage.objects for
select using (bucket_id = 'gym-logos');

drop policy if exists gym_logos_insert on storage.objects;
create policy gym_logos_insert on storage.objects for
insert
to authenticated
with
  check (
    bucket_id = 'gym-logos'
    and public.can_manage_gym_branding_storage (name)
  );

drop policy if exists gym_logos_update on storage.objects;
create policy gym_logos_update on storage.objects for
update to authenticated using (
  bucket_id = 'gym-logos'
  and public.can_manage_gym_branding_storage (name)
)
with
  check (
    bucket_id = 'gym-logos'
    and public.can_manage_gym_branding_storage (name)
  );

drop policy if exists gym_logos_delete on storage.objects;
create policy gym_logos_delete on storage.objects for
delete to authenticated using (
  bucket_id = 'gym-logos'
  and public.can_manage_gym_branding_storage (name)
);
