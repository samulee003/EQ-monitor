# 今心方法語言風險收斂 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 將今心 App 前台與使用者可見輸出，從容易被看成直接沿用 第三方情緒記錄 App / RULER 的語言，收斂成「RULER 啟發、ACT-informed、IFS-informed、Dan Siegel-informed」的今心自有表述。

**Architecture:** 保留既有資料模型、檔名與資料表名，例如 `ruler_logs`、`RulerLogEntry`、`useRulerFlow`，因為它們牽涉儲存、遷移與測試穩定性。四象限 / energy-valence 類型的分類本身是常見情緒覺察表達，可以保留；這次只收斂品牌化名稱、RULER 五字母流程、第三方情緒記錄 App / Yale 關聯暗示、AI fallback、LINE 週報/關懷訊息、產品文件與測試期望。

**Tech Stack:** React 19, TypeScript, Vitest, InsForge Edge Functions, LINE Bot server code, Markdown docs.

**Completion status (2026-05-15):** Implemented and verified. Full frontend tests/build, server tests/build, lint, E2E, `git diff --check`, and active-surface language scans passed. One server test run timed out while build/test/lint were running in parallel; the isolated `src/index.test.ts` and the full server suite passed sequentially.

---

## Assumptions

- 今心可以明確寫出「靈感來自 RULER 的情緒覺察技能」，但不宣稱與 Yale、RULER Approach、第三方情緒記錄 App、ACT、IFS 或 Dan Siegel / Mindsight Institute 有官方關係。
- 今心前台方法名使用「知心四式」：心照、喚名、安神、動念。
- 四象限與能量/舒適度類型的視覺分類可以保留；避免的是把它命名為 `四象限情緒表` 或把 RULER 五字母流程當成今心自己的產品方法。
- ACT、IFS 與 Dan Siegel 相關內容只用作「informed / 參考方向」，不宣稱提供正式 ACT 治療、IFS 治療、心理治療、診斷或官方 Dan Siegel / Mindsight Institute 練習。
- 這不是法律意見；本次是產品語言與程式輸出層面的風險降低。
- 不做資料庫欄位、資料表、TypeScript 型別、檔名的大規模 rename，避免讓已部署資料與 migration 失配。

## File Structure

- Modify: `src/services/AIService.ts`
  - Responsibility: local AI fallback, chat fallback, weekly insight fallback. Remove user-facing `RULER` acronym teaching while keeping four-quadrant wording where it is useful. Add the same 今心 method blend used by the AI coach: RULER-inspired, ACT-informed, IFS-informed, and Dan Siegel-informed.
- Modify: `src/services/AIService.test.ts`
  - Responsibility: update fallback expectations from `RULER` acronym teaching to `知心四式`; four-quadrant expectations may remain.
- Modify: `src/services/prompts.ts`
  - Responsibility: frontend AI analysis system prompt for parenting / emotional coaching. Add concise method boundaries and Dan Siegel-informed language without turning the output into formal therapy.
- Modify: `server/insforge/agents/soul.md`
  - Responsibility: canonical AI coach soul contract. Add the method foundation: RULER inspiration, ACT acceptance / values action, IFS-informed inner parts awareness, and Dan Siegel-informed mindsight / integration / tolerance-window language.
- Modify: `server/src/agents/soulInstruction.ts`
  - Responsibility: Node ADK coach prompt builder. Mirror the soul contract in active agent instructions.
- Modify: `server/insforge/functions/coach-simple.ts`
  - Responsibility: production REST fallback prompt. Mirror the same coach method foundation because this file embeds the prompt instead of importing it.
- Modify: `server/src/agents/skills/emergencyStabilization.ts`
  - Responsibility: Node emergency regulation sub-agent. Shift from branded 緊急安定流程 phrasing toward 今心 emergency stabilization language, including nervous-system downshifting and tolerance-window language.
- Modify: `server/insforge/agents/skills/emergencyStabilization.ts`
  - Responsibility: Edge emergency regulation sub-agent. Mirror the Node EmergencyStabilization prompt.
