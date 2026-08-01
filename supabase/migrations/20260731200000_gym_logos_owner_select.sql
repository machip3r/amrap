-- Upsert / update / remove on storage.objects require SELECT.
-- 20260716003201 dropped the broad public listing policy on gym-logos,
-- which broke owner logo uploads (upsert) and removals.
-- Restore SELECT only for owners/provisional who can manage that gym's logos
-- (no public listing of all objects).

drop policy if exists gym_logos_select_manage on storage.objects;

create policy gym_logos_select_manage on storage.objects for
select
to authenticated
using (
  bucket_id = 'gym-logos'
  and private.can_manage_gym_branding_storage (name)
);
