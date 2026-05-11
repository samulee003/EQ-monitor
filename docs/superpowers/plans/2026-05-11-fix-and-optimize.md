# 今心 ImXin — Fix & Optimize Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or dispatch parallel coder agents.

**Goal:** Fix all P0/P1 issues identified in the deep analysis report: security vulnerabilities, critical bugs, testing gaps, and code quality issues.

**Architecture:** Minimal surgical changes. Fix bugs without rewriting architecture. Preserve all existing behavior while closing security holes and adding missing tests.

**Tech Stack:** React 19 + TypeScript 5.9 + Vite 7 + Express 5 + Vitest

---

## Stream 1: Critical Security & Bug Fixes

### Task 1.1: Fix storage.ts Encryption Fallback (🔴 P0)

**Files:**
- Modify: `src/adapters/storage.ts`

**Current buggy code:**
```typescript
try { 
  const encrypted = await encryptData(json); 
  localStorage.setItem(key, encrypted); 
} catch { 
  localStorage.setItem(key, json); // ⚠️ PLAINTEXT FALLBACK
}
```

**Fix:** Remove the plaintext fallback. If encryption fails, log error and throw. Data must never be stored unencrypted.

**Verification:** Run `npm run test:run` — `storage.test.ts` should still pass.

---

### Task 1.2: Add Sensitive Files to .gitignore (🔴 P0)

**Files:**
- Modify: `.gitignore`

**Add:**
```
.mcp.json
opencode.json
.insforge/credentials.json
```

**Verification:** `git check-ignore .mcp.json opencode.json` should return the paths.

---

### Task 1.3: Fix Android allowBackup="false" (🔴 P0)

**Files:**
- Modify: `android/app/src/main/AndroidManifest.xml`

**Change:** `android:allowBackup="true"` → `android:allowBackup="false"`

This prevents IndexedDB master encryption key from being backed up to Google Drive.

---

### Task 1.4: Fix Draft Resume Bug in useRulerFlow.ts (🔴 P0)

**Files:**
- Modify: `src/hooks/useRulerFlow.ts`
- Test: `src/hooks/useRulerFlow.test.ts`

**Bug:** `RESUME_DRAFT` action restores draft state, but then `SET_STEP` immediately overwrites it to `'recognizing'`.

**Fix:** In the initialization logic (useEffect or reducer), after dispatching `RESUME_DRAFT`, do NOT force `setStep('recognizing')`. The draft's `step` field should control the current step.

**Verification:** Add test: "應該恢復草稿到正確的步驟" — set up a draft at `understanding` step, initialize hook, assert current step is `understanding`.

---

## Stream 2: Testing Fixes & Coverage

### Task 2.1: Fix ThemeContext Test Wrong Assertion (🔴 P0)

**Files:**
- Modify: `src/services/ThemeContext.test.tsx`

**Bug:** Line ~83 has `expect(stored).not.toBe('light')` when it should verify the theme WAS saved as 'light'.

**Fix:** Change to `expect(stored).toBe('"light"')` (note: localStorage stores JSON strings).

**Verification:** `npm run test:run` — ThemeContext tests pass.

---

### Task 2.2: Separate format.test.ts Implementation (🟡 P1)

**Files:**
- Create: `src/utils/format.ts`
- Modify: `src/utils/format.test.ts`

**Bug:** `format.test.ts` contains both implementation and tests.

**Fix:** Extract `formatDate`, `formatTime`, `truncateText`, `formatDuration` into `src/utils/format.ts`. Update `format.test.ts` to import from `./format`.

**Verification:** `npm run test:run` — format tests pass.

---

### Task 2.3: Fix Flaky setTimeout Tests (🟡 P1)

**Files:**
- Modify: `src/services/AuthContext.test.tsx`
- Modify: `src/services/ThemeContext.test.tsx`

**Fix:** Replace `await new Promise(resolve => setTimeout(resolve, N))` with `waitFor` from `@testing-library/react`.

```typescript
// Before:
await new Promise(resolve => setTimeout(resolve, 50));

// After:
import { waitFor } from '@testing-library/react';
await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
```

**Verification:** `npm run test:run` — AuthContext and ThemeContext tests pass.

---

### Task 2.4: Add Tests for ErrorBoundary (🟡 P1)

**Files:**
- Create: `src/components/ErrorBoundary.test.tsx`

**Coverage:**
- Renders children when no error
- Catches error and shows fallback UI
- Calls onError callback if provided

---

### Task 2.5: Add Tests for AuthModal (🟡 P1)

**Files:**
- Create: `src/components/AuthModal.test.tsx`

**Coverage:**
- Renders login form by default
- Switches to register form on click
- Shows error on invalid credentials
- Calls onClose when clicking overlay/close button

---

## Stream 3: Backend Improvements

### Task 3.1: Add Multi-Instance Rate Limiter Comment (🟡 P1)

**Files:**
- Modify: `server/src/middleware/rateLimiter.ts`

**Add:** A prominent comment documenting the limitation:
```typescript
// NOTE: This in-memory Map does not share state across instances.
// For multi-instance deployments (Fly.io), use Redis or a shared store.
```

---

### Task 3.2: Add Middleware Tests (🟡 P1)

**Files:**
- Create: `server/src/middleware/errorHandler.test.ts`
- Create: `server/src/middleware/rateLimiter.test.ts`

**errorHandler tests:**
- Returns 500 with generic message in production
- Returns 500 with stack trace in development
- Filters sensitive keywords from error messages

**rateLimiter tests:**
- Allows requests under limit
- Blocks requests over limit (429)
- Resets counter after window

**Verification:** `cd server && npm run test:run`

---

## Stream 4: Code Quality & Cleanup

### Task 4.1: Add CSP to index.html (🟢 P2)

**Files:**
- Modify: `index.html`

**Add:** `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.insforge.app https://*.zeabur.app; img-src 'self' data:;">`

Adjust as needed for actual external domains used.

---

### Task 4.2: Remove Global DOM Mutations (🟡 P1)

**Files:**
- Modify: `src/components/BodyScan.tsx`
- Modify: `src/components/UnderstandingStep.tsx`
- Modify: `src/components/RegulatingStep.tsx`

**Fix:** Replace `document.documentElement.style.setProperty('--aura-color', ...)` with React state + CSS-in-JS approach or CSS custom properties scoped to component.

Option: Use a CSS variable scoped to the component container instead of `document.documentElement`.

---

### Task 4.3: Clean Up Orphaned InsForge Code (🟢 P2)

**Files:**
- Evaluate: `src/lib/insforge/adapter.ts`, `syncAdapter.ts`

**Decision:** If grep confirms zero imports outside their own files:
- Move to `src/lib/insforge/_deprecated/` OR
- Delete entirely (recoverable from git history)

**Do NOT delete:** `client.ts`, `types.ts`, `migrate.ts` — these are actively used.

---

## Verification Checklist

- [ ] `npm run test:run` (frontend) — all 265+ tests pass
- [ ] `cd server && npm run test:run` (backend) — all 88 tests pass
- [ ] `npm run lint` — no errors
- [ ] `npx tsc --noEmit` — no type errors
- [ ] `npm run build` — builds successfully
- [ ] `cd server && npm run build` — builds successfully
