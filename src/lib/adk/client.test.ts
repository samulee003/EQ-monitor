import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('AI 教練 client', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('未設定環境變數時呼叫正式 InsForge Functions 網址', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { response: '收到' }, error: null }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { sendMessage } = await import('./client');
    await sendMessage({ message: '你好', userId: 'user_123', sessionId: 'session_123' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://b88egxiz.functions.insforge.app/coach',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
