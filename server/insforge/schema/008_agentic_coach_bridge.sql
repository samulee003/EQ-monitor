-- 008_agentic_coach_bridge.sql
-- 內測版 Agentic Coach 橋接層：
-- 1. line_user_bindings：讓 LINE Bot 與 PWA 本地使用者 ID 綁定
-- 2. agent_ruler_logs：支援非 auth.users UUID 的內測使用者記錄

create table if not exists public.line_user_bindings (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  line_user_id text not null,
  app_user_id text,
  status text default 'pending' check (status in ('pending', 'claimed', 'expired')),
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  claimed_at timestamptz
);

create index if not exists idx_line_user_bindings_code
  on public.line_user_bindings (code);

create index if not exists idx_line_user_bindings_app_user
  on public.line_user_bindings (app_user_id, claimed_at desc);

create index if not exists idx_line_user_bindings_line_user
  on public.line_user_bindings (line_user_id, claimed_at desc);

alter table public.line_user_bindings enable row level security;

drop policy if exists "Service role full access line bindings"
  on public.line_user_bindings;

create policy "Service role full access line bindings"
  on public.line_user_bindings for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create table if not exists public.agent_ruler_logs (
  id uuid default gen_random_uuid() primary key,
  app_user_id text not null,
  line_user_id text,
  source text not null default 'coach' check (source in ('coach', 'line', 'pwa')),
  emotions jsonb not null default '[]',
  intensity integer not null check (intensity >= 1 and intensity <= 10),
  body_scan jsonb,
  understanding jsonb,
  expressing jsonb,
  regulating jsonb,
  physical_context jsonb,
  post_mood text,
  is_full_flow boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_agent_ruler_logs_app_user_created
  on public.agent_ruler_logs (app_user_id, created_at desc);

create index if not exists idx_agent_ruler_logs_line_user_created
  on public.agent_ruler_logs (line_user_id, created_at desc);

alter table public.agent_ruler_logs enable row level security;

drop policy if exists "Service role full access agent logs"
  on public.agent_ruler_logs;

create policy "Service role full access agent logs"
  on public.agent_ruler_logs for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
