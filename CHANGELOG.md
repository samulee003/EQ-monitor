# 今心 ImXin 更新日誌

> 記錄重要產品變更、架構升級、部署驗證與後續風險。
> 若本檔與最新 git 狀態衝突，以最新 git 狀態與使用者最新指示為準。

---

## 讀法

- **[Unreleased]**：已在原始碼完成或本機驗證完成，但還沒有完整 production smoke 的變更。
- **[V1.0.0]**：今心產品起點版，是目前對外小圈封測的產品基線。
- **4.x / 3.x / 2.x / 1.x**：V1.0 前的內部衝刺與架構演進紀錄，保留作為追溯用。

## 目前狀態摘要（2026-05-16）

- `main` / `origin/main` 已包含 app 整合版 `0ef72fd fix: 整合 Debug Review 修正` 與 Coach LINE 首屏入口修補 `34b549c fix: 補 Coach 首屏 LINE 入口`；其後若只有 docs-only deployment note commit，不改變線上 app bundle。
- 今心目前定位為開源情緒覺察 PWA + LINE Bot；核心方法語言是 **知心四式：心照、喚名、安神、動念**。
- 阿念主線已轉為 **Agentic Action Loop**：Observe → Orient → Plan → Act → Persist → Evaluate → Adjust。
- 第一個可見閉環是 PWA Coach 的 **7 日小陪跑**：提案小行動 → 使用者確認 → 24 小時內回報 completed / partial / skipped → 阿念調整下一步。
- 產品可給 1-3 位熟人封閉試玩；尚不建議以正式醫療、治療服務或大規模公開宣傳語氣推出。
- 2026-05-16 已將 Debug / Review 整合版部署到 Zeabur；正式站 PWA 目前 serve bundle `index-C0yGyERj.js`，Bot Server deployment 已重新啟動並以 `insforge` adapter 運行。
- 2026-05-16 13:08 已重新部署 InsForge `delete-account` Edge Function；刪帳清除範圍已納入 `coach_micro_actions`、`coach_gamification_stats`、`coach_agent_traces`，並已回讀線上 function code 確認。

## 下一步

1. 做 Agentic Action Loop live API smoke：開始 7 日小陪跑 → 建立小行動 → 回報 partial → 查 `coach_micro_actions`、`coach_gamification_stats`、`coach_agent_traces`。
2. 找 1 位非開發者用手機完整試玩 `#coach`：開始陪跑 → 看見小行動提案 → 明確確認 → 回來回報 completed / partial / skipped。
3. LINE Bot 暫不建立小行動；先讓 PWA Coach 小行動閉環穩定。

## [V1.0.0] - 2026-05-16 — 刪帳範圍補齊 Agentic Action Loop 資料

- `delete-account` Edge Function 刪除清單補上 `coach_micro_actions`、`coach_gamification_stats`、`coach_agent_traces`，避免使用者刪除帳號後仍殘留 7 日小陪跑資料。
- 新增發布守門測試，之後若 Agentic Action Loop 資料表從刪帳流程漏掉會直接失敗。
- Production 已重新部署 `delete-account`，並以 `functions code delete-account` 回讀確認線上版本包含三張新表。
- Live smoke：`OPTIONS /delete-account` 回 204；未帶 Authorization 的 `POST /delete-account` 回 401。
- 驗證：`cd server && npx vitest run insforge/functions/publishingGuardrails.test.ts` → 11 tests passed；`cd server && npm run test:run` → 211 tests / 19 files passed；`cd server && npm run build` → passed；`cd server && npm run lint` → 0 errors / 24 warnings；`git diff --check` → passed。

## [V1.0.0] - 2026-05-16 — Coach 首屏 LINE 對話入口補強

- Coach 開場卡新增「也可以用 LINE 對話」輕量入口，直接顯示 LINE Basic ID `@980pqrhn` 與「輸入綁定」步驟，避免使用者必須滑到下方綁定表單才知道 LINE 可作為對話入口。
- 下方原本的 LINE 官方帳號、加好友連結與 6 位綁定碼表單保留，讓已拿到綁定碼的使用者仍可完成同步。
- 本機驗證：`npm run test:run -- src/pages/CoachPage.test.tsx` → 28 tests passed。
- Production 驗證：PWA deployment `6a07f08abbc71468fc733ca9` 曾以 `34b549c` 跑到 `RUNNING`；後續 docs-only deployment 不改變 app bundle，live bundle 維持 `index-C0yGyERj.js`。

---

## [V1.0.0] - 2026-05-16 — Debug Review 整合與 production 同步

### 同步狀態

- 合入 Claude 安全修正分支 `claude/festive-fermi-fe3154`，並把整合版推到 `main` / `origin/main`：`0ef72fd fix: 整合 Debug Review 修正`。
- PWA 已重新部署到 Zeabur；最新 live bundle 為 `index-C0yGyERj.js`，後續 docs-only push 可能觸發新的 Zeabur deployment，但不改變 app bundle。
- Bot Server 已重新部署到 Zeabur；deployment `6a07ee2bbbc71468fc733b92` 為 `RUNNING`，`/health` uptime 已重置，adapter 為 `insforge`。
- Live check：PWA root 取得 `index-C0yGyERj.js`；Bot `/health` 回 healthy；Bot `/webhook` 無簽名回 `401`。

### 修正摘要

