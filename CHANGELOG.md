# 今心 ImXin 更新日誌

> 所有重要變更、架構升級與里程碑記錄。

---

## [Unreleased] - 2026-05-15 — Agentic Action Loop MVP 與 7 日小陪跑

### PM 狀態

- **阿念已從聊天框升級為 action-loop coach**：第一版實作 Observe → Orient → Plan → Act → Persist → Evaluate → Adjust，不再只靠 prompt 或單次 function call 裝成 agentic。
- **7 日推動感成為第一個產品驗收**：目標是讓使用者在 7 天內感覺「阿念真的有推動我生活一點點」，不是承諾治療成效。
- **遊戲化待辦定位清楚**：XP、金幣、等級、復盤連續是阿念推動小行動的工具層；第一版只做個人進度，不做社交排行榜，也沒有扣分模式。
- **已推到 GitHub `origin/main`**：本地與遠端 `main` 已指向 `baa6275 docs: 同步 Agentic Action Loop 實作計畫`。

### 已完成

- **規格與交接**
  - 新增 `CONTEXT.md`，鎖定阿念、Agentic 情緒代理、完整 action loop、小行動閉環、無扣分模式等詞彙邊界。
  - 新增 ADR：`docs/adr/0001-complete-agentic-action-loop-for-coach.md`，決定先做 single-agent multi-step loop，而不是一口氣做 full multi-agent orchestration。
  - 新增規格：`docs/superpowers/specs/2026-05-15-7-day-coach-momentum.md`。
  - 新增 implementation plan：`docs/superpowers/plans/2026-05-15-complete-agentic-action-loop.md`。
- **Deterministic core**
  - 新增 `server/insforge/functions/_shared/coachActionLoop.ts`。
  - 支援 intent classification、pending proposal、active micro-action expiry、positive-only reward、review streak、level calculation 與 action-loop metadata。
  - `traceId` 改為包含會影響輸出的 normalized inputs；缺少 injected clock 時 fail fast，避免 production 產生 stale dueAt。
  - 高風險判斷改用 user message + structured safety signal，不掃描 free-form coach disclaimer。
- **資料層**
  - 新增 `server/insforge/schema/011_coach_action_loop.sql`。
  - 新表：`coach_micro_actions`、`coach_gamification_stats`、`coach_agent_traces`。
  - schema-level 鎖住 no-penalty invariant：XP、coins、counts、streaks 都有 non-negative checks。
  - 加上 one active micro-action per user/app_user partial unique indexes，避免併發建立重複 active 小行動。
- **Production runtime**
  - `server/insforge/functions/coach-simple.ts` 接上 max-3-step `runAgenticActionLoop()`。
  - 回傳 `intent`、`microActionProposal`、`activeMicroAction`、`gamification`、`toolResult`。
  - 寫入 trace event，並可 create/report micro-action、更新 gamification stats。
  - 危機 path 使用 restricted tools 並 hard-block mutating action-loop tools，回傳 `crisis_reward_blocked`，不得建立小行動或給獎。
  - public `coach-simple` endpoint 拒絕任意 non-UUID `userId`，避免 app_user_id 被公開 endpoint 竄改。
- **PWA Coach UI**
  - `src/lib/adk/types.ts` 新增 action-loop response metadata 型別。
  - 新增 `MicroActionCard`：顯示小行動提案、明確確認、active 小行動回報 completed / partial / skipped。
  - 新增 `GamificationStrip`：顯示等級、XP、金幣與復盤連續。
  - `CoachPage` 首屏新增 `7 日小陪跑` 入口與三個方向：睡前焦慮、親子修復、每日自我照顧。
  - 前端回報文字已與後端 classifier 對齊，避免 UI 看起來有閉環但實際落成普通聊天。
- **守門與 eval**
  - `publishingGuardrails.test.ts` 鎖住 action-loop schema、runtime 多步 loop、trace persistence、新工具與 `crisis_reward_blocked`。
  - 新增 `coachActionLoopEval.test.ts`，防止開始陪跑退回普通聊天、危機拿任務/金幣、沒有 active 小行動卻憑空回報。

### 驗證

- Focused frontend action-loop tests：`npx vitest run src/pages/CoachPage.test.tsx src/components/coach/MicroActionCard.test.tsx src/components/coach/GamificationStrip.test.tsx` ✅ 30 tests / 3 files
- Focused server action-loop tests：`cd server && npx vitest run insforge/functions/_shared/coachActionLoop.test.ts insforge/functions/_shared/coachActionLoopEval.test.ts insforge/functions/publishingGuardrails.test.ts` ✅ 41 tests / 3 files
- Frontend build：`npm run build` ✅
- Server build：`cd server && npm run build` ✅
- `git diff --check` ✅
- GitHub：`git push origin main` ✅ `cb4a8b5..baa6275 main -> main`

### 注意

- 這是 source + local verification 完成；production live smoke 還要在 schema / Edge Function / PWA 部署後重跑。
- 第一版小行動只在 PWA Coach 建立與回報，LINE Bot 暫不建立小行動狀態機。
- 仍要找 1 位非開發者手機試玩 7 日小陪跑，觀察是否真的理解「回來看一眼，不是成績單」。

---

## [Unreleased] - 2026-05-15 — 方法語言風險收斂與知心四式定稿

### PM 狀態

- **阿念教練命名試行**：原「主動教練」角色在使用者可見文案中改為「阿念教練」，承接「今心，即為念」，並強調會接續情緒線索、慢慢看懂使用者節奏。
- **方法語言已收斂**：前台不再使用容易被看成直接沿用 How We Feel / Mood Meter / Meta-Moment 的 active 品牌化語言。
- **來源說法更誠實**：保留 RULER-inspired、ACT-informed、IFS-informed、Dan Siegel-informed，但明確寫清楚今心不是 Yale、RULER Approach、ACT、IFS、Dan Siegel / Mindsight Institute 或任何治療機構的官方產品，也不是心理治療。
- **知心四式定稿**：前台四式命名改為 `心照 → 喚名 → 安神 → 動念`，保留一點武俠心法感，但不神秘化、不浮誇。

