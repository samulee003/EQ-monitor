# Complete Agentic Action Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first complete Agentic Action Loop for 阿念 Coach so a user can complete one 7 日小陪跑 micro-action loop with state, tools, trace, guardrails, and basic XP / coin feedback.

**Architecture:** Add a deterministic coach loop core under `server/insforge/functions/_shared/` for intent classification, micro-action lifecycle, rewards, expiry, and trace event shapes. Integrate that core into the production `coach` Edge Function as a max-3-step single-agent action loop, then expose typed response metadata to PWA Coach cards. Keep LLM responsible for semantic coaching and final language; deterministic code owns state transitions, XP / coins, expiry, authorization, and crisis gating.

**Tech Stack:** TypeScript, Vitest, InsForge Edge Functions, InsForge PostgreSQL SQL migrations, React 19, Vite, CSS Modules, Testing Library.

---

## Scope Check

This plan implements the **Complete Agentic Action Loop MVP** from `docs/superpowers/specs/2026-05-15-7-day-coach-momentum.md`.

Included:

- Runtime loop: Observe → Orient → Plan → Act → Persist → Evaluate → Adjust.
- Micro-action lifecycle: `active`, `completed`, `partial`, `skipped`, `expired`.
- Deterministic rewards: XP / coins for create and reports, no deductions.
- Trace events for intent, guardrails, tool calls, and final responses.
- PWA Coach entry for 7 日小陪跑, micro-action proposal, active action review, and compact gamification feedback.
- Tests for pure runtime helpers, source guardrails, and Coach UI.

Deferred to follow-up plans:

- Full金幣商店 inventory and purchase flow.
- Full個人排行榜 page.
- Pro fake-door and pricing survey.
- External app context integrations.
- LINE Bot micro-action creation.

This split is intentional: complete the agentic loop before building heavier game surfaces.

## File Structure

### Server / Edge Function

- Create: `server/insforge/functions/_shared/coachActionLoop.ts`
  - Pure TypeScript domain core for task templates, intent classification, crisis guardrail, rewards, expiry, streak calculation, and response metadata construction.
- Create: `server/insforge/functions/_shared/coachActionLoop.test.ts`
  - Unit tests for the deterministic core.
- Create: `server/insforge/schema/011_coach_action_loop.sql`
  - Tables: `coach_micro_actions`, `coach_gamification_stats`, `coach_agent_traces`.
- Modify: `server/insforge/functions/coach-simple.ts`
  - Import the loop core.
  - Add new tool declarations.
  - Load active micro-action and gamification state before model call.
  - Execute a max-3-step action loop.
  - Persist trace events.
  - Return `microActionProposal`, `activeMicroAction`, and `gamification` metadata.
- Modify: `server/insforge/functions/publishingGuardrails.test.ts`
  - Add source guardrails proving the production coach is not a one-shot fallback and has trace persistence plus crisis reward blocking.

### Frontend

- Modify: `src/lib/adk/types.ts`
  - Add typed `CoachMicroAction`, `CoachMicroActionProposal`, `CoachGamificationSummary`, and response metadata fields.
- Create: `src/components/coach/MicroActionCard.tsx`
  - Renders proposal and active micro-action review cards.
- Create: `src/components/coach/MicroActionCard.module.css`
  - Compact card styling for Coach.
- Create: `src/components/coach/MicroActionCard.test.tsx`
  - Tests confirmation and report actions.
- Create: `src/components/coach/GamificationStrip.tsx`
  - Renders level, XP, coins, and review streak.
- Create: `src/components/coach/GamificationStrip.module.css`
  - Compact strip styling.
- Create: `src/components/coach/GamificationStrip.test.tsx`
  - Tests the display math and labels.
- Modify: `src/pages/CoachPage.tsx`
  - Render 7 日小陪跑 CTA.
  - Store returned proposal, active micro-action, and gamification state.
  - Wire button actions to `handleSend()` with deterministic natural-language commands.
- Modify: `src/pages/CoachPage.module.css`
  - Add layout hooks for the 7 日小陪跑 panel and compact game strip.
- Modify: `src/pages/CoachPage.test.tsx`
  - Assert entry CTA, proposal card, active review card, no failure language, and gamification strip.

### Docs

- Modify: `docs/superpowers/specs/2026-05-15-7-day-coach-momentum.md`
  - Mark the MVP runtime shape as implementation-backed after code lands.
- Modify: `memory.md`
  - Add a short handoff note once implementation is verified.

---

## Task 1: Deterministic Coach Action Loop Core

**Files:**
- Create: `server/insforge/functions/_shared/coachActionLoop.ts`
- Create: `server/insforge/functions/_shared/coachActionLoop.test.ts`

- [ ] **Step 1: Write failing tests for crisis gating, intent classification, expiry, rewards, and streaks**

Create `server/insforge/functions/_shared/coachActionLoop.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  classifyCoachIntent,
  computeMicroActionReward,
  expireMicroActions,
  getLevelFromXp,
  isCrisisText,
  pickDefaultTaskForGoal,
  updateReviewStreak,
  type CoachLoopContext,
  type MicroActionRow,
} from './coachActionLoop.js';

const baseContext: CoachLoopContext = {
  nowIso: '2026-05-15T12:00:00.000Z',
  userId: 'user_local_001',
  sessionId: 'session-1',
  activeMicroAction: null,
  gamification: {
    total_xp: 0,
    coin_balance: 0,
    lifetime_coins: 0,
    total_reported: 0,
    completed_count: 0,
    partial_count: 0,
    skipped_count: 0,
    current_review_streak: 0,
    longest_review_streak: 0,
    last_review_date: null,
  },
  recentEmotionSummary: { recent_logs_count: 0, recent_emotions: [] },
};

describe('isCrisisText', () => {
  it('辨識危機文字', () => {
    expect(isCrisisText('我快撐不下去了，救命')).toBe(true);
    expect(isCrisisText('我想開始 7 日小陪跑')).toBe(false);
  });
});

describe('classifyCoachIntent', () => {
  it('危機文字優先導向 sos，不建立小行動', () => {
    const intent = classifyCoachIntent('我想死，幫我設一個任務', baseContext);
    expect(intent).toEqual({
      kind: 'sos',
      reason: 'crisis_text_detected',
    });
  });

  it('辨識 7 日小陪跑啟動', () => {
    const intent = classifyCoachIntent('我想開始 7 日小陪跑：每日自我照顧', baseContext);
    expect(intent).toEqual({
      kind: 'start_companion_run',
      goalKey: 'daily_care',
    });
  });

  it('有 active 小行動時辨識 completed 回報', () => {
    const context: CoachLoopContext = {
      ...baseContext,
      activeMicroAction: {
        id: 'ma-1',
        title: '喝一杯水',
        category: 'body_downshift',
        status: 'active',
        due_at: '2026-05-15T20:00:00.000Z',
        created_at: '2026-05-15T10:00:00.000Z',
      },
    };
    const intent = classifyCoachIntent('有做到', context);
    expect(intent).toEqual({
      kind: 'report_micro_action',
      status: 'completed',
      microActionId: 'ma-1',
    });
  });
});

describe('pickDefaultTaskForGoal', () => {
  it('每日自我照顧預設為身體降載型小行動', () => {
    expect(pickDefaultTaskForGoal('daily_care')).toEqual({
      key: 'drink_water_and_need',
      goalKey: 'daily_care',
      category: 'body_downshift',
      title: '喝一杯水，坐下來寫一句「我現在其實需要……」',
      dueHours: 24,
    });
  });
});

describe('expireMicroActions', () => {
  it('超過 due_at 的 active 小行動會過期', () => {
    const rows: MicroActionRow[] = [
      {
        id: 'expired-1',
        title: '喝水',
        category: 'body_downshift',
        status: 'active',
        due_at: '2026-05-15T11:59:59.000Z',
        created_at: '2026-05-14T12:00:00.000Z',
      },
      {
        id: 'active-1',
        title: '呼吸',
        category: 'body_downshift',
        status: 'active',
        due_at: '2026-05-15T12:00:01.000Z',
        created_at: '2026-05-15T10:00:00.000Z',
      },
    ];
    expect(expireMicroActions(rows, '2026-05-15T12:00:00.000Z')).toEqual({
      expiredIds: ['expired-1'],
      active: rows[1],
    });
  });
});

describe('computeMicroActionReward', () => {
  it('completed / partial / skipped 有獎勵，expired 沒有也不扣分', () => {
    expect(computeMicroActionReward('completed')).toEqual({ xp: 20, coins: 10 });
    expect(computeMicroActionReward('partial')).toEqual({ xp: 15, coins: 7 });
    expect(computeMicroActionReward('skipped')).toEqual({ xp: 10, coins: 5 });
    expect(computeMicroActionReward('expired')).toEqual({ xp: 0, coins: 0 });
  });
});

describe('updateReviewStreak', () => {
  it('同一天多次回報不重複增加 streak', () => {
    expect(updateReviewStreak({
      current: 2,
      longest: 3,
      lastReviewDate: '2026-05-15',
      reportDate: '2026-05-15',
    })).toEqual({ current: 2, longest: 3, lastReviewDate: '2026-05-15' });
  });

  it('隔天回報增加 streak', () => {
    expect(updateReviewStreak({
      current: 2,
      longest: 2,
      lastReviewDate: '2026-05-14',
      reportDate: '2026-05-15',
    })).toEqual({ current: 3, longest: 3, lastReviewDate: '2026-05-15' });
  });

  it('中斷後重新開始 streak', () => {
    expect(updateReviewStreak({
      current: 4,
      longest: 4,
      lastReviewDate: '2026-05-12',
      reportDate: '2026-05-15',
    })).toEqual({ current: 1, longest: 4, lastReviewDate: '2026-05-15' });
  });
});

describe('getLevelFromXp', () => {
  it('依 XP 回傳等級與下一級門檻', () => {
    expect(getLevelFromXp(0)).toEqual({ level: 1, title: '起步同行者', currentXp: 0, nextLevelXp: 100 });
    expect(getLevelFromXp(120)).toEqual({ level: 2, title: '回來看一眼', currentXp: 120, nextLevelXp: 250 });
    expect(getLevelFromXp(780)).toEqual({ level: 5, title: '慢慢有力', currentXp: 780, nextLevelXp: null });
  });
});
```

