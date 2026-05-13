import { describe, it, expect, beforeEach } from 'vitest';
import { extractCoachMetaFromLogs, isMigrationNeeded } from './localStorageMigration';
import { type Quadrant } from '@/data/emotionData';
import { type RulerLogEntry } from '@/types/RulerTypes';

const makeLog = (quadrant: string, need: string | null, intensity: number): RulerLogEntry => ({
  id: `id_${Math.random()}`,
  timestamp: new Date().toISOString(),
  emotions: [{ id: '1', name: 'test', quadrant: quadrant as Quadrant, energy: 0, pleasantness: 0 }],
  intensity,
  bodyScan: null,
  understanding: need ? { trigger: '', message: '', what: '', who: '', where: '', need } : null,
  expressing: null,
  regulating: null,
  isFullFlow: false,
  postMood: '',
});

describe('localStorageMigration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('isMigrationNeeded: localStorage 有資料且未遷移時返回 true', () => {
    localStorage.setItem('feelings_logs', JSON.stringify([makeLog('red', null, 5)]));
    expect(isMigrationNeeded(null)).toBe(true);
  });

  it('isMigrationNeeded: 已遷移時返回 false', () => {
    localStorage.setItem('feelings_logs', JSON.stringify([makeLog('red', null, 5)]));
    expect(isMigrationNeeded('2026-01-01T00:00:00Z')).toBe(false);
  });

  it('isMigrationNeeded: localStorage 無資料時返回 false', () => {
    localStorage.removeItem('feelings_logs');
    expect(isMigrationNeeded(null)).toBe(false);
  });

  it('extractCoachMetaFromLogs 空陣列返回預設值', () => {
    const meta = extractCoachMetaFromLogs([]);
    expect(meta.recent_quadrants).toEqual([]);
    expect(meta.avg_intensity).toBe(0);
  });

  it('extractCoachMetaFromLogs 正確計算平均強度', () => {
    const logs = [makeLog('red', 'rest', 8), makeLog('blue', 'rest', 4)];
    const meta = extractCoachMetaFromLogs(logs);
    expect(meta.avg_intensity).toBe(6);
  });
});
