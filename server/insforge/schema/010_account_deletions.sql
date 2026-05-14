-- 010_account_deletions.sql
-- 帳號刪除 tombstone：保留最小紀錄，避免 Auth 身分殘留時被恢復登入。

create table if not exists public.account_deletions (
  user_id uuid primary key,
  email_hash text,
  reason text not null default 'user_requested',
  deleted_at timestamptz not null default now(),
  metadata jsonb not null default '{}'
);

create unique index if not exists idx_account_deletions_email_hash
  on public.account_deletions (email_hash)
  where email_hash is not null;

alter table public.account_deletions enable row level security;

drop policy if exists "Users can read own account deletion"
  on public.account_deletions;

create policy "Users can read own account deletion"
  on public.account_deletions for select
  using (auth.uid() = user_id);

drop policy if exists "Service role full access account deletions"
  on public.account_deletions;

create policy "Service role full access account deletions"
  on public.account_deletions for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
