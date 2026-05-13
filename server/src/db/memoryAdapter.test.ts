import { describe, it, expect, beforeEach } from 'vitest';
import { memoryAdapter } from './memoryAdapter.js';

describe('memoryAdapter', () => {
  beforeEach(() => {
    memoryAdapter.resetStore();
  });

  describe('getOrCreateUser', () => {
    it('創建新用戶', async () => {
      const user = await memoryAdapter.getOrCreateUser('user-1', 'Alice');
      expect(user.lineUserId).toBe('user-1');
      expect(user.displayName).toBe('Alice');
      expect(user.totalSessions).toBe(0);
      expect(user.streakDays).toBe(0);
    });

    it('已存在用戶則返回現有用戶', async () => {
      await memoryAdapter.getOrCreateUser('user-1', 'Alice');
      const user2 = await memoryAdapter.getOrCreateUser('user-1', 'Bob');
      expect(user2.displayName).toBe('Alice');
    });

    it('無 displayName 也可創建', async () => {
      const user = await memoryAdapter.getOrCreateUser('user-2');
      expect(user.lineUserId).toBe('user-2');
      expect(user.displayName).toBeUndefined();
    });
  });

  describe('createSession', () => {
    it('創建會話並返回 id', async () => {
      const session = await memoryAdapter.createSession('user-1');
      expect(session.id).toBeDefined();
      expect(session.lineUserId).toBe('user-1');
      expect(session.status).toBe('in_progress');
      expect(session.data).toEqual({});
    });

    it('可帶初始數據創建', async () => {
      const session = await memoryAdapter.createSession('user-1', { bodyPart: '胸口' });
      expect(session.data.bodyPart).toBe('胸口');
    });
  });

  describe('updateSession', () => {
    it('更新會話數據', async () => {
      const session = await memoryAdapter.createSession('user-1');
      await memoryAdapter.updateSession(session.id, { data: { emotionName: '焦慮' } });
      const all = await memoryAdapter.getAllSessions();
      expect(all[0].data.emotionName).toBe('焦慮');
    });

    it('更新會話狀態', async () => {
      const session = await memoryAdapter.createSession('user-1');
      await memoryAdapter.updateSession(session.id, { status: 'abandoned' });
      const all = await memoryAdapter.getAllSessions();
      expect(all[0].status).toBe('abandoned');
    });

    it('不存在的會話不拋錯', async () => {
      await expect(memoryAdapter.updateSession('non-existent', { status: 'abandoned' })).resolves.toBeUndefined();
    });
  });

  describe('completeSession', () => {
    it('標記會話為完成並更新統計', async () => {
      await memoryAdapter.getOrCreateUser('user-1');
      const session = await memoryAdapter.createSession('user-1');
      await memoryAdapter.completeSession(session.id, { emotionName: '焦慮', bodyPart: '胸口' });

      const all = await memoryAdapter.getAllSessions();
      expect(all[0].status).toBe('completed');
      expect(all[0].completedAt).toBeDefined();
      expect(all[0].data.emotionName).toBe('焦慮');

      const stats = await memoryAdapter.getWeeklyStats('user-1');
      expect(stats.totalSessions).toBe(1);
      expect(stats.streakDays).toBe(1);
    });

    it('連續多天記錄增加 streak', async () => {
      await memoryAdapter.getOrCreateUser('user-1');
      const s1 = await memoryAdapter.createSession('user-1');
      await memoryAdapter.completeSession(s1.id, {});

      // 模擬昨天
      const user = (await memoryAdapter.getAllUsers()).find((u) => u.lineUserId === 'user-1')!;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      user.lastSessionDate = yesterday.toISOString().split('T')[0];

      const s2 = await memoryAdapter.createSession('user-1');
      await memoryAdapter.completeSession(s2.id, {});

      const stats = await memoryAdapter.getWeeklyStats('user-1');
      expect(stats.streakDays).toBe(2);
    });

    it('間隔多天記錄重置 streak', async () => {
      await memoryAdapter.getOrCreateUser('user-1');
      const s1 = await memoryAdapter.createSession('user-1');
      await memoryAdapter.completeSession(s1.id, {});

      // 模擬三天前
      const user = (await memoryAdapter.getAllUsers()).find((u) => u.lineUserId === 'user-1')!;
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      user.lastSessionDate = threeDaysAgo.toISOString().split('T')[0];
      user.streakDays = 5;

      const s2 = await memoryAdapter.createSession('user-1');
      await memoryAdapter.completeSession(s2.id, {});

      const stats = await memoryAdapter.getWeeklyStats('user-1');
      expect(stats.streakDays).toBe(1);
    });

    it('同一天多次完成不增加 streak', async () => {
      await memoryAdapter.getOrCreateUser('user-1');
      const s1 = await memoryAdapter.createSession('user-1');
      await memoryAdapter.completeSession(s1.id, {});
      const s2 = await memoryAdapter.createSession('user-1');
      await memoryAdapter.completeSession(s2.id, {});

      const stats = await memoryAdapter.getWeeklyStats('user-1');
      expect(stats.streakDays).toBe(1);
    });

    it('LINE 已綁定時同步完整練習到 agent 日誌', async () => {
      await memoryAdapter.getOrCreateUser('U123');
      const code = await memoryAdapter.createLineBindingCode('U123');
      await memoryAdapter.claimLineBindingCode(code.code, 'user_local_001');

      const session = await memoryAdapter.createSession('U123');
      await memoryAdapter.completeSession(session.id, {
        bodyPart: '胸口',
        emotionName: '焦慮',
        emotionQuadrant: 'red',
        emotionIntensity: 8,
        need: '安全感',
        regulationTechnique: 'breathing',
        postMood: '平靜一些',
      });

      const logs = await memoryAdapter.getAgentLogs('user_local_001');
      expect(logs).toHaveLength(1);
      expect(logs[0].lineUserId).toBe('U123');
      expect(logs[0].emotions[0]).toEqual({ name: '焦慮', quadrant: 'red' });
      expect(logs[0].isFullFlow).toBe(true);
    });
  });

  describe('LINE 綁定碼', () => {
    it('建立並認領綁定碼', async () => {
      const code = await memoryAdapter.createLineBindingCode('U123');
      expect(code.code).toHaveLength(6);
      expect(code.code).toMatch(/^[A-HJ-NP-Z]{6}$/);

      const claimed = await memoryAdapter.claimLineBindingCode(code.code, 'user_local_001');

      expect(claimed?.lineUserId).toBe('U123');
      expect(claimed?.appUserId).toBe('user_local_001');
    });

    it('不可認領不存在的綁定碼', async () => {
      await expect(memoryAdapter.claimLineBindingCode('NOPE00', 'user_local_001')).resolves.toBeNull();
    });

    it('建立的綁定碼不包含容易混淆的字元', async () => {
      for (let i = 0; i < 50; i++) {
        const code = await memoryAdapter.createLineBindingCode(`U${i}`);
        expect(code.code).not.toMatch(/[IO01]/);
      }
    });
  });

  describe('saveMessage', () => {
    it('保存用戶輸入消息', async () => {
      await memoryAdapter.saveMessage('user-1', 'in', '你好', 'idle');
      const history = await memoryAdapter.getUserHistory('user-1');
      expect(history).toHaveLength(1);
      expect(history[0].content).toBe('你好');
      expect(history[0].direction).toBe('in');
    });

    it('保存 bot 輸出消息', async () => {
      await memoryAdapter.saveMessage('user-1', 'out', '回复内容', 'recognize');
      const history = await memoryAdapter.getUserHistory('user-1');
      expect(history[0].direction).toBe('out');
      expect(history[0].content).toBe('回复内容');
    });

    it('getUserHistory 限制返回數量', async () => {
      for (let i = 0; i < 15; i++) {
        await memoryAdapter.saveMessage('user-1', 'in', `msg-${i}`);
      }
      const history = await memoryAdapter.getUserHistory('user-1', 5);
      expect(history).toHaveLength(5);
    });

    it('不同用戶歷史隔離', async () => {
      await memoryAdapter.saveMessage('user-1', 'in', 'A');
      await memoryAdapter.saveMessage('user-2', 'in', 'B');
      const h1 = await memoryAdapter.getUserHistory('user-1');
      const h2 = await memoryAdapter.getUserHistory('user-2');
      expect(h1[0].content).toBe('A');
      expect(h2[0].content).toBe('B');
    });

    it('空歷史返回空數組', async () => {
      const history = await memoryAdapter.getUserHistory('non-existent');
      expect(history).toEqual([]);
    });
  });

  describe('getWeeklyStats', () => {
    it('不存在的用戶返回 0', async () => {
      const stats = await memoryAdapter.getWeeklyStats('no-user');
      expect(stats.totalSessions).toBe(0);
      expect(stats.streakDays).toBe(0);
    });

    it('統計多個完成會話', async () => {
      await memoryAdapter.getOrCreateUser('user-1');
      for (let i = 0; i < 3; i++) {
        const s = await memoryAdapter.createSession('user-1');
        await memoryAdapter.completeSession(s.id, {});
      }
      const stats = await memoryAdapter.getWeeklyStats('user-1');
      expect(stats.totalSessions).toBe(3);
    });
  });

  describe('getAllUsers / getAllSessions', () => {
    it('返回所有用戶', async () => {
      await memoryAdapter.getOrCreateUser('u1');
      await memoryAdapter.getOrCreateUser('u2');
      expect(await memoryAdapter.getAllUsers()).toHaveLength(2);
    });

    it('返回所有會話', async () => {
      await memoryAdapter.createSession('u1');
      await memoryAdapter.createSession('u2');
      expect(await memoryAdapter.getAllSessions()).toHaveLength(2);
    });
  });

  describe('resetStore', () => {
    it('清空所有數據', async () => {
      await memoryAdapter.getOrCreateUser('u1');
      await memoryAdapter.createSession('u1');
      await memoryAdapter.saveMessage('u1', 'in', 'test');
      memoryAdapter.resetStore();
      expect(await memoryAdapter.getAllUsers()).toHaveLength(0);
      expect(await memoryAdapter.getAllSessions()).toHaveLength(0);
      expect(await memoryAdapter.getUserHistory('u1')).toHaveLength(0);
    });
  });
});
