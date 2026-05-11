import { describe, it, expect } from 'vitest';
import { extractRecentQuadrants, extractRecentNeeds, buildCoachContextPatch } from './coachContext';
import { type RulerLogEntry } from '@/types/RulerTypes';

const makeLog = (quadrant: string, need: string | null, intensity: number): RulerLogEntry => ({
  id: `id_${quadrant}`,
  timestamp: new Date().toISOString(),
  emotions: [{ id: '1', name: 'test', quadrant: quadrant as any, energy: 0, pleasantness: 0 }],
  intensity,
  bodyScan: null,
  understanding: need ? {
    trigger: '', message: '', what: '', who: '', where: '', need
  } : null,
  expressing: null,
  regulating: null,
  isFullFlow: false,
  postMood: '',
});

describe('coachContext helpers', () => {
  it('extractRecentQuadrants 取最近 5 筆象限標籤', () => {
    const logs = ['red', 'yellow', 'blue', 'green', 'red'].map(q => makeLog(q, null, 5));
    expect(extractRecentQuadrants(logs)).toEqual(['red', 'yellow', 'blue', 'green', 'red']);
  });

  it('extractRecentQuadrants 最多取 5 筆（最新優先）', () => {
    const logs = ['red', 'red', 'blue', 'green', 'yellow', 'red'].map(q => makeLog(q, null, 5));
    expect(extractRecentQuadrants(logs)).toHaveLength(5);
    expect(extractRecentQuadrants(logs)[0]).toBe('red');
  });

  it('extractRecentNeeds 去重並過濾 null', () => {
    const logs = [
      makeLog('red', 'connection', 7),
      makeLog('red', 'rest', 6),
      makeLog('blue', 'connection', 5),
      makeLog('green', null, 3),
    ];
    const needs = extractRecentNeeds(logs);
    expect(needs).toContain('connection');
    expect(needs).toContain('rest');
    expect(needs).not.toContain(null);
    expect(new Set(needs).size).toBe(needs.length);
  });

  it('buildCoachContextPatch 計算平均強度', () => {
    const logs = [
      makeLog('red', 'rest', 8),
      makeLog('red', 'rest', 6),
    ];
    const patch = buildCoachContextPatch('user-1', logs);
    expect(patch.avg_intensity).toBeCloseTo(7, 1);
    expect(patch.user_id).toBe('user-1');
    expect(patch.last_active).toBeDefined();
  });
});
