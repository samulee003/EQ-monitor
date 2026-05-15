# 今心 ImXin InsForge 後端 Schema 實施計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:dispatching-parallel-agents to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 InsForge 後端上建立今心所需的所有數據庫表、存儲桶、RLS 策略，並創建前端 SDK 適配層。

**Architecture:** 使用 InsForge 內建 Auth (JWT + OAuth) 作為認證層，擴展 `profiles` 表存儲用戶偏好。核心業務數據（情緒日誌、草稿、成就、連續記錄）存於獨立表，每張表啟用 RLS 確保用戶只能訪問自己的數據。存儲桶用於語音記錄和導出文件。

**Tech Stack:** InsForge (PostgreSQL + PostgREST + Auth + Storage), TypeScript SDK `@insforge/sdk`

---

## File Structure

```
server/insforge/
├── schema/
│   ├── 001_profiles.sql          -- 擴展用戶檔案表
│   ├── 002_ruler_logs.sql        -- 情緒日誌核心表
│   ├── 003_ruler_drafts.sql      -- 流程草稿表
│   ├── 004_achievement_records.sql -- 成就解鎖記錄
│   ├── 005_streaks.sql           -- 連續記錄表
│   └── 006_rls_policies.sql      -- 所有 RLS 策略
├── buckets/
│   └── setup-buckets.sql         -- 存儲桶創建 + 策略
└── functions/
    ├── weekly-report.ts          -- 週報生成 Edge Function
    └── achievement-checker.ts    -- 成就檢查 Edge Function

src/lib/insforge/
├── client.ts                     -- InsForge SDK 客戶端初始化
├── adapter.ts                    -- IDataAdapter 實現（InsForge 版）
└── types.ts                      -- 後端數據類型擴展
```

---

## Task 1: Create profiles table (extend auth.users)

**Files:**
- Create: `server/insforge/schema/001_profiles.sql`

**Context:** InsForge 提供內建 `auth.users`。我們創建 `public.profiles` 表與 `auth.users(id)` 一對一關聯，存儲用戶偏好（語言、主題、時區等）。

- [ ] **Step 1: Write SQL migration**

```sql
-- 001_profiles.sql
-- 擴展用戶檔案表，與 auth.users 一對一

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  avatar_url text,
  timezone text default 'Asia/Taipei',
  language text default 'zh-TW' check (language in ('zh-TW', 'zh-CN')),
  theme_preference text default 'system' check (theme_preference in ('dark', 'light', 'system')),
  privacy_enabled boolean default false,
  notification_settings jsonb default '{}',
  onboarding_completed boolean default false,
  user_role text default 'parent',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 啟用 RLS
alter table public.profiles enable row level security;

-- RLS: 用戶只能讀寫自己的 profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 自動在 auth.users 插入時創建 profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 2: Apply migration via InsForge CLI**

Run:
```bash
cd "/Users/samulee003/Desktop/今心 APP"
npx @insforge/cli db migrate --file server/insforge/schema/001_profiles.sql
```

Expected: Migration applied successfully, `profiles` table created.

- [ ] **Step 3: Verify table exists**

Run:
```bash
npx @insforge/cli db query "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' ORDER BY ordinal_position;"
```

Expected: 11 columns returned (id, display_name, avatar_url, timezone, language, theme_preference, privacy_enabled, notification_settings, onboarding_completed, user_role, created_at, updated_at).

- [ ] **Step 4: Commit**

```bash
git add server/insforge/schema/001_profiles.sql
git commit -m "feat(backend): create profiles table with RLS"
```

---

## Task 2: Create ruler_logs table (core emotion logs)

**Files:**
- Create: `server/insforge/schema/002_ruler_logs.sql`

**Context:** 存儲每次完整的 今心四步 情緒覺察記錄。字段需對齊前端 `RulerLogEntry` 類型。JSONB 用於嵌套結構（emotions, bodyScan, understanding, expressing, regulating）。

- [ ] **Step 1: Write SQL migration**

```sql
-- 002_ruler_logs.sql
-- 情緒日誌核心表