### 已完成

- `582659e Reduce method language overlap risk`
  - `MoodMeter` 前台組件更名為 `EmotionQuadrantPicker`。
  - `MetaMomentOverlay` 前台流程更名為 `EmergencyStabilizationOverlay` / `緊急安定練習`。
  - AI 教練、production `coach-simple.ts`、soul contract、fallback 回覆與 docs 同步改成今心自己的方法語言。
  - active surface scan 清掉 How We Feel、Mood Meter、Meta-Moment、舊 RAIN fallback 等殘留。
- `636b8e4 Rename 知心四式 moves`
  - PWA、LINE Bot、AI 教練 prompt / fallback、onboarding、landing、進度條、E2E 與文件同步使用 `心照、喚名、安神、動念`。
  - LINE Bot 會以「第一式：心照」「第二式：喚名」「第三式：安神」「第四式：動念」引導完整流程。
- 本次交接文件更新新增根目錄 `AGENTS.md`，記錄後續 agent 的產品語言、工程邊界與驗證基線。
- PWA、Coach 首屏、onboarding、landing、AI prompt / soul contract 與影片腳本開始試行「阿念教練」命名；主導覽仍保留「教練」作為簡短分類標籤。
- PWA 無 hash 根網址固定進入 `#home` 今日心情；產品說明移到 App 內 `#about`「關於我們」，由頁尾產品資訊進入，舊 `#landing` 轉到 `#about`。

### 驗證

- Frontend tests：`npm run test:run` ✅ 368 tests / 40 files
- Server tests：`cd server && npm run test:run` ✅ 164 tests / 17 files
- Frontend build：`npm run build` ✅
- Server build：`cd server && npm run build` ✅
- Frontend lint：`npm run lint` ✅ 0 errors / 31 warnings
- Server lint：`cd server && npm run lint` ✅ 0 errors / 24 warnings
- E2E：`npm run test:e2e` ✅ 4 tests
- `git diff --check` ✅
- Runtime / user-facing source scan：無 `今心四步` / `今心整合四步` / `照心` / `點名` / `歸息` / `出招` / 舊品牌化前台語言殘留；CHANGELOG / AGENTS 可保留歷史說明與禁止使用清單 ✅

### 注意

- 這是產品語言與程式輸出層面的風險降低，不是法律意見。
- 內部資料表與相容 identifier 仍保留 `ruler_*` / `RulerLogEntry` / `useRulerFlow`，避免已部署資料與 migration 失配。
- 方法語言更名後尚未重新部署 production；部署前需再做 PWA + LINE Bot smoke。

---

## [V1.0.0] - 2026-05-14 — 今心產品起點版

### PM 狀態

- **這版定為今心 V1.0 產品起點**：`main` / `origin/main` 已指向 `cc21e8d fix: 補齊公開前刪帳與推送守門`，後續功能、設計與營運都以此版為基線往後迭代。
- **可發給小圈朋友試玩**：技術 blocker 已清，適合 1-3 人或熟人封閉試玩；不建議用正式醫療、療癒服務或大規模公開宣傳語氣推出。
- **入口策略定版**：PWA 網頁是所有朋友都能使用的共同入口；LINE 是已驗證的對話入口；WeChat 朋友先走 PWA 網頁，不在 V1.0 做 WeChat Bot。

### 已完成

- **PWA / 主動教練**
  - 首頁與 Coach 首屏已以一般使用者能理解的語言呈現「主動 AI 教練」。
  - 主導覽維持原版文案：`今日心情`、`記錄回顧`、`成長看板`、`教練`。
  - 右上角成就、主題、提醒、帳號入口均為純 SVG 圖示。
- **LINE Bot / 情緒資料流**
  - 首頁與 Coach 綁定區顯示 LINE 官方帳號 `鋅鋰師拔麻的小小額葉養成手札`、Basic ID `@980pqrhn` 與加好友連結。
  - 真 LINE 綁定流程已驗：LINE 取碼、PWA Coach 貼碼、畫面顯示已綁定。
  - Production LINE 情緒整理 完整資料流已驗：有效簽名 webhook、完整知心四式、寫入 `agent_ruler_logs`、`weekly-report` 與 Coach 讀到同一筆資料。
- **帳號 / 資料 / 安全**
  - PWA 已接 InsForge Auth，登入、註冊、重新整理保留 session 與 `coach_context` 初始化均已驗。
  - 刪除帳號流程已補齊：`delete-account` 會清除 app/public 資料、寫入 `account_deletions` 最小刪除紀錄，前端會阻擋已刪帳號再次進入產品。
  - `privacy.html` 與 `account-deletion.html` 已補上資料刪除範圍與最小刪除紀錄說明。
  - Bot `/webhook` 已啟用 LINE 簽名驗證，缺少或無效簽名回 401。
- **主動推送 / 排程**
  - Production InsForge PostgreSQL 已啟用 `pg_cron` 與 `pg_net`。
  - `weekly-report-batch` 與 `care-scan-daily` 均為 active；推送前會檢查必要的 LINE 綁定與 opt-in 條件。
- **AI 教練 soul**
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

### V1.0 後續方向

- P0：找 1 位非開發者用手機完整試玩，記錄哪一步不懂、卡住或不安心。
- P1：依朋友回饋補 LINE 綁定三步驟圖解、首頁入口分流或 Coach 首屏文案，不預先加太多說明。
- P2：WeChat Bot、LINE Push quota 長期監控、主動推送 opt-in 設定頁、更多手機 viewport E2E、正式法律式隱私與免責審稿。

