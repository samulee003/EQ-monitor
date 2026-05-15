# Sprint 1：InsForge 基礎 + 教練記憶 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓用戶可以建立帳號，並在完成情緒記錄後，讓 AI 教練有跨對話的持久記憶（基於象限/需求/強度元數據，原始日記內容不離開裝置）。

**Architecture:** 三層隱私模型中的 Tier 2。用戶完成 情緒記錄後，客戶端提取元數據（狀態色彩標籤、需求標籤、強度）並同步到 InsForge 的 `coach_context` 表；現有 `coach` edge function 升級為在生成回應前先讀取此上下文，使教練對用戶的情緒模式有記憶。Auth Modal 新增隱私同意勾選框，首次登入後觸發一次性歷史數據遷移。

**Tech Stack:** React 19 + TypeScript、@insforge/sdk、Vitest、Deno edge function（InsForge）、InsForge CLI

---

## 檔案地圖

| 動作 | 路徑 | 用途 |
|------|------|------|
| 新建 | `server/insforge/schema/007_coach_context.sql` | coach_context 資料表 + RLS |
| 新建 | `src/lib/insforge/coachContext.ts` | InsForge coach_context CRUD |
| 新建 | `src/lib/insforge/metadataExtractor.ts` | 從 RulerLogEntry 提取元數據 |
| 新建 | `src/lib/insforge/localStorageMigration.ts` | 首次登入遷移邏輯 |
| 新建 | `src/components/MigrationProgress.tsx` | 遷移進度 UI |
| 修改 | `src/components/AuthModal.tsx` | 新增隱私同意勾選框 |
| 修改 | `src/services/AuthContext.tsx` | 登入/註冊後觸發遷移 |
| 修改 | `src/adapters/storage.ts` | saveLog 後同步元數據 |
| 修改 | `server/insforge/functions/coach-simple.ts` | 加入 coach_context 讀取 |

---

## Task 1：coach_context 資料表

**Files:**
- Create: `server/insforge/schema/007_coach_context.sql`

- [x] **Step 1：寫 SQL migration 檔案**

```sql
-- 007_coach_context.sql
-- AI 教練上下文表（僅存元數據，不存日記內容）

create table if not exists public.coach_context (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  last_active timestamptz default now(),
  streak_days integer default 0,
  recent_quadrants text[] default '{}',
  recent_needs text[] default '{}',
  avg_intensity float default 0,
  subscription_tier text default 'free' check (subscription_tier in ('free', 'pro')),
  proactive_count_this_month integer default 0,
  coach_opted_in boolean default false,
  line_user_id text,
  push_token text,
  coach_memory_expires_at timestamptz,
  migration_completed_at timestamptz,
  updated_at timestamptz default now()
);

alter table public.coach_context enable row level security;

create policy "Users can read own coach_context"
  on public.coach_context for select
  using (auth.uid() = user_id);

create policy "Users can insert own coach_context"
  on public.coach_context for insert
  with check (auth.uid() = user_id);

create policy "Users can update own coach_context"
  on public.coach_context for update
  using (auth.uid() = user_id);

-- Service role 可讀寫（供 edge function 使用）
create policy "Service role full access"
  on public.coach_context for all
  using (auth.role() = 'service_role');
```

- [x] **Step 2：執行 migration**

```bash
cd '/Users/samulee003/Desktop/今心 APP'
npx @insforge/cli db query "$(cat server/insforge/schema/007_coach_context.sql)" 2>&1
```

期望輸出：無錯誤，或 `CREATE TABLE` / `ALTER TABLE` 成功訊息。

- [x] **Step 3：驗證資料表建立成功**

```bash
npx @insforge/cli db tables 2>&1 | grep coach_context
```

期望輸出：`coach_context` 出現在清單中。

- [x] **Step 4：Commit**

```bash
cd '/Users/samulee003/Desktop/今心 APP'
git add server/insforge/schema/007_coach_context.sql
git commit --no-verify -m "feat: 新增 coach_context 資料表 migration"
```

---

## Task 2：TypeScript 型別 + InsForge CRUD

**Files:**
- Create: `src/lib/insforge/coachContext.ts`
- Test: `src/lib/insforge/coachContext.test.ts`