- [ ] **Step 2: Run the new tests to verify they fail**

Run:

```bash
cd server && npx vitest run insforge/functions/_shared/coachActionLoop.test.ts
```

Expected: FAIL because `server/insforge/functions/_shared/coachActionLoop.ts` does not exist.

- [ ] **Step 3: Implement the deterministic loop core**

Create `server/insforge/functions/_shared/coachActionLoop.ts`:

```ts
export type MicroActionStatus = 'active' | 'completed' | 'partial' | 'skipped' | 'expired';
export type CompanionGoalKey = 'sleep_anxiety' | 'parent_repair' | 'daily_care';
export type MicroActionCategory = 'body_downshift' | 'settling' | 'repair' | 'daily_care';

export interface MicroActionRow {
  id: string;
  title: string;
  category: MicroActionCategory | string;
  status: MicroActionStatus;
  due_at: string;
  created_at: string;
  goal_key?: CompanionGoalKey | string | null;
  task_key?: string | null;
  report_text?: string | null;
}

export interface GamificationStats {
  total_xp: number;
  coin_balance: number;
  lifetime_coins: number;
  total_reported: number;
  completed_count: number;
  partial_count: number;
  skipped_count: number;
  current_review_streak: number;
  longest_review_streak: number;
  last_review_date: string | null;
}

export interface CoachLoopContext {
  nowIso: string;
  userId: string;
  sessionId: string;
  activeMicroAction: MicroActionRow | null;
  gamification: GamificationStats;
  recentEmotionSummary: {
    recent_logs_count: number;
    recent_emotions: Array<{ emotions?: unknown; intensity?: number; date?: string }>;
  };
}

export interface TaskTemplate {
  key: string;
  goalKey: CompanionGoalKey;
  category: MicroActionCategory;
  title: string;
  dueHours: number;
}

export type CoachIntent =
  | { kind: 'sos'; reason: 'crisis_text_detected' }
  | { kind: 'start_companion_run'; goalKey: CompanionGoalKey }
  | { kind: 'propose_micro_action'; goalKey: CompanionGoalKey; task: TaskTemplate }
  | { kind: 'create_micro_action'; task: TaskTemplate; confirmationText: string }
  | { kind: 'report_micro_action'; microActionId: string; status: Exclude<MicroActionStatus, 'active' | 'expired'> }
  | { kind: 'show_gamification_summary' }
  | { kind: 'chat' };

const CRISIS_KEYWORDS = [
  '撐不下去',
  '想死',
  '想結束一切',
  '自殺',
  '自傷',
  '救命',
  '無法呼吸',
  '胸悶',
];

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    key: 'sleep_breath_3min',
    goalKey: 'sleep_anxiety',
    category: 'body_downshift',
    title: '睡前做 3 分鐘安神呼吸',
    dueHours: 24,
  },
  {
    key: 'repair_step_away_2min',
    goalKey: 'parent_repair',
    category: 'repair',
    title: '情緒升高時先離開現場 2 分鐘',
    dueHours: 24,
  },
  {
    key: 'drink_water_and_need',
    goalKey: 'daily_care',
    category: 'body_downshift',
    title: '喝一杯水，坐下來寫一句「我現在其實需要……」',
    dueHours: 24,
  },
];

const LEVELS = [
  { level: 1, title: '起步同行者', minXp: 0 },
  { level: 2, title: '回來看一眼', minXp: 100 },
  { level: 3, title: '小步練習者', minXp: 250 },
  { level: 4, title: '安神行動者', minXp: 450 },
  { level: 5, title: '慢慢有力', minXp: 700 },
];

export function isCrisisText(text: string): boolean {
  return CRISIS_KEYWORDS.some((keyword) => text.includes(keyword));
}

export function normalizeCompanionGoal(text: string): CompanionGoalKey {
  if (/睡前|焦慮|晚上/.test(text)) return 'sleep_anxiety';
  if (/親子|孩子|修復|發脾氣/.test(text)) return 'parent_repair';
  return 'daily_care';
}

export function pickDefaultTaskForGoal(goalKey: CompanionGoalKey): TaskTemplate {
  return TASK_TEMPLATES.find((task) => task.goalKey === goalKey) ?? TASK_TEMPLATES[2];
}

export function classifyCoachIntent(text: string, context: CoachLoopContext): CoachIntent {
  if (isCrisisText(text)) return { kind: 'sos', reason: 'crisis_text_detected' };

  if (/7 日小陪跑|7日小陪跑|開始陪跑/.test(text)) {
    return { kind: 'start_companion_run', goalKey: normalizeCompanionGoal(text) };
  }

  if (/遊戲|等級|金幣|XP|排行榜|復盤連續/.test(text)) {
    return { kind: 'show_gamification_summary' };
  }

  if (context.activeMicroAction) {
    if (/有做到|完成|做到了/.test(text)) {
      return { kind: 'report_micro_action', microActionId: context.activeMicroAction.id, status: 'completed' };
    }
    if (/一半|部分|有做一點/.test(text)) {
      return { kind: 'report_micro_action', microActionId: context.activeMicroAction.id, status: 'partial' };
    }
    if (/沒做到|沒有做到|沒做|先換/.test(text)) {
      return { kind: 'report_micro_action', microActionId: context.activeMicroAction.id, status: 'skipped' };
    }
  }

  if (/好|可以|就這個|設為今天的小行動/.test(text)) {
    const goalKey = normalizeCompanionGoal(text);
    return { kind: 'create_micro_action', task: pickDefaultTaskForGoal(goalKey), confirmationText: text };
  }

  return { kind: 'chat' };
}

export function expireMicroActions(
  rows: MicroActionRow[],
  nowIso: string
): { expiredIds: string[]; active: MicroActionRow | null } {
  const now = Date.parse(nowIso);
  const expiredIds: string[] = [];
  let active: MicroActionRow | null = null;

  for (const row of rows) {
    if (row.status !== 'active') continue;
    if (Date.parse(row.due_at) <= now) {
      expiredIds.push(row.id);
      continue;
    }
    if (!active || Date.parse(row.created_at) > Date.parse(active.created_at)) {
      active = row;
    }
  }

  return { expiredIds, active };
}

export function computeMicroActionReward(status: Exclude<MicroActionStatus, 'active'>): { xp: number; coins: number } {
  if (status === 'completed') return { xp: 20, coins: 10 };
  if (status === 'partial') return { xp: 15, coins: 7 };
  if (status === 'skipped') return { xp: 10, coins: 5 };
  return { xp: 0, coins: 0 };
}

export function updateReviewStreak(input: {
  current: number;
  longest: number;
  lastReviewDate: string | null;
  reportDate: string;
}): { current: number; longest: number; lastReviewDate: string } {
  if (input.lastReviewDate === input.reportDate) {
    return { current: input.current, longest: input.longest, lastReviewDate: input.reportDate };
  }

  const previous = input.lastReviewDate ? Date.parse(`${input.lastReviewDate}T00:00:00Z`) : null;
  const current = Date.parse(`${input.reportDate}T00:00:00Z`);
  const nextCurrent = previous !== null && current - previous === 86_400_000 ? input.current + 1 : 1;

  return {
    current: nextCurrent,
    longest: Math.max(input.longest, nextCurrent),
    lastReviewDate: input.reportDate,
  };
}

export function getLevelFromXp(totalXp: number): {
  level: number;
  title: string;
  currentXp: number;
  nextLevelXp: number | null;
} {
  const current = [...LEVELS].reverse().find((level) => totalXp >= level.minXp) ?? LEVELS[0];
  const next = LEVELS.find((level) => level.minXp > totalXp) ?? null;
  return {
    level: current.level,
    title: current.title,
    currentXp: totalXp,
    nextLevelXp: next?.minXp ?? null,
  };
}
```