- Modify: `server/insforge/agents/soulContract.test.ts`
  - Responsibility: contract tests ensuring the soul doc, ADK prompt, and production fallback prompt all carry the new method foundation.
- Modify: `server/insforge/functions/weekly-report.ts`
  - Responsibility: deployed weekly report text. Keep `主要象限` acceptable, but remove copy that sounds like branded RULER teaching.
- Modify: `server/insforge/functions/_shared/scheduleHelpers.ts`
  - Responsibility: shared pure render helpers for scheduled pushes. Keep quadrant wording acceptable; ensure care wording is 今心-owned and not brand-adjacent.
- Modify: `server/insforge/functions/_shared/scheduleHelpers.test.ts`
  - Responsibility: update helper test expectations.
- Modify: `server/insforge/functions/achievement-checker.ts`
  - Responsibility: deployed proactive care copy. Keep quadrant wording acceptable; ensure the message does not imply RULER affiliation.
- Modify: `server/src/emotionData.test.ts`
  - Responsibility: keep backend emotion description tests aligned with whichever four-quadrant labels the active implementation uses.
- Modify: `server/src/index.ts`
  - Responsibility: internal comment only, avoid old `RULER Bot` description in active source.
- Modify: `docs/superpowers/specs/2026-05-11-insforge-agentic-coach-design.md`
  - Responsibility: current design docs. Keep `象限` acceptable; replace brand-adjacent method language only.
- Modify: `docs/qa/2026-05-13-普通使用者探索測試.md`
  - Responsibility: QA notes. Keep `象限` acceptable; replace only `四象限情緒表` / RULER-branded phrasing if present.
- Modify: `docs/superpowers/plans/2026-05-11-sprint1-insforge-coach-memory.md`
  - Responsibility: active planning docs. Keep `象限` and code snippets with `quadrant`/`pleasantness` unchanged when they document existing schemas.

## Success Criteria

- Public-facing text no longer teaches the RULER acronym as the product method.
- Public-facing app, AI fallback, weekly report, and care push output use `知心四式` / `知心四式`; four-quadrant wording can remain.
- AI coach prompts consistently state the method blend: RULER-inspired emotion awareness, ACT-informed acceptance / values action, IFS-informed parts awareness, and Dan Siegel-informed mindsight / integration / nervous-system stabilization.
- AI coach prompts avoid claiming affiliation with Dan Siegel, Mindsight Institute, Yale, RULER Approach, 第三方情緒記錄 App, ACT, or IFS organizations.
- README / CLAUDE / current spec clearly state the honest influence line: RULER-inspired, ACT-informed, IFS-informed, Dan Siegel-informed, not affiliated, not therapy.
- Targeted tests pass:
  - `cd server && npm run test:run -- insforge/agents/soulContract.test.ts`
  - `npm run test:run -- src/services/AIService.test.ts src/components/EmotionQuadrantPicker.test.tsx src/components/RulerProgress.test.tsx`
  - `cd server && npm run test:run -- src/emotionData.test.ts src/rulerBot.test.ts`
- A final scan shows remaining `RULER` / `ruler_*` occurrences are internal identifiers, schemas, historical docs, or explicit attribution rather than user-facing copied method language. `象限` / `quadrant` is allowed when used as a generic four-quadrant model.

---

### Task 1: Update AI Coach Method Foundation

**Files:**
- Modify: `server/insforge/agents/soul.md`
- Modify: `server/src/agents/soulInstruction.ts`
- Modify: `server/insforge/functions/coach-simple.ts`
- Modify: `server/src/agents/skills/emergencyStabilization.ts`
- Modify: `server/insforge/agents/skills/emergencyStabilization.ts`
- Test: `server/insforge/agents/soulContract.test.ts`

- [x] **Step 1: Add contract test for the new method foundation**

In `server/insforge/agents/soulContract.test.ts`, add expectations to the soul and production prompt tests:

```ts
for (const phrase of [
  'RULER 啟發',
  'ACT-informed',
  'IFS-informed',
  'Dan Siegel-informed',
  'mindsight',
  '可承受範圍',
  '不宣稱與 Yale、RULER Approach、第三方情緒記錄 App、ACT、IFS 或 Dan Siegel / Mindsight Institute 有官方關係',
]) {
  expect(soul).toContain(phrase);
}
```