- LINE Bot 新增共用危機字詞偵測，命中時直接回 SOS 資源，不建立或推進知心四式 session。
- Production 缺少 LINE credentials 時拒絕啟動，避免 webhook 進入未簽名 demo mode。
- InsForge adapter 補強結構化錯誤日誌，讓 production 問題較容易追查。
- 登入使用者新增情緒記錄時同步寫入 `ruler_logs`，並讓 `storageService.setUserId()` 真正切換使用者資料 cache。
- Coach 首屏保留 LINE 綁定入口，修復 E2E 找不到綁定面板的問題。
- Coach 首屏新增「也可以用 LINE 對話」入口卡，讓使用者不用先進入綁定表單也能看懂 LINE 官方帳號入口。
- Timeline / Coach 深色模式補強文字對比；匯入記錄與快速記錄後會刷新成長進度。
- `achievement-checker` 補齊前台可見成就規則，避免畫面看得到但 backend 不會解鎖。
- 文案持續收斂為「阿念教練」，降低「AI 教練」泛稱造成的角色漂移。

### 驗證

- `npm run test:run` → 393 tests / 44 files passed。
- `cd server && npm run test:run` → 210 tests / 19 files passed。
- `npm run build` → passed。
- `cd server && npm run build` → passed。
- `npm run lint` → 0 errors / 31 warnings。
- `cd server && npm run lint` → 0 errors / 24 warnings。
- `npm run test:e2e` → 4 passed。
- `git diff --check` → passed。

## [Unreleased] - 2026-05-15 — Agentic Action Loop MVP + 知心四式語言收斂

### PM 摘要

- **阿念已從聊天框升級為 action-loop coach**：第一版實作 Observe → Orient → Plan → Act → Persist → Evaluate → Adjust，不再只靠 prompt 或單次 function call 裝成 agentic。
- **7 日推動感成為第一個產品驗收**：目標是讓使用者在 7 天內感覺「阿念真的有推動我生活一點點」，不是承諾治療成效。
- **遊戲化只作為個人工具層**：XP、金幣、等級、復盤連續用來支持小行動，不做社交排行榜、扣分、失敗或羞辱式提醒。
- **方法語言已收斂**：前台不再使用容易被看成直接沿用 How We Feel / Mood Meter / Meta-Moment 的 active 品牌化語言。
- **知心四式定稿**：前台四式命名為 `心照 → 喚名 → 安神 → 動念`。
- **來源說法更誠實**：保留 RULER-inspired、ACT-informed、IFS-informed、Dan Siegel-informed，但明確寫清楚今心不是 Yale、RULER Approach、ACT、IFS、Dan Siegel / Mindsight Institute 或任何治療機構的官方產品，也不是心理治療。

### PWA final Live Mock

- 部署 PWA 至 Zeabur；最新 production deployment `6a073696bbc71468fc730cbc`，狀態 `RUNNING`。
- 正式站 `https://today-mood.zeabur.app/` 已切到 bundle `index-B-9lzdP6.js`。
- Live Mock 覆蓋 frontend root、Bot root、Bot `/health`、8 個頁面在 desktop / tablet / mobile 的檢視，以及 check-in、header 工具、guest login、history filter/edit/export、Coach 7 日小陪跑、LINE 綁定 mock、SOS、onboarding、privacy lock、unknown hash。
- 結果：有效 35/35 passed，console/page errors 0。
- 本輪 Live Mock 攔截 Coach / LINE 綁定 mutating requests，避免污染 production 資料；production DB trace/stats live API smoke 仍是下一個 gate。
- 修正 `src/adapters/storage.ts` 的 log update：更新記錄時產生新列表引用，解決記錄回顧編輯後畫面不刷新。
- 修正 `src/stores/appStore.ts`：無 hash / unknown hash 導回 `#home`、舊 `#landing` 導到 `#about`；應用鎖首次啟用但尚未設定 PIN 時會進入 PIN 設定畫面。
- 驗證：`npm run test:run` 384 tests / 43 files passed；`npm run test:e2e` 4 passed；`npm run build` passed；`npm run lint` 0 errors / 31 warnings；`git diff --check` passed。

### PWA PM 驗收修正

- 初次導覽角色選擇移除「育 / 通 / 學 / 職」單字大圖示，改為「照顧孩子的父母」「一般日常使用」「學生」「職場工作者」等可理解選項。
- 隱私導覽改為只承諾已落實的行為：未登入本機保存、登入同意才同步、可匯出本機記錄與登入後刪除帳號雲端資料。
- 模式導覽改為「每日提醒 / 週洞察 / 成就收藏」，避免把尚需 opt-in / LINE 綁定的主動推送說成無條件主動提醒。
- Coach 首屏從說明書式大段文字改成「先說一句就好」與三個低負擔開始按鈕：我現在很煩、先做呼吸、開始 7 日陪跑；LINE 綁定設定移到開始對話後再出現。
- 提醒時間導覽新增通知預覽與「試發提醒」，明確顯示通知標題 `今心 • 每日心情記錄` 與訊息內容，並提示 LINE / WeChat 內建瀏覽器可能受通知權限限制。
- 修正提醒時間導覽最後一步卡住：`開始旅程` 不再等待通知權限流程完成；通知開啟改為背景 best-effort，權限被擋、延遲或內建瀏覽器不回應時也會先完成導覽進入 App。
- 修正通知設定讀取流程：`NotificationService` 改用同步快取讀取本機提醒設定，避免把 async getter 當成已載入的設定物件。
- 修正個人中心匯出資料會把 Promise 寫進 JSON 的問題，現在會等待實際情緒記錄載入完成再匯出。
- 驗證：`npm run test:run -- src/pages/CoachPage.test.tsx src/components/OnboardingFlow.test.tsx src/components/UserProfile.test.tsx` ✅ 32 tests / 3 files；`npm run build` ✅；`npm run lint` ✅ 0 errors / 31 warnings；`git diff --check` ✅；Playwright mobile 截圖確認 Coach 首屏與提醒導覽主按鈕可見。
- 追加驗證：`npm run test:run -- src/components/OnboardingFlow.test.tsx` ✅ 6 tests；`npm run build` ✅；`git diff --check` ✅；正式站 deployment `6a073696bbc71468fc730cbc` / bundle `index-B-9lzdP6.js` live smoke 確認通知權限 Promise 不回應時仍可完成導覽。

