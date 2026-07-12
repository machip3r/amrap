-- Dual logos (light / dark) for gym branding.

alter table public.gyms
add column if not exists logo_url_light text;

alter table public.gyms
add column if not exists logo_url_dark text;

update public.gyms
set logo_url_light = coalesce (logo_url_light, logo_url)
where
  logo_url is not null
  and logo_url_light is null;

drop function if exists public.update_gym_branding (uuid, jsonb, jsonb, text, boolean);

create or replace function public.update_gym_branding (
  p_gym_id uuid,
  p_theme_light jsonb default null,
  p_theme_dark jsonb default null,
  p_logo_url_light text default null,
  p_logo_url_dark text default null,
  p_clear_logo_light boolean default false,
  p_clear_logo_dark boolean default false
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
    logo_url_light = case
      when p_clear_logo_light then null
      when p_logo_url_light is not null then nullif (trim (p_logo_url_light), '')
      else logo_url_light
    end,
    logo_url_dark = case
      when p_clear_logo_dark then null
      when p_logo_url_dark is not null then nullif (trim (p_logo_url_dark), '')
      else logo_url_dark
    end,
    -- Keep legacy column in sync with light logo for older readers
    logo_url = case
      when p_clear_logo_light then null
      when p_logo_url_light is not null then nullif (trim (p_logo_url_light), '')
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

revoke all on function public.update_gym_branding (
  uuid,
  jsonb,
  jsonb,
  text,
  text,
  boolean,
  boolean
) from public;

grant
execute on function public.update_gym_branding (
  uuid,
  jsonb,
  jsonb,
  text,
  text,
  boolean,
  boolean
) to authenticated;