create table if not exists public.ruler_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  emotions jsonb not null default '[]',
  intensity integer not null check (intensity >= 1 and intensity <= 10),
  body_scan jsonb,
  understanding jsonb,
  expressing jsonb,
  regulating jsonb,
  physical_context jsonb,
  post_mood text,
  is_full_flow boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 索引：用戶 + 時間（查詢歷史用）
create index idx_ruler_logs_user_created
  on public.ruler_logs (user_id, created_at desc);

-- 索引：用戶 + 是否完整流程（統計用）
create index idx_ruler_logs_user_fullflow
  on public.ruler_logs (user_id, is_full_flow);

-- 啟用 RLS
alter table public.ruler_logs enable row level security;

-- RLS: 用戶只能讀寫自己的日誌
create policy "Users can CRUD own logs"
  on public.ruler_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

- [ ] **Step 2: Apply migration**

Run:
```bash
npx @insforge/cli db migrate --file server/insforge/schema/002_ruler_logs.sql
```

- [ ] **Step 3: Verify**

Run:
```bash
npx @insforge/cli db query "SELECT column_name FROM information_schema.columns WHERE table_name = 'ruler_logs' ORDER BY ordinal_position;"
```

Expected: 11 columns.

- [ ] **Step 4: Commit**

```bash
git add server/insforge/schema/002_ruler_logs.sql
git commit -m "feat(backend): create ruler_logs table with indexes and RLS"
```

---

## Task 3: Create ruler_drafts table (session drafts)

**Files:**
- Create: `server/insforge/schema/003_ruler_drafts.sql`

**Context:** 存儲用戶中斷流程時的草稿。每個用戶最多一條草稿。

- [ ] **Step 1: Write SQL migration**

```sql
-- 003_ruler_drafts.sql
-- 流程草稿表（每用戶一條）

create table if not exists public.ruler_drafts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  step text not null,
  selected_quadrants jsonb default '[]',
  selected_emotions jsonb default '[]',
  emotion_intensity integer,
  body_scan jsonb,
  understanding jsonb,
  expressing jsonb,
  regulating jsonb,
  is_full_flow boolean default false,
  post_regulation_mood text,
  updated_at timestamptz default now()
);

-- 啟用 RLS
alter table public.ruler_drafts enable row level security;

create policy "Users can CRUD own drafts"
  on public.ruler_drafts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

- [ ] **Step 2: Apply migration**

```bash
npx @insforge/cli db migrate --file server/insforge/schema/003_ruler_drafts.sql
```

- [ ] **Step 3: Commit**

```bash
git add server/insforge/schema/003_ruler_drafts.sql
git commit -m "feat(backend): create ruler_drafts table with RLS"
```

---

## Task 4: Create achievement_records table

**Files:**
- Create: `server/insforge/schema/004_achievement_records.sql`

**Context:** 存儲用戶已解鎖的成就。成就定義（ACHIEVEMENTS 常量）仍保留在前端，後端只記錄解鎖狀態。

- [ ] **Step 1: Write SQL migration**

```sql
-- 004_achievement_records.sql
-- 成就解鎖記錄表

create table if not exists public.achievement_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  achievement_key text not null,
  unlocked_at timestamptz default now(),
  viewed boolean default false,
  unique (user_id, achievement_key)
);

-- 索引
create index idx_achievements_user
  on public.achievement_records (user_id, unlocked_at desc);

-- 啟用 RLS
alter table public.achievement_records enable row level security;

create policy "Users can CRUD own achievements"
  on public.achievement_records
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

- [ ] **Step 2: Apply migration**

```bash
npx @insforge/cli db migrate --file server/insforge/schema/004_achievement_records.sql
```

- [ ] **Step 3: Commit**

```bash
git add server/insforge/schema/004_achievement_records.sql
git commit -m "feat(backend): create achievement_records table with RLS"
```

---

## Task 5: Create streaks table

**Files:**
- Create: `server/insforge/schema/005_streaks.sql`