### 產品與文件

- 新增 `CONTEXT.md`，鎖定阿念、Agentic 情緒代理、完整 action loop、小行動閉環、無扣分模式等詞彙邊界。
- 新增 ADR：`docs/adr/0001-complete-agentic-action-loop-for-coach.md`，決定先做 single-agent multi-step loop。
- 新增規格：`docs/superpowers/specs/2026-05-15-7-day-coach-momentum.md`。
- 新增 implementation plan：`docs/superpowers/plans/2026-05-15-complete-agentic-action-loop.md`。
- 新增根目錄 `AGENTS.md`，記錄後續 agent 的產品語言、工程邊界與驗證基線。
- PWA、Coach 首屏、onboarding、landing、AI prompt / soul contract 與影片腳本開始試行「阿念教練」命名；主導覽仍保留「教練」作為簡短分類標籤。
- PWA 無 hash 根網址固定進入 `#home` 今日心情；產品說明移到 App 內 `#about`「關於我們」，由頁尾產品資訊進入，舊 `#landing` 轉到 `#about`。
- 初次使用仍保留 App onboarding；已完成 onboarding 的使用者在動畫後直接顯示今日心情四色選擇。

### Agentic Action Loop

- 新增 `server/insforge/functions/_shared/coachActionLoop.ts`。
- 支援 intent classification、pending proposal、active micro-action expiry、positive-only reward、review streak、level calculation 與 action-loop metadata。
- `traceId` 改為包含會影響輸出的 normalized inputs；缺少 injected clock 時 fail fast，避免 production 產生 stale dueAt。
- 高風險判斷改用 user message + structured safety signal，不掃描 free-form coach disclaimer。
- `server/insforge/functions/coach-simple.ts` 接上 max-3-step `runAgenticActionLoop()`。
- 回傳 `intent`、`microActionProposal`、`activeMicroAction`、`gamification`、`toolResult`。
- 寫入 trace event，並可 create/report micro-action、更新 gamification stats。
- 危機 path 使用 restricted tools 並 hard-block mutating action-loop tools，回傳 `crisis_reward_blocked`，不得建立小行動或給獎。
- public `coach-simple` endpoint 拒絕任意 non-UUID `userId`，避免 app_user_id 被公開 endpoint 竄改。

### 資料層

- 新增 `server/insforge/schema/011_coach_action_loop.sql`。
- 新表：`coach_micro_actions`、`coach_gamification_stats`、`coach_agent_traces`。
- schema-level 鎖住 no-penalty invariant：XP、coins、counts、streaks 都有 non-negative checks。
- 加上 one active micro-action per user/app_user partial unique indexes，避免併發建立重複 active 小行動。

### PWA Coach UI

- `src/lib/adk/types.ts` 新增 action-loop response metadata 型別。
- 新增 `MicroActionCard`：顯示小行動提案、明確確認、active 小行動回報 completed / partial / skipped。
- 新增 `GamificationStrip`：顯示等級、XP、金幣與復盤連續。
- `CoachPage` 首屏新增 `7 日小陪跑` 入口與三個方向：睡前焦慮、親子修復、每日自我照顧。
- `CoachPage` 首屏阿念介紹卡、外層主導覽「教練」入口與 Coach 底部「教練」入口都顯示 `Beta` 內測標籤，並補上 AI 教練回合可能有使用上限的短提示。
- 內測額度產品決策：未來限制會呼叫 Gemini 的 AI 對話回合；提醒、小行動回報、SOS / 緊急安定不應跟 AI 回合共用額度。
- 前端回報文字已與後端 classifier 對齊，避免 UI 看起來有閉環但實際落成普通聊天。

### 方法語言與前台命名

- `MoodMeter` 前台組件更名為 `EmotionQuadrantPicker`。
- `MetaMomentOverlay` 前台流程更名為 `EmergencyStabilizationOverlay` / `緊急安定練習`。
- AI 教練、production `coach-simple.ts`、soul contract、fallback 回覆與 docs 同步改成今心自己的方法語言。
- active surface scan 清掉 How We Feel、Mood Meter、Meta-Moment、舊 RAIN fallback 等殘留。
- PWA、LINE Bot、AI 教練 prompt / fallback、onboarding、landing、進度條、E2E 與文件同步使用 `心照、喚名、安神、動念`。
- LINE Bot 會以「第一式：心照」「第二式：喚名」「第三式：安神」「第四式：動念」引導完整流程。
- 內部資料表與相容 identifier 仍保留 `ruler_*` / `RulerLogEntry` / `useRulerFlow`，避免已部署資料與 migration 失配。

### 守門與測試

- `publishingGuardrails.test.ts` 鎖住 action-loop schema、runtime 多步 loop、trace persistence、新工具與 `crisis_reward_blocked`。
- 新增 `coachActionLoopEval.test.ts`，防止開始陪跑退回普通聊天、危機拿任務/金幣、沒有 active 小行動卻憑空回報。

### 驗證

- Focused frontend action-loop tests：`npx vitest run src/pages/CoachPage.test.tsx src/components/coach/MicroActionCard.test.tsx src/components/coach/GamificationStrip.test.tsx` ✅ 30 tests / 3 files
- Focused server action-loop tests：`cd server && npx vitest run insforge/functions/_shared/coachActionLoop.test.ts insforge/functions/_shared/coachActionLoopEval.test.ts insforge/functions/publishingGuardrails.test.ts` ✅ 41 tests / 3 files
- Frontend tests：`npm run test:run` ✅ 368 tests / 40 files
- Server tests：`cd server && npm run test:run` ✅ 164 tests / 17 files
- Frontend build：`npm run build` ✅
- Server build：`cd server && npm run build` ✅
- Frontend lint：`npm run lint` ✅ 0 errors / 31 warnings
- Server lint：`cd server && npm run lint` ✅ 0 errors / 24 warnings
- E2E：`npm run test:e2e` ✅ 4 tests
- `git diff --check` ✅
- Runtime / user-facing source scan：無 `今心四步` / `今心整合四步` / `照心` / `點名` / `歸息` / `出招` / 舊品牌化前台語言殘留；CHANGELOG / AGENTS 可保留歷史說明與禁止使用清單 ✅

