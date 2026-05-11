-- 007_coach_context.sql
-- AI 教練上下文表（僅存元數據，不存日記內容）

create table if not exists public.coach_context (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  last_active timestamptz default now(),
  streak_days integer default 0,
  recent_quadrants text[] default '{}',
  recent_needs text[] default '{}',
  avg_intensity float default 0,
  subscription_tier text default 'free' check (subscription_tier in ('free', 'pro')),
  proactive_count_this_month integer default 0,
  coach_opted_in boolean default false,
  line_user_id text,
  push_token text,
  coach_memory_expires_at timestamptz,
  migration_completed_at timestamptz,
  updated_at timestamptz default now()
);

alter table public.coach_context enable row level security;

create policy "Users can read own coach_context"
  on public.coach_context for select
  using (auth.uid() = user_id);

create policy "Users can insert own coach_context"
  on public.coach_context for insert
  with check (auth.uid() = user_id);

create policy "Users can update own coach_context"
  on public.coach_context for update
  using (auth.uid() = user_id);

-- Service role 可讀寫（供 edge function 使用）
create policy "Service role full access"
  on public.coach_context for all
  using (auth.role() = 'service_role');
