import { Request, Response } from 'express';
import { db } from '../db/index.js';

/**
 * 儀表盤 API — 供 PWA 調用
 */

export const dashboardRoutes = {
  async getSummary(req: Request, res: Response): Promise<void> {
    const { lineUserId } = req.params;
    try {
      const user = await db.getOrCreateUser(String(lineUserId));
      const stats = await db.getWeeklyStats(String(lineUserId));
      res.json({
        totalSessions: stats.totalSessions,
        streakDays: stats.streakDays,
        lastSessionDate: user.lastSessionDate,
      });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getWeeklyReport(req: Request, res: Response): Promise<void> {
    const { lineUserId } = req.params;
    try {
      const allSessions = await db.getAllSessions();
      const sessions = allSessions.filter(
        (s: { lineUserId: string; status: string; data: { emotionQuadrant?: string } }) =>
          s.lineUserId === lineUserId && s.status === 'completed'
      );
      const quadrantCounts = { red: 0, yellow: 0, blue: 0, green: 0 };
      for (const s of sessions) {
        const q = s.data.emotionQuadrant;
        if (q && q in quadrantCounts) {
          (quadrantCounts as Record<string, number>)[q]++;
        }
      }
      res.json({ totalSessions: sessions.length, quadrantDistribution: quadrantCounts });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
