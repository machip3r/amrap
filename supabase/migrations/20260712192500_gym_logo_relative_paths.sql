-- Store gym logos as storage-relative paths (not full public URLs).

update public.gyms
set
  logo_url_light = regexp_replace (
    split_part (logo_url_light, '?', 1),
    '^https?://[^/]+/storage/v1/object/public/gym-logos/',
    ''
  )
where
  logo_url_light is not null
  and logo_url_light ~ '^https?://';

update public.gyms
set
  logo_url_dark = regexp_replace (
    split_part (logo_url_dark, '?', 1),
    '^https?://[^/]+/storage/v1/object/public/gym-logos/',
    ''
  )
where
  logo_url_dark is not null
  and logo_url_dark ~ '^https?://';

update public.gyms
set
  logo_url = regexp_replace (
    split_part (logo_url, '?', 1),
    '^https?://[^/]+/storage/v1/object/public/gym-logos/',
    ''
  )
where
  logo_url is not null
  and logo_url ~ '^https?://';
