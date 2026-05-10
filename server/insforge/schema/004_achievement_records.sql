-- 004_achievement_records.sql
-- 成就解鎖記錄表

create table if not exists public.achievement_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  achievement_key text not null,
  unlocked_at timestamptz default now(),
  viewed boolean default false,
  unique (user_id, achievement_key)
);

create index idx_achievements_user
  on public.achievement_records (user_id, unlocked_at desc);

alter table public.achievement_records enable row level security;

create policy "Users can CRUD own achievements"
  on public.achievement_records
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
