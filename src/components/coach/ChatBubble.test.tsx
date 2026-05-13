import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatBubble } from './ChatBubble';

describe('ChatBubble', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-10T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('應該正確渲染使用者訊息', () => {
    render(
      <ChatBubble
        message={{
          id: '1',
          role: 'user',
          content: '你好',
          timestamp: new Date().toISOString(),
        }}
      />
    );
    expect(screen.getByText('你好')).toBeInTheDocument();
  });

  it('應該正確渲染模型訊息', () => {
    render(
      <ChatBubble
        message={{
          id: '1',
          role: 'model',
          content: '我是今心教練',
          timestamp: new Date().toISOString(),
        }}
      />
    );
    expect(screen.getByText('我是今心教練')).toBeInTheDocument();
  });

  it('應該顯示時間戳為「剛剛」', () => {
    render(
      <ChatBubble
        message={{
          id: '1',
          role: 'model',
          content: '測試',
          timestamp: new Date().toISOString(),
        }}
      />
    );
    expect(screen.getByText('剛剛')).toBeInTheDocument();
  });

  it('不應該把內部技能與工具名稱顯示給使用者', () => {
    render(
      <ChatBubble
        message={{
          id: '1',
          role: 'model',
          content: '已為您執行 `save_ruler_log`，我會陪你把這段感受整理下來。',
          timestamp: new Date().toISOString(),
          metadata: { skillInvoked: 'MetaMoment' },
        }}
      />
    );
    expect(screen.queryByText(/MetaMoment/)).not.toBeInTheDocument();
    expect(screen.queryByText(/save_ruler_log/)).not.toBeInTheDocument();
    expect(screen.getByText(/我會陪你把這段感受整理下來/)).toBeInTheDocument();
  });
});