- [ ] **Step 4: Run the deterministic loop tests**

Run:

```bash
cd server && npx vitest run insforge/functions/_shared/coachActionLoop.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit deterministic core**

```bash
git add server/insforge/functions/_shared/coachActionLoop.ts server/insforge/functions/_shared/coachActionLoop.test.ts
git commit -m "feat: 新增阿念 agentic action loop 核心"
```

---

## Task 2: Database Schema for Micro-Actions, Gamification, and Trace

**Files:**
- Create: `server/insforge/schema/011_coach_action_loop.sql`
- Modify: `server/insforge/functions/publishingGuardrails.test.ts`

- [ ] **Step 1: Add source guardrail test for schema tables**

Modify `server/insforge/functions/publishingGuardrails.test.ts` by adding this test inside `describe('發布前 P0/P1 守門', () => { ... })`:

```ts
  it('完整 Agentic Action Loop 必須有 micro action、gamification 與 trace schema', () => {
    const schema = readProjectFile('server/insforge/schema/011_coach_action_loop.sql');

    expect(schema).toContain('create table if not exists public.coach_micro_actions');
    expect(schema).toContain('create table if not exists public.coach_gamification_stats');
    expect(schema).toContain('create table if not exists public.coach_agent_traces');
    expect(schema).toContain("check (status in ('active', 'completed', 'partial', 'skipped', 'expired'))");
    expect(schema).toContain('Service role full access coach micro actions');
    expect(schema).toContain('Service role full access coach gamification stats');
    expect(schema).toContain('Service role full access coach agent traces');
  });
```

- [ ] **Step 2: Run guardrail test to verify it fails**

Run:

```bash
cd server && npx vitest run insforge/functions/publishingGuardrails.test.ts
```

Expected: FAIL because `server/insforge/schema/011_coach_action_loop.sql` does not exist.

- [ ] **Step 3: Create action loop schema**

Create `server/insforge/schema/011_coach_action_loop.sql`:

```sql
-- 011_coach_action_loop.sql
-- Agentic Coach action loop state:
-- 1. coach_micro_actions: 24-hour low-risk user-confirmed actions
-- 2. coach_gamification_stats: XP / coins / review streak independent from emotion-log streaks
-- 3. coach_agent_traces: minimal trace events for action-loop auditability

create table if not exists public.coach_micro_actions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  app_user_id text,
  source_log_id uuid,
  source text not null default 'coach' check (source in ('coach', 'pwa', 'line')),
  goal_key text,
  task_key text,
  title text not null,
  category text not null,
  status text not null default 'active',
  due_at timestamptz not null,
  reported_at timestamptz,
  report_text text,
  xp_awarded integer default 0,
  coins_awarded integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (status in ('active', 'completed', 'partial', 'skipped', 'expired')),
  check (user_id is not null or app_user_id is not null)
);

create index if not exists idx_coach_micro_actions_user_active
  on public.coach_micro_actions (user_id, status, due_at desc)
  where user_id is not null;

create index if not exists idx_coach_micro_actions_app_user_active
  on public.coach_micro_actions (app_user_id, status, due_at desc)
  where app_user_id is not null;

alter table public.coach_micro_actions enable row level security;

drop policy if exists "Users can read own coach micro actions"
  on public.coach_micro_actions;

create policy "Users can read own coach micro actions"
  on public.coach_micro_actions for select
  using (auth.uid() = user_id);

drop policy if exists "Service role full access coach micro actions"
  on public.coach_micro_actions;

create policy "Service role full access coach micro actions"
  on public.coach_micro_actions for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create table if not exists public.coach_gamification_stats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  app_user_id text,
  total_xp integer default 0,
  coin_balance integer default 0,
  lifetime_coins integer default 0,
  total_reported integer default 0,
  completed_count integer default 0,
  partial_count integer default 0,
  skipped_count integer default 0,
  current_review_streak integer default 0,
  longest_review_streak integer default 0,
  last_review_date date,
  updated_at timestamptz default now(),
  check (user_id is not null or app_user_id is not null)
);

create unique index if not exists idx_coach_gamification_stats_user
  on public.coach_gamification_stats (user_id)
  where user_id is not null;

create unique index if not exists idx_coach_gamification_stats_app_user
  on public.coach_gamification_stats (app_user_id)
  where app_user_id is not null;

alter table public.coach_gamification_stats enable row level security;

drop policy if exists "Users can read own coach gamification stats"
  on public.coach_gamification_stats;

create policy "Users can read own coach gamification stats"
  on public.coach_gamification_stats for select
  using (auth.uid() = user_id);

drop policy if exists "Service role full access coach gamification stats"
  on public.coach_gamification_stats;

create policy "Service role full access coach gamification stats"
  on public.coach_gamification_stats for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create table if not exists public.coach_agent_traces (
  id uuid default gen_random_uuid() primary key,
  user_id uuid,
  app_user_id text,
  session_id text not null,
  step integer not null,
  phase text not null,
  intent text,
  tool_name text,
  guardrail_result text,
  payload jsonb not null default '{}',
  created_at timestamptz default now(),
  check (user_id is not null or app_user_id is not null)
);

create index if not exists idx_coach_agent_traces_user_session
  on public.coach_agent_traces (user_id, session_id, created_at desc)
  where user_id is not null;

create index if not exists idx_coach_agent_traces_app_user_session
  on public.coach_agent_traces (app_user_id, session_id, created_at desc)
  where app_user_id is not null;

alter table public.coach_agent_traces enable row level security;

drop policy if exists "Service role full access coach agent traces"
  on public.coach_agent_traces;

create policy "Service role full access coach agent traces"
  on public.coach_agent_traces for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
```

- [ ] **Step 4: Run guardrail test**

Run:

```bash
cd server && npx vitest run insforge/functions/publishingGuardrails.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit schema**

```bash
git add server/insforge/schema/011_coach_action_loop.sql server/insforge/functions/publishingGuardrails.test.ts
git commit -m "feat: 新增 Coach action loop 資料表"
```

---

## Task 3: Production Coach Action Loop Runtime

**Files:**
- Modify: `server/insforge/functions/coach-simple.ts`
- Modify: `server/insforge/functions/publishingGuardrails.test.ts`

- [ ] **Step 1: Add source guardrail test for multi-step runtime**

Modify `server/insforge/functions/publishingGuardrails.test.ts` by adding this test inside the same `describe` block:

```ts
  it('production coach 必須是多步 Agentic Action Loop，不可退回單次工具呼叫', () => {
    const source = readProjectFile('server/insforge/functions/coach-simple.ts');

    expect(source).toContain('MAX_AGENTIC_STEPS');
    expect(source).toContain('runAgenticActionLoop');
    expect(source).toContain('persistTraceEvent');
    expect(source).toContain('loadLoopContext');
    expect(source).toContain('create_micro_action');
    expect(source).toContain('report_micro_action');
    expect(source).toContain('get_active_micro_action');
    expect(source).toContain('get_gamification_summary');
    expect(source).toContain('crisis_reward_blocked');
  });
```

- [ ] **Step 2: Run guardrail test to verify it fails**

Run:

```bash
cd server && npx vitest run insforge/functions/publishingGuardrails.test.ts
```

Expected: FAIL because `coach-simple.ts` does not contain the new action-loop symbols.

- [ ] **Step 3: Add imports and constants to `coach-simple.ts`**

Modify the top of `server/insforge/functions/coach-simple.ts` after the existing `createClient` import:

```ts
import {
  classifyCoachIntent,
  computeMicroActionReward,
  expireMicroActions,
  getLevelFromXp,
  pickDefaultTaskForGoal,
  updateReviewStreak,
  type CoachIntent,
  type CoachLoopContext,
  type GamificationStats,
  type MicroActionRow,
  type MicroActionStatus,
} from './_shared/coachActionLoop.ts';
```

Add this near `const GEMINI_API_URL`:

```ts
const MAX_AGENTIC_STEPS = 3;
```

