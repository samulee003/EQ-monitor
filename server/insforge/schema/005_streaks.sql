-- 005_streaks.sql
-- 連續記錄統計表

create table if not exists public.streaks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_checkin_date date,
  checkin_count integer default 0,
  weekly_count integer default 0,
  monthly_count integer default 0,
  updated_at timestamptz default now()
);

alter table public.streaks enable row level security;

create policy "Users can read own streaks"
  on public.streaks for select
  using (auth.uid() = user_id);

create policy "Service role can update streaks"
  on public.streaks for all
  using (false)
  with check (false);
