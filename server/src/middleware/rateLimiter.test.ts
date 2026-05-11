import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

describe('rateLimiter', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function createMockReq(ip: string, forwardedFor?: string): Partial<Request> {
    return {
      ip,
      get: vi.fn((header: string) => {
        if (header === 'x-forwarded-for') return forwardedFor || undefined;
        return undefined;
      }),
      path: '/test',
    } as Partial<Request>;
  }

  function createMockRes(): Partial<Response> & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  } {
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    return {
      status,
      json,
    } as any;
  }

  function createMockNext(): NextFunction {
    return vi.fn();
  }

  it('允許限制次數內的請求', async () => {
    const { rateLimiter } = await import('./rateLimiter.js');
    const req = createMockReq('192.168.1.1') as Request;
    const res = createMockRes() as Response;
    const next = createMockNext();

    for (let i = 0; i < 60; i++) {
      rateLimiter(req, res, next);
    }

    expect(next).toHaveBeenCalledTimes(60);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('超過限制返回 429', async () => {
    const { rateLimiter } = await import('./rateLimiter.js');
    const req = createMockReq('192.168.1.2') as Request;
    const res = createMockRes() as Response;
    const next = createMockNext();

    for (let i = 0; i < 60; i++) {
      rateLimiter(req, res, next);
    }

    rateLimiter(req, res, next);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Too many requests',
      })
    );
  });

  it('時間窗口後重置計數器', async () => {
    const { rateLimiter } = await import('./rateLimiter.js');
    const req = createMockReq('192.168.1.3') as Request;
    const res = createMockRes() as Response;
    const next = createMockNext();

    for (let i = 0; i < 60; i++) {
      rateLimiter(req, res, next);
    }

    rateLimiter(req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);

    vi.advanceTimersByTime(60 * 1000 + 1);

    res.status.mockClear();
    res.json.mockClear();
    next.mockClear();

    rateLimiter(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