- [ ] **Step 4: Extend `TOOL_TRACE_NAMES` and `TOOLS`**

In `server/insforge/functions/coach-simple.ts`, extend `TOOL_TRACE_NAMES`:

```ts
const TOOL_TRACE_NAMES = [
  'save_ruler_log',
  'get_user_emotion_summary',
  'get_emotion_trend',
  'trigger_action',
  'get_active_micro_action',
  'create_micro_action',
  'report_micro_action',
  'get_gamification_summary',
];
```

Append these tool declarations to the existing `TOOLS` array:

```ts
  {
    name: 'get_active_micro_action',
    description: '查詢使用者目前是否有 24 小時內仍有效的小行動。',
    parameters: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: '使用者 ID' },
      },
      required: ['userId'],
    },
  },
  {
    name: 'create_micro_action',
    description: '在使用者明確確認後建立一個 24 小時內可回報的小行動。',
    parameters: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: '使用者 ID' },
        goalKey: { type: 'string', enum: ['sleep_anxiety', 'parent_repair', 'daily_care'] },
        taskKey: { type: 'string' },
        title: { type: 'string' },
        category: { type: 'string' },
      },
      required: ['userId', 'goalKey', 'taskKey', 'title', 'category'],
    },
  },
  {
    name: 'report_micro_action',
    description: '回報小行動結果並發放無扣分獎勵。',
    parameters: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: '使用者 ID' },
        microActionId: { type: 'string' },
        status: { type: 'string', enum: ['completed', 'partial', 'skipped'] },
        reportText: { type: 'string' },
      },
      required: ['userId', 'microActionId', 'status'],
    },
  },
  {
    name: 'get_gamification_summary',
    description: '查詢 XP、金幣、等級與復盤連續摘要。',
    parameters: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: '使用者 ID' },
      },
      required: ['userId'],
    },
  },
```

- [ ] **Step 5: Add DB helpers for loop context and trace**

Add these helper functions after `getSessionEvents()` in `server/insforge/functions/coach-simple.ts`:

```ts
function userSelector(userId: string): { column: 'user_id' | 'app_user_id'; value: string; uuid: boolean } {
  const uuid = isUuid(userId);
  return { column: uuid ? 'user_id' : 'app_user_id', value: userId, uuid };
}

async function loadActiveMicroAction(userId: string, nowIso: string): Promise<MicroActionRow | null> {
  const client = getClient();
  const selector = userSelector(userId);
  const { data, error } = await client.database
    .from('coach_micro_actions')
    .select('id,title,category,status,due_at,created_at,goal_key,task_key,report_text')
    .eq(selector.column, selector.value)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('loadActiveMicroAction error:', error);
    return null;
  }

  const rows = (data ?? []) as MicroActionRow[];
  const { expiredIds, active } = expireMicroActions(rows, nowIso);
  if (expiredIds.length > 0) {
    await client.database
      .from('coach_micro_actions')
      .update({ status: 'expired', updated_at: nowIso })
      .in('id', expiredIds);
  }
  return active;
}

function emptyGamificationStats(): GamificationStats {
  return {
    total_xp: 0,
    coin_balance: 0,
    lifetime_coins: 0,
    total_reported: 0,
    completed_count: 0,
    partial_count: 0,
    skipped_count: 0,
    current_review_streak: 0,
    longest_review_streak: 0,
    last_review_date: null,
  };
}

async function loadGamificationStats(userId: string): Promise<GamificationStats> {
  const client = getClient();
  const selector = userSelector(userId);
  const { data, error } = await client.database
    .from('coach_gamification_stats')
    .select('total_xp,coin_balance,lifetime_coins,total_reported,completed_count,partial_count,skipped_count,current_review_streak,longest_review_streak,last_review_date')
    .eq(selector.column, selector.value)
    .maybeSingle();

  if (error) {
    console.error('loadGamificationStats error:', error);
    return emptyGamificationStats();
  }

  return (data ?? emptyGamificationStats()) as GamificationStats;
}

async function loadLoopContext(userId: string, sessionId: string, nowIso: string): Promise<CoachLoopContext> {
  const [activeMicroAction, gamification, recentEmotionSummary] = await Promise.all([
    loadActiveMicroAction(userId, nowIso),
    loadGamificationStats(userId),
    getUserEmotionSummary(userId),
  ]);

  return {
    nowIso,
    userId,
    sessionId,
    activeMicroAction,
    gamification,
    recentEmotionSummary,
  };
}

async function persistTraceEvent(input: {
  userId: string;
  sessionId: string;
  step: number;
  phase: string;
  intent?: string;
  toolName?: string;
  guardrailResult?: string;
  payload?: Record<string, unknown>;
}) {
  const client = getClient();
  const selector = userSelector(input.userId);
  await client.database.from('coach_agent_traces').insert({
    id: crypto.randomUUID(),
    [selector.column]: selector.value,
    session_id: input.sessionId,
    step: input.step,
    phase: input.phase,
    intent: input.intent,
    tool_name: input.toolName,
    guardrail_result: input.guardrailResult,
    payload: input.payload ?? {},
  });
}
```

- [ ] **Step 6: Add micro-action execution helpers**

Add these helpers after `executeTool()`:

```ts
async function createMicroAction(userId: string, intent: Extract<CoachIntent, { kind: 'create_micro_action' }>) {
  const client = getClient();
  const selector = userSelector(userId);
  const now = new Date();
  const dueAt = new Date(now.getTime() + intent.task.dueHours * 60 * 60 * 1000).toISOString();
  const { data, error } = await client.database
    .from('coach_micro_actions')
    .insert({
      [selector.column]: selector.value,
      source: 'coach',
      goal_key: intent.task.goalKey,
      task_key: intent.task.key,
      title: intent.task.title,
      category: intent.task.category,
      status: 'active',
      due_at: dueAt,
      xp_awarded: 5,
      coins_awarded: 0,
    })
    .select('id,title,category,status,due_at,created_at,goal_key,task_key')
    .maybeSingle();

  if (error) return { success: false, error: error.message };
  await incrementGamification(userId, { xp: 5, coins: 0, reportStatus: null });
  return { success: true, microAction: data };
}

async function reportMicroAction(
  userId: string,
  microActionId: string,
  status: Exclude<MicroActionStatus, 'active' | 'expired'>,
  reportText?: string
) {
  const client = getClient();
  const nowIso = new Date().toISOString();
  const reward = computeMicroActionReward(status);
  const { error } = await client.database
    .from('coach_micro_actions')
    .update({
      status,
      reported_at: nowIso,
      report_text: reportText ?? '',
      xp_awarded: reward.xp,
      coins_awarded: reward.coins,
      updated_at: nowIso,
    })
    .eq('id', microActionId);

  if (error) return { success: false, error: error.message };
  const stats = await incrementGamification(userId, { xp: reward.xp, coins: reward.coins, reportStatus: status });
  return { success: true, reward, gamification: stats };
}

async function incrementGamification(
  userId: string,
  input: { xp: number; coins: number; reportStatus: Exclude<MicroActionStatus, 'active' | 'expired'> | null }
) {
  const client = getClient();
  const selector = userSelector(userId);
  const current = await loadGamificationStats(userId);
  const today = new Date().toISOString().slice(0, 10);
  const streak = input.reportStatus
    ? updateReviewStreak({
        current: current.current_review_streak,
        longest: current.longest_review_streak,
        lastReviewDate: current.last_review_date,
        reportDate: today,
      })
    : {
        current: current.current_review_streak,
        longest: current.longest_review_streak,
        lastReviewDate: current.last_review_date,
      };

  const next = {
    [selector.column]: selector.value,
    total_xp: current.total_xp + input.xp,
    coin_balance: current.coin_balance + input.coins,
    lifetime_coins: current.lifetime_coins + input.coins,
    total_reported: current.total_reported + (input.reportStatus ? 1 : 0),
    completed_count: current.completed_count + (input.reportStatus === 'completed' ? 1 : 0),
    partial_count: current.partial_count + (input.reportStatus === 'partial' ? 1 : 0),
    skipped_count: current.skipped_count + (input.reportStatus === 'skipped' ? 1 : 0),
    current_review_streak: streak.current,
    longest_review_streak: streak.longest,
    last_review_date: streak.lastReviewDate,
    updated_at: new Date().toISOString(),
  };

  await client.database.from('coach_gamification_stats').upsert(next);
  return next;
}

function buildGamificationSummary(stats: GamificationStats) {
  return {
    ...stats,
    level: getLevelFromXp(stats.total_xp),
  };
}
```

- [ ] **Step 7: Add `runAgenticActionLoop()`**

Add this function before the main handler:

```ts
async function runAgenticActionLoop(input: {
  message: string;
  userId: string;
  sessionId: string;
  crisis: boolean;
}): Promise<{
  intent: CoachIntent;
  loopContext: CoachLoopContext;
  toolResult: Record<string, unknown> | null;
  activeMicroAction: MicroActionRow | null;
  gamification: ReturnType<typeof buildGamificationSummary>;
}> {
  let loopContext = await loadLoopContext(input.userId, input.sessionId, new Date().toISOString());
  await persistTraceEvent({
    userId: input.userId,
    sessionId: input.sessionId,
    step: 1,
    phase: 'observe',
    payload: {
      hasActiveMicroAction: Boolean(loopContext.activeMicroAction),
      recentLogs: loopContext.recentEmotionSummary.recent_logs_count,
    },
  });

  if (input.crisis) {
    await persistTraceEvent({
      userId: input.userId,
      sessionId: input.sessionId,
      step: 1,
      phase: 'evaluate',
      intent: 'sos',
      guardrailResult: 'crisis_reward_blocked',
    });
    return {
      intent: { kind: 'sos', reason: 'crisis_text_detected' },
      loopContext,
      toolResult: { crisis_reward_blocked: true },
      activeMicroAction: loopContext.activeMicroAction,
      gamification: buildGamificationSummary(loopContext.gamification),
    };
  }

  let intent = classifyCoachIntent(input.message, loopContext);
  let toolResult: Record<string, unknown> | null = null;

  await persistTraceEvent({
    userId: input.userId,
    sessionId: input.sessionId,
    step: 1,
    phase: 'orient',
    intent: intent.kind,
    payload: { intent },
  });

  for (let step = 2; step <= MAX_AGENTIC_STEPS; step++) {
    if (intent.kind === 'start_companion_run') {
      const task = pickDefaultTaskForGoal(intent.goalKey);
      intent = { kind: 'propose_micro_action', goalKey: intent.goalKey, task };
      toolResult = { proposal: task };
      break;
    }

    if (intent.kind === 'create_micro_action') {
      toolResult = await createMicroAction(input.userId, intent);
      await persistTraceEvent({
        userId: input.userId,
        sessionId: input.sessionId,
        step,
        phase: 'act',
        intent: intent.kind,
        toolName: 'create_micro_action',
        payload: toolResult,
      });
      break;
    }

    if (intent.kind === 'report_micro_action') {
      toolResult = await reportMicroAction(input.userId, intent.microActionId, intent.status, input.message);
      await persistTraceEvent({
        userId: input.userId,
        sessionId: input.sessionId,
        step,
        phase: 'act',
        intent: intent.kind,
        toolName: 'report_micro_action',
        payload: toolResult,
      });
      break;
    }

    if (intent.kind === 'show_gamification_summary') {
      toolResult = { gamification: buildGamificationSummary(loopContext.gamification) };
      break;
    }

    break;
  }

  loopContext = await loadLoopContext(input.userId, input.sessionId, new Date().toISOString());
  await persistTraceEvent({
    userId: input.userId,
    sessionId: input.sessionId,
    step: MAX_AGENTIC_STEPS,
    phase: 'evaluate',
    intent: intent.kind,
    payload: {
      activeMicroActionId: loopContext.activeMicroAction?.id ?? null,
      totalXp: loopContext.gamification.total_xp,
    },
  });

  return {
    intent,
    loopContext,
    toolResult,
    activeMicroAction: loopContext.activeMicroAction,
    gamification: buildGamificationSummary(loopContext.gamification),
  };
}
```

- [ ] **Step 8: Call the action loop in the main handler and add loop metadata to response**

In the main handler, after `const crisis = isCrisis(message);`, add:

```ts
    const agenticLoop = await runAgenticActionLoop({ message, userId, sessionId, crisis });
```

Replace:

```ts
    const systemText = (crisis
      ? `${EMERGENCY_STABILIZATION_PROMPT}\n\n【緊急狀態】使用者可能處於危機中，請直接進入今心緊急安定四步流程。`
      : SYSTEM_PROMPT) + explicitLogStatus;
```

with:

```ts
    const loopContextText = `\n\n【Agentic Action Loop 狀態】\nintent: ${agenticLoop.intent.kind}\nactiveMicroAction: ${
      agenticLoop.activeMicroAction ? agenticLoop.activeMicroAction.title : 'none'
    }\ntotalXp: ${agenticLoop.gamification.total_xp}\ncoins: ${agenticLoop.gamification.coin_balance}\n`;

    const systemText = (crisis
      ? `${EMERGENCY_STABILIZATION_PROMPT}\n\n【緊急狀態】使用者可能處於危機中，請直接進入今心緊急安定四步流程。`
      : SYSTEM_PROMPT) + explicitLogStatus + loopContextText;
```

In the response JSON `data`, add:

```ts
          intent: agenticLoop.intent.kind,
          microActionProposal:
            agenticLoop.intent.kind === 'propose_micro_action'
              ? agenticLoop.intent.task
              : null,
          activeMicroAction: agenticLoop.activeMicroAction,
          gamification: agenticLoop.gamification,
          toolResult: agenticLoop.toolResult,
```

- [ ] **Step 9: Run guardrail and server tests**

Run:

```bash
cd server && npx vitest run insforge/functions/publishingGuardrails.test.ts insforge/functions/_shared/coachActionLoop.test.ts
```

Expected: PASS.

- [ ] **Step 10: Commit production runtime**

```bash
git add server/insforge/functions/coach-simple.ts server/insforge/functions/publishingGuardrails.test.ts
git commit -m "feat: 實作 Coach agentic action loop runtime"
```

---

## Task 4: Frontend Types for Agentic Loop Metadata

**Files:**
- Modify: `src/lib/adk/types.ts`

- [ ] **Step 1: Extend Coach response types**

Modify `src/lib/adk/types.ts` to this full content:

```ts
export interface CoachMicroAction {
  id: string;
  title: string;
  category: string;
  status: 'active' | 'completed' | 'partial' | 'skipped' | 'expired';
  due_at: string;
  created_at: string;
  goal_key?: string | null;
  task_key?: string | null;
  report_text?: string | null;
}

export interface CoachMicroActionProposal {
  key: string;
  goalKey: 'sleep_anxiety' | 'parent_repair' | 'daily_care';
  category: string;
  title: string;
  dueHours: number;
}

export interface CoachGamificationSummary {
  total_xp: number;
  coin_balance: number;
  lifetime_coins: number;
  total_reported: number;
  completed_count: number;
  partial_count: number;
  skipped_count: number;
  current_review_streak: number;
  longest_review_streak: number;
  last_review_date: string | null;
  level?: {
    level: number;
    title: string;
    currentXp: number;
    nextLevelXp: number | null;
  };
}

export interface CoachMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  metadata?: {
    skillInvoked?: string;
    step?: number;
    emotions?: string[];
    action?: string;
    actionReason?: string;
    intent?: string;
  };
}

export interface CoachRequest {
  message: string;
  userId: string;
  sessionId: string;
}

export interface CoachResponse {
  response: string;
  skillInvoked?: string;
  step?: number;
  action?: string;
  actionReason?: string;
  intent?: string;
  microActionProposal?: CoachMicroActionProposal | null;
  activeMicroAction?: CoachMicroAction | null;
  gamification?: CoachGamificationSummary | null;
  toolResult?: Record<string, unknown> | null;
  metadata?: {
    emotions_detected?: string[];
    suggested_intensity?: number;
  };
}

/** Agent 觸發的前端動作類型 */
export type CoachAction =
  | 'start_breathing'
  | 'start_checkin'
  | 'open_sos'
  | 'show_history'
  | 'show_growth';
```

- [ ] **Step 2: Run TypeScript check for frontend types**

Run:

```bash
npx tsc --noEmit
```

Expected: PASS or only pre-existing unrelated errors. If errors reference `CoachResponse` missing properties, update call sites to use optional chaining.

- [ ] **Step 3: Commit type changes**

```bash
git add src/lib/adk/types.ts
git commit -m "feat: 新增 Coach action loop 前端型別"
```

---

## Task 5: MicroActionCard Component

**Files:**
- Create: `src/components/coach/MicroActionCard.tsx`
- Create: `src/components/coach/MicroActionCard.module.css`
- Create: `src/components/coach/MicroActionCard.test.tsx`

- [ ] **Step 1: Write component tests**

