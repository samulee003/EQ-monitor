/* eslint-disable @typescript-eslint/no-explicit-any -- 測試離線同步私有快取與 mock adapter 需要觸碰內部欄位。 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { InsForgeSyncAdapter, syncAdapter } from './_deprecated/syncAdapter';

const DB_NAME = 'insforge_sync_v1';

async function clearDb() {
  return new Promise<void>((resolve) => {
    const req = indexedDB.open(DB_NAME);
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('cache') || !db.objectStoreNames.contains('syncQueue')) {
        db.close();
        resolve();
        return;
      }
      const tx = db.transaction(['cache', 'syncQueue'], 'readwrite');
      tx.objectStore('cache').clear();
      tx.objectStore('syncQueue').clear();
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); resolve(); };
    };
    req.onerror = () => resolve();
    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('cache')) db.createObjectStore('cache', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('syncQueue')) db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
    };
  });
}

function createMockAdapter() {
  const ok = { data: null, error: null };
  return {
    signUp: vi.fn().mockResolvedValue(ok),
    signIn: vi.fn().mockResolvedValue(ok),
    signOut: vi.fn().mockResolvedValue(ok),
    getUser: vi.fn().mockReturnValue(ok),
    createLog: vi.fn().mockResolvedValue(ok),
    getLogs: vi.fn().mockResolvedValue(ok),
    getLogById: vi.fn().mockResolvedValue(ok),
    deleteLog: vi.fn().mockResolvedValue(ok),
    getDraft: vi.fn().mockResolvedValue(ok),
    upsertDraft: vi.fn().mockResolvedValue(ok),
    deleteDraft: vi.fn().mockResolvedValue(ok),
    getAchievements: vi.fn().mockResolvedValue(ok),
    unlockAchievement: vi.fn().mockResolvedValue(ok),
    markAchievementViewed: vi.fn().mockResolvedValue(ok),
    getStreak: vi.fn().mockResolvedValue(ok),
    getProfile: vi.fn().mockResolvedValue(ok),
    updateProfile: vi.fn().mockResolvedValue(ok),
  };
}

describe('InsForgeSyncAdapter', () => {
  let adapter: InsForgeSyncAdapter;
  let mockAdapter: ReturnType<typeof createMockAdapter>;

  beforeEach(async () => {
    await clearDb();
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
    adapter = new InsForgeSyncAdapter();
    mockAdapter = createMockAdapter();
    (adapter as any).adapter = mockAdapter;
  });

  afterEach(() => {
    adapter.destroy();
  });

  it('should be defined as a singleton', () => {
    expect(syncAdapter).toBeDefined();
    expect(syncAdapter instanceof InsForgeSyncAdapter).toBe(true);
  });

  it('should expose isOnline state', () => {
    expect(typeof adapter.isOnline).toBe('boolean');
  });

  it('should have the same interface as InsForgeAdapter', () => {
    expect(typeof adapter.signUp).toBe('function');
    expect(typeof adapter.signIn).toBe('function');
    expect(typeof adapter.signOut).toBe('function');
    expect(typeof adapter.getUser).toBe('function');
    expect(typeof adapter.createLog).toBe('function');
    expect(typeof adapter.getLogs).toBe('function');
    expect(typeof adapter.getLogById).toBe('function');
    expect(typeof adapter.deleteLog).toBe('function');
    expect(typeof adapter.getDraft).toBe('function');
    expect(typeof adapter.upsertDraft).toBe('function');
    expect(typeof adapter.deleteDraft).toBe('function');
    expect(typeof adapter.getAchievements).toBe('function');
    expect(typeof adapter.unlockAchievement).toBe('function');
    expect(typeof adapter.markAchievementViewed).toBe('function');
    expect(typeof adapter.getStreak).toBe('function');
    expect(typeof adapter.getProfile).toBe('function');
    expect(typeof adapter.updateProfile).toBe('function');
    expect(typeof adapter.replayQueue).toBe('function');
    expect(typeof adapter.pullLatest).toBe('function');
    expect(typeof adapter.clearQueue).toBe('function');
    expect(typeof adapter.getQueueLength).toBe('function');
  });

  describe('online mode', () => {
    it('getLogs should hit backend and return data', async () => {
      const mockData = [{ id: '1', emotions: [], intensity: 5, created_at: '2024-01-01' }];
      mockAdapter.getLogs.mockResolvedValue({ data: mockData, error: null });

      const result = await adapter.getLogs();
      expect(mockAdapter.getLogs).toHaveBeenCalledWith(50);
      expect(result.data).toEqual(mockData);
    });

    it('createLog should hit backend and return data', async () => {
      const newLog = { id: '2', emotions: [], intensity: 3, created_at: '2024-01-02' };
      mockAdapter.createLog.mockResolvedValue({ data: [newLog], error: null });

      const result = await adapter.createLog({ emotions: [], intensity: 3 } as any);
      expect(mockAdapter.createLog).toHaveBeenCalled();
      expect(result.data).toEqual([newLog]);
    });
  });

  describe('offline mode', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
      adapter.destroy();
      adapter = new InsForgeSyncAdapter();
      mockAdapter = createMockAdapter();
      (adapter as any).adapter = mockAdapter;
    });

    it('getLogs should return cached data when offline', async () => {
      await (adapter as any).cache.set('logs', [{ id: 'cached-1', emotions: [], intensity: 7, created_at: '2024-01-03' }]);

      const result = await adapter.getLogs();
      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].id).toBe('cached-1');
    });

    it('createLog should queue when offline and return local data', async () => {
      const result = await adapter.createLog({ emotions: [], intensity: 4 } as any);
      expect(result.error).toBeNull();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data?.[0].intensity).toBe(4);
      expect(result.data?.[0].id).toBeDefined();

      const queueLen = await adapter.getQueueLength();
      expect(queueLen).toBe(1);
    });

    it('deleteLog should remove from cache and queue when offline', async () => {
      await (adapter as any).cache.set('logs', [{ id: 'del-1', emotions: [], intensity: 2, created_at: '2024-01-04' }]);
      await adapter.deleteLog('del-1');

      const logs = await (adapter as any).cache.get('logs');
      expect(logs).toHaveLength(0);

      const queueLen = await adapter.getQueueLength();
      expect(queueLen).toBe(1);
    });

    it('upsertDraft should update cache and queue when offline', async () => {
      const result = await adapter.upsertDraft({ step: 'emotions' } as any);
      expect(result.error).toBeNull();
      expect(result.data?.[0].step).toBe('emotions');

      const draft = await (adapter as any).cache.get('draft');
      expect(draft.step).toBe('emotions');

      const queueLen = await adapter.getQueueLength();
      expect(queueLen).toBe(1);
    });

    it('updateProfile should update cache and queue when offline', async () => {
      const result = await adapter.updateProfile({ display_name: 'Test' });
      expect(result.error).toBeNull();
      expect((result.data?.[0] as Record<string, unknown>)?.display_name).toBe('Test');

      const profile = await (adapter as any).cache.get('profile');
      expect(profile.display_name).toBe('Test');

      const queueLen = await adapter.getQueueLength();
      expect(queueLen).toBe(1);
    });

    it('unlockAchievement should queue when offline', async () => {
      const result = await adapter.unlockAchievement('first_log');
      expect(result.error).toBeNull();
      expect(result.data?.[0].achievement_key).toBe('first_log');

      const queueLen = await adapter.getQueueLength();
      expect(queueLen).toBe(1);
    });

    it('markAchievementViewed should update cache and queue when offline', async () => {
      await (adapter as any).cache.set('achievements', [{ id: 'ach-1', achievement_key: 'x', viewed: false }]);
      await adapter.markAchievementViewed('ach-1');

      const achievements = await (adapter as any).cache.get('achievements');
      expect(achievements[0].viewed).toBe(true);

      const queueLen = await adapter.getQueueLength();
      expect(queueLen).toBe(1);
    });
  });

  describe('sync / reconnect', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
      adapter.destroy();
      adapter = new InsForgeSyncAdapter();
      mockAdapter = createMockAdapter();
      (adapter as any).adapter = mockAdapter;
    });

    it('replayQueue should send queued operations to backend', async () => {
      mockAdapter.createLog.mockResolvedValue({ data: [{ id: 'remote-1' }], error: null });
      mockAdapter.deleteLog.mockResolvedValue({ data: null, error: null });
      mockAdapter.updateProfile.mockResolvedValue({ data: [{ updated_at: '2024-01-05' }], error: null });
      mockAdapter.getLogs.mockResolvedValue({ data: [], error: null });
      mockAdapter.getDraft.mockResolvedValue({ data: null, error: { message: 'not found' } });
      mockAdapter.getAchievements.mockResolvedValue({ data: [], error: null });
      mockAdapter.getStreak.mockResolvedValue({ data: null, error: { message: 'not found' } });
      mockAdapter.getProfile.mockResolvedValue({ data: { updated_at: '2024-01-01' }, error: null });

      // Seed queue manually
      await (adapter as any).cache.addQueueEntry({ table: 'ruler_logs', operation: 'insert', data: { intensity: 5 }, timestamp: '2024-01-02' });
      await (adapter as any).cache.addQueueEntry({ table: 'ruler_logs', operation: 'delete', data: { id: 'old-1' }, timestamp: '2024-01-02' });
      await (adapter as any).cache.addQueueEntry({ table: 'profiles', operation: 'update', data: { display_name: 'Sam' }, timestamp: '2024-01-06' });

      await adapter.replayQueue();

      expect(mockAdapter.createLog).toHaveBeenCalledTimes(1);
      expect(mockAdapter.deleteLog).toHaveBeenCalledTimes(1);
      expect(mockAdapter.updateProfile).toHaveBeenCalledTimes(1);

      const queueLen = await adapter.getQueueLength();
      expect(queueLen).toBe(0);
    });

    it('last-write-wins should skip stale updates', async () => {
      mockAdapter.getProfile.mockResolvedValue({ data: { updated_at: '2024-12-01T00:00:00Z' }, error: null });
      mockAdapter.updateProfile.mockResolvedValue({ data: null, error: null });
      mockAdapter.getLogs.mockResolvedValue({ data: [], error: null });
      mockAdapter.getDraft.mockResolvedValue({ data: null, error: { message: 'not found' } });
      mockAdapter.getAchievements.mockResolvedValue({ data: [], error: null });
      mockAdapter.getStreak.mockResolvedValue({ data: null, error: { message: 'not found' } });

      // Queue an older update
      await (adapter as any).cache.addQueueEntry({
        table: 'profiles',
        operation: 'update',
        data: { display_name: 'Old' },
        timestamp: '2024-01-01T00:00:00Z',
      });

      await adapter.replayQueue();

      // updateProfile should NOT be called because remote is newer
      expect(mockAdapter.updateProfile).not.toHaveBeenCalled();
      const queueLen = await adapter.getQueueLength();
      expect(queueLen).toBe(0); // stale entry removed
    });

    it('pullLatest should refresh cache from backend', async () => {
      mockAdapter.getLogs.mockResolvedValue({ data: [{ id: 'pulled-1' }], error: null });
      mockAdapter.getDraft.mockResolvedValue({ data: null, error: { message: 'not found' } });
      mockAdapter.getAchievements.mockResolvedValue({ data: [], error: null });
      mockAdapter.getStreak.mockResolvedValue({ data: null, error: { message: 'not found' } });
      mockAdapter.getProfile.mockResolvedValue({ data: null, error: { message: 'not found' } });

      await adapter.pullLatest();

      const logs = await (adapter as any).cache.get('logs');
      expect(logs).toEqual([{ id: 'pulled-1' }]);
    });
  });

  describe('network events', () => {
    it('should notify listeners when network changes', () => {
      const cb = vi.fn();
      const unsub = adapter.onNetworkChange(cb);

      window.dispatchEvent(new Event('offline'));
      expect(cb).toHaveBeenCalledWith(false);

      window.dispatchEvent(new Event('online'));
      expect(cb).toHaveBeenCalledWith(true);

      unsub();
    });
  });
});
