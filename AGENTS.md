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

## 防漂移工作規範

> 這段是硬規範：Codex / Claude / 其他 agent 不可以把整合、部署、版本判斷交給使用者。使用者不是 release manager；agent 必須把狀態收斂成單一可信版本。

### 接手前必查

開始任何開發、debug、review、上線修正前，先確認四件事：

1. `git status --short --branch`：確認目前 branch 與是否有未提交修改。
2. `git log --oneline --decorate -5` 和 `git fetch origin` 後的 `origin/main`：確認主線最新 commit。
3. 是否存在 `claude/`、`codex/` 或其他工作分支含未合入修正。
4. Production 實際跑哪版：
   - PWA：抓 `https://today-mood.zeabur.app` 的 `index-*.js` bundle，與本機 build 或最新部署紀錄比對。
   - Bot：查 `https://imxin-bot.zeabur.app/health`，確認 `adapter=insforge`，必要時用 uptime 判斷是否重啟。

### 任務完成定義

除非使用者明確說「只要分析，不要改」，否則開發任務完成前必須做到：

1. 修正已落在正確分支，不留散落未提交修改。
2. 相關測試已跑，至少包含 touched area focused tests；上線相關改動還要跑 build / lint / E2E 或清楚說明未跑原因。
3. 需要上線時：已 push 到 `main` 或指定 release branch，並完成 Zeabur deployment。
4. 不能把「部署指令成功」當完成；必須做 live smoke：
   - PWA live bundle 與預期一致。
   - Bot `/health` 正常，且 webhook 無簽名回 `401`。
   - 若有新 UI 入口，至少用 E2E 或 browser smoke 確認 live 頁面可見。
5. `memory.md` 與 `CHANGELOG.md` 已同步真實狀態，不能留下「本地未部署」「待合入」等過期句子。
6. 最後確認 `git status --short --branch` 乾淨，並在回覆中用人話說明：本地、GitHub、production、交接文件是否已同步。

### 多 agent 整合規則

- 如果 Claude / Codex 同時動過 repo，不能只列出分支差異給使用者決定；接手 agent 要建立或使用一條整合線，把可保留修正合到一起。
- 如果 production 跑的是某個 agent 分支，但 `main` 沒有該修正，這是 P0 drift。修正順序是：合回 `main` → push → deploy → live smoke → 更新 `memory.md` / `CHANGELOG.md`。
- 如果文件、GitHub、production 三者互相矛盾，以 live production 與最新 git 狀態為準，並立即修文件。
- 若使用者明確說「同步到最新」「已經上線，幫我整理」「修 live bug」，可視為授權執行 push / deploy / live smoke；但仍不得做破壞性資料操作或資料庫遷移，除非另行確認。
- 若本次只做本機修改而不部署，最終回覆必須明講「尚未上 production」，並把 `memory.md` 標成未部署狀態。

### InsForge Edge Function 部署注意

- `delete-account`、`weekly-report`、`achievement-checker` 目前可用原始檔直接部署。
- `coach` production 入口使用 `server/insforge/functions/coach-simple.ts`，且會 import `server/insforge/functions/_shared/coachActionLoop.ts`。目前 InsForge CLI 直接部署原檔可能在 build 階段出現 `Module not found "file:///src/functions/_shared/coachActionLoop.ts"`；部署 `coach` 時先打包成單檔再 deploy：

```bash
npx esbuild server/insforge/functions/coach-simple.ts \
  --bundle --platform=neutral --format=esm \
  --external:npm:@insforge/sdk \
  --outfile=/tmp/imxin-coach-edge-bundled.ts

npx @insforge/cli functions deploy coach --file /tmp/imxin-coach-edge-bundled.ts
```

- 部署後要用 `npx @insforge/cli functions code coach` 回讀線上 code，確認新邏輯真的在 production。

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

目前最新本地基線（2026-05-16）：

- Frontend tests: 44 files / 393 tests passed
- Server tests: 19 files / 213 tests passed
- E2E: 4 passed
- Frontend lint: 0 errors / 31 warnings
- Server lint: 0 errors / 24 warnings
- Frontend build: passed
- Server build: passed

## 最新主線

- `34b549c fix: 補 Coach 首屏 LINE 入口`
  - Coach 開場卡新增「也可以用 LINE 對話」入口，直接露出 `@980pqrhn` 與綁定步驟。
  - PWA production 已確認 live bundle `index-C0yGyERj.js`。
- `0ef72fd fix: 整合 Debug Review 修正`
  - 合入 Claude 安全修正與 Debug / Review 修正。
  - 包含 LINE 危機字詞、production 簽名強制、InsForge adapter 結構化日誌、登入使用者 `ruler_logs` 同步、深色模式對比、成就檢查規則與相關測試。
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