---

## [4.3.2] - 2026-05-14 — LINE 情緒資料流與主動推送排程驗收

### PM 狀態

- **今晚朋友試玩的技術 blocker 已清**：LINE 綁定已驗，production LINE 情緒資料流也已驗到 Coach / 週報都讀得到資料。
- **主動推送有正式路徑**：InsForge PostgreSQL 已啟用 `pg_cron` / `pg_net`，兩個 production cron job 已 active；GitHub Actions fallback 保留。

### 已完成

- **LINE 情緒整理 production 資料流**
  - 以一次性已綁定測試帳號呼叫 production `/webhook`，使用有效 LINE 簽名送完整 7 則 知心四式 對話。
  - Bot Server 完成知心四式 後寫入 `agent_ruler_logs`：`source: line`、`is_full_flow: true`、情緒「焦慮」。
  - `weekly-report` 對同一 app user 讀到 `total_sessions: 1`、`dominant_quadrant: red`。
  - Coach 對同一 app user 可讀到最近一筆 LINE 情緒紀錄：「焦慮」、強度 `7`。
  - 測試產生的一次性 binding、bot user、知心四式 session、chat messages、agent log、ADK session/event 已清理。
- **主動推送排程**
  - production DB 已確認 `pg_cron` 存在，並成功啟用 `pg_net`。
  - 已註冊 `weekly-report-batch`：`0 13 * * 0`（台北每週日 21:00）。
  - 已註冊 `care-scan-daily`：`0 2 * * *`（台北每日 10:00）。
  - 兩個 `cron.job` 均回查為 `active: true`。
- **UI 殘留清理**
  - onboarding 可見的「勳」短字已改為獎盃圖示。
  - Timeline 測試名稱中的舊稱「安定室」已改為「今日心情」。

### 驗證

- Production Bot `/health`：`adapter: insforge` ✅
- Production `/webhook` + 有效 LINE 簽名 + 完整知心四式：7 則訊息 accepted ✅
- `agent_ruler_logs`：新增 1 筆 LINE full-flow 測試資料 ✅
- `weekly-report`：讀到 LINE 情緒整理 寫入資料 ✅
- Coach：讀到最近一筆 LINE 情緒整理「焦慮 / 7」✅
- 測試資料 cleanup：`agent_ruler_logs`、`line_user_bindings`、`ruler_sessions`、`chat_messages` 均為 0 leftover ✅
- Production schedule：`pg_cron` / `pg_net` installed，`weekly-report-batch` / `care-scan-daily` active ✅
- 本機 targeted tests：`Timeline.test.tsx`、`OnboardingFlow.test.tsx`、`MainLayout.auth.test.tsx` ✅ 8 tests

### 剩餘風險

- 技術上已可支撐小圈朋友試玩；若要擴大公開，仍建議用朋友手機做一次非阻塞體驗驗收：加 LINE 官方帳號、輸入「綁定」、PWA 貼碼、完成知心四式。
- LINE Push 免費方案有月額限制；主動推送已透過排程啟用，後續需觀察 `notification_log` 與 LINE quota。

---

## [4.3.1] - 2026-05-14 — 發布前 UI 信任收斂：原版導覽 + 純圖示帳號入口 + LINE 官方帳號入口

### PM 狀態

- **朋友試玩阻礙已收斂一輪**：首頁主導覽已恢復使用者指定的原版文案「今日心情／記錄回顧／成長看板／教練」，避免朋友打開後看到陌生的「安定室」而困惑。
- **帳號入口變清楚**：右上角新增純 SVG 帳號圖示，未登入會開登入／註冊，已登入會進個人中心；同列成就、主題、提醒也全部改為純圖示，沒有「勳／系／訊」文字殘留。
- **LINE Bot 入口變清楚**：首頁與 Coach 綁定區已顯示 LINE 官方帳號名稱、Basic ID 與加好友連結，朋友不需要猜要綁哪個帳號。

### 已完成

- **主導覽恢復原版**
  - `MainLayout` 導覽改回：`今日心情`、`記錄回顧`、`成長看板`、`教練`。
  - `CoachPage` 底部導覽與返回按鈕同步改回原版文案。
  - 新增測試防止導覽再次回退成 `安定室 / 紀錄 / 洞察 / 主動教練`。
- **右上角純圖示列**
  - 成就、主題、提醒、帳號按鈕全部改為 inline SVG icon，保留清楚 aria-label。
  - 帳號 icon 未登入時開 `AuthModal`；已登入時開 `UserProfile`。
  - 新增已登入與未登入入口測試。
- **LINE 官方帳號入口**
  - 新增 `src/constants/lineBot.ts`，集中管理 LINE 官方帳號名稱、Basic ID 與加好友 URL。
  - 首頁新增 LINE Bot 說明卡：`鋅鋰師拔麻的小小額葉養成手札`、`@980pqrhn`、`加入 LINE 官方帳號`、`前往教練綁定`。
  - Coach 綁定區同步顯示官方帳號與加好友連結，再要求使用者貼 6 位碼。
- **部署流程注意事項**
  - PWA 已部署到 Zeabur。
  - 這輪發現 Zeabur CLI 回 `Service deployed successfully` 時，最新 deployment 仍可能處於 `BUILDING`；必須等 `zeabur deployment list` 顯示 `RUNNING` 後再做線上 smoke，否則正式網址可能仍是舊 bundle。

### 驗證

- 本機：
  - `npm run test:run -- src/components/CheckInFlow.test.tsx src/pages/CoachPage.test.tsx` ✅ 27 tests
  - `npm run test:run -- src/components/MainLayout.auth.test.tsx src/pages/CoachPage.test.tsx` ✅ 24 tests
  - `npx tsc --noEmit` ✅
  - `npm run test:run` ✅ 366 tests / 39 files
  - `npm run build` ✅
  - `git diff --check` ✅
