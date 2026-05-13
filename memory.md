# 今心 ImXin 快速交接板

> 這份 `memory.md` 是給續接 agent 的短記憶，不取代 `AGENTS.md` 與 `CHANGELOG.md`。

---

## 目前主線（2026-05-13 晚）

- 今晚可做 **1-3 人封閉內測**，不建議公開宣傳或大量開放。
- Stitch UI 發佈候選已整理為 PR #20：`https://github.com/samulee003/EQ-monitor/pull/20`。
- 乾淨發佈分支：`codex/stitch-ui-release-clean-20260513`。
- 發佈候選 commit：`f4030b3 feat: 套用 Stitch UI 視覺更新`。
- PR #20 只接在 `origin/main` 後加 1 個 UI commit，不包含 schedule commit、`memory.md` 舊草稿或 Stitch 原始匯出素材。

## PR #20 內容

- 套用 Stitch / Luminous Morandi 視覺語言到 Coach、打卡、歷史時間軸、成長洞察、成就頁與全域導覽。
- Coach 頁加入 Stitch 聊天畫布、快速回覆、LINE 綁定卡、固定輸入欄與底部導覽。
- 修正安全信任風險：
  - 首屏不再暗示讀到睡眠資料。
  - SOS 按鈕明確顯示 `SOS`。
  - Meta-Moment 補回安心專線 `1925` 與生命線 `1909`。

## 已驗證

- 乾淨 release worktree：
  - `git diff --check`
  - `./node_modules/.bin/tsc --noEmit`
  - `npm run test:run -- src/pages/CoachPage.test.tsx src/components/coach/ChatInput.test.tsx` → 20/20 passed
  - `npm run build`
- 原工作區完整補驗：
  - `npm run test:run` → 338/338 passed
  - `npm run test:e2e` → 4/4 passed
  - `cd server && npm run test:run` → 133/133 passed
  - `cd server && npm run build`
- Bot / production smoke 由 agent team 驗證：
  - `https://imxin-bot.zeabur.app/health` → 200 healthy，adapter=`insforge`
  - `/api/line-binding/claim {}` → 400，不寫入資料
  - `/webhook` 無簽名 / 假簽名 → 401

## 今晚最短發布路線

1. 合併 PR #20 到 `main`。
2. 讓 Zeabur 從 `main` 重新部署 PWA。
3. 驗證 `https://today-mood.zeabur.app/` 已載入新 asset hash。
4. 驗證 `https://imxin-bot.zeabur.app/health` 仍為 healthy。
5. 用真 LINE 帳號跑一次完整 E2E：
   - LINE 輸入「綁定」
   - PWA 貼 6 位碼
   - LINE 完成 RULER
   - Coach / 週報讀到該次資料

## 不要混入今晚 PR

- `server/insforge/functions/_shared/scheduleHelpers.ts`：屬於 schedule / 主動推送線，不在 PR #20。
- `stitch_design_system_implementation/`：Stitch 原始匯出素材，不進 production commit。
- 舊本地分支 `codex/stitch-ui-release-20260513`：含 schedule commit ancestry，不作為今晚正式發佈來源。

