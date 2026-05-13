import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';

const mockRunCoach = vi.hoisted(() =>
  vi.fn(() => Promise.resolve({ text: '教練回應內容', sessionId: 'sess-abc' }))
);

vi.mock('../agents/runner.js', () => ({
  runCoach: mockRunCoach,
}));

import coachRouter from './coach.js';

let app: ReturnType<typeof express>;

beforeAll(() => {
  app = express();
  app.use(express.json());
  app.use('/api/coach', coachRouter);
});

describe('POST /api/coach', () => {
  it('缺少必填欄位時回傳 400', async () => {
    const res = await request(app)
      .post('/api/coach')
      .send({ message: '你好' });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ data: null, error: expect.any(String) });
    expect(mockRunCoach).not.toHaveBeenCalled();
  });

  it('缺少 userId 時回傳 400', async () => {
    const res = await request(app)
      .post('/api/coach')
      .send({ message: '你好', sessionId: 'sess-1' });

    expect(res.status).toBe(400);
  });

  it('缺少 sessionId 時回傳 400', async () => {
    const res = await request(app)
      .post('/api/coach')
      .send({ message: '你好', userId: 'user-1' });

    expect(res.status).toBe(400);
  });

  it('完整請求時呼叫 runCoach 並回傳結果', async () => {
    const res = await request(app)
      .post('/api/coach')
      .send({ message: '我今天很焦慮', userId: 'user-1', sessionId: 'sess-1' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ data: { text: '教練回應內容' }, error: null });
    expect(mockRunCoach).toHaveBeenCalledWith('我今天很焦慮', 'user-1', 'sess-1');
  });

  it('runCoach 拋出例外時回傳 500', async () => {
    mockRunCoach.mockRejectedValueOnce(new Error('ADK 連線失敗'));

    const res = await request(app)
      .post('/api/coach')
      .send({ message: '你好', userId: 'user-1', sessionId: 'sess-1' });

    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({ data: null, error: 'ADK 連線失敗' });
  });
});