- 線上 smoke：
  - `https://today-mood.zeabur.app/?v=linebot-entry-70313a2#home` ✅
  - Header nav 顯示 `今日心情 / 記錄回顧 / 成長看板 / 教練` ✅
  - Header actions 四個按鈕均為純 SVG 且無可見文字 ✅
  - 帳號圖示可開登入 modal ✅
  - 首頁顯示 LINE 官方帳號、`@980pqrhn` 與 `加入 LINE 官方帳號` 連結 ✅
  - Coach 綁定區顯示 LINE 官方帳號、`@980pqrhn` 與 `先加入 LINE 官方帳號` 連結 ✅
  - 真 LINE 綁定 E2E 已在 session `019e242d-7d68-7580-bfa2-6c612b61529f` 驗過：LINE 取碼 → production PWA Coach 貼碼 → 畫面顯示已綁定 ✅
  - 頁面文字不再包含 `安定室` ✅

### 剩餘風險

- 真 LINE 綁定與 production LINE 情緒資料流已於 `4.3.2` 補驗完成。
- 這些修正已推到 `main` 與 `codex/stitch-ui-release-20260513`，正式 Zeabur 來源已可部署到同一版。

---

## [4.3.0] - 2026-05-14 — 主動教練導覽 + Soul/ADK 生產同步

### PM 狀態

- **產品定位更清楚**：導覽文案已從「AI 聊天」收斂為「Agentic AI 主動教練」，用一般使用者能理解的語言說明今心會主動整理線索、提出一個下一步。
- **AI 人格契約已落地**：`soul.md` 不只是文件，已同步到 ADK agent、production REST fallback、契約測試與線上部署。

### 已完成

- **導覽與 Coach 首屏**
  - 首頁新增「今日教練建議」，強調使用者不用等情緒爆滿才找今心。
  - Coach 空狀態新增三個情境入口：晚上焦慮、對孩子發脾氣、想看教練觀察。
  - Coach 首屏文案調整為「今心主動 AI 教練畫布」，凸顯主動教練而非普通聊天機器人。
- **Soul 契約**
  - 新增 `server/insforge/agents/soul.md` 作為今心教練人格、語氣、主動性邊界與危機處理規格。
  - 新增 `server/src/agents/soulInstruction.ts`，提供 `buildEmotionCoachGlobalInstruction()`、`buildEmotionCoachInstruction()`、`buildProductionCoachSystemPrompt()`。
  - 新增 `server/insforge/agents/soulContract.test.ts`，鎖定 `soul.md`、ADK agent 與 production prompt 不再分裂。
- **ADK 對照與接入**
  - 對照本地 `adk-js-adk-v1.0.0` 的 `LlmAgent`，確認 `instruction`、`globalInstruction`、`tools`、`subAgents` 是合適承載點。
  - `server/src/agents/emotionCoach.ts` 與 `server/insforge/agents/emotionCoach.ts` 均改為用 `globalInstruction + instruction` 接上 soul/知心四式 策略。
  - 工具仍維持 `get_user_emotion_summary`、`get_emotion_trend`、`save_ruler_log`、`trigger_action`，危機轉接走內部緊急安定技能；API 對外只回公開 enum。
- **Production fallback**
  - `server/insforge/functions/coach-simple.ts` 改為 `buildProductionCoachSystemPrompt()` 組裝 prompt。
  - InsForge Functions 部署不接受本地相對 import；因此 `coach-simple.ts` 保持自包含版本，並由契約測試比對核心 phrase 與 canonical builder。
  - `coach` Edge Function 已重新部署成功。
- **Session 整合補強**
  - 補回 TDD 驗證 session 中不改產品碼的後端測試：`rulerData`、`triggerAction`、`insforgeAdapter`、`coach` route。
  - `.gitignore` 已忽略本地 ADK vendor 與 Stitch design artifact，避免交接時把外部參考資料夾誤當成待提交源碼。

### 驗證

- 前端：
  - `npx tsc --noEmit` ✅
  - `npm run test:run` ✅ 352 tests / 37 files
  - `npm run build` ✅
- 後端：
  - `cd server && npm run test:run` ✅ 156 tests / 15 files
  - `cd server && npm run build` ✅
  - `cd server && npm run test:run -- insforge/agents/soulContract.test.ts` ✅ 3 tests
- 線上 smoke：
  - `OPTIONS https://b88egxiz.functions.insforge.app/coach` → 204 ✅
  - `POST /coach` 測試焦慮 7 分記錄 → 200 ✅，回傳 `skillInvoked: "emergency_stabilization"` 與 `action: "open_sos"`。
  - smoke 產生的 `codex-smoke-agentic-soul` 測試資料已從 `agent_ruler_logs`、`adk_events`、`adk_sessions`、`adk_user_states` 清除。

### 剩餘風險

- 真 LINE 使用者完整 E2E 仍未跑：LINE 輸入「綁定」→ PWA 貼碼 → LINE 完成知心四式 → Coach/週報讀到資料。
- 目前工作樹仍有多組未整理變更；不要在 dirty worktree 直接 pull 或重置。
- 本機仍無 `deno`，Edge Functions 本地 `deno check` 未跑，主要依賴 InsForge 部署與線上 smoke。
- Production `coach-simple.ts` 因 InsForge 打包限制保留自包含 prompt builder；改 `soulInstruction.ts` 時必須同步檢查契約測試。

---

## [4.2.2] - 2026-05-14 — InsForge Auth 本機接通 + 帳號登入驗證

### 已完成

