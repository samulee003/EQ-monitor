import { describe, it, expect, vi, beforeEach } from 'vitest';

// ═══════════════════════════════════════════════════════════════
// Mock pg Pool
// ═══════════════════════════════════════════════════════════════

const mockQuery = vi.hoisted(() => vi.fn());

vi.mock('pg', () => {
  const Pool = vi.fn().mockImplementation(function (this: Record<string, unknown>) {
    this.query = mockQuery;
    this.on = vi.fn();
  });
  return { default: { Pool } };
});

import { createInsforgeAdapter } from './insforgeAdapter.js';

const adapter = createInsforgeAdapter('postgresql://test:test@localhost/test');

describe('createInsforgeAdapter', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  // ─────────────────────── getOrCreateUser ───────────────────────

  describe('getOrCreateUser', () => {
    it('既有使用者直接回傳', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ line_user_id: 'U123', display_name: '王小明', total_sessions: 5, streak_days: 3, last_session_date: null, created_at: '2026-01-01' }],
      });

      const user = await adapter.getOrCreateUser('U123');

      expect(user.lineUserId).toBe('U123');
      expect(user.displayName).toBe('王小明');
      expect(user.totalSessions).toBe(5);
    });

    it('不存在時建立新使用者', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ line_user_id: 'U999', display_name: null, total_sessions: 0, streak_days: 0, last_session_date: null, created_at: '2026-05-12' }],
        });

      const user = await adapter.getOrCreateUser('U999', '新使用者');

      expect(user.lineUserId).toBe('U999');
      expect(user.totalSessions).toBe(0);
    });

    it('資料庫錯誤時回傳降級物件', async () => {
      mockQuery.mockRejectedValueOnce(new Error('connection failed'));

      const user = await adapter.getOrCreateUser('U_ERR');

      expect(user.lineUserId).toBe('U_ERR');
      expect(user.totalSessions).toBe(0);
    });
  });

  // ─────────────────────── completeSession 連續天數邏輯 ───────────────────────

  describe('completeSession — streak 計算', () => {
    const sessionId = 'sess-001';
    const lineUserId = 'U_STREAK';
    const rulerData = { emotionName: '平靜', emotionIntensity: 5 };

    function stubSession(lastSessionDate: string | null, streakDays: number) {
      // 1st query: SELECT session
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: sessionId, line_user_id: lineUserId, started_at: new Date().toISOString() }],
      });
      // 2nd query: UPDATE session
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // 3rd query: SELECT user streak
      mockQuery.mockResolvedValueOnce({
        rows: [{ total_sessions: 2, streak_days: streakDays, last_session_date: lastSessionDate }],
      });
      // 4th query: UPDATE user
      mockQuery.mockResolvedValueOnce({ rows: [] });
    }

    it('首次完成時 streak = 1', async () => {
      stubSession(null, 0);
      await adapter.completeSession(sessionId, rulerData);

      const updateCall = mockQuery.mock.calls[3];
      const [streakDaysArg] = [updateCall[1][1]];
      expect(streakDaysArg).toBe(1);
    });

    it('昨天有記錄時 streak 遞增', async () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      stubSession(yesterday, 3);
      await adapter.completeSession(sessionId, rulerData);

      const updateCall = mockQuery.mock.calls[3];
      const streakDaysArg = updateCall[1][1];
      expect(streakDaysArg).toBe(4);
    });

    it('超過一天未記錄時 streak 重置為 1', async () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];
      stubSession(threeDaysAgo, 7);
      await adapter.completeSession(sessionId, rulerData);

      const updateCall = mockQuery.mock.calls[3];
      const streakDaysArg = updateCall[1][1];
      expect(streakDaysArg).toBe(1);
    });

    it('同一天再次完成時 streak 不變', async () => {
      const today = new Date().toISOString().split('T')[0];
      stubSession(today, 5);
      await adapter.completeSession(sessionId, rulerData);

      const updateCall = mockQuery.mock.calls[3];
      const streakDaysArg = updateCall[1][1];
      expect(streakDaysArg).toBe(5);
    });

    it('session 不存在時靜默結束，不更新使用者', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await adapter.completeSession('nonexistent', rulerData);

      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });

  // ─────────────────────── getWeeklyStats ───────────────────────

  describe('getWeeklyStats', () => {
    it('回傳使用者統計資料', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ total_sessions: 10, streak_days: 4 }],
      });

      const stats = await adapter.getWeeklyStats('U123');

      expect(stats).toEqual({ totalSessions: 10, streakDays: 4 });
    });

    it('資料庫錯誤時回傳零值', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB down'));

      const stats = await adapter.getWeeklyStats('U_ERR');

      expect(stats).toEqual({ totalSessions: 0, streakDays: 0 });
    });
  });
});
