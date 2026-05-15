# 今心 ImXin V1.0 快速交接板

> 這份 `memory.md` 是給續接 agent 的短記憶，不取代 `AGENTS.md` 與 `CHANGELOG.md`。如果資訊衝突，以 `AGENTS.md` 的工程規範與最新 git 狀態為準。

---

## 目前主線（2026-05-14）

- 產品版本：`V1.0.0`，定為今心產品起點。
- 目前主線：`main` / `origin/main` 均已指向 `cc21e8d fix: 補齊公開前刪帳與推送守門`。
- 前一個發布工作分支：`codex/stitch-ui-release-20260513`，已快轉合入 `main`。
- 工作區仍可能有未追蹤規格書：`docs/superpowers/specs/2026-05-14-imxin-current-app-spec.md`，不要未確認就混進產品提交。
- 產品判斷：可以給 1-3 位熟人封閉試玩；不要用正式醫療、治療或大量公開宣傳語氣。

## V1.0 已完成的產品面

- PWA 已可作為共同入口：朋友用 LINE、WeChat 或其他通訊軟體，都可以直接打開 `https://today-mood.zeabur.app/` 使用網頁版。
- LINE 是 V1.0 已驗證的對話入口：官方帳號 `鋅鋰師拔麻的小小額葉養成手札`，Basic ID `@980pqrhn`。
- WeChat 朋友先走 PWA 網頁，不做 WeChat Bot；WeChat Official Account / Bot 放 P2。
- 主導覽維持原版文案：`今日心情`、`記錄回顧`、`成長看板`、`教練`。
- Header 右上角為純 SVG 圖示列：成就、主題、提醒、帳號。
- 首頁與 Coach 首屏用一般人能懂的語氣呈現「主動 AI 教練」，不要把第一層文案改成內部技術語。
- Coach 危機語句會回公開 enum `emergency_stabilization` 並觸發 `open_sos`。

## V1.0 已完成的技術面

- PWA、Bot Server、InsForge Edge Functions 已上線或完成 production smoke。
- 已部署／驗證的 Edge Functions：
  - `coach`
  - `weekly-report`
  - `achievement-checker`
  - `delete-account`
- InsForge Auth 已接入 PWA：登入、註冊、session 保留、`coach_context` 初始化已驗。
- 真 LINE 綁定 E2E 已驗：LINE 取碼 → production PWA Coach 貼碼 → 畫面顯示已綁定。
- Production LINE 情緒資料流已驗：有效簽名 webhook → 完整知心四式 → `agent_ruler_logs` → `weekly-report` → Coach 讀到資料。
- Bot `/webhook` 已啟用 LINE 簽名驗證：缺少或無效 `x-line-signature` 回 401。
- 主動推送排程已啟用：`pg_cron` / `pg_net` installed，`weekly-report-batch` 與 `care-scan-daily` active。
- 主動推送守門已補齊：需要有 LINE 綁定與 opt-in，避免未同意推送。
- 刪除帳號已補齊：`delete-account` 清理 app/public 資料並寫入 `account_deletions` 最小 tombstone；前端阻擋已刪帳號再次進入產品。
- `privacy.html` 與 `account-deletion.html` 已補上資料刪除範圍與最小刪除紀錄說明。

## 最新驗證基線

- `npm run test:run` → 372 tests / 40 files passed
- `cd server && npm run test:run` → 160 tests / 16 files passed
- `npx tsc --noEmit` → passed
- `npm run build` → passed
- `cd server && npm run build` → passed
- `npm run lint` → 0 errors / 31 warnings
- `git diff --check` → passed
- Production smoke：PWA、LINE 綁定、LINE 情緒資料流、Coach、週報、主動排程、刪帳流程均已跑過；測試資料已清理。

## 主要守門檔案

- `src/components/MainLayout.tsx`：主導覽、右上角純 SVG icons、帳號入口。
- `src/components/MainLayout.auth.test.tsx`：鎖定純圖示、登入入口、原版主導覽文案。
- `src/constants/lineBot.ts`：LINE 官方帳號名稱、Basic ID、加好友 URL。
- `src/components/CheckInFlow.tsx`：首頁 LINE 官方帳號入口。
- `src/pages/CoachPage.tsx`：Coach 返回按鈕、底部導覽文案、LINE 官方帳號與綁定碼入口。
- `src/pages/CoachPage.test.tsx`：鎖定 Coach 底部導覽原版文案、LINE 官方帳號入口、LINE 綁定碼流程。
- `src/services/InsForgeAuthService.ts`：InsForge Auth、刪帳 tombstone guard。
- `src/services/AuthContext.tsx`：登入／註冊後初始化 `coach_context`。
- `server/src/rulerBot.ts`：LINE 輸入「綁定」產生 6 位碼。
- `server/insforge/functions/coach-simple.ts`：production `coach` Edge Function；因 InsForge 打包限制，需保持自包含 prompt builder。
- `server/insforge/functions/delete-account.ts`：帳號刪除與 tombstone。
- `server/insforge/schema/010_account_deletions.sql`：刪帳最小紀錄 schema。

## 下一步

1. 找 1 位非開發者用手機完整試玩，記錄哪一步不懂、卡住或不安心。
2. LINE 使用者：測 PWA → 加 LINE → 綁定 → LINE 情緒整理 → 回 Coach 問最近記錄。
3. WeChat 使用者：直接開 PWA 網頁，測「網頁記錄 + Coach」，不要要求他先裝 LINE。
4. P1 只根據真回饋補：LINE 綁定三步驟圖解、首頁入口分流、Coach 首屏文案。
5. P2 再考慮：WeChat Bot、LINE Push quota 長期監控、主動推送 opt-in 設定頁、更多手機 viewport E2E、正式法律式隱私與免責審稿。
