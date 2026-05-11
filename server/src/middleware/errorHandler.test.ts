import { describe, it, expect, afterEach, vi } from 'vitest';
import { errorHandler, createApiError } from './errorHandler.js';

function createMockRes() {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  return { status, json };
}

function createMockReq() {
  return {};
}

function createMockNext() {
  return vi.fn();
}

describe('errorHandler', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    vi.restoreAllMocks();
  });

  it('生產環境返回 500 與通用錯誤訊息', () => {
    process.env.NODE_ENV = 'production';

    const err = new Error('some error');
    const req = createMockReq() as any;
    const res = createMockRes() as any;
    const next = createMockNext();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_ERROR',
        message: '伺服器內部錯誤，請稍後再試',
      },
    });
  });

  it('開發環境返回 500 與堆疊追蹤', () => {
    process.env.NODE_ENV = 'development';

    const err = new Error('dev error');
    const req = createMockReq() as any;
    const res = createMockRes() as any;
    const next = createMockNext();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.error.message).toBe('dev error');
    expect(jsonCall.error.stack).toBeDefined();
  });

  it('過濾包含 password 的錯誤訊息', () => {
    process.env.NODE_ENV = 'production';

    const err = new Error('invalid password provided');
    const req = createMockReq() as any;
    const res = createMockRes() as any;
    const next = createMockNext();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_ERROR',
        message: '伺服器內部錯誤，請稍後再試',
      },
    });
  });

  it('過濾包含 secret 的錯誤訊息', () => {
    process.env.NODE_ENV = 'production';

    const err = createApiError(400, 'BAD_REQUEST', 'missing secret key');
    const req = createMockReq() as any;
    const res = createMockRes() as any;
    const next = createMockNext();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_ERROR',
        message: '伺服器內部錯誤，請稍後再試',
      },
    });
  });

  it('過濾包含 token 的錯誤訊息', () => {
    process.env.NODE_ENV = 'production';

    const err = new Error('jwt token expired');
    const req = createMockReq() as any;
    const res = createMockRes() as any;
    const next = createMockNext();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_ERROR',
        message: '伺服器內部錯誤，請稍後再試',
      },
    });
  });
});