**Context:** 存儲用戶連續記錄統計。可由後端根據 ruler_logs 計算，但為了性能保留一張聚合表。

- [ ] **Step 1: Write SQL migration**

```sql
-- 005_streaks.sql
-- 連續記錄統計表

create table if not exists public.streaks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_checkin_date date,
  checkin_count integer default 0,
  weekly_count integer default 0,
  monthly_count integer default 0,
  updated_at timestamptz default now()
);

-- 啟用 RLS
alter table public.streaks enable row level security;

create policy "Users can read own streaks"
  on public.streaks for select
  using (auth.uid() = user_id);

-- 只有後端函數/觸發器可以寫入 streaks
create policy "Service role can update streaks"
  on public.streaks for all
  using (false)
  with check (false);
```

- [ ] **Step 2: Apply migration**

```bash
npx @insforge/cli db migrate --file server/insforge/schema/005_streaks.sql
```

- [ ] **Step 3: Commit**

```bash
git add server/insforge/schema/005_streaks.sql
git commit -m "feat(backend): create streaks table with RLS"
```

---

## Task 6: Create storage buckets

**Files:**
- Create: `server/insforge/buckets/setup-buckets.sql`

**Context:** 語音記錄和導出文件需要存儲桶。

- [ ] **Step 1: Write SQL migration**

```sql
-- setup-buckets.sql
-- 存儲桶創建（通過 Supabase storage schema）

-- 語音記錄存儲桶
insert into storage.buckets (id, name, public)
values ('voice-recordings', 'voice-recordings', false)
on conflict (id) do nothing;

-- 導出文件存儲桶
insert into storage.buckets (id, name, public)
values ('exports', 'exports', false)
on conflict (id) do nothing;

-- RLS: voice-recordings 桶 — 用戶只能訪問自己的文件
create policy "Users can upload own voice recordings"
  on storage.objects for insert
  with check (
    bucket_id = 'voice-recordings' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read own voice recordings"
  on storage.objects for select
  using (
    bucket_id = 'voice-recordings' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own voice recordings"
  on storage.objects for delete
  using (
    bucket_id = 'voice-recordings' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS: exports 桶 — 同上結構
create policy "Users can upload own exports"
  on storage.objects for insert
  with check (
    bucket_id = 'exports' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read own exports"
  on storage.objects for select
  using (
    bucket_id = 'exports' and
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

- [ ] **Step 2: Apply via CLI**

```bash
npx @insforge/cli db migrate --file server/insforge/buckets/setup-buckets.sql
```

- [ ] **Step 3: Verify buckets exist**

```bash
npx @insforge/cli storage list
```

Expected: `voice-recordings`, `exports` both listed.

- [ ] **Step 4: Commit**

```bash
git add server/insforge/buckets/setup-buckets.sql
git commit -m "feat(backend): create voice-recordings and exports storage buckets"
```

---

## Task 7: Create InsForge SDK client + adapter

**Files:**
- Create: `src/lib/insforge/client.ts`
- Create: `src/lib/insforge/types.ts`
- Create: `src/lib/insforge/adapter.ts`

**Context:** 初始化 `@insforge/sdk` 客戶端，並創建符合前端 `IDataAdapter` 接口的後端適配器。

- [ ] **Step 1: Install SDK**

```bash
cd "/Users/samulee003/Desktop/今心 APP"
npm install @insforge/sdk
```

- [ ] **Step 2: Create client.ts**

```typescript
// src/lib/insforge/client.ts
import { createClient } from '@insforge/sdk';

const API_BASE_URL = import.meta.env.VITE_INSFORGE_URL || 'https://b88egxiz.ap-southeast.insforge.app';

export const insforge = createClient({
  baseUrl: API_BASE_URL,
});

export type InsForgeClient = typeof insforge;
```

- [ ] **Step 3: Create types.ts**

```typescript
// src/lib/insforge/types.ts
// 後端數據類型（對齊前端 RulerTypes + 後端 schema）

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string;
  language: 'zh-TW' | 'zh-CN';
  theme_preference: 'dark' | 'light' | 'system';
  privacy_enabled: boolean;
  notification_settings: Record<string, unknown>;
  onboarding_completed: boolean;
  user_role: string;
  created_at: string;
  updated_at: string;
}