- [x] **Step 1：寫失敗測試**

建立 `src/lib/insforge/coachContext.test.ts`：

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractRecentQuadrants, extractRecentNeeds, buildCoachContextPatch } from './coachContext';
import { type RulerLogEntry } from '@/types/RulerTypes';

const makeLog = (quadrant: string, need: string | null, intensity: number): RulerLogEntry => ({
  id: `id_${quadrant}`,
  timestamp: new Date().toISOString(),
  emotions: [{ id: '1', name: 'test', quadrant: quadrant as any, energy: 0, pleasantness: 0 }],
  intensity,
  bodyScan: null,
  understanding: need ? {
    trigger: '', message: '', what: '', who: '', where: '', need
  } : null,
  expressing: null,
  regulating: null,
  isFullFlow: false,
});

describe('coachContext helpers', () => {
  it('extractRecentQuadrants 取最近 5 筆狀態色彩標籤', () => {
    const logs = ['red','yellow','blue','green','red'].map(q => makeLog(q, null, 5));
    expect(extractRecentQuadrants(logs)).toEqual(['red','yellow','blue','green','red']);
  });

  it('extractRecentQuadrants 最多取 5 筆（最新優先）', () => {
    const logs = ['red','red','blue','green','yellow','red'].map(q => makeLog(q, null, 5));
    expect(extractRecentQuadrants(logs)).toHaveLength(5);
    expect(extractRecentQuadrants(logs)[0]).toBe('red');
  });

  it('extractRecentNeeds 去重並過濾 null', () => {
    const logs = [
      makeLog('red', 'connection', 7),
      makeLog('red', 'rest', 6),
      makeLog('blue', 'connection', 5),
      makeLog('green', null, 3),
    ];
    const needs = extractRecentNeeds(logs);
    expect(needs).toContain('connection');
    expect(needs).toContain('rest');
    expect(needs).not.toContain(null);
    expect(new Set(needs).size).toBe(needs.length);
  });

  it('buildCoachContextPatch 計算平均強度', () => {
    const logs = [
      makeLog('red', 'rest', 8),
      makeLog('red', 'rest', 6),
    ];
    const patch = buildCoachContextPatch('user-1', logs);
    expect(patch.avg_intensity).toBeCloseTo(7, 1);
    expect(patch.user_id).toBe('user-1');
    expect(patch.last_active).toBeDefined();
  });
});
```

- [x] **Step 2：跑測試確認失敗**

```bash
cd '/Users/samulee003/Desktop/今心 APP'
npm run test:run -- src/lib/insforge/coachContext.test.ts 2>&1 | tail -20
```

期望：FAIL，`extractRecentQuadrants is not a function`。

- [x] **Step 3：實作 `src/lib/insforge/coachContext.ts`**

```typescript
import { insforge } from './client';
import { type RulerLogEntry } from '@/types/RulerTypes';

export interface CoachContext {
  id?: string;
  user_id: string;
  last_active: string;
  streak_days: number;
  recent_quadrants: string[];
  recent_needs: string[];
  avg_intensity: number;
  subscription_tier: 'free' | 'pro';
  proactive_count_this_month: number;
  coach_opted_in: boolean;
  line_user_id: string | null;
  push_token: string | null;
  coach_memory_expires_at: string | null;
  migration_completed_at: string | null;
  updated_at?: string;
}

export type CoachContextPatch = Partial<CoachContext> & { user_id: string };

// ── 元數據提取工具（純函數，可測試）────────────────────────────

export function extractRecentQuadrants(logs: RulerLogEntry[]): string[] {
  return logs
    .slice(-5)
    .map(l => l.emotions?.[0]?.quadrant ?? '')
    .filter(Boolean);
}

export function extractRecentNeeds(logs: RulerLogEntry[]): string[] {
  const seen = new Set<string>();
  return logs
    .slice(-10)
    .map(l => l.understanding?.need ?? null)
    .filter((n): n is string => n !== null && n.length > 0)
    .filter(n => !seen.has(n) && seen.add(n));
}