### 尚未完成 / 風險

- Agentic Action Loop 是 source + local verification 完成；production live smoke 還要在 schema / Edge Function / PWA 部署後重跑。
- 方法語言更名後尚未重新部署 production；部署前需再做 PWA + LINE Bot smoke。
- 第一版小行動只在 PWA Coach 建立與回報，LINE Bot 暫不建立小行動狀態機。
- 仍要找 1 位非開發者手機試玩 7 日小陪跑，觀察是否真的理解「回來看一眼，不是成績單」。
- 方法語言風險降低不是法律意見。

---

## [V1.0.0] - 2026-05-14 — 今心產品起點版

### PM 摘要

- **這版定為今心 V1.0 產品起點**：後續功能、設計與營運都以此版為基線往後迭代。
- **可發給小圈朋友試玩**：技術 blocker 已清，適合 1-3 人或熟人封閉試玩；不建議用正式醫療、療癒服務或大規模公開宣傳語氣推出。
- **入口策略定版**：PWA 網頁是所有朋友都能使用的共同入口；LINE 是已驗證的對話入口；WeChat 朋友先走 PWA 網頁，不在 V1.0 做 WeChat Bot。

### PWA / 主動教練

- 首頁與 Coach 首屏已以一般使用者能理解的語言呈現「主動 AI 教練」。
- 主導覽維持原版文案：`今日心情`、`記錄回顧`、`成長看板`、`教練`。
- 右上角成就、主題、提醒、帳號入口均為純 SVG 圖示。

### LINE Bot / 情緒資料流

- 首頁與 Coach 綁定區顯示 LINE 官方帳號 `鋅鋰師拔麻的小小額葉養成手札`、Basic ID `@980pqrhn` 與加好友連結。
- 真 LINE 綁定流程已驗：LINE 取碼、PWA Coach 貼碼、畫面顯示已綁定。
- Production LINE 情緒整理完整資料流已驗：有效簽名 webhook、完整知心四式、寫入 `agent_ruler_logs`、`weekly-report` 與 Coach 讀到同一筆資料。

### 帳號 / 資料 / 安全

- PWA 已接 InsForge Auth，登入、註冊、重新整理保留 session 與 `coach_context` 初始化均已驗。
- 刪除帳號流程已補齊：`delete-account` 會清除 app/public 資料、寫入 `account_deletions` 最小刪除紀錄，前端會阻擋已刪帳號再次進入產品。
- `privacy.html` 與 `account-deletion.html` 已補上資料刪除範圍與最小刪除紀錄說明。
- Bot `/webhook` 已啟用 LINE 簽名驗證，缺少或無效簽名回 401。

### 主動推送 / 排程

- Production InsForge PostgreSQL 已啟用 `pg_cron` 與 `pg_net`。
- `weekly-report-batch` 與 `care-scan-daily` 均為 active；推送前會檢查必要的 LINE 綁定與 opt-in 條件。

### AI 教練 soul

- `server/insforge/agents/soul.md` 作為教練人格、語氣、安全邊界與危機處理規格。
- Node ADK agent、InsForge agent 參考實作與 production `coach-simple.ts` 已用契約測試避免 prompt 分裂。

### 驗證

- 前端測試：`npm run test:run` ✅ 372 tests / 40 files
- 後端測試：`cd server && npm run test:run` ✅ 160 tests / 16 files
- TypeScript：`npx tsc --noEmit` ✅
- 前端 build：`npm run build` ✅
- 後端 build：`cd server && npm run build` ✅
- lint：`npm run lint` ✅ 0 errors / 31 warnings
- `git diff --check` ✅
- Production smoke：PWA、LINE 綁定、LINE 情緒整理、Coach、週報、主動排程、刪帳流程均已跑過並清理測試資料 ✅

### 後續方向

- P0：找 1 位非開發者用手機完整試玩，記錄哪一步不懂、卡住或不安心。
- P1：依朋友回饋補 LINE 綁定三步驟圖解、首頁入口分流或 Coach 首屏文案，不預先加太多說明。
- P2：WeChat Bot、LINE Push quota 長期監控、主動推送 opt-in 設定頁、更多手機 viewport E2E、正式法律式隱私與免責審稿。

---

## Pre-V1 內部衝刺紀錄

## [4.3.2] - 2026-05-14 — LINE 情緒資料流與主動推送排程驗收

### PM 摘要

- **今晚朋友試玩的技術 blocker 已清**：LINE 綁定已驗，production LINE 情緒資料流也已驗到 Coach / 週報都讀得到資料。
- **主動推送有正式路徑**：InsForge PostgreSQL 已啟用 `pg_cron` / `pg_net`，兩個 production cron job 已 active；GitHub Actions fallback 保留。

### 已完成

