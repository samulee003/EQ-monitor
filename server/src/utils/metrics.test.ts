import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordRequest,
  recordError,
  recordRulerSessionCompleted,
  recordRulerSessionTimedOut,
  getMetrics,
  resetMetrics,
} from './metrics.js';

describe('metrics', () => {
  beforeEach(() => {
    resetMetrics();
  });

  it('初始值為 0', () => {
    const m = getMetrics();
    expect(m.totalRequests).toBe(0);
    expect(m.totalErrors).toBe(0);
    expect(m.rulerSessionsCompleted).toBe(0);
    expect(m.rulerSessionsTimedOut).toBe(0);
    expect(m.startTime).toBeGreaterThan(0);
  });

  it('recordRequest 累加請求數', () => {
    recordRequest();
    recordRequest();
    const m = getMetrics();
    expect(m.totalRequests).toBe(2);
  });

  it('recordError 累加錯誤數', () => {
    recordError();
    const m = getMetrics();
    expect(m.totalErrors).toBe(1);
  });

  it('recordRulerSessionCompleted 累加完成數', () => {
    recordRulerSessionCompleted();
    recordRulerSessionCompleted();
    const m = getMetrics();
    expect(m.rulerSessionsCompleted).toBe(2);
  });

  it('recordRulerSessionTimedOut 累加超時數', () => {
    recordRulerSessionTimedOut();
    const m = getMetrics();
    expect(m.rulerSessionsTimedOut).toBe(1);
  });

  it('getMetrics 返回獨立副本', () => {
    recordRequest();
    const m1 = getMetrics();
    recordRequest();
    const m2 = getMetrics();
    expect(m1.totalRequests).toBe(1);
    expect(m2.totalRequests).toBe(2);
  });

  it('resetMetrics 重置所有計數', () => {
    recordRequest();
    recordError();
    recordRulerSessionCompleted();
    recordRulerSessionTimedOut();
    resetMetrics();
    const m = getMetrics();
    expect(m.totalRequests).toBe(0);
    expect(m.totalErrors).toBe(0);
    expect(m.rulerSessionsCompleted).toBe(0);
    expect(m.rulerSessionsTimedOut).toBe(0);
  });
});
