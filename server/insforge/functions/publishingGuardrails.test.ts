import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(__dirname, '../../..');

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('發布前 P0/P1 守門', () => {
  it('主動推送批次必須只推給 coach_opted_in 使用者', () => {
    const weekly = readProjectFile('server/insforge/functions/weekly-report.ts');
    const care = readProjectFile('server/insforge/functions/achievement-checker.ts');

    for (const source of [weekly, care]) {
      expect(source).toContain("from('coach_context')");
      expect(source).toContain('coach_opted_in');
      expect(source).toContain('.eq(\'coach_opted_in\', true)');
    }
  });

  it('achievement-checker 必須覆蓋前台所有可見成就規則', () => {
    const source = readProjectFile('server/insforge/functions/achievement-checker.ts');

    for (const key of [
      'first_log',
      'streak_3',
      'streak_7',
      'streak_30',
      'emotions_10',
      'full_ruler_5',
      'repair_master',
      'gentle_awareness',
      'self_compassion',
    ]) {
      expect(source).toContain(`key: '${key}'`);
    }
  });

  it('production coach 必須驗證 Authorization 所屬 userId，避免任意 userId 查詢', () => {
    const source = readProjectFile('server/insforge/functions/coach-simple.ts');

    expect(source).toContain('async function assertAuthorizedUser');
    expect(source).toContain("req.headers.get('Authorization')");
    expect(source).toContain('auth.getCurrentUser');
    expect(source).toContain('authUser.id !== userId');
  });

  it('刪除帳號必須留下最小 tombstone，避免 Auth 身分殘留後重新登入', () => {
    const source = readProjectFile('server/insforge/functions/delete-account.ts');
    const schema = readProjectFile('server/insforge/schema/010_account_deletions.sql');

    expect(schema).toContain('create table if not exists public.account_deletions');
    expect(schema).toContain('email_hash');
    expect(schema).toContain('Users can read own account deletion');
    expect(schema).toContain('Service role full access account deletions');
    expect(source).toContain('account_deletions');
    expect(source).toContain('sha256Hex');
    expect(source.indexOf('recordAccountDeletion')).toBeLessThan(
      source.indexOf('for (const spec of DATA_DELETE_SPECS)')
    );
  });

  it('完整 Agentic Action Loop 必須有 micro action、gamification 與 trace schema', () => {
    const schema = readProjectFile('server/insforge/schema/011_coach_action_loop.sql');

    expect(schema).toContain('create table if not exists public.coach_micro_actions');
    expect(schema).toContain('create table if not exists public.coach_gamification_stats');
    expect(schema).toContain('create table if not exists public.coach_agent_traces');
    expect(schema).toContain("check (status in ('active', 'completed', 'partial', 'skipped', 'expired'))");
    expect(schema).toContain('check (xp_awarded >= 0)');
    expect(schema).toContain('check (coins_awarded >= 0)');
    expect(schema).toContain('check (total_xp >= 0)');
    expect(schema).toContain('check (coin_balance >= 0)');
    expect(schema).toContain('check (lifetime_coins >= 0)');
    expect(schema).toContain('check (current_review_streak >= 0)');
    expect(schema).toContain('Service role full access coach micro actions');
    expect(schema).toContain('Service role full access coach gamification stats');
    expect(schema).toContain('Service role full access coach agent traces');
  });

  it('刪除帳號必須清除 Agentic Action Loop 使用者資料', () => {
    const source = readProjectFile('server/insforge/functions/delete-account.ts');

    expect(source).toContain("{ table: 'coach_micro_actions', column: 'user_id' }");
    expect(source).toContain("{ table: 'coach_gamification_stats', column: 'user_id' }");
    expect(source).toContain("{ table: 'coach_agent_traces', column: 'user_id' }");
  });

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

  it('production coach 危機路徑不可開放 micro action mutating tools', () => {
    const source = readProjectFile('server/insforge/functions/coach-simple.ts');

    expect(source).toContain('RESTRICTED_CRISIS_TOOLS');
    expect(source).toContain('MUTATING_ACTION_LOOP_TOOLS');
    expect(source).toContain('executeTool(fc.name, fc.args, userId, { crisis })');
    expect(source).toContain('{ success: false, crisis_reward_blocked: true }');
    expect(source).toContain('crisis ? RESTRICTED_CRISIS_TOOLS : TOOLS');
  });

  it('production coach 回報 micro action 必須限 active row，避免重複發獎勵', () => {
    const source = readProjectFile('server/insforge/functions/coach-simple.ts');

    expect(source).toContain(".eq('status', 'active')");
    expect(source).toContain(".is('reported_at', null)");
    expect(source).toContain('micro_action_not_active');
    expect(source.indexOf('if (!data)')).toBeLessThan(source.indexOf('incrementGamification(userId'));
  });

  it('production coach public endpoint 不接受任意 app_user_id 寫入', () => {
    const source = readProjectFile('server/insforge/functions/coach-simple.ts');

    expect(source).toContain("if (!isUuid(userId))");
    expect(source).toContain('Public coach endpoint requires UUID userId');
  });

  it('production coach 必須等待對話持久化並回傳持久化狀態', () => {
    const source = readProjectFile('server/insforge/functions/coach-simple.ts');

    expect(source).toContain('async function persistConversationEvents');
    expect(source).toContain('await persistConversationEvents');
    expect(source).toContain('conversationPersisted');
    expect(source).toContain('conversationPersistFailedRoles');
    expect(source).toContain('throw new Error(`adk_events ${role}: ${error.message}`)');
    expect(source).not.toContain('appendEvent(APP_NAME, userId, sessionId, \'user\', message).catch');
  });

  it('action loop schema 必須限制每個使用者只能有一個 active micro action', () => {
    const schema = readProjectFile('server/insforge/schema/011_coach_action_loop.sql');

    expect(schema).toContain('idx_coach_micro_actions_one_active_user');
    expect(schema).toContain('idx_coach_micro_actions_one_active_app_user');
    expect(schema).toContain("where user_id is not null and status = 'active'");
    expect(schema).toContain("where app_user_id is not null and status = 'active'");
  });
});
