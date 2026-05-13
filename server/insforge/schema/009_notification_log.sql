-- 009_notification_log.sql
-- 主動推送冪等記錄表：避免同一天對同一用戶重複發送同類型通知
-- 對應 schedules：weekly-report 批次、achievement-checker 主動關懷掃描

create table if not exists public.notification_log (
  user_id text not null,
  type text not null check (type in ('weekly_report', 'care_silent', 'care_red_streak', 'habit_reminder')),
  run_date date not null default current_date,
  channel text not null default 'line' check (channel in ('line', 'push', 'email')),
  payload jsonb,
  sent_at timestamptz default now(),
  primary key (user_id, type, run_date)
);

create index if not exists idx_notification_log_sent_at
  on public.notification_log (sent_at desc);

create index if not exists idx_notification_log_type_date
  on public.notification_log (type, run_date desc);

alter table public.notification_log enable row level security;

drop policy if exists "Service role full access notification log"
  on public.notification_log;

create policy "Service role full access notification log"
  on public.notification_log for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- pg_cron schedule（如平台已啟用 pg_cron extension）：
-- 由 server/insforge/schedules/ 內的 SQL 註冊；本檔僅維護資料表。
