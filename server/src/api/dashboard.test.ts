import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dashboardRoutes } from './dashboard.js';

// ═══════════════════════════════════════════════════════════════
// Mock db
// ═══════════════════════════════════════════════════════════════

const mockDb = vi.hoisted(() => ({
  getOrCreateUser: vi.fn(),
  getWeeklyStats: vi.fn(),
  getAllSessions: vi.fn(),
}));

vi.mock('../db/index.js', () => ({ db: mockDb }));

function createMockReq(params = {}) {
  return { params } as any;
}

function createMockRes() {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  return { status, json };
}

describe('dashboard API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSummary', () => {
    it('返回正確的數據結構', async () => {
      // Arrange
      mockDb.getOrCreateUser.mockResolvedValue({
        lineUserId: 'U123',
        totalSessions: 5,
        streakDays: 3,
        lastSessionDate: '2026-05-10',
      });
      mockDb.getWeeklyStats.mockResolvedValue({
        totalSessions: 5,
        streakDays: 3,
      });

      const req = createMockReq({ lineUserId: 'U123' });
      const res = createMockRes() as any;

      // Act
      await dashboardRoutes.getSummary(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        totalSessions: 5,
        streakDays: 3,
        lastSessionDate: '2026-05-10',
      });
    });

    it('處理數據庫錯誤時返回 500', async () => {
      // Arrange
      mockDb.getOrCreateUser.mockRejectedValue(new Error('db error'));

      const req = createMockReq({ lineUserId: 'U123' });
      const res = createMockRes() as any;

      // Act
      await dashboardRoutes.getSummary(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
      });
    });
  });

  describe('getWeeklyReport', () => {
    it('返回正確的週報數據結構', async () => {
      // Arrange
      mockDb.getAllSessions.mockResolvedValue([
        {
          lineUserId: 'U123',
          status: 'completed',
          data: { emotionQuadrant: 'red' },
        },
        {
          lineUserId: 'U123',
          status: 'completed',
          data: { emotionQuadrant: 'blue' },
        },
        {
          lineUserId: 'U123',
          status: 'in_progress',
          data: { emotionQuadrant: 'yellow' },
        },
        {
          lineUserId: 'U456',
          status: 'completed',
          data: { emotionQuadrant: 'green' },
        },
      ]);

      const req = createMockReq({ lineUserId: 'U123' });
      const res = createMockRes() as any;

      // Act
      await dashboardRoutes.getWeeklyReport(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        totalSessions: 2,
        quadrantDistribution: { red: 1, yellow: 0, blue: 1, green: 0 },
      });
    });

    it('處理數據庫錯誤時返回 500', async () => {
      // Arrange
      mockDb.getAllSessions.mockRejectedValue(new Error('db error'));

      const req = createMockReq({ lineUserId: 'U123' });
      const res = createMockRes() as any;

      // Act
      await dashboardRoutes.getWeeklyReport(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
      });
    });
  });
});