And in the production prompt loop:

```ts
for (const phrase of [
  'RULER 啟發',
  'ACT-informed',
  'IFS-informed',
  'Dan Siegel-informed',
  'mindsight',
  '可承受範圍',
]) {
  expect(productionPrompt).toContain(phrase);
  expect(promptSource).toContain(phrase);
}
```

- [x] **Step 2: Run the contract test and verify expected failure**

Run:

```bash
cd server && npm run test:run -- insforge/agents/soulContract.test.ts
```

Expected: FAIL because the method foundation is not yet in the soul doc / prompt builders.

- [x] **Step 3: Update `soul.md` with method foundation**

Add a `## 方法來源與邊界` section after role positioning:

```md
## 方法來源與邊界

今心教練的方法是今心自己的整合版本：

- RULER 啟發：重視情緒辨識、理解、命名、表達與調節，但不使用 RULER 五字母作為前台流程。
- ACT-informed：先允許感受存在，再回到使用者重視的價值與下一個可做的小行動。
- IFS-informed：把內在拉扯視為不同部分的訊號，溫和詢問「這個部分想保護什麼」。
- Dan Siegel-informed：參考 mindsight、身心腦與關係的整合、以及情緒升高時先回到可承受範圍再回應。

今心不宣稱與 Yale、RULER Approach、第三方情緒記錄 App、ACT、IFS 或 Dan Siegel / Mindsight Institute 有官方關係，也不提供正式心理治療、診斷或醫療建議。
```

- [x] **Step 4: Update ADK prompt builder**

In `server/src/agents/soulInstruction.ts`, add a method section to `buildEmotionCoachGlobalInstruction()`:

```ts
- 方法來源要誠實：今心是 RULER 啟發、ACT-informed、IFS-informed、Dan Siegel-informed 的自有整合練習。
- 不宣稱與 Yale、RULER Approach、第三方情緒記錄 App、ACT、IFS 或 Dan Siegel / Mindsight Institute 有官方關係。
```

Add to `buildEmotionCoachInstruction()`:

```md
## 方法融合
- RULER 啟發：看見、理解、命名情緒，但使用今心自己的知心四式語言。
- ACT-informed：接納感受，協助使用者回到價值與可做的小行動。
- IFS-informed：把內在衝突視為不同部分的保護訊號，不把任何部分說成壞。
- Dan Siegel-informed：用 mindsight 幫使用者看見「我正在感到...」而不是「我就是...」，並在高壓時先回到可承受範圍。
```

- [x] **Step 5: Mirror the prompt changes into production fallback**

Apply the same wording to `server/insforge/functions/coach-simple.ts`, because production embeds its own prompt builder and does not import the Node prompt.

- [x] **Step 6: Update EmergencyStabilization language**

In both EmergencyStabilization files, keep the existing step flow, but add this constraint near communication principles:

```md
- 這是今心的緊急穩定流程，參考情緒調節與 Dan Siegel-informed 的身心腦整合觀點；不要宣稱是官方 RULER、第三方情緒記錄 App 或 Dan Siegel / Mindsight Institute 練習。
- 目標不是立刻變好，而是先回到可承受範圍，讓使用者多一點停頓與選擇空間。
```

- [x] **Step 7: Re-run contract test**

Run:

```bash
cd server && npm run test:run -- insforge/agents/soulContract.test.ts
```

Expected: PASS.

---

### Task 2: Update Frontend AI Coach Prompt And Fallbacks

**Files:**
- Modify: `src/services/prompts.ts`
- Modify: `src/services/AIService.ts`
- Test: `src/services/AIService.test.ts`

- [x] **Step 1: Update frontend prompt boundaries**

In `src/services/prompts.ts`, add to the parent coach system prompt:

```md
## 方法來源與邊界

- 今心方法是 RULER 啟發、ACT-informed、IFS-informed、Dan Siegel-informed 的自有整合練習。
- 可以用「接納感受」「回到重要價值」「聽見內在部分」「先回到可承受範圍」等語言。
- 不要宣稱今心與 Yale、RULER Approach、第三方情緒記錄 App、ACT、IFS 或 Dan Siegel / Mindsight Institute 有官方關係。
- 不提供心理治療、診斷或醫療建議。
```