- 以一次性已綁定測試帳號呼叫 production `/webhook`，使用有效 LINE 簽名送完整 7 則知心四式對話。
- Bot Server 完成知心四式後寫入 `agent_ruler_logs`：`source: line`、`is_full_flow: true`、情緒「焦慮」。
- `weekly-report` 對同一 app user 讀到 `total_sessions: 1`、`dominant_quadrant: red`。
- Coach 對同一 app user 可讀到最近一筆 LINE 情緒紀錄：「焦慮」、強度 `7`。
- 測試產生的一次性 binding、bot user、知心四式 session、chat messages、agent log、ADK session/event 已清理。
- production DB 已確認 `pg_cron` 存在，並成功啟用 `pg_net`。
- 已註冊 `weekly-report-batch`：`0 13 * * 0`（台北每週日 21:00）。
- 已註冊 `care-scan-daily`：`0 2 * * *`（台北每日 10:00）。
- 兩個 `cron.job` 均回查為 `active: true`。
- onboarding 可見的「勳」短字已改為獎盃圖示。
- Timeline 測試名稱中的舊稱「安定室」已改為「今日心情」。

### 驗證

- Production Bot `/health`：`adapter: insforge` ✅
- Production `/webhook` + 有效 LINE 簽名 + 完整知心四式：7 則訊息 accepted ✅
- `agent_ruler_logs`：新增 1 筆 LINE full-flow 測試資料 ✅
- `weekly-report`：讀到 LINE 情緒整理寫入資料 ✅
- Coach：讀到最近一筆 LINE 情緒整理「焦慮 / 7」✅
- 測試資料 cleanup：`agent_ruler_logs`、`line_user_bindings`、`ruler_sessions`、`chat_messages` 均為 0 leftover ✅
- Production schedule：`pg_cron` / `pg_net` installed，`weekly-report-batch` / `care-scan-daily` active ✅
- 本機 targeted tests：`Timeline.test.tsx`、`OnboardingFlow.test.tsx`、`MainLayout.auth.test.tsx` ✅ 8 tests

### 風險

- 技術上已可支撐小圈朋友試玩；若要擴大公開，仍建議用朋友手機做一次非阻塞體驗驗收：加 LINE 官方帳號、輸入「綁定」、PWA 貼碼、完成知心四式。
- LINE Push 免費方案有月額限制；主動推送已透過排程啟用，後續需觀察 `notification_log` 與 LINE quota。

## [4.3.1] - 2026-05-14 — 發布前 UI 信任收斂

### PM 摘要

- 首頁主導覽恢復使用者指定的原版文案「今日心情／記錄回顧／成長看板／教練」，避免朋友打開後看到陌生的「安定室」而困惑。
- 右上角新增純 SVG 帳號圖示；同列成就、主題、提醒也全部改為純圖示，沒有「勳／系／訊」文字殘留。
- 首頁與 Coach 綁定區已顯示 LINE 官方帳號名稱、Basic ID 與加好友連結。

### 已完成

- `MainLayout` 導覽改回：`今日心情`、`記錄回顧`、`成長看板`、`教練`。
- `CoachPage` 底部導覽與返回按鈕同步改回原版文案。
- 新增測試防止導覽再次回退成 `安定室 / 紀錄 / 洞察 / 主動教練`。
- 成就、主題、提醒、帳號按鈕全部改為 inline SVG icon，保留清楚 aria-label。
- 帳號 icon 未登入時開 `AuthModal`；已登入時開 `UserProfile`。
- 新增 `src/constants/lineBot.ts`，集中管理 LINE 官方帳號名稱、Basic ID 與加好友 URL。
- 首頁新增 LINE Bot 說明卡；Coach 綁定區同步顯示官方帳號與加好友連結。
- PWA 已部署到 Zeabur。
- 補充部署注意：Zeabur CLI 回 `Service deployed successfully` 後，需等 `zeabur deployment list` 顯示 `RUNNING` 再 smoke。

### 驗證

- `npm run test:run -- src/components/CheckInFlow.test.tsx src/pages/CoachPage.test.tsx` ✅ 27 tests
- `npm run test:run -- src/components/MainLayout.auth.test.tsx src/pages/CoachPage.test.tsx` ✅ 24 tests
- `npx tsc --noEmit` ✅
- `npm run test:run` ✅ 366 tests / 39 files
- `npm run build` ✅
- `git diff --check` ✅
- 線上 smoke：首頁與 Coach 均顯示 LINE 官方帳號、`@980pqrhn` 與加好友連結；Header nav 與純 SVG actions 正常；帳號圖示可開登入 modal；頁面文字不再包含 `安定室` ✅
- 真 LINE 綁定 E2E 已在 session `019e242d-7d68-7580-bfa2-6c612b61529f` 驗過：LINE 取碼 → production PWA Coach 貼碼 → 畫面顯示已綁定 ✅

### 風險

- 真 LINE 綁定與 production LINE 情緒資料流已於 `4.3.2` 補驗完成。
- 這些修正已推到 `main` 與 `codex/stitch-ui-release-20260513`，正式 Zeabur 來源已可部署到同一版。

## [4.3.0] - 2026-05-14 — 主動教練導覽 + Soul/ADK 生產同步

### PM 摘要

- 導覽文案已從「AI 聊天」收斂為「Agentic AI 主動教練」，用一般使用者能理解的語言說明今心會主動整理線索、提出一個下一步。
- `soul.md` 不只是文件，已同步到 ADK agent、production REST fallback、契約測試與線上部署。

### 已完成

- 首頁新增「今日教練建議」，強調使用者不用等情緒爆滿才找今心。
- Coach 空狀態新增三個情境入口：晚上焦慮、對孩子發脾氣、想看教練觀察。
- Coach 首屏文案調整為「今心主動 AI 教練畫布」。
- 新增 `server/insforge/agents/soul.md` 作為今心教練人格、語氣、主動性邊界與危機處理規格。
- 新增 `server/src/agents/soulInstruction.ts`，提供 `buildEmotionCoachGlobalInstruction()`、`buildEmotionCoachInstruction()`、`buildProductionCoachSystemPrompt()`。
- 新增 `server/insforge/agents/soulContract.test.ts`，鎖定 `soul.md`、ADK agent 與 production prompt 不再分裂。
- 對照本地 `adk-js-adk-v1.0.0` 的 `LlmAgent`，確認 `instruction`、`globalInstruction`、`tools`、`subAgents` 是合適承載點。
- `server/src/agents/emotionCoach.ts` 與 `server/insforge/agents/emotionCoach.ts` 均改為用 `globalInstruction + instruction` 接上 soul / 知心四式策略。
- `server/insforge/functions/coach-simple.ts` 改為 `buildProductionCoachSystemPrompt()` 組裝 prompt；因 InsForge Functions 不接受本地相對 import，仍保持自包含版本並由契約測試比對。
- `coach` Edge Function 已重新部署成功。
- 補回 TDD 驗證 session 中不改產品碼的後端測試：`rulerData`、`triggerAction`、`insforgeAdapter`、`coach` route。
- `.gitignore` 已忽略本地 ADK vendor 與 Stitch design artifact。

