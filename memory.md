# 今心 ImXin 快速交接板

> 這份 `memory.md` 是給續接 agent 的短記憶，不取代 `AGENTS.md` 與 `CHANGELOG.md`。

---

## 目前主線（2026-05-14）

- 最新可測版本已部署到 production PWA：`https://today-mood.zeabur.app/`。
- 目前工作分支：`codex/stitch-ui-polish-20260513`。
- 最新已推 commit：
  - `c21e588 fix: 補上 LINE 官方帳號入口`
  - `584e907 fix: 明確化 LINE Bot 綁定入口`
  - `25dcca1 fix: 將首頁右上角改為純圖示`
  - `7dd80d1 fix: 收回原版首頁並補 LINE Bot 綁定入口`
  - `440c380 fix: 收斂朋友試玩前的 UI 信任問題`
- PM 狀態：可發給 1-3 位朋友封閉試玩；仍不要公開大量宣傳。

## 朋友試玩入口

- PWA：`https://today-mood.zeabur.app/`
- LINE 官方帳號：
  - 顯示名稱：`鋅鋰師拔麻的小小額葉養成手札`
  - Basic ID：`@980pqrhn`
  - 加入連結：`https://line.me/R/ti/p/@980pqrhn`
- 目前這個 LINE 帳號名稱不是「今心」，朋友可能會疑惑；正式公開前建議在 LINE 後台改名或補品牌說明。

## 這輪已完成

- 首頁回到使用者偏好的原版安靜風格，保留快速記錄、LINE Bot 說明與心情矩陣。
- 右上角「勳 / 系 / 訊」已改成無文字 SVG 圖示；無障礙標籤仍保留功能語意。
- 首頁 LINE Bot 卡片已顯示正式 LINE 帳號名稱、`@980pqrhn` 與「加入 LINE 官方帳號」連結。
- Coach 頁 LINE 綁定卡移到第一屏，清楚寫出：
  - 先加入上方 LINE 官方帳號
  - 在 LINE 對它輸入「綁定」
  - 複製 LINE 回覆的 6 位碼，貼到 APP
- 從首頁「前往教練綁定」會寫入 `sessionStorage.imxin_focus_line_binding`，到 Coach 後自動聚焦 `LINE 綁定碼` 輸入框。
- LINE 帳號資訊集中在 `src/constants/lineBot.ts`，首頁與 Coach 共用。

## 已驗證

- `npm run test:run` → 348/348 passed
- `npx tsc --noEmit` → passed
- `npm run build` → passed
- `npm run lint` → 0 errors / 31 existing warnings
- `git diff --check` → passed
- Production live smoke：
  - 首頁可看到 `鋅鋰師拔麻的小小額葉養成手札` 與 `@980pqrhn`
  - 首頁與 Coach 的 LINE 加入連結皆為 `https://line.me/R/ti/p/@980pqrhn`
  - 點首頁「前往教練綁定」後進入 `#coach` 並聚焦 `LINE 綁定碼`

## 下一步最短清單

1. 用真 LINE 帳號加入 `@980pqrhn`。
2. 在 LINE 對 Bot 輸入「綁定」。
3. 把 LINE 回覆的 6 位碼貼到 PWA Coach 頁。
4. 在 LINE 完成一次 RULER。
5. 回 PWA 確認 Coach / 週報能讀到該次資料。
6. 如果朋友看見 LINE 顯示名稱覺得怪，先不要公開宣傳，改 LINE 官方帳號名稱後再推。

## 不要混入今晚版本

- 主動推送 / schedule 相關功能尚未納入本次 production PWA polish，若要發佈需另跑 pg_cron / fallback smoke。
- 認證 / LocalStorage → InsForge 遷移仍未完成，不要宣傳跨裝置正式同步。
- 舊 PR #20 / `codex/stitch-ui-release-clean-20260513` 是先前 Stitch UI 發佈候選記錄；現在 production smoke 以 `codex/stitch-ui-polish-20260513` 為準。
