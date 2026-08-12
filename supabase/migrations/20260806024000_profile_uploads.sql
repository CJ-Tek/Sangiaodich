-- Profile: CCCD document images (front + back). Paths relative to private bucket `id-docs`.
alter table public.profiles
  add column if not exists national_id_front_url text,
  add column if not exists national_id_back_url text;

-- Public avatars (settlements / UI preview)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Private CCCD scans — only subject + admin via RLS; app uses service role for upload
insert into storage.buckets (id, name, public)
values ('id-docs', 'id-docs', false)
on conflict (id) do nothing;

-- Avatars: anyone can read; authenticated user writes only under own folder
create policy avatars_public_read on storage.objects
  for select using (bucket_id = 'avatars');

create policy avatars_own_insert on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatars_own_update on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatars_own_delete on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ID docs: subject or admin only
create policy id_docs_own_select on storage.objects
  for select using (
    bucket_id = 'id-docs'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.current_role() = 'ADMIN'
    )
  );

create policy id_docs_own_insert on storage.objects
  for insert with check (
    bucket_id = 'id-docs'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy id_docs_own_update on storage.objects
  for update using (
    bucket_id = 'id-docs'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy id_docs_own_delete on storage.objects
  for delete using (
    bucket_id = 'id-docs'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