### 驗證

- `npx tsc --noEmit` ✅
- `npm run test:run` ✅ 352 tests / 37 files
- `npm run build` ✅
- `cd server && npm run test:run` ✅ 156 tests / 15 files
- `cd server && npm run build` ✅
- `cd server && npm run test:run -- insforge/agents/soulContract.test.ts` ✅ 3 tests
- 線上 smoke：`OPTIONS /coach` → 204；`POST /coach` 焦慮 7 分記錄 → 200，回傳 `skillInvoked: "emergency_stabilization"` 與 `action: "open_sos"`；測試資料已清除 ✅

### 風險

- 真 LINE 使用者完整 E2E 當時仍未跑；後續已於 `4.3.2` 補驗。
- 本機仍無 `deno`，Edge Functions 本地 `deno check` 未跑，主要依賴 InsForge 部署與線上 smoke。
- Production `coach-simple.ts` 因 InsForge 打包限制保留自包含 prompt builder；改 `soulInstruction.ts` 時必須同步檢查契約測試。

## [4.2.2] - 2026-05-14 — InsForge Auth 本機接通 + 帳號登入驗證

### 已完成

- `AuthContext` 改走 `InsForgeAuthService`，登入、註冊、取 current user、更新 profile 不再依賴本機假帳戶。
- Header 帳號入口可登入 InsForge 帳戶；登入後顯示帳號狀態，重新整理後仍保持登入。
- 訪客模式保留為本機 UI 狀態，不寫入 InsForge Auth。
- 修正 `server/insforge/schema/001_profiles.sql` 的 `handle_new_user()`：InsForge `auth.users` 使用 `profile` / `metadata`，不是 Supabase 的 `raw_user_meta_data`。
- live InsForge trigger 已同步修正，註冊時會自動建立 `public.profiles`。
- 登入/註冊成功後會自動補 `coach_context` 初始列。
- 測試帳號 `samlei@apm.org.mo` 已完成 email verification，並確認 `auth.users`、`public.profiles`、`coach_context` 均有資料。
- `.env.local` 已設定 `VITE_INSFORGE_URL` / `VITE_INSFORGE_ANON_KEY`，且受 `.gitignore` 保護。
- `eslint.config.js` 已排除外部 ADK vendor 與 Stitch design artifact。

### 驗證

- `npm run lint` ✅ 0 errors / 31 warnings
- `npx tsc --noEmit` ✅
- `npm run test:run` ✅ 352 tests / 37 files
- `npm run build` ✅
- `cd server && npm run test:run` ✅ 156 tests / 15 files
- `cd server && npm run build` ✅
- 本機 UI / 後端 smoke：`http://127.0.0.1:5176/#coach` 登入成功、重新整理仍保持登入、InsForge 回查 email verified / profile / coach context ✅

### 風險

- Production Zeabur PWA 仍需確認已設定 `VITE_INSFORGE_URL` / `VITE_INSFORGE_ANON_KEY` 並重部署。
- 真 LINE 使用者完整 E2E 當時仍未跑；後續已於 `4.3.2` 補驗。
- 當時工作分支 `codex/stitch-ui-release-20260513` 仍有多組 dirty changes / untracked artifacts，提交或 PR 前需整理 scope。

## [4.2.1] - 2026-05-13 — Agentic Coach 內測收尾 + LINE/PWA 生產鏈路驗證

### PM 摘要

- 內測判斷：黃燈偏綠，可進入 1-3 人封閉內測；暫不建議公開宣傳或大量開放。
- 內測目標：驗證真實使用者是否能順利完成 LINE 綁定、知心四式情緒紀錄、AI Coach 對話與緊急安定練習 SOS。

### 已完成

- `coach`、`weekly-report`、`achievement-checker` 三個 InsForge Edge Functions 已重新部署。
- 危機語句會回 `skillInvoked: "emergency_stabilization"` 並觸發 `action: "open_sos"`。
- 明確「請幫我記錄 + 情緒 + 強度」時，Edge Function 會確定寫入 `agent_ruler_logs`，週報與成就可讀到。
- 新增並套用 `008_agentic_coach_bridge.sql`：`line_user_bindings`、`agent_ruler_logs`。
- 兩張橋接表已啟用 RLS，採 service role only 存取。
- Production PWA 的 LINE 綁定 UI 已能呼叫 production Bot Server `/api/line-binding/claim`。
- Bot Server 已部署至 `https://imxin-bot.zeabur.app`，health 顯示 adapter 為 `insforge`。
- `/webhook` 已補 LINE 簽名保護：缺少或無效 `x-line-signature` 回 401。
- 使用 Zeabur container 內 `LINE_CHANNEL_SECRET` 計算有效簽名，production 空 events webhook 回 200 / `OK`，未輸出密鑰。
- PWA 已部署至 `https://today-mood.zeabur.app`。
- Production Coach 頁已確認有 `LINE Bot 同步`、`LINE 綁定碼` 與緊急安定練習快捷入口。

### 驗證