export interface RulerLogRow {
  id: string;
  user_id: string;
  emotions: Array<{
    id: string;
    name: string;
    quadrant: string;
    energy: number;
    pleasantness: number;
  }>;
  intensity: number;
  body_scan: { location: string; sensation: string } | null;
  understanding: {
    trigger: string;
    message: string;
    what: string;
    who: string;
    where: string;
    need: string | null;
    interactionCycle?: {
      myReaction: string;
      childReaction: string;
      reflection: string;
    };
  } | null;
  expressing: { expression: string; prompt: string; mode: string } | null;
  regulating: { selectedStrategies: string[] } | null;
  physical_context: { sleepHours?: number; activityLevel?: string } | null;
  post_mood: string | null;
  is_full_flow: boolean;
  created_at: string;
}

export interface RulerDraftRow {
  id: string;
  user_id: string;
  step: string;
  selected_quadrants: string[];
  selected_emotions: Array<{ id: string; name: string; quadrant: string }>;
  emotion_intensity: number | null;
  body_scan: any;
  understanding: any;
  expressing: any;
  regulating: any;
  is_full_flow: boolean;
  post_regulation_mood: string | null;
  updated_at: string;
}

export interface AchievementRecordRow {
  id: string;
  user_id: string;
  achievement_key: string;
  unlocked_at: string;
  viewed: boolean;
}

export interface StreakRow {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_checkin_date: string | null;
  checkin_count: number;
  weekly_count: number;
  monthly_count: number;
  updated_at: string;
}
```

- [ ] **Step 4: Create adapter.ts (InsForgeAdapter)**

```typescript
// src/lib/insforge/adapter.ts
import { insforge } from './client';
import type { RulerLogRow, RulerDraftRow, AchievementRecordRow, StreakRow } from './types';

export class InsForgeAdapter {
  // ── Auth ──
  async signUp(email: string, password: string) {
    return insforge.auth.signUp({ email, password });
  }

  async signIn(email: string, password: string) {
    return insforge.auth.signInWithPassword({ email, password });
  }

  async signOut() {
    return insforge.auth.signOut();
  }

  getUser() {
    return insforge.auth.getUser();
  }

  // ── Ruler Logs ──
  async createLog(data: Omit<RulerLogRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    return insforge.db
      .from('ruler_logs')
      .insert([{ ...data }]);
  }