- **InsForge Auth 前端接線**
  - `AuthContext` 改走 `InsForgeAuthService`，登入、註冊、取 current user、更新 profile 不再依賴本機假帳戶。
  - Header 帳號入口可登入 InsForge 帳戶；登入後顯示帳號狀態，重新整理後仍保持登入。
  - 訪客模式保留為本機 UI 狀態，不寫入 InsForge Auth。
- **註冊 trigger 修復**
  - 修正 `server/insforge/schema/001_profiles.sql` 的 `handle_new_user()`：InsForge `auth.users` 使用 `profile` / `metadata`，不是 Supabase 的 `raw_user_meta_data`。
  - live InsForge trigger 已同步修正，註冊時會自動建立 `public.profiles`。
- **Coach context 初始化**
  - 登入/註冊成功後會自動補 `coach_context` 初始列。
  - 測試帳號 `samlei@apm.org.mo` 已完成 email verification，並確認 `auth.users`、`public.profiles`、`coach_context` 均有資料。
- **本機環境**
  - `.env.local` 已設定 `VITE_INSFORGE_URL` / `VITE_INSFORGE_ANON_KEY`，且受 `.gitignore` 保護。
  - `eslint.config.js` 已排除外部 ADK vendor 與 Stitch design artifact，避免 `npm run lint` 掃到非專案源碼。

### 驗證

- 前端：
  - `npm run lint` ✅ 0 errors / 31 warnings
  - `npx tsc --noEmit` ✅
  - `npm run test:run` ✅ 352 tests / 37 files
  - `npm run build` ✅
- 後端：
  - `cd server && npm run test:run` ✅ 156 tests / 15 files
  - `cd server && npm run build` ✅
- 本機 UI / 後端 smoke：
  - `http://127.0.0.1:5176/#coach` 登入成功 ✅
  - 登入後重新整理仍保持登入 ✅
  - InsForge 回查 email verified / profile / coach context ✅

### 剩餘風險

- Production Zeabur PWA 仍需確認已設定 `VITE_INSFORGE_URL` / `VITE_INSFORGE_ANON_KEY` 並重部署，否則線上前端不一定會使用 InsForge Auth。
- 真 LINE 使用者完整 E2E 仍未跑：LINE 輸入「綁定」→ PWA 貼碼 → LINE 完成知心四式 → Coach/週報讀到資料。
- 目前工作分支 `codex/stitch-ui-release-20260513` 仍有多組 dirty changes / untracked artifacts，提交或 PR 前需整理 scope。

---

## [4.2.1] - 2026-05-13 — Agentic Coach 內測收尾 + LINE/PWA 生產鏈路驗證

### PM 狀態

- **內測判斷**：黃燈偏綠，可進入 1-3 人封閉內測；暫不建議公開宣傳或大量開放。
- **內測目標**：驗證真實使用者是否能順利完成 LINE 綁定、知心四式 情緒紀錄、AI Coach 對話與 緊急安定練習 SOS。

### 已完成

- **Agentic Coach 生產鏈路收斂**
  - `coach`、`weekly-report`、`achievement-checker` 三個 InsForge Edge Functions 已重新部署。
  - 危機語句會回 `skillInvoked: "emergency_stabilization"` 並觸發 `action: "open_sos"`。
  - 明確「請幫我記錄 + 情緒 + 強度」時，Edge Function 會確定寫入 `agent_ruler_logs`，週報與成就可讀到。
- **LINE Bot / PWA 橋接**
  - 新增並套用 `008_agentic_coach_bridge.sql`：`line_user_bindings`、`agent_ruler_logs`。
  - 兩張橋接表已啟用 RLS，採 service role only 存取。
  - Production PWA 的 LINE 綁定 UI 已能呼叫 production Bot Server `/api/line-binding/claim`。
- **Bot Server 生產部署**
  - Bot Server 已部署至 `https://imxin-bot.zeabur.app`，health 顯示 adapter 為 `insforge`。
  - `/webhook` 已補 LINE 簽名保護：缺少或無效 `x-line-signature` 回 401。
  - 使用 Zeabur container 內 `LINE_CHANNEL_SECRET` 計算有效簽名，production 空 events webhook 回 200 / `OK`，未輸出密鑰。
- **PWA 生產部署**
  - PWA 已部署至 `https://today-mood.zeabur.app`。
  - Production Coach 頁已確認有 `LINE Bot 同步`、`LINE 綁定碼` 與 緊急安定練習 快捷入口。

### 驗證

- 前端：
  - `npx tsc --noEmit` ✅
  - `npm run test:run` ✅ 336 tests / 32 files
  - `npm run build` ✅（仍有既有 circular chunk warning）
  - `npm run lint` ✅ 0 errors / 299 warnings
- 後端：
  - `cd server && npm run test:run` ✅ 117 tests / 9 files
  - `cd server && npm run build` ✅
  - `cd server && npm run test:run -- src/index.test.ts --reporter=verbose` ✅ 10 tests
- 線上 smoke：
  - Coach crisis → `open_sos` ✅
  - Coach 明確記錄 → 週報/成就讀取 ✅
  - PWA LINE 綁定 UI → Bot Server claim ✅
  - Bot webhook 無簽名 → 401 ✅
  - Bot webhook 有效簽名空事件 → 200 ✅

### 剩餘風險

- 真 LINE 使用者訊息尚未完整 E2E：LINE 輸入「綁定」→ PWA 貼碼 → LINE 完成知心四式 → Coach/週報讀到資料。
- `main` 仍落後 `origin/main` 2 commits，且工作樹尚未整理成 commit/PR；不要在髒工作樹直接 pull。
- 本機沒有 `deno`，Edge Functions 本地 `deno check` 未跑，主要依賴線上 smoke。
- 既有 ESLint warnings 與 Vite circular chunk warning 仍需另排技術債整理。

