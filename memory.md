# 今心 ImXin 快速交接板

> 這份 `memory.md` 是給續接 agent 的短記憶，不取代 `AGENTS.md` 與 `CHANGELOG.md`。

---

## 目前主線（2026-05-14）

- 目前分支：`codex/stitch-ui-release-20260513`。
- 目前分支已推上 GitHub，最新重要 commits：
  - `61f61fd fix: 將頁首帳號入口改為純圖示`
  - `9a5c5c3 fix: 恢復原版導覽文案`
  - `9219bc3 fix: 補上 LINE 官方帳號入口`
- Production PWA 已驗證版本：`https://today-mood.zeabur.app/?v=linebot-entry-70313a2#home`
- 內測判斷仍是黃燈偏綠：可以給 1-3 人／小圈朋友封閉試玩，不建議大量公開或投放式宣傳。
- 真 LINE 帳號完整 E2E 仍未跑。

## 本輪最新修正

- 右上角快捷操作已改成純 SVG 圖示：
  - 成就：獎盃圖示，aria-label `我的成就`
  - 主題：系統／月亮／太陽圖示，aria-label `切換主題：系統`
  - 提醒：鈴鐺圖示，aria-label `提醒設定`
  - 帳號：人像圖示，aria-label `登入或註冊帳號`
- 帳號圖示行為：
  - 未登入：打開登入／註冊 modal
  - 已登入：打開個人中心
- 主導覽已恢復使用者指定的原版文案：
  - `今日心情`
  - `記錄回顧`
  - `成長看板`
  - `教練`
- `CoachPage` 底部導覽與返回按鈕也同步改回原版文案。
- LINE 官方帳號入口已補回首頁與 Coach 綁定區：
  - 顯示名稱：`鋅鋰師拔麻的小小額葉養成手札`
  - Basic ID：`@980pqrhn`
  - 加好友連結：`https://line.me/R/ti/p/@980pqrhn`
- 新增測試鎖住這三件事，避免之後 merge 又把導覽改回 `安定室 / 紀錄 / 洞察 / 主動教練`、把右上角改回文字按鈕，或移除 LINE 官方帳號入口。

## 線上部署與 smoke

- Zeabur PWA 已重新部署。
- 注意：`npx zeabur deploy` 回 `Service deployed successfully` 時，最新 deployment 可能仍是 `BUILDING`；必須等 `zeabur deployment list` 顯示最新 deployment `RUNNING` 後再 smoke，否則正式網址可能還吐上一包。
- 線上 smoke 已確認：
  - Header nav 是 `今日心情 / 記錄回顧 / 成長看板 / 教練`
  - `.header-actions` 四個按鈕都是純 SVG，沒有可見文字
  - 帳號圖示可開登入 modal
  - `document.body` 不再包含 `安定室`
  - 首頁與 Coach 綁定區都顯示 `鋅鋰師拔麻的小小額葉養成手札`、`@980pqrhn`、LINE 加好友連結

## 最新驗證

- `npm run test:run -- src/components/CheckInFlow.test.tsx src/pages/CoachPage.test.tsx` → 27 tests passed
- `npm run test:run -- src/components/MainLayout.auth.test.tsx src/pages/CoachPage.test.tsx` → 24 tests passed（前一輪導覽／帳號入口驗證）
- `npx tsc --noEmit` → passed
- `npm run test:run` → 366 tests / 39 files passed
- `npm run build` → passed
- `git diff --check` → passed
- 前一次 lint 基線：`npm run lint` → 0 errors / 31 warnings
- 後端基線仍是：`cd server && npm run test:run` → 156 tests / 15 files passed；`cd server && npm run build` → passed

## 主要檔案

- `src/components/MainLayout.tsx`：主導覽、右上角純 SVG icons、帳號入口。
- `src/components/MainLayout.auth.test.tsx`：鎖定純圖示、登入入口、原版主導覽文案。
- `src/constants/lineBot.ts`：LINE 官方帳號名稱、Basic ID、加好友 URL。
- `src/components/CheckInFlow.tsx`：首頁 LINE 官方帳號入口。
- `src/pages/CoachPage.tsx`：Coach 返回按鈕、底部導覽文案、LINE 官方帳號與綁定碼入口。
- `src/pages/CoachPage.test.tsx`：鎖定 Coach 底部導覽原版文案、LINE 官方帳號入口、LINE 綁定碼流程。
- `src/services/InsForgeAuthService.ts`：InsForge Auth service。
- `src/services/AuthContext.tsx`：登入／註冊後初始化 `coach_context`。
- `server/src/rulerBot.ts`：LINE 輸入「綁定」產生 6 位碼。
- `server/insforge/functions/coach-simple.ts`：production `coach` Edge Function；因 InsForge 打包限制，需保持自包含 prompt builder。

## 明確剩餘事項

1. 真 LINE 帳號完整 E2E：LINE「綁定」→ PWA 貼碼 → LINE 完成 RULER → Coach / 週報讀到資料。
2. 若要把本分支正式合併回 `main`，先確認 GitHub PR/merge 策略，不要 reset 或覆蓋目前發布修正。
3. 若要合併 schedule 相關變更，仍需用真實資料庫環境檢查 pg_cron / schedule。
