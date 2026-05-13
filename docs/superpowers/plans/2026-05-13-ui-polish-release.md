# 今心 UI Polish Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修掉普通使用者探索測試中阻礙封閉內測信任的 P0/P1/P2 問題，並把 Stitch 視覺收斂成更接近原版清楚、穩定、好操作的體驗。

**Architecture:** 以現有 React 19 + CSS Modules / Vanilla CSS 結構為主，不重做架構。資料保存仍走 `dataAdapter`；UI 修整集中在 `CheckInFlow`、`QuickCheckIn`、`Timeline`、`MainLayout`、`CoachPage` 與設定彈窗。

**Tech Stack:** React 19、TypeScript、Vitest、Testing Library、Vite、Vanilla CSS / CSS Modules。

---

### Task 1: 測試鎖住 QA 回歸

**Files:**
- Modify: `src/components/CheckInFlow.test.tsx`
- Modify: `src/components/Timeline.test.tsx` if present, otherwise create `src/components/Timeline.test.tsx`

- [ ] **Step 1: Add failing test for quick check-in persistence**

Test should render `CheckInFlow`, click quick record, choose a quadrant/emotion/intensity/scenario, click save, then assert `dataAdapter.logs.create` or exported logs contain the quick record.

- [ ] **Step 2: Add failing test for timeline edit refresh**

Test should seed one log without expression, edit it, save, and assert the visible text updates without leaving the page.

- [ ] **Step 3: Run focused tests and confirm the new tests fail**

Run: `npm run test:run -- src/components/CheckInFlow.test.tsx src/components/Timeline.test.tsx`

Expected: new tests fail for missing quick save and stale edit render.

### Task 2: Fix data and history behavior

**Files:**
- Modify: `src/components/CheckInFlow.tsx`
- Modify: `src/components/QuickCheckIn.tsx`
- Modify: `src/components/Timeline.tsx`

- [ ] **Step 1: Persist quick check-in through dataAdapter**

Map quick check-in data into a `RulerLogEntry` and call `dataAdapter.logs.create`.

- [ ] **Step 2: Split general quick check-in from parent scenario copy**

Use general emotion labels for the default quick entry; keep parent-specific copy only for parent mode.

- [ ] **Step 3: Refresh timeline state after edit**

After save, update local `logs` from the saved data or reload then clear editing state only after state is refreshed.

- [ ] **Step 4: Make quadrant chips honest**

Either implement local filtering or render inactive stats as non-button cards. Prefer filtering because users already read them as filters.

- [ ] **Step 5: Add empty-state primary action**

Add「開始第一筆紀錄」button that navigates to `#home`.

### Task 3: Polish layout and copy

**Files:**
- Modify: `src/components/MainLayout.tsx`
- Modify: `src/index.css`
- Modify: `src/components/NotificationSettings.tsx`
- Modify: `src/pages/CoachPage.tsx`
- Modify: `src/pages/CoachPage.module.css`

- [ ] **Step 1: Prevent sticky header overlap**

Add consistent top spacing / scroll margin and reduce header dominance so content is not hidden during scroll.

- [ ] **Step 2: Improve header actions**

Show clearer desktop labels for achievements, theme, and reminders while preserving compact mobile layout.

- [ ] **Step 3: Improve settings modal contrast**

Use a more opaque panel background and stronger text colors in light mode.

- [ ] **Step 4: Fix Coach LINE binding layout**

Give binding card and chat input dock clear separation and ensure binding message is visible after submit.

- [ ] **Step 5: Localize Coach bottom nav and remove dead profile button**

Use「安定室 / 紀錄 / 教練 / 洞察」and make profile button open existing reminders/settings or remove it.

- [ ] **Step 6: Hide internal tool names from Coach display**

Sanitize rendered model content to remove raw backticked tool-call snippets such as `save_ruler_log`.

### Task 4: Verify and browser smoke

**Files:**
- No production file edits unless verification reveals a blocker.

- [ ] **Step 1: Run focused tests**

Run: `npm run test:run -- src/components/CheckInFlow.test.tsx src/components/Timeline.test.tsx src/pages/CoachPage.test.tsx src/components/coach/ChatInput.test.tsx`

- [ ] **Step 2: Run typecheck and build**

Run: `npx tsc --noEmit`

Run: `npm run build`

- [ ] **Step 3: Browser smoke**

Open `http://127.0.0.1:5173/`, test quick record saves, history edit refreshes, Coach SOS/chat/binding layout remains usable, and header no longer covers content.