---

## [4.2.0] - 2026-05-12 — Agentic AI 工具升級 + Edge Functions 擴展

### 🎯 重大變更

- **Agentic AI 能力擴展**：從單一 `coach` Edge Function 擴展為三大 Agentic 工具矩陣
  - `coach`：AI 情緒教練（4 Tools + Session 持久化 + 緊急安定練習 危機協議）
  - `weekly-report`：週報生成（讀取 `ruler_logs` 分析狀態色彩分佈與趨勢）
  - `achievement-checker`：成就檢查（讀取 `ruler_logs` + `streaks`，自動解鎖成就）
- **前端改呼叫 Edge Function**：`AIService.generateWeeklyInsight` 與 `HabitService.updateProgress` 改為優先呼叫 Edge Function，失敗時本地 fallback
- **部署平台統一**：放棄 Fly.io 路徑，Bot Server 統一部署至 Zeabur（與 PWA 同平台）
- **設計系統文件化**：新增 `DESIGN.md`（402 行，58 color tokens + 8 typography + 20 component specs）
- **方案規格書**：新增 `今心_ImXin_方案規格.html`（含 5 頁實機截圖）

### ✨ 新增功能

- **📊 週報 Edge Function**
  - 讀取用戶近 7 天 `ruler_logs`
  - 計算狀態色彩分佈、平均強度、最頻繁情緒
  - 回傳個人化洞察（summary + patterns + suggestedAction + quote + colorTheory）
- **🏆 成就檢查 Edge Function**
  - 讀取 `ruler_logs` 計算統計（totalLogs / fullFlowCount / uniqueEmotions / currentStreak）
  - 與 `achievement_records` 比對，自動插入新解鎖成就
  - 5 條規則：first_log / streak_3 / streak_7 / emotions_10 / full_ruler_5
- **🔧 前端適配**
  - `GrowthDashboard` 傳遞 `userId` 給週報 API
  - `HabitContext` 傳遞 `userId` 給成就更新
  - 本地用戶（`test-user` 或 `local-*`）自動 fallback 到本地計算，無需網路

### 🔧 技術棧擴展

| 層級 | 新增/變更 |
|------|----------|
| Edge Function | `weekly-report.ts`、`achievement-checker.ts`（Deno runtime） |
| 資料庫 | `streaks` 表 RLS 策略修復（新增 `Users can upsert own streaks`） |
| 前端 API | `AIService.ts`、`HabitService.ts` 新增 Edge Function 呼叫路徑 |
| 部署 | `server/zeabur.toml` 成為 Bot Server 主要配置，移除 Fly.io 優先級 |
| 文件 | `DESIGN.md`、`今心_ImXin_方案規格.html`、`CLAUDE_CODE_HANDOFF.md` |

### 📁 新增/修改檔案

```
server/insforge/functions/weekly-report.ts       # 週報生成 Edge Function
server/insforge/functions/achievement-checker.ts # 成就檢查 Edge Function
src/services/AIService.ts                        # 週報改呼叫 Edge Function
src/services/HabitService.ts                     # 成就同步到 Edge Function
src/components/GrowthDashboard.tsx               # 傳遞 userId
src/services/HabitContext.tsx                    # 傳遞 userId
DESIGN.md                                        # 設計系統文件
今心_ImXin_方案規格.html                          # 產品規格書（含截圖）
CLAUDE_CODE_HANDOFF.md                           # Claude Code 交接文件
Zeabur_Bot_Server_部署需求.md                     # Bot Server 部署技術規格
```

### 🧪 測試

- 總測試數：**330 / 330 通過**（前端）+ **52 / 52 通過**（後端，1 文件 dotenv 忽略）
- Build：✅ 成功
- TypeScript：✅ 零錯誤

### 🚀 部署狀態

| 服務 | URL | 狀態 |
|------|-----|------|
| Edge Function — Coach | `https://b88egxiz.functions.insforge.app/coach` | ✅ 已上線 |
| Edge Function — Weekly | `https://b88egxiz.functions.insforge.app/weekly-report` | ✅ 已部署 |
| Edge Function — Achievement | `https://b88egxiz.functions.insforge.app/achievement-checker` | ✅ 已部署 |
| PWA 前端 | `https://today-mood.zeabur.app` | ✅ 已上線 |
| Bot Server | Zeabur（`server/`） | ⏳ 待部署 |

### ⚠️ 已知限制

- 數據遷移（LocalStorage → InsForge）尚未完成，需等待認證架構整合
- 主動推送（Proactive AI / Cron）尚未實現
- Bot Server 尚未部署至 Zeabur

---

## [4.1.0] - 2026-05-11 — InsForge 雲端同步 + AI 教練記憶

### 🎯 重大變更

- **三層隱私模型正式落地**：
  - Tier 1（裝置）：原始日記內容、身體掃描、表達內容 — 永不上雲
  - Tier 2（雲端元數據）：狀態色彩標籤、需求標籤、強度分數 — 同步至 InsForge `coach_context` 供 AI 教練記憶
  - Tier 3（可選完整備份）：用戶可主動選擇加密全量備份
- **AI 教練獲得持久記憶**：Edge Function 在生成回應前讀取 `coach_context`，能參考用戶連續記錄天數、常見情緒色彩、核心需求與平均強度，提供真正個人化的陪伴。
- **歷史數據遷移**：已使用本地記錄的用戶，首次登入後可一鍵將歷史元數據遷移至雲端。

### ✨ 新增功能

- **🔐 帳號系統 + 隱私同意**
  - 註冊流程新增兩項勾選框：
    - （必填）雲端備份同意書 — 數據僅用於 AI 教練，不作商業用途
    - （選填）AI 教練主動關懷 — 允許系統根據情緒模式主動推送關心訊息
  - Guest 登入支援（自動生成匿名帳號）
  - `AuthContext` 同步 `coachOptIn` 狀態至 `coach_context`
