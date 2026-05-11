-- 006_coach_messages.sql
-- 教練對話歷史表，支援多輪對話記憶

create table if not exists public.coach_messages (
  id uuid default gen_random_uuid() primary key,
  session_id text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('user', 'model')),
  content text not null,
  created_at timestamptz default now()
);

create index idx_coach_messages_session_created
  on public.coach_messages (session_id, created_at desc);

create index idx_coach_messages_user_created
  on public.coach_messages (user_id, created_at desc);

alter table public.coach_messages enable row level security;

create policy "Users can read own coach messages"
  on public.coach_messages for select
  using (auth.uid() = user_id);

create policy "Users can insert own coach messages"
  on public.coach_messages for insert
  with check (auth.uid() = user_id);

create policy "Service role can manage coach messages"
  on public.coach_messages for all
  using (false)
  with check (false);
