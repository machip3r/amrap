-- Ensure gym logo bucket stays publicly readable for dashboard <img> tags.

update storage.buckets
set public = true
where id = 'gym-logos';

drop policy if exists gym_logos_select on storage.objects;
create policy gym_logos_select on storage.objects for
select using (bucket_id = 'gym-logos');
