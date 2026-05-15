# 今心 ImXin Agent 交接規範

> 給 Codex / Claude / 其他 agent 的短規範。若本檔與最新 git 狀態衝突，以最新 git 狀態與使用者最新指示為準。

## 產品定位

今心 ImXin 是開源情緒覺察 PWA + LINE Bot，目標是幫焦慮父母在情緒高漲時先停一下、看清感受，再選一個較不傷害自己與他人的下一步。

前台方法語言定稿為 **知心四式**：

1. **心照**：心照一念，先看清此刻。
2. **喚名**：喚其真名，精準靠近感受。
3. **安神**：安住心神，讓感受與需要有地方放。
4. **動念**：一念可轉，選一個可做的小行動。

方法來源要誠實：今心是 RULER-inspired、ACT-informed、IFS-informed、Dan Siegel-informed 的自有整合練習。不得宣稱與 Yale、RULER Approach、ACT、IFS、Dan Siegel / Mindsight Institute 或任何治療機構有官方關係，也不得宣稱提供正式心理治療、診斷或醫療建議。

## Agentic Coach 主線

阿念不是普通聊天框，也不是純遊戲化待辦。第一版主線已轉為 **完整 Agentic Action Loop**：

```text
Observe → Orient → Plan → Act → Persist → Evaluate → Adjust
```

產品驗收是 **7 日推動感**：讓使用者在 7 天內感覺「阿念真的有推動我生活一點點」。第一個可見閉環是 PWA Coach 內的 7 日小陪跑：阿念提出小行動、使用者明確確認、24 小時內回來回報 completed / partial / skipped，阿念再依回報調整下一步。

實作邊界：

- LLM 負責語意判斷與自然語言陪伴。
- deterministic code 負責狀態轉移、權限、副作用、trace、XP / 金幣、過期與危機守門。
- 危機語句必須 `crisis_reward_blocked`，不得建立小行動或發放獎勵。
- 遊戲化只能是個人工具層：允許 XP、等級、金幣、復盤連續；不做社交排行榜，不做扣分、失敗、降級或羞辱式提醒。

## 工作原則

- 使用繁體中文（台灣）更新 UI 文案、文件與 commit message。
- 四象限 / energy-valence 類型可以保留；不要再使用 `Mood Meter`、`Meta-Moment`、`How We Feel` 作為前台或 active prompt 語言。
- 保留內部資料模型與相容命名，例如 `ruler_logs`、`RulerLogEntry`、`useRulerFlow`、`server/src/rulerBot.ts`，除非使用者明確要求資料遷移。
- `server/insforge/functions/coach-simple.ts` 是 production `coach` Edge Function 自包含 prompt builder；改 AI 教練方法語言時要同步它、`server/src/agents/soulInstruction.ts`、`server/insforge/agents/soul.md` 與相關測試。
- 改 Agentic Action Loop 時要同步 `server/insforge/functions/_shared/coachActionLoop.ts`、`server/insforge/functions/coach-simple.ts`、`server/insforge/schema/011_coach_action_loop.sql`、`src/lib/adk/types.ts`、`src/pages/CoachPage.tsx` 與相關測試。
- 根目錄 `memory.md` 是短交接板；`CHANGELOG.md` 是產品變更紀錄；兩者要在重要命名、部署、驗證狀態變更後同步更新。

## 常用驗證

```bash
npm run test:run
npm run build
npm run lint
npm run test:e2e
cd server && npm run test:run
cd server && npm run build
cd server && npm run lint
git diff --check
```

目前最新本地基線（2026-05-15）：

- Frontend tests: 40 files / 368 tests passed
- Server tests: 17 files / 164 tests passed
- Agentic focused frontend tests: 3 files / 30 tests passed
- Agentic focused server tests: 3 files / 41 tests passed
- E2E: 4 passed
- Frontend lint: 0 errors / 31 warnings
- Server lint: 0 errors / 24 warnings
- Frontend build: passed
- Server build: passed

## 最新主線

- `baa6275 docs: 同步 Agentic Action Loop 實作計畫`
  - `origin/main` 已包含 Agentic Action Loop MVP 相關 commits。
  - 新增 `CONTEXT.md`、Agentic Action Loop ADR、7 日推動感規格與 implementation plan。
- `6760365 feat: 串接 Coach 小行動閉環 UI`
  - PWA Coach 首屏新增 7 日小陪跑入口、小行動提案卡、active 小行動回顧卡與 XP / 金幣 / 復盤連續進度列。
- `fdc52f2 fix: 補強 Coach action loop 安全邊界`
  - 危機 path 限制工具與 reward；回報只獎勵 active/unreported row；pending proposal 才能建立小行動；schema 鎖一人一個 active 小行動。
- `e634c2f feat: 實作 Coach agentic action loop runtime`
  - production `coach-simple.ts` 接上多步 action loop、trace persistence、micro-action create/report、gamification summary response metadata。
- `582659e Reduce method language overlap risk`
  - 移除 How We Feel / Mood Meter / Meta-Moment 等 active 前台風險語言。
  - 保留 RULER-inspired 誠實來源與非官方邊界。
- `636b8e4 Rename 知心四式 moves`
  - 前台四式定稿為：心照、喚名、安神、動念。
  - 同步 PWA、LINE Bot、AI 教練 prompt / fallback、docs、E2E 與測試。

## 近期下一步

1. 找 1 位非開發者用手機完整試玩 `#coach` 的 7 日小陪跑：開始陪跑 → 看見小行動提案 → 明確確認 → 回來回報 completed / partial / skipped。
2. 觀察使用者是否理解「阿念推動我生活一點點」與「回來看一眼，不是成績單」。
3. 驗證 production schema / Edge Function 部署後，再做一次 live API smoke，確認 `coach_micro_actions`、`coach_gamification_stats`、`coach_agent_traces` 都有最小資料流。
4. LINE Bot 暫不建立小行動；先讓 PWA Coach 小行動閉環穩定。
