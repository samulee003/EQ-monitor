import { describe, it, expect, beforeEach } from 'vitest';
import { memoryAdapter } from './memoryAdapter.js';
import type { DatabaseAdapter } from './index.js';

const DATABASE_URL = process.env.DATABASE_URL || '';
const insforgeAvailable = Boolean(DATABASE_URL && DATABASE_URL.includes('insforge.app'));

interface AdapterCase {
  name: string;
  build: () => Promise<DatabaseAdapter> | DatabaseAdapter;
}

const cases: AdapterCase[] = [
  { name: 'memoryAdapter', build: () => memoryAdapter },
];

if (insforgeAvailable) {
  cases.push({
    name: 'insforgeAdapter',
    build: async () => {
      const { createInsforgeAdapter } = await import('./insforgeAdapter.js');
      return createInsforgeAdapter(DATABASE_URL);
    },
  });
}

describe.each(cases)('Adapter Contract: $name', ({ build }) => {
  let adapter: DatabaseAdapter;
  const lineUserId = `contract-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  beforeEach(async () => {
    adapter = await build();
  });

  it('建立或取得使用者後 lineUserId 一致', async () => {
    const user = await adapter.getOrCreateUser(lineUserId, '契約測試');
    expect(user.lineUserId).toBe(lineUserId);
  });

  it('建立 session 後 session id 可用於更新與完成', async () => {
    await adapter.getOrCreateUser(lineUserId);
    const session = await adapter.createSession(lineUserId);
    expect(session.id).toBeTruthy();

    await adapter.updateSession(session.id, { status: 'in_progress' });
    await adapter.completeSession(session.id, {
      bodyPart: '胸口',
      emotionQuadrant: 'green',
      emotionName: '平靜',
      emotionIntensity: 3,
      trigger: '測試情境',
      need: '休息',
      expressionText: '深呼吸',
      regulationTechnique: 'breathing',
      postMood: '舒緩',
    });

    const allSessions = await adapter.getAllSessions();
    const target = allSessions.find((s) => s.id === session.id);
    expect(target?.completedAt).toBeTruthy();
  });

  it('saveMessage 寫入後可從 getUserHistory 讀回', async () => {
    await adapter.getOrCreateUser(lineUserId);
    await adapter.saveMessage(lineUserId, 'in', '測試訊息');
    const history = await adapter.getUserHistory(lineUserId, 5);
    expect(history.some((m) => m.content === '測試訊息' && m.direction === 'in')).toBe(true);
  });

  it('getWeeklyStats 回傳必要欄位', async () => {
    await adapter.getOrCreateUser(lineUserId);
    const stats = await adapter.getWeeklyStats(lineUserId);
    expect(stats).toHaveProperty('totalSessions');
    expect(stats).toHaveProperty('streakDays');
    expect(typeof stats.totalSessions).toBe('number');
    expect(typeof stats.streakDays).toBe('number');
  });
});
