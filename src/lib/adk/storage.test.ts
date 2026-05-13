import { beforeEach, describe, expect, it } from 'vitest';
import { clearChatHistory, loadChatHistory, saveChatHistory } from './storage';
import { type CoachMessage } from './types';

const message = (content: string): CoachMessage => ({
  id: crypto.randomUUID(),
  role: 'user',
  content,
  timestamp: new Date().toISOString(),
});

describe('AI 教練聊天紀錄儲存', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('依使用者隔離聊天紀錄', () => {
    saveChatHistory([message('甲的訊息')], 'user-a');
    saveChatHistory([message('乙的訊息')], 'user-b');

    expect(loadChatHistory('user-a')?.[0].content).toBe('甲的訊息');
    expect(loadChatHistory('user-b')?.[0].content).toBe('乙的訊息');
  });

  it('清除指定使用者時不影響其他人', () => {
    saveChatHistory([message('甲的訊息')], 'user-a');
    saveChatHistory([message('乙的訊息')], 'user-b');

    clearChatHistory('user-a');

    expect(loadChatHistory('user-a')).toBeNull();
    expect(loadChatHistory('user-b')?.[0].content).toBe('乙的訊息');
  });
});