- **☁️ localStorage → InsForge 遷移**
  - 自動偵測未遷移的本地記錄
  - 增量提取 Tier-2 元數據（quadrants、needs、intensity、streak）
  - `MigrationProgress` 全螢幕進度 UI（帶錯誤降級）
  - 遷移後保留本地原始數據，可隨時重刷
- **🧠 AI 教練記憶注入**
  - Edge Function `fetchCoachContext()` 讀取用戶情緒輪廓
  - `buildContextSummary()` 將元數據轉為中文摘要注入 Gemini system prompt
  - 無輪廓時 graceful fallback（不影響對話）
- **📊 即時元數據同步**
  - 每次完成 情緒記錄後，背景同步最新元數據至 `coach_context`
  - `extractMetadataFromLog()` 純函數式提取，測試友好

### 🔧 技術棧擴展

| 層級 | 新增技術 |
|------|----------|
| 雲端資料庫 | InsForge PostgreSQL + `coach_context` 表 |
| Edge Function | `coach` function（Deno runtime，已部署） |
| 隱私安全 | Row Level Security（RLS）+ service_role 策略 |
| 前端狀態 | `AuthContext` coachOptIn 同步 |

### 📁 新增/修改檔案

```
server/insforge/schema/007_coach_context.sql    # coach_context 資料表 + RLS
src/lib/insforge/coachContext.ts                # CRUD + 元數據提取
src/lib/insforge/localStorageMigration.ts       # 遷移邏輯
src/components/MigrationProgress.tsx            # 遷移進度 UI
src/components/AuthModal.tsx                    # 隱私同意勾選框
src/services/AuthContext.tsx                    # coachOptIn 狀態管理
src/App.tsx                                     # 自動觸發遷移
src/adapters/storage.ts                         # saveLog 後背景同步
server/insforge/functions/coach-simple.ts       # 讀取 coach_context 注入 prompt
```

### 🧪 測試

- 新增 **61** 個單元測試（frontend + backend）
- 總測試數：**326 / 326 通過**（29 test files）+ **110 / 110 通過**（9 test files）
- Build：✅ 成功
- TypeScript：✅ 零錯誤

### 🔒 安全與隱私

- `coach_context` 啟用 RLS，用戶只能讀寫自己的資料
- Edge Function 使用 `SERVICE_ROLE_KEY` 繞過 RLS（內部服務調用）
- 原始日記內容始終留在 AES-256-GCM 加密的 localStorage / IndexedDB
- 加密失敗時不再靜默降級為明文儲存（已移除危險 fallback）

### 🚀 部署狀態

| 服務 | URL | 狀態 |
|------|-----|------|
| Edge Function API | `https://b88egxiz.functions.insforge.app/coach` | ✅ 已部署（含記憶注入） |
| InsForge 資料庫 | `coach_context` 表 | ✅ 已建立 |

---

## [4.0.0] - 2026-05-11 — Agentic AI 情緒教練

### 🎯 重大變更

- **Agentic AI 轉型**：從「被動打卡工具」升級為「主動 AI 情緒教練」，導入 Google ADK JS v1.0.0（後採用 REST API fallback）。
- **雙軌對話架構**：APP 內對話介面 + 已部署 Edge Function API，未來可擴展至 LINE Bot。
- **緊急安定練習 緊急協助**：今心自己的 4 步驟 SOS 流程（感覺身體 → 呼吸暫停 → 記得想成為的自己 → 選一個照顧動作）。

### ✨ 新增功能

- **🧠 AI 情緒教練對話**
  - 獨立 `/coach` 頁面，全螢幕聊天介面
  - 依知心四式的系統提示（Recognize / Understand / Label / Express / Regulate）
  - 讀取使用者歷史情緒日誌，提供個人化回應
  - 模型：`gemini-3.1-flash-lite`
- **🆘 緊急安定練習 SOS 緊急協助**
  - 紅色浮動 SOS 按鈕
  - 4 步驟引導覆蓋層：身體掃描 → 4-7-8 呼吸動畫 → 最佳自我輸入 → 策略選擇
  - 呼吸動畫：圓形縮放 + 即時倒數計時
- **💬 對話體驗優化**
  - 打字指示器（「教練正在思考...」）
  - 歡迎卡片（首次使用引導 + 建議提示）
  - 錯誤處理 + 重試按鈕（網路 / API / 超時）
  - LocalStorage 聊天歷史持久化
  - 浮動 FAB 快速入口（CoachFAB）
- **♿ Accessibility**
  - ARIA 標籤（SOS、輸入框、送出按鈕）
  - 呼吸動畫 `aria-live` 播報
  - EmergencyStabilization 覆蓋層 `role="dialog"` + Escape 鍵關閉
  - 全鍵盤可操作

### 🔧 技術棧擴展

| 層級 | 新增技術 |
|------|----------|
| AI Agent | Google Gemini REST API (`gemini-3.1-flash-lite`) |
| Edge Function | InsForge Functions (Deno runtime) |
| 前端狀態 | LocalStorage 持久化 |
| 測試 | 新增 24 個 component tests |

### 📁 新增檔案

