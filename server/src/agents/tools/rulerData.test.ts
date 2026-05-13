import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockMaybeSingle = vi.hoisted(() => vi.fn());
const mockLimit = vi.hoisted(() => vi.fn());
const mockOrder = vi.hoisted(() => vi.fn());
const mockEq = vi.hoisted(() => vi.fn());
const mockSelect = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}));

beforeEach(() => {
  mockFrom.mockReset();
  mockSelect.mockReset();
  mockEq.mockReset();
  mockOrder.mockReset();
  mockLimit.mockReset();
  mockMaybeSingle.mockReset();

  mockLimit.mockResolvedValue({ data: [], error: null });
  mockMaybeSingle.mockResolvedValue({ data: null, error: null });
  mockOrder.mockReturnValue({ limit: mockLimit });
  mockEq.mockReturnValue({ order: mockOrder, maybeSingle: mockMaybeSingle });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockFrom.mockReturnValue({ select: mockSelect });
});

import { getUserEmotionSummary } from './rulerData.js';

describe('getUserEmotionSummary', () => {
  it('有資料時回傳日誌與連續記錄', async () => {
    mockLimit.mockResolvedValue({
      data: [
        { emotions: [{ name: '平靜' }], intensity: 6, created_at: '2026-05-12T10:00:00Z' },
      ],
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({
      data: { current_streak: 3, longest_streak: 7, total_logs: 15, last_checkin_date: '2026-05-12' },
      error: null,
    });

    const result = await getUserEmotionSummary('user-uuid-123');

    expect(result.recentLogs).toHaveLength(1);
    expect(result.recentLogs[0].intensity).toBe(6);
    expect(result.streak.current_streak).toBe(3);
    expect(result.streak.total_logs).toBe(15);
  });

  it('無資料時回傳空日誌與零值 streak', async () => {
    mockLimit.mockResolvedValue({ data: null, error: null });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await getUserEmotionSummary('new-user');

    expect(result.recentLogs).toEqual([]);
    expect(result.streak.current_streak).toBe(0);
    expect(result.streak.longest_streak).toBe(0);
  });

  it('查詢 ruler_logs 與 streaks 各呼叫一次 client', async () => {
    await getUserEmotionSummary('user-uuid-456');

    expect(mockFrom).toHaveBeenCalledTimes(2);
    expect(mockFrom).toHaveBeenCalledWith('ruler_logs');
    expect(mockFrom).toHaveBeenCalledWith('streaks');
  });
});
