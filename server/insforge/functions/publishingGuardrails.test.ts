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
});
