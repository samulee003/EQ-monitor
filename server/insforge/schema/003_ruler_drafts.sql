-- 003_ruler_drafts.sql
-- 流程草稿表（每用戶一條）

create table if not exists public.ruler_drafts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  step text not null,
  selected_quadrants jsonb default '[]',
  selected_emotions jsonb default '[]',
  emotion_intensity integer,
  body_scan jsonb,
  understanding jsonb,
  expressing jsonb,
  regulating jsonb,
  is_full_flow boolean default false,
  post_regulation_mood text,
  updated_at timestamptz default now()
);

alter table public.ruler_drafts enable row level security;

create policy "Users can CRUD own drafts"
  on public.ruler_drafts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
