# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**今心 ImXin** — an open-source emotional awareness PWA built around the app's own 「知心四式」 flow: 心照 → 喚名 → 安神 → 動念. The method is RULER-inspired, ACT-informed, IFS-informed, and Dan Siegel-informed, but 今心 is not affiliated with Yale, RULER Approach, ACT, IFS, Dan Siegel / Mindsight Institute, or any therapy institute. Target users: anxious parents needing in-the-moment emotional regulation support.

**Dual-entry, Bot-First architecture:**
- LINE Bot (primary) — 知心四式 conversation state machine via `server/src/rulerBot.ts`
- PWA Dashboard (secondary) — history, heatmap, achievements, 阿念 AI coach

**Current product focus: Agentic Action Loop (阿念教練 7 日小陪跑).** Coach is not a chat box — it runs `Observe → Orient → Plan → Act → Persist → Evaluate → Adjust` per interaction. LLM does semantic judgement; deterministic code owns state transitions, rewards, expiry and crisis-gating. See `AGENTS.md` for full agent rules and `CONTEXT.md` for product-language definitions.

**All UI text, comments, commit messages must be in Traditional Chinese (Taiwan).** Front-stage method names are **心照 / 喚名 / 安神 / 動念**. Do NOT use `Mood Meter`, `Meta-Moment`, `How We Feel`, or `RULER 五步` as user-facing or active-prompt language. Internal identifiers (`ruler_logs`, `RulerLogEntry`, `useRulerFlow`, `rulerBot.ts`) stay as-is for compatibility.

---

## Commands

### Frontend PWA (root directory)

```bash
npm run dev          # Dev server → http://localhost:5173
npm run build        # Production build → dist/
npm run preview      # Preview production build
npm run test         # Vitest watch mode
npm run test:run     # Single run (~368 tests across 40 files, baseline 2026-05-15)
npm run test:e2e     # Playwright E2E (4 critical paths)
npm run test:e2e:ui  # Playwright interactive UI
npx vitest run src/path/to/file.test.ts  # Run single test file
npm run test:coverage
npm run lint
npx tsc --noEmit     # Type check
npm run cap:sync     # Build + sync Capacitor (Android)
npm run cap:open     # Open Android Studio
npm run migrate      # Run InsForge LocalStorage→InsForge data migration
```

### Backend Bot Server (cd server/)

```bash
npm run dev          # tsx watch → http://localhost:3000
npm run build        # tsc → dist/
npm run start        # Run compiled
npm run test:run     # ~164 tests across 17 files (1 env.ts test fails due to dotenv — expected)
node test-bot.cjs    # End-to-end conversation simulation
```

### InsForge CLI (from project root)

```bash
npx @insforge/cli metadata                          # Inspect all backend resources
npx @insforge/cli db tables                         # List DB tables
npx @insforge/cli db query "<sql>"                  # Run raw SQL
npx @insforge/cli functions deploy coach            # Deploy edge function
npx @insforge/cli secrets add KEY "value"           # Add secret
npx @insforge/cli current                           # Verify linked project
```

---

## Architecture

### Frontend (`src/`)

**Routing**: No React Router. Hash-based view routing via `appStore.currentView`:
```typescript
type AppView = 'home' | 'checkin' | 'history' | 'growth' | 'achievement' | 'coach';
```
`App.tsx` lazy-loads view components; `MainLayout.tsx` handles the switch.

**Data Layer — Adapter Pattern (critical):**
All data operations go through `src/adapters/`. Never access localStorage directly.
```typescript
import { dataAdapter } from '@/adapters';
await dataAdapter.saveLog(entry);  // ✅
localStorage.setItem('...', ...);  // ❌
```
Current implementation: AES-256-GCM encrypted localStorage. InsForge sync adapter exists at `src/lib/insforge/` but LocalStorage → InsForge migration is not yet wired up.

**State management rules (strictly enforced):**

