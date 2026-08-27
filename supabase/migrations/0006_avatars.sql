-- Lets people upload a profile picture: a public "avatars" storage bucket
-- (so uploaded images can be shown without signed URLs) plus a column to
-- remember which file belongs to which profile.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

alter table profiles add column avatar_url text;

-- Anyone can VIEW avatars (it's a public bucket — profile pictures aren't
-- sensitive), but you can only upload/replace/delete your OWN picture.
-- Files are stored as "<user id>/<filename>", so checking the first path
-- segment against auth.uid() is what enforces "own" here.
create policy avatar_read_all on storage.objects for select
  using (bucket_id = 'avatars');

create policy avatar_upload_own on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy avatar_update_own on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy avatar_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
