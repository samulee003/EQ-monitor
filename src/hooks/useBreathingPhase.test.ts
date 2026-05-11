import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useBreathingPhase, type BreathingCadence } from './useBreathingPhase';

const FAST_CADENCE: BreathingCadence = {
  inhaleMs: 100,
  holdMs: 80,
  exhaleMs: 100,
};

describe('useBreathingPhase', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('初始狀態應為 inhale', () => {
    const { result } = renderHook(() => useBreathingPhase(FAST_CADENCE));
    expect(result.current).toBe('inhale');
  });

  it('應按節奏循環 inhale → hold → exhale → inhale', async () => {
    const { result } = renderHook(() => useBreathingPhase(FAST_CADENCE));

    expect(result.current).toBe('inhale');

    act(() => {
      vi.advanceTimersByTime(FAST_CADENCE.inhaleMs);
    });
    await waitFor(() => expect(result.current).toBe('hold'));

    act(() => {
      vi.advanceTimersByTime(FAST_CADENCE.holdMs);
    });
    await waitFor(() => expect(result.current).toBe('exhale'));

    act(() => {
      vi.advanceTimersByTime(FAST_CADENCE.exhaleMs);
    });
    await waitFor(() => expect(result.current).toBe('inhale'));
  });

  it('unmount 後不應拋出 setState 警告', () => {
    const { unmount } = renderHook(() => useBreathingPhase(FAST_CADENCE));
    unmount();

    // 推進時間，確認沒有未清理的 timer 導致錯誤
    act(() => {
      vi.advanceTimersByTime(1000);
    });
  });

  it('變更節奏參數後應重新開始循環', async () => {
    const { result, rerender } = renderHook(
      ({ cadence }: { cadence: BreathingCadence }) => useBreathingPhase(cadence),
      { initialProps: { cadence: FAST_CADENCE } }
    );

    act(() => {
      vi.advanceTimersByTime(FAST_CADENCE.inhaleMs + FAST_CADENCE.holdMs);
    });
    await waitFor(() => expect(result.current).toBe('exhale'));

    const NEW_CADENCE: BreathingCadence = { inhaleMs: 50, holdMs: 40, exhaleMs: 50 };
    rerender({ cadence: NEW_CADENCE });

    // 重新掛載 effect 後應回到 inhale
    await waitFor(() => expect(result.current).toBe('inhale'));
  });
});