| Scenario | Use |
|----------|-----|
| Global UI prefs (theme/language) | React Context (`ThemeContext`, `LanguageContext`) |
| Auth state | React Context (`AuthContext`) |
| Complex flow state (知心四式, chat) | `useReducer` (`useRulerFlow`) |
| Cross-component shared data | Zustand (`appStore`, `botStore`) |
| Simple key-value prefs | `settingsStore` |
| Local UI state | `useState` |

Do not mix strategies in a single component.

**InsForge client** (`src/lib/insforge/client.ts`):
```typescript
import { insforge } from '@/lib/insforge/client';
// Requires VITE_INSFORGE_URL env var
```
Project linked at `.insforge/project.json` (do not commit). OSS host: `https://b88egxiz.ap-southeast.insforge.app`

**AI Coach (阿念) — Agentic Action Loop**: PWA Coach is a multi-step agent, not a chat wrapper.
- Frontend: `src/lib/adk/` (REST client + types), `src/pages/CoachPage.tsx` (7 日小陪跑 UI, 小行動提案卡, active 回顧卡, XP / 金幣 / 復盤連續進度列).
- Backend runtime: `server/insforge/functions/coach-simple.ts` is the **production `coach` Edge Function** (self-contained prompt builder, multi-step loop, trace persistence, gamification metadata).
- Shared loop logic: `server/insforge/functions/_shared/coachActionLoop.ts`.
- Schema: `server/insforge/schema/011_coach_action_loop.sql` (`coach_micro_actions`, `coach_gamification_stats`, `coach_agent_traces`; DB enforces one active 小行動 per user).
- Reference (not deployed): `server/src/agents/soulInstruction.ts`, `server/insforge/agents/soul.md`.

**When modifying coach method-language or action-loop behaviour, update all of: `coach-simple.ts`, `soulInstruction.ts`, `soul.md`, `coachActionLoop.ts`, `src/lib/adk/types.ts`, `CoachPage.tsx`, and the corresponding tests in lockstep.**

Hard rules enforced by code (do not bypass):
- 危機語句 → `crisis_reward_blocked`; never create a 小行動 or award XP/金幣 on a crisis path.
- A 回報 (completed/partial/skipped) only rewards an active, unreported row.
- A 小行動 can only be created from a pending proposal that the user has explicitly confirmed.
- Gamification is personal-tool only: XP / 等級 / 金幣 / 復盤連續 allowed; **no social leaderboards, no point deductions, no demotion, no shaming reminders**.

### Backend (`server/`)

Express 5 + TypeScript. Entry: `server/src/index.ts`.

**LINE Webhook** → `rulerBot.ts` (知心四式 state machine, 30-min session context).

**DB adapter** (`server/src/db/index.ts`): switches between `memoryAdapter` (dev/test, no env vars needed) and `insforgeAdapter` (production, requires `DATABASE_URL`). Production uses InsForge PostgreSQL.

**InsForge infrastructure** (`server/insforge/`):
- `schema/` — SQL migrations (run via direct PostgreSQL or `npx @insforge/cli db query`)
- `functions/` — Edge Functions deployed to InsForge (Deno/TS); `coach` is the active one
- `agents/` — ADK agent definitions (reference only, not deployed; ADK JS incompatible with Deno)

### InsForge Backend

Tables (all RLS-enabled, see `server/insforge/schema/`):
- Core: `profiles`, `ruler_logs`, `ruler_drafts`, `achievement_records`, `streaks`.
- Coach: `coach_messages`, `coach_context`, `coach_micro_actions`, `coach_gamification_stats`, `coach_agent_traces`.
- Ops: `notification_log`, `account_deletions`.

Storage (2 private buckets): `voice-recordings`, `exports`.

Edge Functions (`server/insforge/functions/`): `coach-simple.ts` is the deployed `coach` function; `coach.ts` is legacy reference. Other functions: `achievement-checker`, `weekly-report`, `delete-account`.

Auth trigger: `on_auth_user_created` auto-creates `profiles` row.

---

## Zeabur Deployment

### 架構（2026-05-12 整合後）

