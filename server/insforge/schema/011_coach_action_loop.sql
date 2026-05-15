-- 011_coach_action_loop.sql
-- Agentic Action Loop：微行動生命週期、個人獎勵狀態與 agent trace 稽核紀錄。

create table if not exists public.coach_micro_actions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  app_user_id text,
  source_log_id uuid,
  source text not null default 'coach' check (source in ('coach', 'pwa', 'line')),
  goal_key text,
  task_key text,
  title text not null,
  category text not null,
  status text not null default 'active' check (status in ('active', 'completed', 'partial', 'skipped', 'expired')),
  due_at timestamptz not null,
  reported_at timestamptz,
  report_text text,
  xp_awarded integer default 0,
  coins_awarded integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (user_id is not null or app_user_id is not null)
);

create index if not exists idx_coach_micro_actions_user_status_due
  on public.coach_micro_actions (user_id, status, due_at)
  where user_id is not null;

create index if not exists idx_coach_micro_actions_app_user_status_due
  on public.coach_micro_actions (app_user_id, status, due_at)
  where app_user_id is not null;

alter table public.coach_micro_actions enable row level security;

drop policy if exists "Users can read own coach micro actions"
  on public.coach_micro_actions;

create policy "Users can read own coach micro actions"
  on public.coach_micro_actions for select
  using (auth.uid() = user_id);

drop policy if exists "Service role full access coach micro actions"
  on public.coach_micro_actions;

create policy "Service role full access coach micro actions"
  on public.coach_micro_actions for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create table if not exists public.coach_gamification_stats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  app_user_id text,
  total_xp integer default 0,
  coin_balance integer default 0,
  lifetime_coins integer default 0,
  total_reported integer default 0,
  completed_count integer default 0,
  partial_count integer default 0,
  skipped_count integer default 0,
  current_review_streak integer default 0,
  longest_review_streak integer default 0,
  last_review_date date,
  updated_at timestamptz default now(),
  check (user_id is not null or app_user_id is not null)
);

create unique index if not exists idx_coach_gamification_stats_user
  on public.coach_gamification_stats (user_id)
  where user_id is not null;

create unique index if not exists idx_coach_gamification_stats_app_user
  on public.coach_gamification_stats (app_user_id)
  where app_user_id is not null;

alter table public.coach_gamification_stats enable row level security;

drop policy if exists "Users can read own coach gamification stats"
  on public.coach_gamification_stats;

create policy "Users can read own coach gamification stats"
  on public.coach_gamification_stats for select
  using (auth.uid() = user_id);

drop policy if exists "Service role full access coach gamification stats"
  on public.coach_gamification_stats;

create policy "Service role full access coach gamification stats"
  on public.coach_gamification_stats for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create table if not exists public.coach_agent_traces (
  id uuid default gen_random_uuid() primary key,
  user_id uuid,
  app_user_id text,
  session_id text not null,
  step integer not null,
  phase text not null,
  intent text,
  tool_name text,
  guardrail_result text,
  payload jsonb not null default '{}',
  created_at timestamptz default now(),
  check (user_id is not null or app_user_id is not null)
);

create index if not exists idx_coach_agent_traces_user_session_created
  on public.coach_agent_traces (user_id, session_id, created_at)
  where user_id is not null;

create index if not exists idx_coach_agent_traces_app_user_session_created
  on public.coach_agent_traces (app_user_id, session_id, created_at)
  where app_user_id is not null;

alter table public.coach_agent_traces enable row level security;

drop policy if exists "Service role full access coach agent traces"
  on public.coach_agent_traces;

create policy "Service role full access coach agent traces"
  on public.coach_agent_traces for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