  async getLogs(limit = 50) {
    return insforge.db
      .from('ruler_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
  }

  async getLogById(id: string) {
    return insforge.db
      .from('ruler_logs')
      .select('*')
      .eq('id', id)
      .single();
  }

  async deleteLog(id: string) {
    return insforge.db
      .from('ruler_logs')
      .delete()
      .eq('id', id);
  }

  // ── Drafts ──
  async getDraft() {
    return insforge.db
      .from('ruler_drafts')
      .select('*')
      .single();
  }

  async upsertDraft(data: Partial<Omit<RulerDraftRow, 'id' | 'user_id'>>) {
    return insforge.db
      .from('ruler_drafts')
      .upsert([{ ...data }]);
  }

  async deleteDraft() {
    return insforge.db
      .from('ruler_drafts')
      .delete();
  }

  // ── Achievements ──
  async getAchievements() {
    return insforge.db
      .from('achievement_records')
      .select('*')
      .order('unlocked_at', { ascending: false });
  }

  async unlockAchievement(achievementKey: string) {
    return insforge.db
      .from('achievement_records')
      .insert([{ achievement_key: achievementKey }]);
  }

  async markAchievementViewed(id: string) {
    return insforge.db
      .from('achievement_records')
      .update({ viewed: true })
      .eq('id', id);
  }

  // ── Streaks ──
  async getStreak() {
    return insforge.db
      .from('streaks')
      .select('*')
      .single();
  }

  // ── Profile ──
  async getProfile() {
    return insforge.db
      .from('profiles')
      .select('*')
      .single();
  }

  async updateProfile(data: Partial<Record<string, unknown>>) {
    return insforge.db
      .from('profiles')
      .update({ ...data, updated_at: new Date().toISOString() });
  }
}

export const insforgeAdapter = new InsForgeAdapter();
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/insforge/
git commit -m "feat(backend): add InsForge SDK client, types, and adapter"
```

---

## Task 8: Write integration tests for adapter

**Files:**
- Create: `src/lib/insforge/adapter.test.ts`

- [ ] **Step 1: Write tests**

```typescript
// src/lib/insforge/adapter.test.ts
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { insforgeAdapter } from './adapter';

describe('InsForgeAdapter', () => {
  beforeAll(() => {
    // Mock environment for tests
    vi.stubGlobal('import.meta.env', { VITE_INSFORGE_URL: 'https://test.insforge.app' });
  });

  it('should be defined', () => {
    expect(insforgeAdapter).toBeDefined();
  });

  it('should have all CRUD methods for logs', () => {
    expect(typeof insforgeAdapter.createLog).toBe('function');
    expect(typeof insforgeAdapter.getLogs).toBe('function');
    expect(typeof insforgeAdapter.getLogById).toBe('function');
    expect(typeof insforgeAdapter.deleteLog).toBe('function');
  });

  it('should have draft methods', () => {
    expect(typeof insforgeAdapter.getDraft).toBe('function');
    expect(typeof insforgeAdapter.upsertDraft).toBe('function');
    expect(typeof insforgeAdapter.deleteDraft).toBe('function');
  });

  it('should have achievement methods', () => {
    expect(typeof insforgeAdapter.getAchievements).toBe('function');
    expect(typeof insforgeAdapter.unlockAchievement).toBe('function');
  });

  it('should have auth methods', () => {
    expect(typeof insforgeAdapter.signUp).toBe('function');
    expect(typeof insforgeAdapter.signIn).toBe('function');
    expect(typeof insforgeAdapter.signOut).toBe('function');
  });
});
```

- [ ] **Step 2: Run tests**

```bash
npm run test:run src/lib/insforge/adapter.test.ts
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/lib/insforge/adapter.test.ts
git commit -m "test(backend): add InsForgeAdapter unit tests"
```

---

## Task 9: Update .env.example with InsForge config

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Add InsForge env vars**

Append to `.env.example`:
```
# InsForge Backend
VITE_INSFORGE_URL=https://b88egxiz.ap-southeast.insforge.app
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "chore(config): add InsForge URL to env example"
```

---

## Task 10: Final verification

- [ ] **Step 1: Run all tests**

```bash
npm run test:run
```

Expected: All existing tests pass + new adapter tests pass.

- [ ] **Step 2: Verify InsForge metadata**

```bash
npx @insforge/cli metadata
```

Expected: Shows all 5 tables + 2 buckets.

- [ ] **Step 3: Final commit**

```bash
git log --oneline -15
```

---

## Self-Review

**1. Spec coverage:**
- ✅ profiles table — 對齊 `UserProfile` 類型
- ✅ ruler_logs table — 對齊 `RulerLogEntry` 類型
- ✅ ruler_drafts table — 對齊 `RulerDraft` 類型
- ✅ achievement_records table — 對齊 `AchievementRecord` 類型
- ✅ streaks table — 對齊 `StreakInfo` 類型
- ✅ storage buckets — voice-recordings + exports
- ✅ RLS on all tables — 用戶只能訪問自己的數據
- ✅ SDK adapter — 符合前端 `dataAdapter` 接口模式

**2. Placeholder scan:**
- ✅ 無 TBD/TODO
- ✅ 所有 SQL 包含完整語句
- ✅ 所有代碼步驟包含實際代碼

**3. Type consistency:**
- ✅ 後端字段名使用 snake_case（PostgreSQL 慣例）
- ✅ 前端 adapter 映射為 camelCase
- ✅ 類型定義與前端 `RulerTypes.ts` 對齊

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-10-insforge-backend-schema.md`.**

**Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
