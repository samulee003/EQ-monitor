import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRulerFlow } from './useRulerFlow';
import { RulerLogEntry } from '../types/RulerTypes';

describe('useRulerFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('應該初始化為 recognizing 步驟', () => {
    const { result } = renderHook(() => useRulerFlow());
    expect(result.current.step).toBe('recognizing');
  });

  it('應該正確處理情緒選擇', () => {
    const { result } = renderHook(() => useRulerFlow());

    act(() => {
      result.current.handleMoodComplete(['red'], 5);
    });

    expect(result.current.selectedQuadrants).toContain('red');
    expect(result.current.emotionIntensity).toBe(5);
  });

  it('應該支持多象限選擇', () => {
    const { result } = renderHook(() => useRulerFlow());

    act(() => {
      result.current.handleMoodComplete(['red', 'blue'], 7);
    });

    expect(result.current.selectedQuadrants).toContain('red');
    expect(result.current.selectedQuadrants).toContain('blue');
  });

  it('應該正確重置流程', () => {
    const { result } = renderHook(() => useRulerFlow());

    act(() => {
      result.current.handleMoodComplete(['red'], 5);
    });

    expect(result.current.step).not.toBe('recognizing');

    act(() => {
      result.current.resetFlow();
    });

    expect(result.current.step).toBe('recognizing');
    expect(result.current.selectedQuadrants).toHaveLength(0);
    expect(result.current.selectedEmotions).toHaveLength(0);
  });

  it('應該正確處理身體掃描數據', () => {
    const { result } = renderHook(() => useRulerFlow());

    const bodyScanData = {
      location: '胸口',
      sensation: '緊繃'
    };

    act(() => {
      result.current.handleMoodComplete(['red'], 5);
      result.current.handleBodyScanComplete(bodyScanData);
    });

    expect(result.current.bodyScanData).toEqual(bodyScanData);
  });

  it('應該支持完整 RULER 流程', () => {
    const { result } = renderHook(() => useRulerFlow());

    // Recognizing
    act(() => {
      result.current.handleMoodComplete(['red'], 5);
    });

    // Body Scan
    act(() => {
      result.current.handleBodyScanComplete({ location: '胸口', sensation: '緊繃' });
    });

    // Labeling - 選擇情緒並啟動完整流程
    act(() => {
      result.current.setIsFullFlow(true);
      result.current.handleEmotionSelect([{ 
        id: 'angry', 
        name: '生氣的', 
        quadrant: 'red', 
        energy: 3, 
        pleasantness: 3 
      }]);
    });

    // Understanding
    act(() => {
      result.current.handleUnderstandingComplete({
        trigger: '工作壓力',
        message: '',
        what: '工作',
        who: '同事',
        where: '辦公室',
        need: '尊重與認可'
      });
    });

    // Expressing
    act(() => {
      result.current.handleExpressingComplete({
        expression: '我感到很沮喪',
        prompt: '心情書信',
        mode: 'letter'
      });
    });

    // Regulating
    act(() => {
      result.current.handleRegulatingComplete({
        selectedStrategies: ['breathing', 'grounding']
      });
    });

    expect(result.current.step).toBe('neuroCheck');
  });

  it('應該正確保存草稿到 localStorage', () => {
    const { result } = renderHook(() => useRulerFlow());

    act(() => {
      result.current.handleMoodComplete(['yellow'], 8);
    });

    const savedDraft = localStorage.getItem('ruler_draft');
    expect(savedDraft).not.toBeNull();
    
    const draft = JSON.parse(savedDraft!);
    expect(draft.selectedQuadrants).toContain('yellow');
  });
});
