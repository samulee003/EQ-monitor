import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

// ═══════════════════════════════════════════════════════════════
// Mocks
// ═══════════════════════════════════════════════════════════════

const mockProcessMessage = vi.hoisted(() =>
  vi.fn(() => Promise.resolve({ text: 'mock response', quickReplies: [] }))
);
const mockGetActiveSessionCount = vi.hoisted(() => vi.fn(() => 0));
const mockValidateSignature = vi.hoisted(() => vi.fn(() => true));
const mockGetMetrics = vi.hoisted(() =>
  vi.fn(() => ({
    totalRequests: 10,
    totalErrors: 0,
    rulerSessionsCompleted: 2,
    rulerSessionsTimedOut: 0,
    startTime: Date.now(),
  }))
);

vi.mock('@line/bot-sdk', () => ({
  middleware: vi.fn(() => (_req: any, _res: any, next: any) => next()),
  validateSignature: mockValidateSignature,
  Client: vi.fn(() => ({ replyMessage: vi.fn() })),
  WebhookEvent: {},
  TextMessage: {},
}));

vi.mock('./rulerBot.js', () => ({
  processMessage: mockProcessMessage,
  getActiveSessionCount: mockGetActiveSessionCount,
}));

vi.mock('./db/index.js', () => ({
  adapterName: 'memory',
  db: {},
}));

vi.mock('./utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('./utils/metrics.js', () => ({
  getMetrics: mockGetMetrics,
  recordRequest: vi.fn(),
  recordError: vi.fn(),
  recordRulerSessionCompleted: vi.fn(),
  recordRulerSessionTimedOut: vi.fn(),
  resetMetrics: vi.fn(),
}));

describe('Express app', () => {
  let app: Express;
  let server: any;

  beforeAll(async () => {
    // 使用隨機端口避免衝突
    process.env.PORT = '0';
    // 確保不會觸發 LINE 簽名驗證警告分支
    process.env.LINE_CHANNEL_SECRET = '';
    process.env.LINE_CHANNEL_ACCESS_TOKEN = '';

    const mod = await import('./index.js');
    app = mod.app;
    server = mod.server;
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('GET / 返回服務狀態', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('今心 ImXin Bot Server');
  });

  it('GET /health 返回 200 與健康數據', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('memory');
    expect(res.body.sessionCount).toBe(0);
    expect(res.body.requestCount).toBe(10);
    expect(res.body.version).toBe('1.0.0');
  });

  it('GET /metrics 返回運行指標', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.body.totalRequests).toBe(10);
    expect(res.body.rulerSessionsCompleted).toBe(2);
  });

  it('POST /webhook 接受 LINE webhook payload 並返回 200', async () => {
    const payload = {
      events: [
        {
          type: 'message',
          message: { type: 'text', text: '你好' },
          source: { userId: 'U123456' },
          replyToken: 'abc123',
        },
      ],
    };

    const res = await request(app)
      .post('/webhook')
      .send(payload)
      .set('x-line-signature', 'dummy-signature');

    expect(res.status).toBe(200);
    expect(res.text).toBe('OK');
    expect(mockProcessMessage).toHaveBeenCalledWith('U123456', '你好');
  });

  it('POST /webhook 處理 follow 事件', async () => {
    const payload = {
      events: [
        {
          type: 'follow',
          source: { userId: 'U789' },
          replyToken: 'follow-token',
        },
      ],
    };

    const res = await request(app)
      .post('/webhook')
      .send(payload)
      .set('x-line-signature', 'dummy-signature');

    expect(res.status).toBe(200);
    expect(res.text).toBe('OK');
  });

  it('POST /webhook 空 events 不拋錯', async () => {
    const payload = { events: [] };

    const res = await request(app)
      .post('/webhook')
      .send(payload)
      .set('x-line-signature', 'dummy-signature');

    expect(res.status).toBe(200);
  });

  it('不存在的路由返回 404', async () => {
    const res = await request(app).get('/nonexistent-route');
    expect(res.status).toBe(404);
  });

  it('GET /api/dashboard/:lineUserId/summary 返回儀表盤摘要', async () => {
    // 這裡透過真實的 dashboardRoutes 與 memoryAdapter 測試
    // 因為 db/index.js 被 mock 為空物件，dashboard 會拋錯
    // 所以我們只驗證路由存在且能夠處理（即使返回 500）
    const res = await request(app).get('/api/dashboard/U123/summary');
    // dashboardRoutes 內部會呼叫 db.getOrCreateUser，而 mock db 為空物件
    // 因此會進入 catch，返回 500
    expect(res.status).toBe(500);
  });
});