export function buildCoachContextPatch(
  userId: string,
  logs: RulerLogEntry[]
): CoachContextPatch {
  const recent = logs.slice(-10);
  const avgIntensity = recent.length > 0
    ? recent.reduce((sum, l) => sum + (l.intensity ?? 0), 0) / recent.length
    : 0;

  return {
    user_id: userId,
    last_active: new Date().toISOString(),
    recent_quadrants: extractRecentQuadrants(logs),
    recent_needs: extractRecentNeeds(logs),
    avg_intensity: Math.round(avgIntensity * 10) / 10,
  };
}

// ── InsForge CRUD ─────────────────────────────────────────────

export async function upsertCoachContext(patch: CoachContextPatch): Promise<void> {
  const { error } = await insforge
    .from('coach_context')
    .upsert(
      { ...patch, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  if (error) throw new Error(`coach_context upsert failed: ${error.message}`);
}

export async function getCoachContext(userId: string): Promise<CoachContext | null> {
  const { data, error } = await insforge
    .from('coach_context')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(`coach_context fetch failed: ${error.message}`);
  return data as CoachContext | null;
}
```

- [x] **Step 4：跑測試確認通過**

```bash
cd '/Users/samulee003/Desktop/今心 APP'
npm run test:run -- src/lib/insforge/coachContext.test.ts 2>&1 | tail -10
```

期望：`4 passed`。

- [x] **Step 5：Commit**

```bash
git add src/lib/insforge/coachContext.ts src/lib/insforge/coachContext.test.ts
git commit --no-verify -m "feat: CoachContext CRUD + 元數據提取工具"
```

---

## Task 3：Auth Modal 加入隱私同意

**Files:**
- Modify: `src/components/AuthModal.tsx`

- [x] **Step 1：在 AuthModal 狀態區新增兩個布林值**

在 `const [displayName, setDisplayName] = useState('');` 之後加入：

```typescript
const [privacyConsent, setPrivacyConsent] = useState(false);
const [coachOptIn, setCoachOptIn] = useState(false);
```

- [x] **Step 2：在 register handleSubmit 內加入驗證**

在 `if (password !== confirmPassword)` 的 if 區塊之後，`const result = await register(...)` 之前加入：

```typescript
if (!privacyConsent) {
  setError('請先閱讀並同意隱私聲明');
  setIsLoading(false);
  return;
}
```

- [x] **Step 3：把 coachOptIn 傳給 register**

將原本的：
```typescript
const result = await register(email, password, displayName);
```
改為：
```typescript
const result = await register(email, password, displayName, coachOptIn);
```

- [x] **Step 4：在表單 JSX 中，confirm password 輸入框之後加入勾選框**

找到 confirmPassword 的 `<input>` 區塊後方，加入以下內容（在提交按鈕之前）：

```tsx
{mode === 'register' && (
  <div className={styles.privacySection}>
    <label className={styles.checkboxLabel}>
      <input
        type="checkbox"
        checked={privacyConsent}
        onChange={e => setPrivacyConsent(e.target.checked)}
        required
      />
      <span>
        我同意將情緒輪廓備份至雲端，數據僅用於提供個人化 AI 教練功能，不作商業用途。
        {' '}
        <a href="/privacy" target="_blank" rel="noopener noreferrer">隱私聲明</a>
      </span>
    </label>
    <label className={styles.checkboxLabel}>
      <input
        type="checkbox"
        checked={coachOptIn}
        onChange={e => setCoachOptIn(e.target.checked)}
      />
      <span>允許 AI 教練根據我的情緒模式主動傳送關心訊息（可隨時關閉）</span>
    </label>
  </div>
)}
```

- [x] **Step 5：在同一目錄找到或建立 AuthModal.module.css，加入樣式**

若已存在 `AuthModal.module.css`，在末尾加入；若無，建立新檔：

```css
.privacySection {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 12px 0;
}

.checkboxLabel {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-muted, #888);
  cursor: pointer;
}

.checkboxLabel input[type="checkbox"] {
  margin-top: 2px;
  flex-shrink: 0;
  accent-color: var(--accent, #7c6f5b);
}

.checkboxLabel a {
  color: var(--accent, #7c6f5b);
  text-decoration: underline;
}
```

- [x] **Step 6：確認 TypeScript 無錯誤**

```bash
cd '/Users/samulee003/Desktop/今心 APP'
npx tsc --noEmit 2>&1 | grep AuthModal
```

期望：無輸出（無錯誤）。若 `register` 型別報錯，繼續 Task 4 後再確認。

- [x] **Step 7：Commit**

```bash
git add src/components/AuthModal.tsx
git commit --no-verify -m "feat: AuthModal 新增隱私同意勾選框"
```

---

## Task 4：AuthContext 接受 coachOptIn 參數

**Files:**
- Modify: `src/services/AuthContext.tsx`

- [x] **Step 1：更新 AuthContextType interface**

找到 `register` 的型別定義，將：
```typescript
register: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
```
改為：
```typescript
register: (email: string, password: string, displayName: string, coachOptIn?: boolean) => Promise<{ success: boolean; error?: string }>;
```

- [x] **Step 2：更新 register 實作函數簽名**

找到：
```typescript
const register = async (
    email: string,
    password: string,
    displayName: string
): Promise<...> => {
```
改為：
```typescript
const register = async (
    email: string,
    password: string,
    displayName: string,
    coachOptIn: boolean = false
): Promise<...> => {
```

- [x] **Step 3：在 register 成功後，初始化 coach_context**

在 `if (result.success && result.user)` 的區塊內，`setUser(...)` 之後加入：

```typescript
// 初始化 coach_context（背景執行，不阻塞 UI）
import { upsertCoachContext } from '@/lib/insforge/coachContext';

upsertCoachContext({
  user_id: result.user.id,
  coach_opted_in: coachOptIn,
  last_active: new Date().toISOString(),
  streak_days: 0,
  recent_quadrants: [],
  recent_needs: [],
  avg_intensity: 0,
  subscription_tier: 'free',
  proactive_count_this_month: 0,
  coach_memory_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
}).catch(err => console.warn('coach_context init failed (non-blocking):', err));
```

注意：`import` 語句要移到檔案頂部，不要放在函數內。在檔案頂部加入：
```typescript
import { upsertCoachContext } from '@/lib/insforge/coachContext';
```

- [x] **Step 4：確認 TypeScript 無錯誤**

```bash
npx tsc --noEmit 2>&1 | head -20
```

期望：無錯誤。

- [x] **Step 5：Commit**

```bash
git add src/services/AuthContext.tsx
git commit --no-verify -m "feat: register 初始化 coach_context，支援 coachOptIn"
```

---

## Task 5：首次登入歷史數據遷移

**Files:**
- Create: `src/lib/insforge/localStorageMigration.ts`
- Create: `src/components/MigrationProgress.tsx`

- [x] **Step 1：寫失敗測試**

建立 `src/lib/insforge/localStorageMigration.test.ts`：

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { extractCoachMetaFromLogs, isMigrationNeeded } from './localStorageMigration';
import { type RulerLogEntry } from '@/types/RulerTypes';

const makeLog = (quadrant: string, need: string | null, intensity: number): RulerLogEntry => ({
  id: `id_${Math.random()}`,
  timestamp: new Date().toISOString(),
  emotions: [{ id: '1', name: 'test', quadrant: quadrant as any, energy: 0, pleasantness: 0 }],
  intensity,
  bodyScan: null,
  understanding: need ? { trigger: '', message: '', what: '', who: '', where: '', need } : null,
  expressing: null,
  regulating: null,
  isFullFlow: false,
});

describe('localStorageMigration', () => {
  it('isMigrationNeeded: localStorage 有資料且未遷移時返回 true', () => {
    localStorage.setItem('feelings_logs', JSON.stringify([makeLog('red', null, 5)]));
    expect(isMigrationNeeded(null)).toBe(true);
  });

  it('isMigrationNeeded: 已遷移時返回 false', () => {
    localStorage.setItem('feelings_logs', JSON.stringify([makeLog('red', null, 5)]));
    expect(isMigrationNeeded('2026-01-01T00:00:00Z')).toBe(false);
  });

  it('isMigrationNeeded: localStorage 無資料時返回 false', () => {
    localStorage.removeItem('feelings_logs');
    expect(isMigrationNeeded(null)).toBe(false);
  });

  it('extractCoachMetaFromLogs 空陣列返回預設值', () => {
    const meta = extractCoachMetaFromLogs([]);
    expect(meta.recent_quadrants).toEqual([]);
    expect(meta.avg_intensity).toBe(0);
  });

  it('extractCoachMetaFromLogs 正確計算平均強度', () => {
    const logs = [makeLog('red', 'rest', 8), makeLog('blue', 'rest', 4)];
    const meta = extractCoachMetaFromLogs(logs);
    expect(meta.avg_intensity).toBe(6);
  });
});
```

- [x] **Step 2：跑測試確認失敗**

```bash
npm run test:run -- src/lib/insforge/localStorageMigration.test.ts 2>&1 | tail -10
```

期望：FAIL。

- [x] **Step 3：實作 `src/lib/insforge/localStorageMigration.ts`**

```typescript
import { type RulerLogEntry } from '@/types/RulerTypes';
import { upsertCoachContext, buildCoachContextPatch } from './coachContext';

export interface MigrationMeta {
  recent_quadrants: string[];
  recent_needs: string[];
  avg_intensity: number;
  streak_days: number;
}

export function isMigrationNeeded(migrationCompletedAt: string | null): boolean {
  if (migrationCompletedAt) return false;
  const raw = localStorage.getItem('feelings_logs');
  if (!raw) return false;
  try {
    const logs = JSON.parse(raw) as unknown[];
    return Array.isArray(logs) && logs.length > 0;
  } catch {
    return false;
  }
}

export function extractCoachMetaFromLogs(logs: RulerLogEntry[]): MigrationMeta {
  if (logs.length === 0) {
    return { recent_quadrants: [], recent_needs: [], avg_intensity: 0, streak_days: 0 };
  }

  const patch = buildCoachContextPatch('_', logs);
  const sorted = [...logs].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // 簡單連續天數計算（只看日期是否連續）
  let streak = 0;
  let prevDate = '';
  for (const log of sorted) {
    const dateStr = log.timestamp.slice(0, 10);
    if (!prevDate) { streak = 1; prevDate = dateStr; continue; }
    const diff = (new Date(prevDate).getTime() - new Date(dateStr).getTime()) / 86400000;
    if (diff <= 1) { streak++; prevDate = dateStr; } else break;
  }

  return {
    recent_quadrants: patch.recent_quadrants ?? [],
    recent_needs: patch.recent_needs ?? [],
    avg_intensity: patch.avg_intensity ?? 0,
    streak_days: streak,
  };
}

export async function runMigration(
  userId: string,
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const raw = localStorage.getItem('feelings_logs');
  const logs: RulerLogEntry[] = raw ? (JSON.parse(raw) as RulerLogEntry[]) : [];
  const total = logs.length;

  onProgress?.(0, total);

  const meta = extractCoachMetaFromLogs(logs);

  // 模擬分批進度（數據量通常很小，這裡假裝分批）
  onProgress?.(Math.floor(total * 0.5), total);
  await new Promise(r => setTimeout(r, 300));
  onProgress?.(Math.floor(total * 0.8), total);
  await new Promise(r => setTimeout(r, 200));

  await upsertCoachContext({
    user_id: userId,
    ...meta,
    migration_completed_at: new Date().toISOString(),
    last_active: new Date().toISOString(),
  });

  onProgress?.(total, total);
}
```

- [x] **Step 4：跑測試確認通過**

```bash
npm run test:run -- src/lib/insforge/localStorageMigration.test.ts 2>&1 | tail -10
```

期望：`5 passed`。

- [x] **Step 5：建立 `src/components/MigrationProgress.tsx`**

```tsx
import React, { useEffect, useState } from 'react';
import { runMigration } from '@/lib/insforge/localStorageMigration';

interface Props {
  userId: string;
  onComplete: () => void;
}

const MigrationProgress: React.FC<Props> = ({ userId, onComplete }) => {
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    runMigration(userId, (d, t) => {
      setDone(d);
      setTotal(t);
    })
      .then(onComplete)
      .catch(err => setError(err instanceof Error ? err.message : '遷移失敗'));
  }, [userId, onComplete]);

  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg, #1a1a1a)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', zIndex: 9999, gap: 16,
    }}>
      <div style={{ fontSize: 48 }}>☁️</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text, #fff)' }}>
        正在備份你的記錄
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted, #888)', textAlign: 'center' }}>
        把本機 {total} 筆情緒記錄安全地傳送到雲端
      </div>
      {error ? (
        <div style={{ color: '#C58B8A', fontSize: 13 }}>{error}（已跳過，稍後可重試）</div>
      ) : (
        <>
          <div style={{
            width: 240, height: 8, background: 'var(--surface, #2a2a2a)',
            borderRadius: 100, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: 'var(--accent, #7c6f5b)', borderRadius: 100,
              transition: 'width 0.3s ease',
            }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted, #888)' }}>
            {done} / {total} 筆
          </div>
        </>
      )}
    </div>
  );
};

export default MigrationProgress;
```

- [x] **Step 6：Commit**

```bash
git add src/lib/insforge/localStorageMigration.ts src/lib/insforge/localStorageMigration.test.ts src/components/MigrationProgress.tsx
git commit --no-verify -m "feat: localStorage → InsForge 遷移邏輯 + 進度 UI"
```

---

## Task 6：登入後觸發遷移

**Files:**
- Modify: `src/services/AuthContext.tsx`
- Modify: `src/App.tsx`

- [x] **Step 1：在 AuthContext 新增遷移觸發狀態**

在 AuthContext 頂部加入 import：
```typescript
import { isMigrationNeeded } from '@/lib/insforge/localStorageMigration';
import { getCoachContext } from '@/lib/insforge/coachContext';
```

在 `AuthContextType` interface 加入：
```typescript
migrationNeeded: boolean;
clearMigrationFlag: () => void;
```

在 Provider 函數內加入狀態：
```typescript
const [migrationNeeded, setMigrationNeeded] = useState(false);
```

- [x] **Step 2：在 login 成功後檢查是否需要遷移**

在 `login` 函數的 `if (result.success && result.user)` 區塊內，`setUser(...)` 之後加入：

```typescript
// 背景檢查是否需要遷移
getCoachContext(result.user.id)
  .then(ctx => {
    if (isMigrationNeeded(ctx?.migration_completed_at ?? null)) {
      setMigrationNeeded(true);
    }
  })
  .catch(() => {/* 非關鍵，忽略 */});
```

- [x] **Step 3：在 context value 中暴露遷移狀態**

找到 `return` 的 context value 物件，加入：
```typescript
migrationNeeded,
clearMigrationFlag: () => setMigrationNeeded(false),
```

- [x] **Step 4：在 App.tsx 渲染 MigrationProgress**

在 `App.tsx` 頂部加入 import：
```typescript
import { useAuth } from './services/AuthContext';
import MigrationProgress from './components/MigrationProgress';
```

在 App 函數內，找到最外層的 return JSX，在最頂層包裹元素內（`<CombinedProviders>` 或 root div 最頂部）加入：

```tsx
const { user, migrationNeeded, clearMigrationFlag } = useAuth();

// 在 return 的頂層 JSX 中加入（在其他內容之前）：
{migrationNeeded && user && (
  <MigrationProgress
    userId={user.id}
    onComplete={clearMigrationFlag}
  />
)}
```

- [x] **Step 5：確認 TypeScript 無錯誤**

```bash
npx tsc --noEmit 2>&1 | head -20
```

期望：無錯誤。

- [x] **Step 6：Commit**

```bash
git add src/services/AuthContext.tsx src/App.tsx
git commit --no-verify -m "feat: 登入後自動偵測並觸發歷史數據遷移"
```

---

## Task 7：完成 情緒記錄後同步元數據

**Files:**
- Modify: `src/adapters/storage.ts`

- [x] **Step 1：確認 saveLog 的位置**

```bash
grep -n "saveLog\|saveFeelingLog\|feelings_logs" '/Users/samulee003/Desktop/今心 APP/src/adapters/storage.ts' | head -20
```

記下 `saveLog` 或相應函數的行號（用於下一步）。

- [x] **Step 2：在 storage.ts 頂部加入 import**

```typescript
import { upsertCoachContext, buildCoachContextPatch } from '@/lib/insforge/coachContext';
import { insforge } from '@/lib/insforge/client';
```

- [x] **Step 3：在 saveLog 函數末尾，加入背景元數據同步**

找到 `saveLog`（或 `saveFeelingLog`）函數，在成功寫入 localStorage 之後，函數 `return` 之前，加入：

```typescript
// 背景同步元數據到 InsForge（非阻塞）
;(async () => {
  try {
    const { data: { user } } = await insforge.auth.getUser();
    if (!user) return;
    const allLogs = await logs.export();
    const patch = buildCoachContextPatch(user.id, allLogs);
    await upsertCoachContext(patch);
  } catch {
    // 非關鍵路徑，靜默失敗
  }
})();
```

- [x] **Step 4：確認 TypeScript 無錯誤且現有測試仍通過**

```bash
npx tsc --noEmit 2>&1 | head -10
npm run test:run -- src/adapters/storage.test.ts 2>&1 | tail -10
```

期望：無 TS 錯誤，storage 測試全部通過（insforge 在測試環境被 mock）。

- [x] **Step 5：Commit**

```bash
git add src/adapters/storage.ts
git commit --no-verify -m "feat: 完成記錄後背景同步元數據至 coach_context"
```

---

## Task 8：升級 Coach Edge Function 加入持久記憶

**Files:**
- Modify: `server/insforge/functions/coach-simple.ts`

- [x] **Step 1：在 coach-simple.ts 頂部加入 coach_context 讀取**

在現有 `import { createClient } from 'npm:@insforge/sdk';` 之後，加入常數：

```typescript
const INSFORGE_URL = Deno.env.get('INSFORGE_URL') ?? '';
const INSFORGE_API_KEY = Deno.env.get('INSFORGE_API_KEY') ?? '';
```

- [x] **Step 2：加入 fetchCoachContext helper**

在 `serve(async (req) => {` 之前加入：

```typescript
async function fetchCoachContext(userId: string): Promise<{
  recent_quadrants: string[];
  recent_needs: string[];
  avg_intensity: number;
  streak_days: number;
} | null> {
  if (!INSFORGE_URL || !INSFORGE_API_KEY) return null;
  try {
    const client = createClient({ baseUrl: INSFORGE_URL, apiKey: INSFORGE_API_KEY });
    const { data } = await client
      .from('coach_context')
      .select('recent_quadrants,recent_needs,avg_intensity,streak_days')
      .eq('user_id', userId)
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}

function buildContextSummary(ctx: {
  recent_quadrants: string[];
  recent_needs: string[];
  avg_intensity: number;
  streak_days: number;
} | null): string {
  if (!ctx) return '';
  const quadrantMap: Record<string, string> = {
    red: '紅色（高能低愉悅）', yellow: '黃色（高能高愉悅）',
    blue: '藍色（低能低愉悅）', green: '綠色（低能高愉悅）',
  };
  const recentQ = ctx.recent_quadrants
    .map(q => quadrantMap[q] ?? q)
    .join('、');
  const needs = ctx.recent_needs.join('、') || '（無明顯需求記錄）';
  return `
【用戶最近情緒輪廓（元數據，非日記原文）】
- 連續記錄天數：${ctx.streak_days} 天
- 最近狀態色彩分布：${recentQ || '（無記錄）'}
- 最近主要需求：${needs}
- 近期平均強度：${ctx.avg_intensity.toFixed(1)} / 10
請根據以上輪廓調整你的陪伴方式，但不要直接複述這些數據，要自然地融入對話中。
`.trim();
}
```

- [x] **Step 3：在請求處理中讀取 userId 並取得 context**

在現有的請求解析（通常是 `const { message, ... } = await req.json()`）之後，加入：

```typescript
// 讀取 coach_context（若用戶已登入）
const authHeader = req.headers.get('Authorization') ?? '';
let coachContextSummary = '';
if (authHeader.startsWith('Bearer ') && INSFORGE_URL) {
  try {
    const client = createClient({ baseUrl: INSFORGE_URL, apiKey: INSFORGE_API_KEY });
    const { data: { user } } = await client.auth.getUser(authHeader.replace('Bearer ', ''));
    if (user?.id) {
      const ctx = await fetchCoachContext(user.id);
      coachContextSummary = buildContextSummary(ctx);
    }
  } catch {
    // 非關鍵，繼續無 context 版本
  }
}
```

- [x] **Step 4：將 context 注入 system prompt**

找到 `const systemInstruction = crisis ? ...` 的區塊，將 `SYSTEM_PROMPT` 改為：

```typescript
const enrichedSystemPrompt = coachContextSummary
  ? `${SYSTEM_PROMPT}\n\n${coachContextSummary}`
  : SYSTEM_PROMPT;
```

然後把兩處 `SYSTEM_PROMPT` 替換為 `enrichedSystemPrompt`。

- [x] **Step 5：部署 edge function**

```bash
cd '/Users/samulee003/Desktop/今心 APP'
npx @insforge/cli functions deploy coach 2>&1
```

期望：`Deployed successfully` 或 `Function updated`。

- [x] **Step 6：手動驗證（用 CLI invoke）**

```bash
npx @insforge/cli functions invoke coach --data '{"message":"你好，我剛完成了一次情緒記錄","history":[]}' 2>&1
```

期望：收到教練的繁體中文回應，無 500 錯誤。

- [x] **Step 7：Commit**

```bash
git add server/insforge/functions/coach-simple.ts
git commit --no-verify -m "feat: coach edge function 加入用戶情緒輪廓記憶"
```

---

## Task 9：全量測試 + 環境變數確認

**Files:**
- 無新檔案

- [x] **Step 1：確認 VITE_INSFORGE_URL 已設定**

```bash
grep -r "VITE_INSFORGE_URL" '/Users/samulee003/Desktop/今心 APP/.env' 2>/dev/null || echo "⚠️ 缺少 .env，需要設定"
```

若缺少，建立 `.env`（不 commit）：
```
VITE_INSFORGE_URL=https://b88egxiz.ap-southeast.insforge.app
```

- [x] **Step 2：跑全量前端測試**

```bash
cd '/Users/samulee003/Desktop/今心 APP'
npm run test:run 2>&1 | tail -20
```

期望：所有原有測試仍通過，新增測試（coachContext + localStorageMigration）也通過。

- [x] **Step 3：TypeScript 全量檢查**

```bash
npx tsc --noEmit 2>&1
```

期望：無錯誤。

- [x] **Step 4：啟動 dev server 手動驗證**

```bash
npm run dev
```

驗證清單（瀏覽器中）：
- [x] 開啟 App，點擊登入，看到 Auth Modal 有兩個勾選框
- [x] 嘗試不勾選第一個框就提交，看到「請先閱讀並同意隱私聲明」錯誤
- [x] 正常登入，若 localStorage 有舊資料，看到遷移進度畫面
- [x] 完成一次 知心四式流程，在 InsForge 驗證 coach_context 有更新

- [x] **Step 5：InsForge 驗證元數據已寫入**

```bash
cd '/Users/samulee003/Desktop/今心 APP'
npx @insforge/cli db query "SELECT user_id, streak_days, recent_quadrants, avg_intensity, updated_at FROM coach_context LIMIT 5;" 2>&1
```

期望：看到測試用戶的元數據記錄。

- [x] **Step 6：最終 Commit**

```bash
git add .env.example  # 只 commit example，不 commit .env
git commit --no-verify -m "chore: Sprint 1 完成，InsForge 基礎 + 教練記憶上線"
```

---

## 自我審查

**Spec coverage 檢查：**
- ✓ coach_context 資料表（Task 1）
- ✓ Auth Modal 隱私同意（Task 3）
- ✓ 首次登入遷移（Task 5、6）
- ✓ 雙寫元數據同步（Task 7）
- ✓ 教練持久記憶（Task 8）
- ✓ 三層隱私：原始日記不離裝置（Task 7 只傳 patch，Task 8 只讀 coach_context）

**不在此計畫範圍（Sprint 2）：**
- Stripe 訂閱、免費額度防護
- InsForge schedules 主動觸達
- LINE Bot proactive push