- `npx tsc --noEmit` ✅
- `npm run test:run` ✅ 336 tests / 32 files
- `npm run build` ✅（仍有既有 circular chunk warning）
- `npm run lint` ✅ 0 errors / 299 warnings
- `cd server && npm run test:run` ✅ 117 tests / 9 files
- `cd server && npm run build` ✅
- `cd server && npm run test:run -- src/index.test.ts --reporter=verbose` ✅ 10 tests
- 線上 smoke：Coach crisis → `open_sos`、Coach 明確記錄 → 週報/成就讀取、PWA LINE 綁定 UI → Bot Server claim、Bot webhook 無簽名 → 401、Bot webhook 有效簽名空事件 → 200 ✅

### 風險

- 真 LINE 使用者訊息當時尚未完整 E2E；後續已於 `4.3.2` 補驗。
- 當時 `main` 仍落後 `origin/main` 2 commits，且工作樹尚未整理成 commit/PR；不要在髒工作樹直接 pull。
- 本機沒有 `deno`，Edge Functions 本地 `deno check` 未跑，主要依賴線上 smoke。
- 既有 ESLint warnings 與 Vite circular chunk warning 仍需另排技術債整理。

## [4.2.0] - 2026-05-12 — Agentic AI 工具升級 + Edge Functions 擴展

### 重大變更

- 從單一 `coach` Edge Function 擴展為三大 Agentic 工具矩陣：`coach`、`weekly-report`、`achievement-checker`。
- `AIService.generateWeeklyInsight` 與 `HabitService.updateProgress` 改為優先呼叫 Edge Function，失敗時本地 fallback。
- 放棄 Fly.io 路徑，Bot Server 統一部署至 Zeabur。
- 新增 `DESIGN.md` 與 `今心_ImXin_方案規格.html`。

### 已完成

- `weekly-report` 讀取近 7 天 `ruler_logs`，回傳 summary、patterns、suggestedAction、quote、colorTheory。
- `achievement-checker` 讀取 `ruler_logs` + `streaks`，比對 `achievement_records` 自動插入新解鎖成就。
- `GrowthDashboard` 傳遞 `userId` 給週報 API。
- `HabitContext` 傳遞 `userId` 給成就更新。
- 本地用戶（`test-user` 或 `local-*`）自動 fallback 到本地計算。
- `streaks` 表 RLS 策略修復。
- `server/zeabur.toml` 成為 Bot Server 主要配置。

### 主要檔案

```text
server/insforge/functions/weekly-report.ts
server/insforge/functions/achievement-checker.ts
src/services/AIService.ts
src/services/HabitService.ts
src/components/GrowthDashboard.tsx
src/services/HabitContext.tsx
DESIGN.md
今心_ImXin_方案規格.html
CLAUDE_CODE_HANDOFF.md
Zeabur_Bot_Server_部署需求.md
```

### 驗證

- 前端：330 / 330 tests passed
- 後端：52 / 52 tests passed（1 文件 dotenv 忽略）
- Build：✅
- TypeScript：✅

### 部署狀態

| 服務 | URL | 狀態 |
|------|-----|------|
| Edge Function — Coach | `https://b88egxiz.functions.insforge.app/coach` | 已上線 |
| Edge Function — Weekly | `https://b88egxiz.functions.insforge.app/weekly-report` | 已部署 |
| Edge Function — Achievement | `https://b88egxiz.functions.insforge.app/achievement-checker` | 已部署 |
| PWA 前端 | `https://today-mood.zeabur.app` | 已上線 |
| Bot Server | Zeabur（`server/`） | 當時待部署 |

### 限制

- 數據遷移（LocalStorage → InsForge）尚未完成，需等待認證架構整合。
- 主動推送（Proactive AI / Cron）尚未實現。
- Bot Server 當時尚未部署至 Zeabur。

## [4.1.0] - 2026-05-11 — InsForge 雲端同步 + AI 教練記憶

### 重大變更

- 三層隱私模型落地：裝置原始內容、雲端元數據、可選完整備份分層處理。
- Edge Function 在生成回應前讀取 `coach_context`，讓 AI 教練能參考使用者連續記錄天數、常見情緒色彩、核心需求與平均強度。
- 本地記錄使用者首次登入後可一鍵將歷史元數據遷移至雲端。

### 已完成

- 註冊流程新增雲端備份同意書與 AI 教練主動關懷 opt-in。
- 支援 Guest 登入與 `AuthContext` coachOptIn 同步。
- 自動偵測未遷移本地記錄，增量提取 Tier-2 元數據。
- 新增 `MigrationProgress` 全螢幕進度 UI。
- Edge Function `fetchCoachContext()` 讀取使用者情緒輪廓。
- `buildContextSummary()` 將元數據轉為中文摘要注入 Gemini system prompt。
- 每次完成情緒記錄後，背景同步最新元數據至 `coach_context`。

### 主要檔案

```text
server/insforge/schema/007_coach_context.sql
src/lib/insforge/coachContext.ts
src/lib/insforge/localStorageMigration.ts
src/components/MigrationProgress.tsx
src/components/AuthModal.tsx
src/services/AuthContext.tsx
src/App.tsx
src/adapters/storage.ts
server/insforge/functions/coach-simple.ts
```

### 驗證

- 新增 61 個單元測試。
- 前端：326 / 326 tests passed（29 files）
- 後端：110 / 110 tests passed（9 files）
- Build：✅
- TypeScript：✅

### 安全與隱私

- `coach_context` 啟用 RLS，用戶只能讀寫自己的資料。
- Edge Function 使用 `SERVICE_ROLE_KEY` 繞過 RLS。
- 原始日記內容始終留在 AES-256-GCM 加密的 localStorage / IndexedDB。
- 加密失敗時不再靜默降級為明文儲存。

### 部署狀態

