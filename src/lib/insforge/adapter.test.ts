import { describe, it, expect, beforeAll, vi } from 'vitest';
import { InsForgeAdapter, insforgeAdapter } from './adapter';

describe('InsForgeAdapter', () => {
  beforeAll(() => {
    vi.stubGlobal('import.meta.env', { VITE_INSFORGE_URL: 'https://test.insforge.app' });
  });

  it('should be defined', () => {
    expect(insforgeAdapter).toBeDefined();
  });

  it('should have all CRUD methods for logs', () => {
    expect(typeof insforgeAdapter.createLog).toBe('function');
    expect(typeof insforgeAdapter.getLogs).toBe('function');
    expect(typeof insforgeAdapter.getLogById).toBe('function');
    expect(typeof insforgeAdapter.deleteLog).toBe('function');
  });

  it('should have draft methods', () => {
    expect(typeof insforgeAdapter.getDraft).toBe('function');
    expect(typeof insforgeAdapter.upsertDraft).toBe('function');
    expect(typeof insforgeAdapter.deleteDraft).toBe('function');
  });

  it('should have achievement methods', () => {
    expect(typeof insforgeAdapter.getAchievements).toBe('function');
    expect(typeof insforgeAdapter.unlockAchievement).toBe('function');
  });

  it('should have auth methods', () => {
    expect(typeof insforgeAdapter.signUp).toBe('function');
    expect(typeof insforgeAdapter.signIn).toBe('function');
    expect(typeof insforgeAdapter.signOut).toBe('function');
  });
});
