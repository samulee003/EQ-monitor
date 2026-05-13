import { describe, it, expect, beforeEach, vi } from 'vitest';
import { extractCoachMetaFromLogs, isMigrationNeeded } from './localStorageMigration';
import { type Quadrant } from '@/data/emotionData';
import { runMigration } from './localStorageMigration';
import { upsertCoachContext } from './coachContext';
import { type RulerLogEntry } from '@/types/RulerTypes';

const databaseMock = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock('./client', () => ({
  insforge: {
    database: databaseMock,
  },
}));

vi.mock('./coachContext', async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    upsertCoachContext: vi.fn().mockResolvedValue(undefined),
  };
});

const makeLog = (quadrant: string, need: string | null, intensity: number): RulerLogEntry => ({
  id: `id_${Math.random()}`,
  timestamp: new Date().toISOString(),
  emotions: [{ id: '1', name: 'test', quadrant: quadrant as Quadrant, energy: 0, pleasantness: 0 }],
  intensity,
  bodyScan: null,
  understanding: need ? { trigger: '', message: '', what: '', who: '', where: '', need } : null,
  expressing: null,
  regulating: null,
  isFullFlow: false,
  postMood: '',
});

describe('localStorageMigration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

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

  it('runMigration 應把本機 RULER 日誌寫入 InsForge ruler_logs 並標記完成', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    databaseMock.from.mockReturnValue({ insert });

    const logs = [
      {
        ...makeLog('red', 'rest', 8),
        id: 'local-1',
        bodyScan: { location: '胸口', sensation: '緊' },
        postMood: '比較平靜',
        isFullFlow: true,
      },
      {
        ...makeLog('blue', null, 4),
        id: 'local-2',
        physicalContext: { sleepHours: 6, activityLevel: 2 },
      },
    ];
    localStorage.setItem('feelings_logs', JSON.stringify(logs));

    await runMigration('user-1');

    expect(databaseMock.from).toHaveBeenCalledWith('ruler_logs');
    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({
        user_id: 'user-1',
        emotions: logs[0].emotions,
        intensity: 8,
        body_scan: logs[0].bodyScan,
        understanding: logs[0].understanding,
        expressing: logs[0].expressing,
        regulating: logs[0].regulating,
        physical_context: null,
        post_mood: '比較平靜',
        is_full_flow: true,
        created_at: logs[0].timestamp,
      }),
      expect.objectContaining({
        user_id: 'user-1',
        intensity: 4,
        physical_context: { sleepHours: 6, activityLevel: 2 },
        is_full_flow: false,
      }),
    ]);
    expect(upsertCoachContext).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user-1',
      migration_completed_at: expect.any(String),
    }));
  });
});
