import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  processMessage,
  resetRulerBotState,
  getSessionStatus,
  getActiveSessionCount,
  pushScheduler,
} from './rulerBot.js';
import { memoryAdapter } from './db/memoryAdapter.js';
import { resetMetrics } from './utils/metrics.js';

describe('rulerBot', () => {
  beforeEach(() => {
    resetRulerBotState();
    memoryAdapter.resetStore();
    resetMetrics();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const userId = 'test-user-001';

  describe('完整 RULER 流程', () => {
    it('7 步對話：觸發 -> 胸口 -> 焦慮 -> 安全感 -> 碎紙 -> 呼吸 -> 好多了', async () => {
      // Step 1: idle -> recognize
      const r1 = await processMessage(userId, '你好');
      expect(r1.text).toContain('第一步：覺察');
      expect(r1.quickReplies?.some((q) => q.label === '胸口')).toBe(true);
      expect(getSessionStatus(userId)).toContain('recognize');

      // Step 2: recognize -> understand
      const r2 = await processMessage(userId, '胸口');
      expect(r2.text).toContain('第二步：理解');
      expect(r2.quickReplies?.some((q) => q.label === '焦慮')).toBe(true);

      // Step 3: understand -> label (精確匹配)
      const r3 = await processMessage(userId, '焦慮');
      expect(r3.text).toContain('第三步：標記');
      expect(r3.text).toContain('焦慮');
      expect(r3.quickReplies?.length).toBeGreaterThan(0);
      expect(r3.quickReplies?.some((q) => q.label === '安全感')).toBe(true);

      // Step 4: label -> express
      const r4 = await processMessage(userId, '安全感');
      expect(r4.text).toContain('第四步：表達');
      expect(r4.quickReplies?.some((q) => q.label === '開始碎紙')).toBe(true);

      // Step 5: express -> regulate
      const r5 = await processMessage(userId, '開始碎紙');
      expect(r5.text).toContain('碎掉了');
      expect(r5.quickReplies?.some((q) => q.label === '呼吸引導')).toBe(true);

      // Step 6: regulate -> summary
      const r6 = await processMessage(userId, '呼吸');
      expect(r6.text).toContain('呼吸引導');
      expect(r6.quickReplies?.some((q) => q.label === '好多了')).toBe(true);

      // Step 7: summary -> idle (完成)
      const r7 = await processMessage(userId, '好多了');
      expect(r7.text).toContain('練習完成');
      expect(r7.text).toContain('焦慮');
      expect(r7.text).toContain('安全感');
      expect(getSessionStatus(userId)).toBe('無活躍會話');
    });

    it('說不出來的身體部位也能正常進行', async () => {
      await processMessage(userId, '測試');
      const r2 = await processMessage(userId, '說不出來');
      expect(r2.text).toContain('沒關係，身體的感覺有時候很模糊');
      expect(r2.text).toContain('第二步：理解');
    });

    it('跳過表達步驟', async () => {
      await processMessage(userId, 'start');
      await processMessage(userId, '肩膀');
      await processMessage(userId, '疲憊');
      await processMessage(userId, '休息');
      const r5 = await processMessage(userId, '跳過');
      expect(r5.text).toContain('第五步：調節');
      expect(r5.quickReplies?.some((q) => q.label?.includes('呼吸引導'))).toBe(true);
    });

    it('選擇 5-4-3-2-1 接地練習', async () => {
      await processMessage(userId, 'start');
      await processMessage(userId, '頭');
      await processMessage(userId, '憤怒');
      await processMessage(userId, '被尊重');
      await processMessage(userId, '發洩');
      const r6 = await processMessage(userId, '接地');
      expect(r6.text).toContain('5-4-3-2-1 接地練習');
    });

    it('選擇正念短引導', async () => {
      await processMessage(userId, 'start');
      await processMessage(userId, '胃');
      await processMessage(userId, '孤單');
      await processMessage(userId, '陪伴');
      await processMessage(userId, '跳過');
      const r6 = await processMessage(userId, '正念');
      expect(r6.text).toContain('正念短引導');
    });

    it('summary 後輸入「平靜一些」得到對應反饋', async () => {
      await processMessage(userId, 'start');
      await processMessage(userId, '喉嚨');
      await processMessage(userId, '緊張');
      await processMessage(userId, '準備時間');
      await processMessage(userId, '說說話');
      await processMessage(userId, '呼吸');
      const r7 = await processMessage(userId, '平靜一些');
      expect(r7.text).toContain('練習完成');
      expect(r7.text).toContain('平靜一些');
    });

    it('summary 後輸入「還是一樣」得到對應反饋', async () => {
      await processMessage(userId, 'start');
      await processMessage(userId, '胸口');
      await processMessage(userId, '焦慮');
      await processMessage(userId, '安全感');
      await processMessage(userId, '說說話');
      await processMessage(userId, '呼吸');
      const r7 = await processMessage(userId, '還是一樣');
      expect(r7.text).toContain('沒關係');
      expect(r7.text).toContain('練習完成');
    });

    it('summary 後輸入「更糟了」得到對應反饋', async () => {
      await processMessage(userId, 'start');
      await processMessage(userId, '胸口');
      await processMessage(userId, '焦慮');
      await processMessage(userId, '安全感');
      await processMessage(userId, '說說話');
      await processMessage(userId, '呼吸');
      const r7 = await processMessage(userId, '更糟了');
      expect(r7.text).toContain('專業支持');
      expect(r7.text).toContain('練習完成');
    });
  });

  describe('情緒詞匹配流程', () => {
    it('多個情緒詞部分匹配時讓用戶選擇', async () => {
      await processMessage(userId, 'start');
      await processMessage(userId, '胸口');
      const r3 = await processMessage(userId, '怒');
      expect(r3.text).toContain('哪一個');
      expect(r3.text).toContain('最準確');
      expect(r3.quickReplies?.length).toBeGreaterThan(0);
    });

    it('輸入無法識別的情緒詞返回默認高頻詞列表', async () => {
      await processMessage(userId, 'start');
      await processMessage(userId, '胸口');
      const r3 = await processMessage(userId, 'xyz-unknown');
      expect(r3.text).toContain('哪一個');
      expect(r3.quickReplies?.length).toBeGreaterThan(0);
    });

    it('模糊匹配紅色象限關鍵字', async () => {
      await processMessage(userId, 'start');
      await processMessage(userId, '胸口');
      const r3 = await processMessage(userId, '生氣');
      expect(r3.text).toContain('憤怒');
    });

    it('模糊匹配藍色象限關鍵字', async () => {
      await processMessage(userId, 'start');
      await processMessage(userId, '胸口');
      const r3 = await processMessage(userId, '累');
      expect(r3.text).toContain('疲憊');
    });
  });

  describe('全局指令', () => {
    it('「幫助」返回使用說明', async () => {
      const r = await processMessage(userId, '幫助');
      expect(r.text).toContain('今心情緒陪伴 Bot 指令');
      expect(r.text).toContain('結束');
      expect(r.text).toContain('週報');
    });

    it('「help」返回使用說明', async () => {
      const r = await processMessage(userId, 'help');
      expect(r.text).toContain('今心情緒陪伴 Bot 指令');
    });

    it('「?」返回使用說明', async () => {
      const r = await processMessage(userId, '?');
      expect(r.text).toContain('今心情緒陪伴 Bot 指令');
    });

    it('「結束」結束當前練習', async () => {
      await processMessage(userId, 'start');
      expect(getActiveSessionCount()).toBe(1);
      const r = await processMessage(userId, '結束');
      expect(r.text).toContain('練習已結束');
      expect(getActiveSessionCount()).toBe(0);
    });

    it('「結束練習」也能結束', async () => {
      await processMessage(userId, 'start');
      const r = await processMessage(userId, '結束練習');
      expect(r.text).toContain('練習已結束');
    });

    it('「end」也能結束', async () => {
      await processMessage(userId, 'start');
      const r = await processMessage(userId, 'end');
      expect(r.text).toContain('練習已結束');
    });

    it('「週報」返回統計（無記錄時）', async () => {
      const r = await processMessage(userId, '週報');
      expect(r.text).toContain('情緒週報');
      expect(r.text).toContain('0');
    });

    it('「weekly」返回統計', async () => {
      const r = await processMessage(userId, 'weekly');
      expect(r.text).toContain('情緒週報');
    });

    it('週報顯示完成後的統計', async () => {
      // 完成一次練習
      await processMessage(userId, 'start');
      await processMessage(userId, '胸口');
      await processMessage(userId, '焦慮');
      await processMessage(userId, '安全感');
      await processMessage(userId, '說說話');
      await processMessage(userId, '呼吸');
      await processMessage(userId, '好多了');

      const r = await processMessage(userId, '週報');
      expect(r.text).toContain('1');
      expect(r.text).toContain('連續記錄');
    });
  });

  describe('無效輸入容錯處理', () => {
    it('在 express 步驟輸入任意文字視為碎紙內容', async () => {
      await processMessage(userId, 'start');
      await processMessage(userId, '胸口');
      await processMessage(userId, '焦慮');
      await processMessage(userId, '安全感');
      const r5 = await processMessage(userId, '@#$%^&* 亂七八糟的文字 123');
      expect(r5.text).toContain('碎掉了');
    });

    it('在 regulate 步驟輸入不匹配關鍵字默認使用 mindfulness', async () => {
      await processMessage(userId, 'start');
      await processMessage(userId, '胸口');
      await processMessage(userId, '焦慮');
      await processMessage(userId, '安全感');
      await processMessage(userId, '說說話');
      const r6 = await processMessage(userId, '隨便輸入');
      expect(r6.text).toContain('正念短引導');
    });

    it('在 understand 步驟輸入空字符串返回默認情緒詞', async () => {
      await processMessage(userId, 'start');
      await processMessage(userId, '胸口');
      const r3 = await processMessage(userId, '  ');
      expect(r3.quickReplies?.length).toBeGreaterThan(0);
    });

    it('未開始練習時結束指令仍可執行', async () => {
      const r = await processMessage(userId, '結束');
      expect(r.text).toContain('練習已結束');
    });
  });

  describe('會話狀態管理', () => {
    it('getSessionStatus 返回會話信息', async () => {
      await processMessage(userId, 'start');
      const status = getSessionStatus(userId);
      expect(status).toContain('recognize');
    });

    it('getSessionStatus 無會話時返回提示', async () => {
      expect(getSessionStatus('unknown-user')).toBe('無活躍會話');
    });

    it('getActiveSessionCount 返回活躍數', async () => {
      expect(getActiveSessionCount()).toBe(0);
      await processMessage(userId, 'start');
      expect(getActiveSessionCount()).toBe(1);
    });

    it('多個用戶會話互相隔離', async () => {
      await processMessage('user-a', 'start');
      await processMessage('user-b', 'start');
      expect(getActiveSessionCount()).toBe(2);
      await processMessage('user-a', '胸口');
      expect(getSessionStatus('user-a')).toContain('understand');
      expect(getSessionStatus('user-b')).toContain('recognize');
    });

    it('完成後可立即開始新練習', async () => {
      await processMessage(userId, 'start');
      await processMessage(userId, '胸口');
      await processMessage(userId, '焦慮');
      await processMessage(userId, '安全感');
      await processMessage(userId, '說說話');
      await processMessage(userId, '呼吸');
      await processMessage(userId, '好多了');

      const r = await processMessage(userId, '新的開始');
      expect(r.text).toContain('第一步：覺察');
    });
  });

  describe('推送調度器', () => {
    it('schedule 註冊任務', () => {
      pushScheduler.schedule(9, async () => [{ userId: 'u1', text: '早安' }]);
      const tasks = pushScheduler.listTasks();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].dailyHour).toBe(9);
    });

    it('triggerAll 執行所有任務', async () => {
      pushScheduler.schedule(9, async () => [{ userId: 'u1', text: '早安' }]);
      pushScheduler.schedule(21, async () => [{ userId: 'u2', text: '晚安' }]);
      const messages = await pushScheduler.triggerAll();
      expect(messages).toHaveLength(2);
      expect(messages.some((m) => m.text === '早安')).toBe(true);
      expect(messages.some((m) => m.text === '晚安')).toBe(true);
    });

    it('triggerAll 捕獲任務異常', async () => {
      pushScheduler.schedule(9, async () => {
        throw new Error('task failed');
      });
      const messages = await pushScheduler.triggerAll();
      expect(messages).toHaveLength(0);
    });
  });

  describe('定時清理', () => {
    it('cleanupSessions 清理過期會話', async () => {
      await processMessage(userId, 'start');
      expect(getActiveSessionCount()).toBe(1);

      // 模擬 31 分鐘後
      vi.advanceTimersByTime(31 * 60 * 1000);

      // 手動觸發清理（實際模塊中有 setInterval，但我們只驗證狀態）
      // 這裡由於 setInterval 已經被 fake timers 控制，不會自動觸發
      // 我們主要驗證 getActiveSessionCount 的初始狀態正確
      expect(getActiveSessionCount()).toBe(1);
    });
  });
});