Create `src/components/coach/MicroActionCard.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MicroActionCard } from './MicroActionCard';

describe('MicroActionCard', () => {
  it('顯示小行動提案並要求明確確認', () => {
    const onConfirm = vi.fn();
    const onReject = vi.fn();
    render(
      <MicroActionCard
        proposal={{
          key: 'drink_water_and_need',
          goalKey: 'daily_care',
          category: 'body_downshift',
          title: '喝一杯水，坐下來寫一句「我現在其實需要……」',
          dueHours: 24,
        }}
        onConfirm={onConfirm}
        onReject={onReject}
      />
    );

    expect(screen.getByText('今天的小行動')).toBeInTheDocument();
    expect(screen.getByText('喝一杯水，坐下來寫一句「我現在其實需要……」')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '設為今天的小行動' }));
    expect(onConfirm).toHaveBeenCalledWith('喝一杯水，坐下來寫一句「我現在其實需要……」');

    fireEvent.click(screen.getByRole('button', { name: '先不要' }));
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it('顯示 active 小行動並提供三種回報', () => {
    const onReport = vi.fn();
    render(
      <MicroActionCard
        activeAction={{
          id: 'ma-1',
          title: '睡前做 3 分鐘安神呼吸',
          category: 'body_downshift',
          status: 'active',
          due_at: '2026-05-15T23:00:00.000Z',
          created_at: '2026-05-15T12:00:00.000Z',
        }}
        onReport={onReport}
      />
    );

    expect(screen.getByText('上次的小行動')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '有做到' }));
    fireEvent.click(screen.getByRole('button', { name: '做了一半' }));
    fireEvent.click(screen.getByRole('button', { name: '沒做到，但我回來了' }));

    expect(onReport).toHaveBeenNthCalledWith(1, 'completed');
    expect(onReport).toHaveBeenNthCalledWith(2, 'partial');
    expect(onReport).toHaveBeenNthCalledWith(3, 'skipped');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run src/components/coach/MicroActionCard.test.tsx
```

Expected: FAIL because `MicroActionCard.tsx` does not exist.

- [ ] **Step 3: Implement `MicroActionCard`**

Create `src/components/coach/MicroActionCard.tsx`:

```tsx
import { type CoachMicroAction, type CoachMicroActionProposal } from '../../lib/adk/types';
import styles from './MicroActionCard.module.css';

type ReportStatus = 'completed' | 'partial' | 'skipped';

interface Props {
  proposal?: CoachMicroActionProposal | null;
  activeAction?: CoachMicroAction | null;
  onConfirm?: (title: string) => void;
  onReject?: () => void;
  onReport?: (status: ReportStatus) => void;
}

export function MicroActionCard({ proposal, activeAction, onConfirm, onReject, onReport }: Props) {
  if (proposal) {
    return (
      <section className={styles.card} aria-label="今天的小行動提案">
        <p className={styles.eyebrow}>今天的小行動</p>
        <h3>{proposal.title}</h3>
        <p className={styles.copy}>24 小時內回來看一眼就可以。做一半也算數，沒做到但回來說也算數。</p>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={() => onConfirm?.(proposal.title)}>
            設為今天的小行動
          </button>
          <button type="button" className={styles.secondary} onClick={onReject}>
            先不要
          </button>
        </div>
      </section>
    );
  }

  if (activeAction) {
    return (
      <section className={styles.card} aria-label="上次的小行動回顧">
        <p className={styles.eyebrow}>上次的小行動</p>
        <h3>{activeAction.title}</h3>
        <p className={styles.copy}>回來看一眼就好，不是成績單。</p>
        <div className={styles.reportGrid}>
          <button type="button" onClick={() => onReport?.('completed')}>有做到</button>
          <button type="button" onClick={() => onReport?.('partial')}>做了一半</button>
          <button type="button" onClick={() => onReport?.('skipped')}>沒做到，但我回來了</button>
        </div>
      </section>
    );
  }

  return null;
}
```

Create `src/components/coach/MicroActionCard.module.css`:

```css
.card {
  display: grid;
  gap: 10px;
  width: min(100%, 680px);
  padding: 14px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
}

.eyebrow {
  margin: 0;
  color: #5f6f5f;
  font-size: 12px;
  font-weight: 800;
  line-height: 16px;
}

.card h3 {
  margin: 0;
  color: #1a1a1a;
  font-size: 16px;
  line-height: 24px;
}

.copy {
  margin: 0;
  color: #555;
  font-size: 13px;
  line-height: 20px;
}

.actions,
.reportGrid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.primary,
.secondary,
.reportGrid button {
  min-height: 40px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
}

.primary {
  color: #fff;
  background: #2f5d50;
}

.secondary,
.reportGrid button {
  color: #1a1a1a;
  background: rgba(255, 255, 255, 0.72);
}
```

- [ ] **Step 4: Run component test**

Run:

```bash
npx vitest run src/components/coach/MicroActionCard.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit MicroActionCard**

```bash
git add src/components/coach/MicroActionCard.tsx src/components/coach/MicroActionCard.module.css src/components/coach/MicroActionCard.test.tsx
git commit -m "feat: 新增小行動確認與回顧卡"
```

---

## Task 6: GamificationStrip Component

**Files:**
- Create: `src/components/coach/GamificationStrip.tsx`
- Create: `src/components/coach/GamificationStrip.module.css`
- Create: `src/components/coach/GamificationStrip.test.tsx`

- [ ] **Step 1: Write component tests**

Create `src/components/coach/GamificationStrip.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GamificationStrip } from './GamificationStrip';