```
src/pages/CoachPage.tsx                  # 教練主頁面
src/components/coach/
  ├── ChatBubble.tsx + .test.tsx         # 訊息氣泡
  ├── ChatInput.tsx + .test.tsx          # 輸入 + SOS 按鈕
  ├── EmergencyStabilizationOverlay.tsx              # 4 步驟 SOS 覆蓋層
  ├── BreathingAnimation.tsx             # 呼吸動畫
  ├── TypingIndicator.tsx + .test.tsx    # 打字指示器
  ├── WelcomeCard.tsx + .test.tsx        # 歡迎卡片
  └── CoachFAB.tsx                       # 浮動快速入口
src/lib/adk/
  ├── client.ts                          # API client
  ├── types.ts                           # TypeScript 型別
  └── storage.ts                         # LocalStorage 助手
server/insforge/functions/coach-simple.ts # 已部署 Edge Function
server/insforge/agents/
  ├── emotionCoach.ts                    # 主 Agent 定義
  ├── runner.ts                          # InMemoryRunner 包裝
  ├── skills/emergencyStabilization.ts               # EmergencyStabilization Skill
  └── tools/rulerData.ts                 # DB 查詢 Tool
```

### 🧪 測試

- 新增 **24** 個 component tests（ChatBubble、ChatInput、TypingIndicator、WelcomeCard、CoachPage）
- 總測試數：**265 / 265 通過**（20 test files）
- Build：✅ 成功
- TypeScript：✅ 零錯誤

### 🚀 部署狀態

| 服務 | URL | 狀態 |
|------|-----|------|
| Edge Function API | `https://b88egxiz.functions.insforge.app/coach` | ✅ 已部署 |
| 前端 PWA | `https://<your-domain>/#coach` | ✅ 就緒 |

### ⚠️ 已知限制

- ADK JS 無法在 InsForge Deno runtime 部署（bundler 不支援本地相對匯入），已改用純 REST API 實現
- `InMemoryRunner` session 不持久（Edge Function 無狀態），未來需遷移至持久 session store
- E2E 測試框架（Playwright / Cypress）尚未建立

---

## [3.0.0] - 2026-04-21 — Bot-First 架構重構

### 🎯 重大變更

- **Bot-First 架構**：項目從「純前端 PWA」全面轉型為「LINE Bot 為核心入口，PWA 為數據儀表盤」的架構。
- **新增後端伺服器** (`server/`)：完整的 LINE Bot 後端，基於 Express + TypeScript。
- **知心四式對話式狀態機**：實現 `recognize → understand → label → express → regulate → summary` 六步對話流程，用戶在 LINE 上即可完成完整覺察練習。

### ✨ 新增功能

- **LINE Bot 即時陪伴**
  - 加入好友自動歡迎訊息
  - 文字消息觸發情緒覺察流程
  - Quick Reply 按鈕支持（身體部位、情緒詞、需求、調節技巧）
  - 全局指令：`幫助`、`週報`、`結束練習`
- **用戶會話管理**
  - 30 分鐘會話超時機制
  - 每 5 分鐘自動清理過期會話
  - 用戶狀態持久化至內存（開發）/ PostgreSQL（生產 Schema 就緒）
- **數據持久化層**
  - 內存數據庫適配器（`memoryAdapter.ts`）：零配置開箱即用
  - PostgreSQL/Supabase Schema（`schema.sql`）：`bot_users`、`ruler_sessions`、`chat_messages` 三表結構
  - 連續記錄天數（Streak）自動計算
- **健康檢查端點**
  - `GET /` — 服務狀態（含 live/demo 模式標識）
  - `GET /health` — 健康檢查（含 uptime）
  - `POST /webhook` — LINE Webhook 接收端（帶簽名驗證）
- **端到端測試腳本** (`test-bot.cjs`)：模擬完整 知心四式流程的自動化測試

### 🔧 技術棧擴展

| 層級 | 新增技術 |
|------|----------|
| 後端框架 | Express 5.x |
| LINE SDK | @line/bot-sdk 9.x |
| 開發工具 | tsx 4.x（熱重載） |
| 數據庫 | PostgreSQL Schema（生產就緒） |

### 📝 文檔

- 新增 [`server/README.md`](./server/README.md)：後端完整文檔（開發、部署、LINE Bot 設置、測試）
- 新增 [`BOT_DEPLOYMENT.md`](./BOT_DEPLOYMENT.md)：Bot-First 架構決策說明與五分鐘快速開始
- 新增 [`CHANGELOG.md`](./CHANGELOG.md)：本文件

### 🔄 PWA 角色調整

- PWA 從「獨立完整應用」調整為「數據儀表盤與深度視圖」
- 核心情緒覺察流程遷移至 LINE Bot
- PWA 保留：歷史回顧、情緒熱力圖、成就展示、數據導出、主題設置

---

## [2.1] - 2026-04-21

### 維護更新

- 更新 `AGENTS.md` 以準確反映項目結構
- 添加後端架構規劃章節
- 更新測試覆蓋數據（165 測試 / 94.74%）
- 補充 Capacitor Android 構建流程
- 更新所有組件和服務列表

---

## [2.0] - 2026-03-01 — 100 分滿分優化版

### 新增功能

- 優化至 Lighthouse 100/100 分
- Error Boundary 錯誤邊界
- 完整可訪問性支持（A11y）
- 主題切換（Dark / Light / System）
- 路由懶加載
- 時間軸分頁
- 多格式導出（CSV / JSON / Markdown / TXT）
- Web Speech API 語音引導
- 165 個單元測試
- Bundle 優化（Terser）
- AI 聊天助手
- 親子模式
- SOS 緊急模式
- 快速打卡

---

## [1.0] — 初始版本

### 核心功能

- 知心四式情緒覺察練習
- 100+ 繁體中文情緒詞彙
- AI 洞察分析
- 成就系統
- PWA 離線支持

---

## 版本命名約定

| 版本號變化 | 含義 |
|-----------|------|
| `MAJOR` (X.0.0) | 重大架構變更或破壞性改動 |
| `MINOR` (x.Y.0) | 新功能發布 |
| `PATCH` (x.y.Z) | Bug 修復與優化 |

---

**今心團隊** | 打造平穩心靈 🌿
