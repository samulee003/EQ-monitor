-- setup-buckets.sql
-- 存儲桶創建（通過 Supabase storage schema）

insert into storage.buckets (id, name, public)
values ('voice-recordings', 'voice-recordings', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('exports', 'exports', false)
on conflict (id) do nothing;

create policy "Users can upload own voice recordings"
  on storage.objects for insert
  with check (
    bucket_id = 'voice-recordings' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read own voice recordings"
  on storage.objects for select
  using (
    bucket_id = 'voice-recordings' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own voice recordings"
  on storage.objects for delete
  using (
    bucket_id = 'voice-recordings' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can upload own exports"
  on storage.objects for insert
  with check (
    bucket_id = 'exports' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read own exports"
  on storage.objects for select
  using (
    bucket_id = 'exports' and
    (storage.foldername(name))[1] = auth.uid()::text
  );
