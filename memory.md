# 今心 ImXin V1.0 快速交接板

> 這份 `memory.md` 是給續接 agent 的短記憶，不取代 `AGENTS.md` 與 `CHANGELOG.md`。如果資訊衝突，以 `AGENTS.md` 的工程規範與最新 git 狀態為準。

---

## 目前主線（2026-05-15）

- 產品版本：`V1.0.0`，定為今心產品起點。
- 目前本地主線與 `origin/main`：`baa6275 docs: 同步 Agentic Action Loop 實作計畫`。
- Agentic Action Loop MVP 已直接 push 到 `origin/main`，包含 commits `8f58d28` through `baa6275`。
- 重要前序：`636b8e4 Rename 知心四式 moves`；方法語言風險收斂 commit 為 `582659e Reduce method language overlap risk`。
- 前一個發布工作分支：`codex/stitch-ui-release-20260513`，已快轉合入 `main`。
- 根目錄已新增 `AGENTS.md`，作為後續 agent 的工程與產品語言規範。
- 產品判斷：可以給 1-3 位熟人封閉試玩；不要用正式醫療、治療或大量公開宣傳語氣。

## Agentic Action Loop MVP（2026-05-15）

- 新規格：`docs/superpowers/specs/2026-05-15-7-day-coach-momentum.md`。
- 新 ADR：`docs/adr/0001-complete-agentic-action-loop-for-coach.md`。
- 實作計畫：`docs/superpowers/plans/2026-05-15-complete-agentic-action-loop.md`。
- 詞彙脈絡：`CONTEXT.md`。
- 產品核心：阿念是 Agentic 情緒代理；遊戲化待辦只是工具層。
- 技術核心：必須實作 Observe → Orient → Plan → Act → Persist → Evaluate → Adjust，不可只做 prompt + 單次 function call。
- 第一個實作切片已完成：PWA Coach 可完成一次 7 日小陪跑小行動閉環，包含 trace、guardrails、micro-action state、basic XP / coins。
- 新資料表：`server/insforge/schema/011_coach_action_loop.sql`，包含 `coach_micro_actions`、`coach_gamification_stats`、`coach_agent_traces`。
- Runtime：`server/insforge/functions/coach-simple.ts` 已接上 max-3-step action loop；危機 path 會 `crisis_reward_blocked`，不得建立小行動或獎勵。
- Core helpers：`server/insforge/functions/_shared/coachActionLoop.ts` 負責 intent classification、pending proposal、expiry、reward、review streak、level。
- Frontend：`src/pages/CoachPage.tsx` 已接 7 日小陪跑 CTA、`MicroActionCard`、`GamificationStrip`、`CoachResponse` metadata，並顯示 `Beta` 內測標籤與 AI 回合使用上限提示。
- 內測額度決策：未來要限制會呼叫 Gemini 的「AI 對話回合」；提醒、小行動回報、SOS / 緊急安定應走 deterministic template 或狀態機，不應因 AI 回合用完而失效。
- 測試：focused frontend 3 files / 30 tests passed；focused server loop/eval/guardrail 3 files / 41 tests passed；frontend/server build passed；`git diff --check` passed。
- 注意：小行動第一版只在 PWA Coach 建立與回報，LINE Bot 暫不建立小行動狀態機。

## 對話資料與模型路線（2026-05-15）

- **短期（現在到下一輪封測）**：不要急著 fine-tune。先補 20-50 條高品質對話樣本與 eval case，重點放在語氣、角色邊界、危機守門、intent routing、提出一個小行動與回報後的調整語句。樣本要從真對話整理，但必須先匿名化、去除敏感識別資訊，再由人標註。
- **中期（1-2 個月）**：建立「對話資料飛輪」：收集同意後的聊天片段 -> 匿名化 -> 標註 intent / 危機 / 回報類型 / 好壞案例 -> 產生 golden set 與回歸測試 -> 用 few-shot 範例與 prompt 版本比較改善。這一階段優先做評估與路由，不優先做模型訓練。
- **長期（3 個月以上）**：如果真的需要模型層改善，再考慮平台是否支援 tuning，或用更強的模型負責摘要/複盤，Flash-Lite 維持低延遲回合。若有 fine-tuning 能力，也只拿高信心、已審核的樣本做離線訓練，不把原始對話直接拿去線上自我學習。
- **自我進化的真相**：對話歷史可以幫產品「變好」，但通常不是模型自己在線上自動學會。比較正確的做法是：歷史對話 -> 資料治理 -> 樣本/標註 -> 評估 -> 更新 prompt / 路由 / 規則 /（必要時）離線 tuning。這比較像產品資料飛輪，不是模型即時長出新能力。
- **對今心的意思**：阿念可以越來越懂人，但要靠人類整理樣本與守門，不能靠 raw logs 自動進化成失控的代理。

## V1.0 已完成的產品面