- [x] **Step 2: Update chat fallback explanation**

In `src/services/AIService.ts`, ensure the `知心四式` explanation includes:

```ts
這套練習靈感來自 RULER 的情緒覺察技能，也參考 ACT 的接納與價值行動、IFS-informed 的內在部分覺察，以及 Dan Siegel-informed 的 mindsight 與身心腦整合觀點；今心不是 Yale、RULER Approach、第三方情緒記錄 App、ACT、IFS 或 Dan Siegel / Mindsight Institute 官方產品，也不是心理治療。
```

- [x] **Step 3: Update AIService tests**

In `src/services/AIService.test.ts`, add expectations for the chat fallback:

```ts
expect(result).toContain('Dan Siegel-informed');
expect(result).toContain('mindsight');
expect(result).toContain('不是 Yale');
```

- [x] **Step 4: Run AIService tests**

Run:

```bash
npm run test:run -- src/services/AIService.test.ts
```

Expected: PASS.

---

### Task 3: Update AIService User-Facing Fallbacks Without Removing Four-Quadrant Language

**Files:**
- Modify: `src/services/AIService.ts`
- Test: `src/services/AIService.test.ts`

- [x] **Step 1: Update tests for mock insight wording**

Keep four-quadrant expectations acceptable. Change only the method explanation expectations in `src/services/AIService.test.ts`:

```ts
expect(result.colorTheory).toContain('紅色');
expect(result.colorTheory).toContain('黃色');
expect(result.colorTheory).toContain('藍色');
expect(result.colorTheory).toContain('綠色');
```

For chat fallback, replace acronym expectations with:

```ts
expect(result).toContain('知心四式');
expect(result).toContain('看見');
expect(result).toContain('命名');
expect(result).toContain('安放');
expect(result).toContain('回應');
expect(result).not.toContain('Recognizing');
```

- [x] **Step 2: Run AIService tests and verify expected failures**

Run:

```bash
npm run test:run -- src/services/AIService.test.ts
```

Expected: FAIL only where old expectations or old fallback wording still exists.

- [x] **Step 3: Update `AIService.ts` fallback strings**

In `MOCK_INSIGHTS` and `generateWeeklyInsight()` local fallback, keep four-quadrant wording if useful, but avoid sounding like an official RULER lesson. Acceptable examples:

```ts
colorTheory: "紅色象限代表高能量、不舒服的時刻，通常需要先暫停，讓身體有機會回到可承受範圍。"
colorTheory: "黃色象限代表被點亮、較順心的時刻，適合創意工作與社交互動。"
colorTheory: "藍色象限需要自我慈悲，這不是軟弱的表現，而是復原的起點。"
colorTheory: "綠色象限是恢復與整合的狀態，是建立新習慣和深度思考的最佳時機。"
```

For `getMockChatResponse()`, keep this explanation style:

```ts
return `知心四式是我們自己的前台整理語言，幫你把混亂感受拆成可以開始的小步：

1. **看見**：先注意身體與此刻狀態
2. **命名**：用更準確的詞靠近感覺
3. **安放**：理解它和哪個情境、需要或內在部分有關，並把想說的話安全放下來
4. **回應**：選一個不傷害自己或他人的小行動

這套練習靈感來自 RULER 的情緒覺察技能，也參考 ACT 的接納與價值行動、IFS-informed 的內在部分覺察，以及 Dan Siegel-informed 的 mindsight 與身心腦整合觀點；今心不是 Yale、RULER Approach、第三方情緒記錄 App、ACT、IFS 或 Dan Siegel / Mindsight Institute 官方產品，也不是心理治療。`;
```

- [x] **Step 4: Re-run AIService tests**

Run:

```bash
npm run test:run -- src/services/AIService.test.ts
```

Expected: PASS.

---

### Task 4: Update Scheduled LINE Weekly Report And Care Text Without Broad `象限` Replacement