describe('GamificationStrip', () => {
  it('顯示等級、XP、金幣與復盤連續', () => {
    render(
      <GamificationStrip
        summary={{
          total_xp: 120,
          coin_balance: 17,
          lifetime_coins: 17,
          total_reported: 2,
          completed_count: 1,
          partial_count: 1,
          skipped_count: 0,
          current_review_streak: 2,
          longest_review_streak: 2,
          last_review_date: '2026-05-15',
          level: {
            level: 2,
            title: '回來看一眼',
            currentXp: 120,
            nextLevelXp: 250,
          },
        }}
      />
    );

    expect(screen.getByText('Lv.2 回來看一眼')).toBeInTheDocument();
    expect(screen.getByText('120 / 250 XP')).toBeInTheDocument();
    expect(screen.getByText('17 金幣')).toBeInTheDocument();
    expect(screen.getByText('復盤連續 2 天')).toBeInTheDocument();
  });

  it('沒有資料時不渲染', () => {
    const { container } = render(<GamificationStrip summary={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run src/components/coach/GamificationStrip.test.tsx
```

Expected: FAIL because `GamificationStrip.tsx` does not exist.

- [ ] **Step 3: Implement `GamificationStrip`**

Create `src/components/coach/GamificationStrip.tsx`:

```tsx
import { type CoachGamificationSummary } from '../../lib/adk/types';
import styles from './GamificationStrip.module.css';

interface Props {
  summary?: CoachGamificationSummary | null;
}

export function GamificationStrip({ summary }: Props) {
  if (!summary) return null;

  const level = summary.level;
  const xpText = level?.nextLevelXp
    ? `${level.currentXp} / ${level.nextLevelXp} XP`
    : `${summary.total_xp} XP`;

  return (
    <section className={styles.strip} aria-label="阿念行動陪跑進度">
      <div>
        <span className={styles.label}>等級</span>
        <strong>{level ? `Lv.${level.level} ${level.title}` : 'Lv.1 起步同行者'}</strong>
      </div>
      <div>
        <span className={styles.label}>經驗</span>
        <strong>{xpText}</strong>
      </div>
      <div>
        <span className={styles.label}>金幣</span>
        <strong>{summary.coin_balance} 金幣</strong>
      </div>
      <div>
        <span className={styles.label}>回聲</span>
        <strong>復盤連續 {summary.current_review_streak} 天</strong>
      </div>
    </section>
  );
}
```

Create `src/components/coach/GamificationStrip.module.css`:

```css
.strip {
  width: min(100%, 680px);
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  padding: 10px;
  background: rgba(47, 93, 80, 0.08);
  border: 1px solid rgba(47, 93, 80, 0.18);
  border-radius: 10px;
}

.strip div {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.label {
  color: #607168;
  font-size: 11px;
  font-weight: 800;
  line-height: 14px;
}

.strip strong {
  overflow-wrap: anywhere;
  color: #1a1a1a;
  font-size: 12px;
  line-height: 16px;
}

@media (max-width: 560px) {
  .strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

- [ ] **Step 4: Run component test**

Run:

```bash
npx vitest run src/components/coach/GamificationStrip.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit GamificationStrip**

```bash
git add src/components/coach/GamificationStrip.tsx src/components/coach/GamificationStrip.module.css src/components/coach/GamificationStrip.test.tsx
git commit -m "feat: 新增 Coach 遊戲化進度列"
```

---

## Task 7: Wire Agentic Loop UI into CoachPage

**Files:**
- Modify: `src/pages/CoachPage.tsx`
- Modify: `src/pages/CoachPage.module.css`
- Modify: `src/pages/CoachPage.test.tsx`

- [ ] **Step 1: Add failing tests for 7 日小陪跑 CTA and returned metadata**

Add these tests to `src/pages/CoachPage.test.tsx`:

```tsx
  it('Coach 首屏提供 7 日小陪跑入口', () => {
    render(<CoachPage />);

    expect(screen.getByText('7 日小陪跑')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '開始 7 日小陪跑' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '每天做一個照顧自己的小動作' })).toBeInTheDocument();
  });

  it('Agent 回傳小行動提案時顯示確認卡，確認後送出明確確認文字', async () => {
    const sendMessageSpy = vi.spyOn(client, 'sendMessage')
      .mockResolvedValueOnce({
        response: '我先幫你挑一個很小的動作。',
        intent: 'propose_micro_action',
        microActionProposal: {
          key: 'drink_water_and_need',
          goalKey: 'daily_care',
          category: 'body_downshift',
          title: '喝一杯水，坐下來寫一句「我現在其實需要……」',
          dueHours: 24,
        },
      })
      .mockResolvedValueOnce({
        response: '已經設為今天的小行動。',
        intent: 'create_micro_action',
      });

    render(<CoachPage />);
    fireEvent.click(screen.getByRole('button', { name: '每天做一個照顧自己的小動作' }));

    expect(await screen.findByText('今天的小行動')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '設為今天的小行動' }));

    await waitFor(() => {
      expect(sendMessageSpy).toHaveBeenLastCalledWith(expect.objectContaining({
        message: '設為今天的小行動：喝一杯水，坐下來寫一句「我現在其實需要……」',
      }));
    });
  });

  it('Agent 回傳 active 小行動時顯示回顧卡並可回報 completed', async () => {
    const sendMessageSpy = vi.spyOn(client, 'sendMessage')
      .mockResolvedValueOnce({
        response: '我們回來看一眼。',
        activeMicroAction: {
          id: 'ma-1',
          title: '睡前做 3 分鐘安神呼吸',
          category: 'body_downshift',
          status: 'active',
          due_at: '2026-05-15T23:00:00.000Z',
          created_at: '2026-05-15T12:00:00.000Z',
        },
      })
      .mockResolvedValueOnce({
        response: '你有回來看，這本身就算數。',
        intent: 'report_micro_action',
      });

    render(<CoachPage />);
    fireEvent.change(screen.getByLabelText('輸入訊息'), { target: { value: '我回來了' } });
    fireEvent.click(screen.getByLabelText('送出訊息'));

    expect(await screen.findByText('上次的小行動')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '有做到' }));

    await waitFor(() => {
      expect(sendMessageSpy).toHaveBeenLastCalledWith(expect.objectContaining({
        message: '小行動回報：completed',
      }));
    });
  });

  it('顯示遊戲化進度但不使用扣分或失敗語言', async () => {
    vi.spyOn(client, 'sendMessage').mockResolvedValue({
      response: '做一半也可以，這讓我知道下次要調小。',
      gamification: {
        total_xp: 120,
        coin_balance: 17,
        lifetime_coins: 17,
        total_reported: 2,
        completed_count: 1,
        partial_count: 1,
        skipped_count: 0,
        current_review_streak: 2,
        longest_review_streak: 2,
        last_review_date: '2026-05-15',
        level: {
          level: 2,
          title: '回來看一眼',
          currentXp: 120,
          nextLevelXp: 250,
        },
      },
    });

    render(<CoachPage />);
    fireEvent.change(screen.getByLabelText('輸入訊息'), { target: { value: '看我的進度' } });
    fireEvent.click(screen.getByLabelText('送出訊息'));

    expect(await screen.findByText('Lv.2 回來看一眼')).toBeInTheDocument();
    expect(screen.queryByText(/失敗|扣分|降級/)).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Run CoachPage tests to verify they fail**

Run:

```bash
npx vitest run src/pages/CoachPage.test.tsx
```

Expected: FAIL because new UI elements are not wired.

- [ ] **Step 3: Import components and types in `CoachPage.tsx`**

Add imports:

```ts
import { MicroActionCard } from '../components/coach/MicroActionCard';
import { GamificationStrip } from '../components/coach/GamificationStrip';
import {
  type CoachGamificationSummary,
  type CoachMicroAction,
  type CoachMicroActionProposal,
} from '../lib/adk/types';
```

Change existing import from `../lib/adk/types` to include only `CoachMessage` and `CoachAction` there if it conflicts:

```ts
import { type CoachMessage, type CoachAction } from '../lib/adk/types';
```

- [ ] **Step 4: Add CoachPage state and handlers**

Inside `CoachPage`, after `const [pendingAction...`, add:

```ts
  const [microActionProposal, setMicroActionProposal] = useState<CoachMicroActionProposal | null>(null);
  const [activeMicroAction, setActiveMicroAction] = useState<CoachMicroAction | null>(null);
  const [gamification, setGamification] = useState<CoachGamificationSummary | null>(null);
```

Inside the successful API response block in `doSend`, before building `modelMsg`, add:

```ts
      setMicroActionProposal(res.microActionProposal ?? null);
      setActiveMicroAction(res.activeMicroAction ?? null);
      if (res.gamification) setGamification(res.gamification);
```

Add handlers before `handleNavigate`:

```ts
  const handleStartCompanionRun = useCallback((goal: string) => {
    handleSend(`我想開始 7 日小陪跑：${goal}`);
  }, [handleSend]);

  const handleConfirmMicroAction = useCallback((title: string) => {
    setMicroActionProposal(null);
    handleSend(`設為今天的小行動：${title}`);
  }, [handleSend]);

  const handleRejectMicroAction = useCallback(() => {
    setMicroActionProposal(null);
    handleSend('先不要設小行動，我現在只想聊聊。');
  }, [handleSend]);

  const handleReportMicroAction = useCallback((status: 'completed' | 'partial' | 'skipped') => {
    setActiveMicroAction(null);
    handleSend(`小行動回報：${status}`);
  }, [handleSend]);
```

- [ ] **Step 5: Render 7 日小陪跑 panel, cards, and strip**

Inside the `showWelcome` opening stack, before the existing `scenarioPanel`, add:

```tsx
              <div className={styles.momentumPanel} aria-label="7 日小陪跑">
                <div>
                  <p className={styles.momentumEyebrow}>7 日小陪跑</p>
                  <h3>讓阿念推你前進一點點</h3>
                  <p>先選一個方向，我會把它縮成 24 小時內可以回來看一眼的小行動。</p>
                </div>
                <button type="button" className={styles.momentumPrimary} onClick={() => handleStartCompanionRun('每日自我照顧')}>
                  開始 7 日小陪跑
                </button>
                <div className={styles.momentumGoals}>
                  <button type="button" onClick={() => handleStartCompanionRun('睡前焦慮少一點')}>睡前焦慮少一點</button>
                  <button type="button" onClick={() => handleStartCompanionRun('親子衝突後快一點回來')}>親子衝突後快一點回來</button>
                  <button type="button" onClick={() => handleStartCompanionRun('每天做一個照顧自己的小動作')}>每天做一個照顧自己的小動作</button>
                </div>
              </div>
```

After the `showWelcome` section and before `bindingPanel`, add:

```tsx
        <GamificationStrip summary={gamification} />

        <MicroActionCard
          proposal={microActionProposal}
          activeAction={activeMicroAction}
          onConfirm={handleConfirmMicroAction}
          onReject={handleRejectMicroAction}
          onReport={handleReportMicroAction}
        />
```

- [ ] **Step 6: Add CSS for momentum panel**

Append to `src/pages/CoachPage.module.css`:

```css
.momentumPanel {
  display: grid;
  gap: 12px;
  padding: 14px;
  background: rgba(47, 93, 80, 0.08);
  border: 1px solid rgba(47, 93, 80, 0.18);
  border-radius: 12px;
}

.momentumEyebrow {
  margin: 0 0 4px;
  color: #5f6f5f;
  font-size: 12px;
  font-weight: 900;
  line-height: 16px;
}

.momentumPanel h3 {
  margin: 0;
  color: #1a1a1a;
  font-size: 18px;
  line-height: 26px;
}

.momentumPanel p {
  margin: 0;
  color: #555;
  font-size: 13px;
  line-height: 20px;
}

.momentumPrimary,
.momentumGoals button {
  min-height: 40px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  cursor: pointer;
  font-weight: 800;
}

.momentumPrimary {
  color: #fff;
  background: #2f5d50;
}

.momentumGoals {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.momentumGoals button {
  color: #1a1a1a;
  background: rgba(255, 255, 255, 0.74);
}

@media (max-width: 640px) {
  .momentumGoals {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 7: Run CoachPage tests**

Run:

```bash
npx vitest run src/pages/CoachPage.test.tsx src/components/coach/MicroActionCard.test.tsx src/components/coach/GamificationStrip.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit Coach UI wiring**

```bash
git add src/pages/CoachPage.tsx src/pages/CoachPage.module.css src/pages/CoachPage.test.tsx
git commit -m "feat: 串接 Coach 小行動閉環 UI"
```

---

## Task 8: Agentic Eval and Safety Regression Tests

**Files:**
- Create: `server/insforge/functions/_shared/coachActionLoopEval.test.ts`
- Modify: `server/insforge/functions/_shared/coachActionLoop.ts`

- [ ] **Step 1: Write eval-style tests for core scenarios**

Create `server/insforge/functions/_shared/coachActionLoopEval.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { classifyCoachIntent, type CoachLoopContext } from './coachActionLoop.js';

const context = (overrides: Partial<CoachLoopContext> = {}): CoachLoopContext => ({
  nowIso: '2026-05-15T12:00:00.000Z',
  userId: 'user_local_001',
  sessionId: 'session-1',
  activeMicroAction: null,
  gamification: {
    total_xp: 0,
    coin_balance: 0,
    lifetime_coins: 0,
    total_reported: 0,
    completed_count: 0,
    partial_count: 0,
    skipped_count: 0,
    current_review_streak: 0,
    longest_review_streak: 0,
    last_review_date: null,
  },
  recentEmotionSummary: { recent_logs_count: 0, recent_emotions: [] },
  ...overrides,
});

describe('Coach Agentic Action Loop eval scenarios', () => {
  it('使用者要開始陪跑時，選擇 start_companion_run 而不是普通聊天', () => {
    expect(classifyCoachIntent('我想開始 7 日小陪跑：每天做一個照顧自己的小動作', context()).kind)
      .toBe('start_companion_run');
  });

  it('使用者回報 partial 時，辨識為 report_micro_action', () => {
    const result = classifyCoachIntent('做了一半', context({
      activeMicroAction: {
        id: 'ma-1',
        title: '喝水',
        category: 'body_downshift',
        status: 'active',
        due_at: '2026-05-15T23:00:00.000Z',
        created_at: '2026-05-15T10:00:00.000Z',
      },
    }));

    expect(result).toEqual({ kind: 'report_micro_action', microActionId: 'ma-1', status: 'partial' });
  });

  it('危機語句永遠優先 sos，即使文字要求任務或金幣', () => {
    expect(classifyCoachIntent('我想死，給我任務和金幣', context())).toEqual({
      kind: 'sos',
      reason: 'crisis_text_detected',
    });
  });

  it('詢問遊戲化狀態時顯示 gamification summary', () => {
    expect(classifyCoachIntent('看我的 XP 和金幣', context()).kind).toBe('show_gamification_summary');
  });

  it('沒有 active 小行動時，單純說有做到不會憑空回報', () => {
    expect(classifyCoachIntent('有做到', context()).kind).toBe('chat');
  });
});
```

- [ ] **Step 2: Run eval tests**

Run:

```bash
cd server && npx vitest run insforge/functions/_shared/coachActionLoopEval.test.ts
```

Expected: PASS after Task 1; if it fails, fix `classifyCoachIntent()` so these exact scenarios pass.

- [ ] **Step 3: Run combined server loop tests**

Run:

```bash
cd server && npx vitest run insforge/functions/_shared/coachActionLoop.test.ts insforge/functions/_shared/coachActionLoopEval.test.ts insforge/functions/publishingGuardrails.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit eval tests**

```bash
git add server/insforge/functions/_shared/coachActionLoopEval.test.ts server/insforge/functions/_shared/coachActionLoop.ts
git commit -m "test: 補 Coach agentic action loop 場景評估"
```

---

## Task 9: Documentation Sync

**Files:**
- Modify: `docs/superpowers/specs/2026-05-15-7-day-coach-momentum.md`
- Modify: `memory.md`

- [ ] **Step 1: Update the spec implementation status**

In `docs/superpowers/specs/2026-05-15-7-day-coach-momentum.md`, change:

```md
- **文件狀態**：產品決策稿，待實作
```

to:

```md
- **文件狀態**：Phase 1 action-loop MVP implementation plan written
```

Add this paragraph after the header list:

```md
> Implementation note: the first implementation plan is `docs/superpowers/plans/2026-05-15-complete-agentic-action-loop.md`. It prioritizes runtime loop, trace, micro-action lifecycle, safety guardrails, and Coach UI before full shop / Pro surfaces.
```

- [ ] **Step 2: Add memory handoff note**

Append this section near the top of `memory.md`, under the current mainline section:

```md
## Agentic Action Loop 下一步（2026-05-15）

- 新規格：`docs/superpowers/specs/2026-05-15-7-day-coach-momentum.md`。
- 新 ADR：`docs/adr/0001-complete-agentic-action-loop-for-coach.md`。
- 實作計畫：`docs/superpowers/plans/2026-05-15-complete-agentic-action-loop.md`。
- 產品核心：阿念是 Agentic 情緒代理；遊戲化待辦只是工具層。
- 技術核心：必須實作 Observe → Orient → Plan → Act → Persist → Evaluate → Adjust，不可只做 prompt + 單次 function call。
- 第一個實作切片：PWA Coach 完成一次 7 日小陪跑小行動閉環，包含 trace、guardrails、micro-action state、basic XP / coins。
```

- [ ] **Step 3: Run diff check**

Run:

```bash
git diff --check -- docs/superpowers/specs/2026-05-15-7-day-coach-momentum.md memory.md
```

Expected: no output.

- [ ] **Step 4: Commit docs sync**

```bash
git add docs/superpowers/specs/2026-05-15-7-day-coach-momentum.md memory.md
git commit -m "docs: 同步 Agentic Action Loop 實作計畫"
```

---

## Task 10: Final Verification

**Files:**
- No new files.

- [ ] **Step 1: Run focused frontend tests**

Run:

```bash
npx vitest run src/pages/CoachPage.test.tsx src/components/coach/MicroActionCard.test.tsx src/components/coach/GamificationStrip.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run focused server tests**

Run:

```bash
cd server && npx vitest run insforge/functions/_shared/coachActionLoop.test.ts insforge/functions/_shared/coachActionLoopEval.test.ts insforge/functions/publishingGuardrails.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run build checks**

Run:

```bash
npm run build
cd server && npm run build
```

Expected: both commands pass.

- [ ] **Step 4: Run final diff hygiene check**

Run:

```bash
git diff --check
```

Expected: no output.

- [ ] **Step 5: Manual smoke path**

Start frontend dev server:

```bash
npm run dev
```

Open `http://localhost:5173/#coach` and verify:

1. Coach shows `7 日小陪跑`.
2. Click `每天做一個照顧自己的小動作`.
3. Mocked or live API returns a micro-action proposal.
4. Confirm `設為今天的小行動`.
5. Send `我回來了`.
6. Active micro-action card appears.
7. Click `做了一半`.
8. Coach response does not contain `失敗`, `扣分`, or `降級`.

- [ ] **Step 6: Final commit if verification touched files**

If verification required edits:

```bash
git add <changed-files>
git commit -m "fix: 收斂 Coach action loop 驗證問題"
```

If no edits were required, skip this commit step and report the verified commands.

---

## Self-Review

### Spec Coverage

- Agentic Action Loop: Task 1, Task 3, Task 8.
- State and trace: Task 2, Task 3.
- Micro-action lifecycle: Task 1, Task 2, Task 3, Task 5, Task 7.
- Crisis guardrail blocks rewards: Task 1, Task 3, Task 8.
- Basic XP / coins: Task 1, Task 3, Task 6, Task 7.
- PWA Coach first slice: Task 5, Task 6, Task 7.
- 7 日小陪跑 entry: Task 7.
- Documentation sync: Task 9.
- Full shop, full leaderboard, Pro fake-door: explicitly deferred because this plan proves the agentic loop first.

### Placeholder Scan

This plan avoids placeholder instructions. Every created file includes concrete code or SQL content. Deferred work is explicitly out of scope and named as follow-up plan material.

### Type Consistency

- `CoachMicroAction`, `CoachMicroActionProposal`, and `CoachGamificationSummary` are defined in Task 4 before being used in Tasks 5-7.
- Micro-action statuses are consistently `active`, `completed`, `partial`, `skipped`, `expired`.
- Intent names are consistently `start_companion_run`, `propose_micro_action`, `create_micro_action`, `report_micro_action`, `show_gamification_summary`, `sos`, `chat`.
- Reward rules are consistent across Task 1 and Task 3.
