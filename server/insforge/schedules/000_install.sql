-- pg_cron + pg_net 排程註冊
-- 使用前提：
--   1. 已執行 `create extension if not exists pg_cron;`
--   2. 已執行 `create extension if not exists pg_net;`
--   3. InsForge function endpoint 與 service role key 可呼叫
--
-- 替換以下 placeholder（部署時可用 psql -v 或手動編輯）：
--   :insforge_base_url  例：https://b88egxiz.ap-southeast.insforge.app
--   :service_role_key   InsForge service role key

-- 安全卸載再註冊（idempotent）
do $$
begin
  perform cron.unschedule('weekly-report-batch')
    where exists (select 1 from cron.job where jobname = 'weekly-report-batch');
exception when others then null;
end$$;

do $$
begin
  perform cron.unschedule('care-scan-daily')
    where exists (select 1 from cron.job where jobname = 'care-scan-daily');
exception when others then null;
end$$;

-- 1. 週報批次：每週日 13:00 UTC（台北 21:00）
select cron.schedule(
  'weekly-report-batch',
  '0 13 * * 0',
  $cmd$
  select net.http_post(
    url := :'insforge_base_url' || '/functions/v1/weekly-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || :'service_role_key'
    ),
    body := jsonb_build_object('mode', 'batch')
  );
  $cmd$
);

-- 2. 主動關懷掃描：每日 02:00 UTC（台北 10:00）
select cron.schedule(
  'care-scan-daily',
  '0 2 * * *',
  $cmd$
  select net.http_post(
    url := :'insforge_base_url' || '/functions/v1/achievement-checker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || :'service_role_key'
    ),
    body := jsonb_build_object('mode', 'scan')
  );
  $cmd$
);

-- 確認註冊結果
select jobname, schedule, active from cron.job
  where jobname in ('weekly-report-batch', 'care-scan-daily')
  order by jobname;
