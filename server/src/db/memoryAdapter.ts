import { RulerData } from '../types.js';

/**
 * 內存數據庫適配器 — 開發/演示用
 * 接口與 Supabase 適配器一致，便於未來切換
 */

export interface DbSession {
  id: string;
  lineUserId: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  startedAt: number;
  completedAt?: number;
  data: RulerData;
}

export interface DbUser {
  lineUserId: string;
  displayName?: string;
  totalSessions: number;
  streakDays: number;
  lastSessionDate?: string;
  createdAt: number;
}

const users = new Map<string, DbUser>();
const sessions = new Map<string, DbSession>();
const messages: Array<{
  id: string;
  lineUserId: string;
  direction: 'in' | 'out';
  content: string;
  step?: string;
  createdAt: number;
}> = [];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const memoryAdapter = {
  async getOrCreateUser(lineUserId: string, displayName?: string): Promise<DbUser> {
    let user = users.get(lineUserId);
    if (!user) {
      user = {
        lineUserId,
        displayName,
        totalSessions: 0,
        streakDays: 0,
        createdAt: Date.now(),
      };
      users.set(lineUserId, user);
    }
    return user;
  },

  async createSession(lineUserId: string, data?: RulerData): Promise<DbSession> {
    const session: DbSession = {
      id: generateId(),
      lineUserId,
      status: 'in_progress',
      startedAt: Date.now(),
      data: data || {},
    };
    sessions.set(session.id, session);
    return session;
  },

  async updateSession(sessionId: string, updates: Partial<DbSession>): Promise<void> {
    const session = sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates);
    }
  },

  async completeSession(sessionId: string, data: RulerData): Promise<void> {
    const session = sessions.get(sessionId);
    if (session) {
      session.status = 'completed';
      session.completedAt = Date.now();
      session.data = { ...session.data, ...data };

      // 更新用戶統計
      const user = users.get(session.lineUserId);
      if (user) {
        user.totalSessions++;
        const today = new Date().toISOString().split('T')[0];
        if (user.lastSessionDate && user.lastSessionDate !== today) {
          const lastDate = new Date(user.lastSessionDate);
          const diffDays = Math.floor((Date.now() - lastDate.getTime()) / 86400000);
          if (diffDays === 1) {
            user.streakDays++;
          } else {
            user.streakDays = 1;
          }
        } else if (!user.lastSessionDate) {
          user.streakDays = 1;
        }
        user.lastSessionDate = today;
      }
    }
  },

  async saveMessage(
    lineUserId: string,
    direction: 'in' | 'out',
    content: string,
    step?: string
  ): Promise<void> {
    messages.push({
      id: generateId(),
      lineUserId,
      direction,
      content,
      step,
      createdAt: Date.now(),
    });
  },

  async getUserHistory(lineUserId: string, limit = 10): Promise<Array<{ direction: 'in' | 'out'; content: string; createdAt: number }>> {
    return messages
      .filter((m) => m.lineUserId === lineUserId)
      .slice(-limit)
      .map((m) => ({ direction: m.direction, content: m.content, createdAt: m.createdAt }));
  },

  async getWeeklyStats(lineUserId: string): Promise<{ totalSessions: number; streakDays: number }> {
    const user = users.get(lineUserId);
    return {
      totalSessions: user?.totalSessions || 0,
      streakDays: user?.streakDays || 0,
    };
  },

  // 調試用
  async getAllUsers(): Promise<DbUser[]> {
    return Array.from(users.values());
  },

  async getAllSessions(): Promise<DbSession[]> {
    return Array.from(sessions.values());
  },

  // 測試用
  resetStore(): void {
    users.clear();
    sessions.clear();
    messages.length = 0;
  },
};
