# InsForge Schedule（主動推送排程）

目的：以 InsForge 平台原生 `pg_cron` 觸發 Edge Functions，定期執行週報與主動關懷推送。如 InsForge CLI 已支援 `schedules` 子命令，請優先使用 CLI；否則用本目錄下的 SQL 直接 `INSERT INTO cron.job`。

> **時區**：pg_cron 預設 UTC。下方 cron 表達式皆為 UTC，台北時間請 +8 後驗算。

## 三個排程

| 名稱 | 觸發 (UTC) | 觸發 (台北) | 目標 endpoint | mode |
|------|------------|-------------|---------------|------|
| `weekly-report-batch` | `0 13 * * 0` | 每週日 21:00 | `/functions/v1/weekly-report` | `batch` |
| `care-scan-daily` | `0 2 * * *` | 每日 10:00 | `/functions/v1/achievement-checker` | `scan` |
| `habit-reminder` | （暫不啟用） | — | — | — |

## 啟用步驟

### 1. 確認 pg_cron 已啟用

```bash
bash server/scripts/check-pg-cron.sh
```

若顯示「pg_cron 未啟用」，先以 superuser 連線執行：

```sql
create extension if not exists pg_cron;
```

InsForge 雲端版若無 superuser 權限，請聯絡平台支援，或改用 GitHub Actions 備援（見 `.github/workflows/cron-fallback.yml`）。

### 2. 透過 InsForge CLI（如支援）

```bash
npx @insforge/cli schedules apply server/insforge/schedules/
```

### 3. 退而求其次：直接寫入 cron.job

```bash
npx @insforge/cli db query "$(cat server/insforge/schedules/000_install.sql)"
```

或用 `psql $DATABASE_URL -f server/insforge/schedules/000_install.sql`。

### 4. 移除排程

```bash
npx @insforge/cli db query "select cron.unschedule('weekly-report-batch'); select cron.unschedule('care-scan-daily');"
```

## 必要環境變數

Edge Function runtime 需具備：

- `INSFORGE_BASE_URL` / `INSFORGE_URL`
- `SERVICE_ROLE_KEY` 或 `API_KEY`
- `LINE_CHANNEL_ACCESS_TOKEN`（用於 LINE Push）

`cron.job` 內以 `net.http_post`（pg_net）呼叫 function；請先確認 InsForge 已安裝 `pg_net` extension。

## LINE Push 配額提醒

LINE Messaging API 免費方案每月 200 則推播。請在用戶 onboarding 提供 **opt-in** 選項，避免無聲超額。本系統已透過 `notification_log` 與 7 天冷卻機制控制頻次。