| 服務 | URL | 狀態 |
|------|-----|------|
| Edge Function API | `https://b88egxiz.functions.insforge.app/coach` | 已部署（含記憶注入） |
| InsForge 資料庫 | `coach_context` 表 | 已建立 |

## [4.0.0] - 2026-05-11 — Agentic AI 情緒教練

### 重大變更

- 從「被動打卡工具」升級為「主動 AI 情緒教練」，導入 Google ADK JS v1.0.0，後採用 REST API fallback。
- 建立 APP 內對話介面 + 已部署 Edge Function API 的雙軌架構。
- 建立今心自己的 4 步驟緊急安定練習 SOS 流程。

### 已完成

- 新增獨立 `/coach` 頁面，全螢幕聊天介面。
- 依知心四式的系統提示提供個人化回應，讀取使用者歷史情緒日誌。
- 使用模型：`gemini-3.1-flash-lite`。
- 新增紅色浮動 SOS 按鈕。
- 新增 4 步驟引導覆蓋層：身體掃描 → 4-7-8 呼吸動畫 → 最佳自我輸入 → 策略選擇。
- 新增打字指示器、歡迎卡片、錯誤處理、重試按鈕、LocalStorage 聊天歷史與 `CoachFAB`。
- 補 ARIA 標籤、呼吸動畫 `aria-live`、dialog role、Escape 關閉與鍵盤操作。

### 主要檔案

```text
src/pages/CoachPage.tsx
src/components/coach/ChatBubble.tsx
src/components/coach/ChatInput.tsx
src/components/coach/EmergencyStabilizationOverlay.tsx
src/components/coach/BreathingAnimation.tsx
src/components/coach/TypingIndicator.tsx
src/components/coach/WelcomeCard.tsx
src/components/coach/CoachFAB.tsx
src/lib/adk/client.ts
src/lib/adk/types.ts
src/lib/adk/storage.ts
server/insforge/functions/coach-simple.ts
server/insforge/agents/emotionCoach.ts
server/insforge/agents/runner.ts
server/insforge/agents/skills/emergencyStabilization.ts
server/insforge/agents/tools/rulerData.ts
```

### 驗證

- 新增 24 個 component tests。
- 前端：265 / 265 tests passed（20 files）
- Build：✅
- TypeScript：✅

### 部署狀態

| 服務 | URL | 狀態 |
|------|-----|------|
| Edge Function API | `https://b88egxiz.functions.insforge.app/coach` | 已部署 |
| 前端 PWA | `https://<your-domain>/#coach` | 就緒 |

### 限制

- ADK JS 無法在 InsForge Deno runtime 部署，已改用純 REST API 實現。
- `InMemoryRunner` session 不持久，未來需遷移至持久 session store。
- E2E 測試框架當時尚未建立。

## [3.0.0] - 2026-04-21 — Bot-First 架構重構

### 重大變更

- 項目從「純前端 PWA」全面轉型為「LINE Bot 為核心入口，PWA 為數據儀表盤」的架構。
- 新增 `server/`：完整 LINE Bot 後端，基於 Express + TypeScript。
- 實作知心四式對話式狀態機：`recognize → understand → label → express → regulate → summary`。

### 已完成

- LINE Bot 加入好友自動歡迎訊息。
- 文字消息觸發情緒覺察流程。
- Quick Reply 按鈕支持身體部位、情緒詞、需求、調節技巧。
- 全局指令：`幫助`、`週報`、`結束練習`。
- 30 分鐘會話超時機制與每 5 分鐘自動清理。
- 用戶狀態持久化至內存（開發）/ PostgreSQL（生產 Schema 就緒）。
- 新增內存數據庫適配器與 PostgreSQL/Supabase schema：`bot_users`、`ruler_sessions`、`chat_messages`。
- 新增 `GET /`、`GET /health`、`POST /webhook`。
- 新增 `test-bot.cjs` 端到端測試腳本。

### 文件

- 新增 `server/README.md`。
- 新增 `BOT_DEPLOYMENT.md`。
- 新增本 `CHANGELOG.md`。

### PWA 角色調整

- PWA 從「獨立完整應用」調整為「數據儀表盤與深度視圖」。
- 核心情緒覺察流程遷移至 LINE Bot。
- PWA 保留歷史回顧、情緒熱力圖、成就展示、數據導出、主題設置。

## [2.1] - 2026-04-21 — 維護更新

- 更新 `AGENTS.md` 以準確反映項目結構。
- 添加後端架構規劃章節。
- 更新測試覆蓋數據（165 測試 / 94.74%）。
- 補充 Capacitor Android 構建流程。
- 更新所有組件和服務列表。

## [2.0] - 2026-03-01 — 100 分滿分優化版

- 優化至 Lighthouse 100/100 分。
- 新增 Error Boundary 錯誤邊界。
- 補完整可訪問性支持（A11y）。
- 新增主題切換（Dark / Light / System）。
- 新增路由懶加載。
- 新增時間軸分頁。
- 支援多格式導出（CSV / JSON / Markdown / TXT）。
- 支援 Web Speech API 語音引導。
- 新增 165 個單元測試。
- Bundle 優化（Terser）。
- 新增 AI 聊天助手、親子模式、SOS 緊急模式、快速打卡。

## [1.0] — 初始版本

- 知心四式情緒覺察練習。
- 100+ 繁體中文情緒詞彙。
- AI 洞察分析。
- 成就系統。
- PWA 離線支持。

---

## 版本命名約定

| 版本號變化 | 含義 |
|-----------|------|
| `MAJOR` (X.0.0) | 重大架構變更或破壞性改動 |
| `MINOR` (x.Y.0) | 新功能發布 |
| `PATCH` (x.y.Z) | Bug 修復與優化 |

---

**今心團隊** | 打造平穩心靈
