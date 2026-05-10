-- 002_ruler_logs.sql
-- 情緒日誌核心表

create table if not exists public.ruler_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
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

create index idx_ruler_logs_user_created
  on public.ruler_logs (user_id, created_at desc);

create index idx_ruler_logs_user_fullflow
  on public.ruler_logs (user_id, is_full_flow);

alter table public.ruler_logs enable row level security;

create policy "Users can CRUD own logs"
  on public.ruler_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