**Files:**
- Modify: `server/insforge/functions/weekly-report.ts`
- Modify: `server/insforge/functions/_shared/scheduleHelpers.ts`
- Modify: `server/insforge/functions/_shared/scheduleHelpers.test.ts`
- Modify: `server/insforge/functions/achievement-checker.ts`

- [x] **Step 1: Update helper tests first**

Keep `主要象限` and `紅象限` acceptable. Only ensure the care message is 今心-owned and does not mention RULER / 第三方情緒記錄 App. Expectations can stay:

```ts
expect(text).toContain('主要象限：red');
expect(renderCareMessage('care_red_streak')).toContain('紅象限');
```

- [x] **Step 2: Run helper tests and verify expected failures**

Run:

```bash
npm run test:run -- server/insforge/functions/_shared/scheduleHelpers.test.ts
```

Expected: PASS unless there are other wording changes already made.

- [x] **Step 3: Review shared helper output**

In `server/insforge/functions/_shared/scheduleHelpers.ts`, keep this output acceptable:

```ts
report.dominant_quadrant ? `主要象限：${report.dominant_quadrant}` : '',
```

And this care message acceptable:

```ts
'注意到你最近幾天有些紅象限的情緒升溫。',
```

Leave function name `findRedStreakUsers` unchanged because it is internal scheduling logic.

- [x] **Step 4: Review deployed weekly report output**

In `server/insforge/functions/weekly-report.ts`, keep this output acceptable:

```ts
report.dominant_quadrant ? `主要象限：${String(report.dominant_quadrant)}` : '',
```

Color theory strings may use `象限`, but should not present RULER or 第三方情緒記錄 App as official source. Acceptable examples:

```ts
colorTheory: '紅色象限佔比高時，身體多半處於較警覺的保護模式。試著在一天結束時加入綠色活動（如靜坐或慢呼吸）來平衡。'
colorTheory: '黃色象限代表被點亮、較順心的時刻。善用這段時間處理重要決定，但也留意別過度消耗。'
colorTheory: '藍色象限是身體提醒你需要修復與被照顧。像對待重要的人一樣對待自己，給予溫柔與耐心。'
colorTheory: '綠色象限代表較能恢復與整合的時刻。這是沉澱經驗、建立新習慣的好時機。'
```

- [x] **Step 5: Review proactive care copy**

In `server/insforge/functions/achievement-checker.ts`, keep this acceptable:

```ts
'注意到你最近幾天有些紅象限的情緒升溫。',
```

- [x] **Step 6: Re-run helper tests**

Run:

```bash
npm run test:run -- server/insforge/functions/_shared/scheduleHelpers.test.ts
```

Expected: PASS.

---

### Task 5: Keep Backend Emotion Description Tests Aligned

**Files:**
- Modify: `server/src/emotionData.test.ts`

- [x] **Step 1: Keep expectations aligned with the chosen four-quadrant copy**

If implementation uses classic energy/comfort wording, these expectations are acceptable:

```ts
expect(getQuadrantDescription('red')).toContain('高能量低愉悅');
expect(getQuadrantDescription('yellow')).toContain('高能量高愉悅');
expect(getQuadrantDescription('blue')).toContain('低能量低愉悅');
expect(getQuadrantDescription('green')).toContain('低能量高愉悅');
```

If implementation already uses `很滿 / 很慢` wording from earlier edits, update tests to match. Do not change wording only to remove `象限`.

- [x] **Step 2: Run backend emotion tests**

Run:

```bash
cd server && npm run test:run -- src/emotionData.test.ts
```

Expected: PASS if `server/src/emotionData.ts` already uses 今心四色狀態 wording.

---

### Task 6: Clean Active Source Comments And Current Docs

**Files:**
- Modify: `server/src/index.ts`
- Modify: `docs/superpowers/specs/2026-05-11-insforge-agentic-coach-design.md`
- Modify: `docs/qa/2026-05-13-普通使用者探索測試.md`
- Modify: `docs/superpowers/plans/2026-05-11-sprint1-insforge-coach-memory.md`

- [x] **Step 1: Update active source comment**

In `server/src/index.ts`, change:

```ts
// 使用知心四式 Bot 處理消息
```

- [x] **Step 2: Update current design docs prose**

In `docs/superpowers/specs/2026-05-11-insforge-agentic-coach-design.md`, keep `象限` prose acceptable. Only remove direct branded method claims if present:

```md
2. 逐筆提取元數據（象限、需求、強度）
- 訊息風格：「上週你記錄了 N 次，主要在 X 象限，主要需求是 Y...」
```

- [x] **Step 3: Update QA notes prose**

In `docs/qa/2026-05-13-普通使用者探索測試.md`, keep `象限` prose acceptable:

```md
- 快速紀錄：象限、情緒、強度、情境、文字備註、回饋、保存。
- 歷史紀錄：空狀態、有資料狀態、象限 chips、編輯、刪除確認、匯出預覽。
### P1 - 歷史頁象限 chips 看起來可篩選，但點擊沒有作用
```

- [x] **Step 4: Update active plan prose only**

In `docs/superpowers/plans/2026-05-11-sprint1-insforge-coach-memory.md`, keep prose lines acceptable:

```md
**Goal:** 讓用戶可以建立帳號，並在完成情緒記錄後，讓 AI 教練有跨對話的持久記憶（基於象限/需求/強度元數據，原始日記內容不離開裝置）。
```

For code snippets in this doc, keep `quadrant` and `pleasantness` unchanged because they are schema examples.

---

### Task 7: Verification Scan And Targeted Test Run

**Files:**
- No planned code edits unless verification finds a user-facing miss.

- [x] **Step 1: Run targeted frontend and service tests**

Run:

```bash
npm run test:run -- src/services/AIService.test.ts src/components/EmotionQuadrantPicker.test.tsx src/components/RulerProgress.test.tsx
```

Expected: PASS.

- [x] **Step 2: Run targeted server tests**

Run:

```bash
cd server && npm run test:run -- src/emotionData.test.ts src/rulerBot.test.ts
```

Expected: PASS.

- [x] **Step 3: Scan active user-facing surfaces**

Run an active-surface scan for old copied product language across README, CLAUDE, source, server code, E2E tests, and current docs, excluding archives, coverage, build output, and dependencies.

Expected: no hits that are active user-facing product copy. Allowed hits:

```text
README.md / CLAUDE.md / current spec explicit attribution lines
explicit attribution lines in README / CLAUDE / current spec
internal identifiers such as ruler_logs, RulerLogEntry, useRulerFlow
generic four-quadrant language such as 象限 / quadrant
historical docs or schema examples that must match existing database fields
```

- [x] **Step 4: Scan AI coach method foundation**

Run:

```bash
rg -n "RULER 啟發|ACT-informed|IFS-informed|Dan Siegel-informed|mindsight|可承受範圍|Mindsight Institute" server/insforge/agents/soul.md server/src/agents/soulInstruction.ts server/insforge/functions/coach-simple.ts src/services/prompts.ts src/services/AIService.ts
```

Expected: hits in the canonical soul doc, active prompt builders, production fallback prompt, and frontend AI prompt/fallback.

- [x] **Step 5: Summarize residual risk**

Report:

```md
已完成前台與使用者可見輸出改寫。
四象限保留，因為它是常見情緒覺察模型，不是本次主要風險來源。
AI 教練已加入 RULER 啟發、ACT-informed、IFS-informed、Dan Siegel-informed 的今心自有整合說法。
保留的 `ruler_*` / `Ruler*` 主要是內部資料表、型別、檔名與 migration 兼容命名。
若要做下一階段，可另開資料模型 rename/migration 計畫。
```

---

## Self-Review

- Spec coverage: The plan covers the user's requested direction: not copying five steps exactly, adding ACT / IFS / Dan Siegel-informed framing, honestly stating RULER inspiration, and preserving four-quadrant language as acceptable.
- Placeholder scan: No `TBD`, `TODO`, or unspecified "add tests" steps remain.
- Type consistency: Internal names stay unchanged, so no TypeScript or database schema migration is introduced.
- Scope control: This plan intentionally excludes archived docs and generated coverage output from active risk cleanup.
