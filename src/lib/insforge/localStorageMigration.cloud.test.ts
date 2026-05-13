import { describe, expect, it, vi, beforeEach } from 'vitest';
import { insforge } from '@/lib/insforge/client';
import { runMigration } from './localStorageMigration';
import { type Quadrant } from '@/data/emotionData';
import { type RulerLogEntry } from '@/types/RulerTypes';

const mocks = vi.hoisted(() => {
  const insertMock = vi.fn().mockResolvedValue({ error: null });
  const upsertMock = vi.fn().mockResolvedValue({ error: null });
  const fromMock = vi.fn((table: string) => ({
    insert: table === 'ruler_logs' ? insertMock : vi.fn().mockResolvedValue({ error: null }),
    upsert: table === 'coach_context' ? upsertMock : vi.fn().mockResolvedValue({ error: null }),
  }));
  return { fromMock, insertMock, upsertMock };
});

vi.mock('@/lib/insforge/client', () => ({
  insforge: {
    database: {
      from: mocks.fromMock,
    },
  },
}));

const makeLog = (): RulerLogEntry => ({
  id: 'local_log_1',
  timestamp: '2026-05-13T08:00:00Z',
  emotions: [{ id: '1', name: '焦慮', quadrant: 'red' as Quadrant, energy: 8, pleasantness: 2 }],
  intensity: 8,
  bodyScan: null,
  understanding: { trigger: '工作壓力', message: '', what: '', who: '', where: '', need: '休息' },
  expressing: null,
  regulating: null,
  isFullFlow: true,
  postMood: '比較穩定',
});

describe('localStorageMigration 雲端寫入', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.insertMock.mockResolvedValue({ error: null });
    mocks.upsertMock.mockResolvedValue({ error: null });
  });

  it('runMigration 會把本機 RULER 日誌寫入 InsForge ruler_logs', async () => {
    localStorage.setItem('feelings_logs', JSON.stringify([makeLog()]));

    await runMigration('0f6a5a96-7e44-4db2-b533-ec26b5b92f12');

    expect(insforge.database.from).toHaveBeenCalledWith('ruler_logs');
    expect(mocks.insertMock).toHaveBeenCalledWith([
      expect.objectContaining({
        user_id: '0f6a5a96-7e44-4db2-b533-ec26b5b92f12',
        intensity: 8,
        is_full_flow: true,
        created_at: '2026-05-13T08:00:00Z',
      }),
    ]);
  });
});