- PWA 已可作為共同入口：朋友用 LINE、WeChat 或其他通訊軟體，都可以直接打開 `https://today-mood.zeabur.app/` 使用網頁版。
- 無 hash 的根網址應直接進入 `#home` 今日心情；初次使用者看完動畫後仍會看到 App onboarding，已完成 onboarding 的使用者則直接露出四色選擇。產品說明改放在 App 內 `#about`「關於我們」，先由頁尾產品資訊進入，舊 `#landing` 只作相容轉址。
- LINE 是 V1.0 已驗證的對話入口：官方帳號 `鋅鋰師拔麻的小小額葉養成手札`，Basic ID `@980pqrhn`。
- WeChat 朋友先走 PWA 網頁，不做 WeChat Bot；WeChat Official Account / Bot 放 P2。
- 主導覽維持原版文案：`今日心情`、`記錄回顧`、`成長看板`、`教練`。
- Header 右上角為純 SVG 圖示列：成就、主題、提醒、帳號。
- 首頁與 Coach 首屏用一般人能懂的語氣呈現「阿念教練」：會接續情緒線索、慢慢看懂使用者節奏、陪使用者整理下一步。不要把第一層文案改成內部技術語。
- Coach 危機語句會回公開 enum `emergency_stabilization` 並觸發 `open_sos`。
- Coach 首屏現在有 `7 日小陪跑`，可把阿念建議轉為 24 小時內可回來回報的小行動。
- 遊戲化回饋是個人 XP / 金幣 / 等級 / 復盤連續，不做全站或好友排行榜，不做扣分模式。
- 前台方法語言定稿為 **知心四式：心照、喚名、安神、動念**。保留輕武俠心法感，但不要浮誇或神秘化。
- Active 前台 / prompt 語言已清掉 `How We Feel`、`Mood Meter`、`Meta-Moment` 等容易混淆的品牌化表述；保留 RULER-inspired / ACT-informed / IFS-informed / Dan Siegel-informed 的誠實來源與非官方邊界。

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
- Agentic Action Loop MVP 已落地到 production `coach` Edge Function source，但仍需部署後 live smoke 才能宣稱 production data path 已驗。

## 最新驗證基線

- `npm run test:run` → 368 tests / 40 files passed
- `cd server && npm run test:run` → 164 tests / 17 files passed
- `npx vitest run src/pages/CoachPage.test.tsx src/components/coach/MicroActionCard.test.tsx src/components/coach/GamificationStrip.test.tsx` → 30 tests / 3 files passed
- `cd server && npx vitest run insforge/functions/_shared/coachActionLoop.test.ts insforge/functions/_shared/coachActionLoopEval.test.ts insforge/functions/publishingGuardrails.test.ts` → 41 tests / 3 files passed
- `npm run build` → passed
- `cd server && npm run build` → passed
- `npm run lint` → 0 errors / 31 warnings
- `cd server && npm run lint` → 0 errors / 24 warnings
- `npm run test:e2e` → 4 passed
- `git diff --check` → passed
- Production smoke：PWA、LINE 綁定、LINE 情緒資料流、Coach、週報、主動排程、刪帳流程均已跑過；測試資料已清理。方法語言更名後尚未重新部署 production。

## 主要守門檔案

- `src/components/MainLayout.tsx`：主導覽、右上角純 SVG icons、帳號入口。
- `src/components/MainLayout.auth.test.tsx`：鎖定純圖示、登入入口、原版主導覽文案。
- `src/constants/lineBot.ts`：LINE 官方帳號名稱、Basic ID、加好友 URL。
- `src/components/CheckInFlow.tsx`：首頁 LINE 官方帳號入口。
- `src/pages/CoachPage.tsx`：Coach 返回按鈕、底部導覽文案、LINE 官方帳號與綁定碼入口。
- `src/pages/CoachPage.test.tsx`：鎖定 Coach 底部導覽原版文案、LINE 官方帳號入口、LINE 綁定碼流程。
- `src/components/coach/MicroActionCard.tsx`：小行動提案確認與 active 小行動回報卡。
- `src/components/coach/GamificationStrip.tsx`：個人 XP、金幣、等級與復盤連續摘要。
- `src/lib/adk/types.ts`：Coach action-loop response metadata 型別。
- `src/services/InsForgeAuthService.ts`：InsForge Auth、刪帳 tombstone guard。
- `src/services/AuthContext.tsx`：登入／註冊後初始化 `coach_context`。
- `server/src/rulerBot.ts`：LINE 輸入「綁定」產生 6 位碼。
- `server/insforge/functions/coach-simple.ts`：production `coach` Edge Function；因 InsForge 打包限制，需保持自包含 prompt builder。
- `server/insforge/functions/_shared/coachActionLoop.ts`：Agentic Action Loop deterministic core；改 intent / reward / expiry / pending proposal 時先補測試。
- `server/insforge/schema/011_coach_action_loop.sql`：micro-action、gamification、agent trace schema；保留 no-penalty non-negative checks 與 one-active-action partial unique indexes。
- `server/insforge/functions/delete-account.ts`：帳號刪除與 tombstone。
- `server/insforge/schema/010_account_deletions.sql`：刪帳最小紀錄 schema。

## 下一步

1. 部署 Agentic Action Loop schema + Edge Function + PWA 後，做 live smoke：開始 7 日小陪跑 → 建立小行動 → 回報 partial → 查 DB trace/stats。
2. 找 1 位非開發者用手機完整試玩，記錄哪一步不懂、卡住或不安心。
3. LINE 使用者：測 PWA → 加 LINE → 綁定 → LINE 情緒整理 → 回 Coach 問最近記錄；暫不測 LINE 建立小行動。
4. WeChat 使用者：直接開 PWA 網頁，測「網頁記錄 + Coach」，不要要求他先裝 LINE。
5. P1 只根據真回饋補：7 日小陪跑文案、LINE 綁定三步驟圖解、首頁入口分流。
6. P2 再考慮：LINE Bot 小行動、金幣商店、個人排行榜頁、Pro fake-door、WeChat Bot、LINE Push quota 長期監控、正式法律式隱私與免責審稿。