| 服務 | Zeabur 專案 | 位置 | Domain | Service ID |
|------|------------|------|--------|------------|
| eq-monitor (PWA) | `today-mood` | Shared | `today-mood.zeabur.app` | `6958b4f0b8dd347fac234e9f` |
| imxin-bot-server (LINE Bot) | `imxin` | Tencent Tokyo 專用伺服器 | `imxin-bot.zeabur.app` | `6a032e7f5e7e3bf5e93f155e` |

### Zeabur 專案 ID

| 專案 | ID |
|------|----|
| `today-mood` | `6958b4dd85bfb0039750b2f4` |
| `imxin` (專用伺服器) | `6a032e42dd502f86055b3f22` |

### 專用伺服器

- **名稱**: Tencent Tokyo 2C 2GB
- **Server ID**: `6a02e30fdd50c05e554d2537`
- **IP**: `43.167.10.6`

### 重新部署指令

```bash
# PWA (eq-monitor) — 從專案根目錄
npx zeabur@latest deploy --project-id 6958b4dd85bfb0039750b2f4 --service-id 6958b4f0b8dd347fac234e9f --json -i=false

# Bot Server — 從 server/ 目錄
cd server && npx zeabur@latest deploy --project-id 6a032e42dd502f86055b3f22 --service-id 6a032e7f5e7e3bf5e93f155e --json -i=false
```

### 健康檢查

```bash
curl https://imxin-bot.zeabur.app/health   # 確認 "adapter":"insforge"
curl https://today-mood.zeabur.app         # 確認 PWA 正常
```

---

## Code Style

- Inline type imports required: `import { type Foo } from '...'` not `import type { Foo }`
- Function components + hooks only (no class components)
- CSS Modules (`*.module.css`) or CSS custom properties; no `<style>` in JSX
- Path alias: `@` → `src/`

---

## Testing Pitfalls

**crypto.subtle in jsdom**: inject a test master key before each test:
```typescript
import { _injectMasterKey, _resetKeyCache } from '@/utils/crypto';
beforeEach(() => {
  localStorage.clear();
  _injectMasterKey('0'.repeat(64));
  _resetKeyCache();
});
```

**Module-level singletons leak between tests** (`settingsStore`, logs cache). Always `localStorage.clear()` + reinitialize in `beforeEach`.

**PBKDF2 is slow** (600K iterations ~400ms). Use low iteration count in tests:
```typescript
const hash = await hashPassword('test', 1000);
```

InsForge SDK is mocked in tests via alias: `@insforge/sdk` → `src/test/mocks/insforge-sdk.ts`.

---

## Known Issues

| Issue | Workaround |
|-------|-----------|
| `server/src/env.ts` test fails (dotenv) | Affects 1 test file; other 52 pass |
| Edge Function sessions not persistent | `InMemoryRunner` — each request is stateless |
| LocalStorage → InsForge migration | Not implemented |
| `ik_` admin key can't do DDL | Use direct PostgreSQL connection string for schema changes |
| `uak_` (user API key) unreachable headlessly | Use direct SQL + MCP tools for infra tasks |

---

## Companion Docs (read when in doubt)

- `AGENTS.md` — agent handoff rules, current baseline test counts, recent main-branch commits, next-step priorities.
- `CONTEXT.md` — product language dictionary (what each term means and what to avoid).
- `memory.md` — short-lived handoff notes between sessions.
- `CHANGELOG.md` — product change log; update after meaningful renames, deploys, or verification milestones.
- `docs/adr/` — architectural decision records (incl. Agentic Action Loop ADR).

## Regression Risk

Run `npm run test:run` before and after touching:
- `src/utils/crypto.ts` — may break v1/v2 decryption compatibility
- `src/utils/passwordHash.ts` — may break legacy DJB2 hash verification
- `src/adapters/storage.ts` — cache strategy affects write consistency
- `src/types/RulerTypes.ts` `RulerLogEntry.id` — affects `ensureId()` migration logic
