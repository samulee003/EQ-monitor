# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**今心 ImXin** — an open-source emotional awareness PWA based on the RULER method (Recognize → Understand → Label → Express → Regulate). Target users: anxious parents needing in-the-moment emotional regulation support.

**Dual-entry, Bot-First architecture:**
- LINE Bot (primary) — RULER conversation state machine via `server/src/rulerBot.ts`
- PWA Dashboard (secondary) — history, heatmap, achievements, AI coach

**All UI text, comments, commit messages must be in Traditional Chinese (Taiwan).**

---

## Commands

### Frontend PWA (root directory)

```bash
npm run dev          # Dev server → http://localhost:5173
npm run build        # Production build → dist/
npm run preview      # Preview production build
npm run test         # Vitest watch mode
npm run test:run     # Single run (265 tests)
npm run test:coverage
npm run lint
npx tsc --noEmit     # Type check
npm run cap:sync     # Build + sync Capacitor (Android)
npm run cap:open     # Open Android Studio
```

### Backend Bot Server (cd server/)

```bash
npm run dev          # tsx watch → http://localhost:3000
npm run build        # tsc → dist/
npm run start        # Run compiled
npm run test:run     # 52 tests pass (1 file fails due to dotenv)
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
| Complex flow state (RULER steps, chat) | `useReducer` (`useRulerFlow`) |
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

**AI Coach** (`src/lib/adk/`): REST fetch wrapper to the `coach` edge function. Chat history stored in localStorage.

### Backend (`server/`)

Express 5 + TypeScript. Entry: `server/src/index.ts`.

**LINE Webhook** → `rulerBot.ts` (RULER state machine, 30-min session context).

**DB adapter** (`server/src/db/index.ts`): switches between `memoryAdapter` (dev/test, no env vars needed) and `insforgeAdapter` (production, requires `DATABASE_URL`). Production uses InsForge PostgreSQL.

**InsForge infrastructure** (`server/insforge/`):
- `schema/` — SQL migrations (run via direct PostgreSQL or `npx @insforge/cli db query`)
- `functions/` — Edge Functions deployed to InsForge (Deno/TS); `coach` is the active one
- `agents/` — ADK agent definitions (reference only, not deployed; ADK JS incompatible with Deno)

### InsForge Backend

5 tables (all RLS-enabled): `profiles`, `ruler_logs`, `ruler_drafts`, `achievement_records`, `streaks`.
2 storage buckets (private): `voice-recordings`, `exports`.
1 active edge function: `coach` (AI coach REST API using Gemini).
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

## Regression Risk

Run `npm run test:run` before and after touching:
- `src/utils/crypto.ts` — may break v1/v2 decryption compatibility
- `src/utils/passwordHash.ts` — may break legacy DJB2 hash verification
- `src/adapters/storage.ts` — cache strategy affects write consistency
- `src/types/RulerTypes.ts` `RulerLogEntry.id` — affects `ensureId()` migration logic
