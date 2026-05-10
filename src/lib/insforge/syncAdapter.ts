import { InsForgeAdapter } from './adapter';
import type { RulerLogRow, RulerDraftRow } from './types';

/* ------------------------------------------------------------------ */
/*  IndexedDB cache layer                                               */
/* ------------------------------------------------------------------ */

const DEFAULT_DB_NAME = 'insforge_sync_v1';
const DB_VERSION = 1;

interface CacheRecord {
  key: string;
  value: unknown;
}

export interface SyncQueueEntry {
  id?: number;
  table: string;
  operation: 'insert' | 'update' | 'delete' | 'upsert';
  data: Record<string, unknown>;
  timestamp: string;
  recordId?: string;
}

class IndexedDBCache {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private dbName: string;

  constructor(dbName = DEFAULT_DB_NAME) {
    this.dbName = dbName;
  }

  init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('indexedDB not available'));
        return;
      }
      const req = indexedDB.open(this.dbName, DB_VERSION);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        this.db = req.result;
        resolve();
      };
      req.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
    return this.initPromise;
  }

  private store(name: 'cache' | 'syncQueue', mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) throw new Error('IndexedDB not initialised');
    return this.db.transaction(name, mode).objectStore(name);
  }

  async get<T>(key: string): Promise<T | null> {
    await this.init();
    return new Promise((resolve, reject) => {
      const req = this.store('cache', 'readonly').get(key);
      req.onsuccess = () => {
        const record = req.result as CacheRecord | undefined;
        resolve((record?.value as T) ?? null);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const req = this.store('cache', 'readwrite').put({ key, value });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async addQueueEntry(entry: Omit<SyncQueueEntry, 'id'>): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const req = this.store('syncQueue', 'readwrite').add(entry);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getQueue(): Promise<SyncQueueEntry[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const req = this.store('syncQueue', 'readonly').getAll();
      req.onsuccess = () => resolve((req.result as SyncQueueEntry[]) ?? []);
      req.onerror = () => reject(req.error);
    });
  }

  async removeQueueEntry(id: number): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const req = this.store('syncQueue', 'readwrite').delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async clearQueue(): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const req = this.store('syncQueue', 'readwrite').clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

/* ------------------------------------------------------------------ */
/*  Network monitor                                                     */
/* ------------------------------------------------------------------ */

class NetworkMonitor {
  private _online: boolean;
  private listeners = new Set<(online: boolean) => void>();

  constructor() {
    this._online = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.set(true));
      window.addEventListener('offline', () => this.set(false));
    }
  }

  get isOnline() {
    return this._online;
  }

  onChange(cb: (online: boolean) => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private set(online: boolean) {
    if (this._online === online) return;
    this._online = online;
    this.listeners.forEach((cb) => cb(online));
  }
}

/* ------------------------------------------------------------------ */
/*  Sync adapter                                                        */
/* ------------------------------------------------------------------ */

export class InsForgeSyncAdapter {
  private adapter = new InsForgeAdapter();
  private cache: IndexedDBCache;
  private network = new NetworkMonitor();
  private syncInProgress = false;
  private unsubNetwork?: () => void;

  constructor(dbName?: string) {
    this.cache = new IndexedDBCache(dbName);
    this.unsubNetwork = this.network.onChange((online) => {
      if (online) this.replayQueue();
    });
  }

  /* -- public state -- */

  get isOnline() {
    return this.network.isOnline;
  }

  onNetworkChange(cb: (online: boolean) => void) {
    return this.network.onChange(cb);
  }

  destroy() {
    this.unsubNetwork?.();
  }

  /* -- helpers -- */

  private async ensureCache() {
    await this.cache.init();
  }

  private genId() {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  private now() {
    return new Date().toISOString();
  }

  /* -- auth (pass-through; auth requires network) -- */

  async signUp(email: string, password: string) {
    return this.adapter.signUp(email, password);
  }

  async signIn(email: string, password: string) {
    return this.adapter.signIn(email, password);
  }

  async signOut() {
    return this.adapter.signOut();
  }

  getUser() {
    return this.adapter.getUser();
  }

  /* -- logs -- */

  async createLog(data: Omit<RulerLogRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    await this.ensureCache();
    if (this.isOnline) {
      const result = await this.adapter.createLog(data);
      if (!result.error && result.data) {
        const logs = (await this.cache.get<RulerLogRow[]>('logs')) ?? [];
        const arr = Array.isArray(result.data) ? result.data : [result.data];
        logs.unshift(...arr);
        await this.cache.set('logs', logs);
      }
      return result;
    }

    const id = this.genId();
    const ts = this.now();
    const newLog = { ...(data as unknown as RulerLogRow), id, created_at: ts, updated_at: ts };
    const logs = (await this.cache.get<RulerLogRow[]>('logs')) ?? [];
    logs.unshift(newLog);
    await this.cache.set('logs', logs);
    await this.cache.addQueueEntry({ table: 'ruler_logs', operation: 'insert', data: data as Record<string, unknown>, timestamp: ts });
    return { data: [newLog], error: null };
  }

  async getLogs(limit = 50) {
    await this.ensureCache();
    if (this.isOnline) {
      const result = await this.adapter.getLogs(limit);
      if (!result.error && result.data) {
        await this.cache.set('logs', result.data);
      }
      return result;
    }
    const cached = (await this.cache.get<RulerLogRow[]>('logs')) ?? [];
    return { data: cached.slice(0, limit), error: null };
  }

  async getLogById(id: string) {
    await this.ensureCache();
    if (this.isOnline) {
      const result = await this.adapter.getLogById(id);
      if (!result.error && result.data) {
        const logs = (await this.cache.get<RulerLogRow[]>('logs')) ?? [];
        const idx = logs.findIndex((l) => l.id === id);
        if (idx >= 0) logs[idx] = result.data as RulerLogRow;
        else logs.push(result.data as RulerLogRow);
        await this.cache.set('logs', logs);
      }
      return result;
    }
    const logs = (await this.cache.get<RulerLogRow[]>('logs')) ?? [];
    const found = logs.find((l) => l.id === id) ?? null;
    return { data: found, error: null };
  }

  async deleteLog(id: string) {
    await this.ensureCache();
    if (this.isOnline) {
      const result = await this.adapter.deleteLog(id);
      if (!result.error) {
        const logs = (await this.cache.get<RulerLogRow[]>('logs')) ?? [];
        await this.cache.set(
          'logs',
          logs.filter((l) => l.id !== id)
        );
      }
      return result;
    }
    const logs = (await this.cache.get<RulerLogRow[]>('logs')) ?? [];
    await this.cache.set(
      'logs',
      logs.filter((l) => l.id !== id)
    );
    await this.cache.addQueueEntry({ table: 'ruler_logs', operation: 'delete', data: { id }, timestamp: this.now(), recordId: id });
    return { data: null, error: null };
  }

  /* -- draft -- */

  async getDraft() {
    await this.ensureCache();
    if (this.isOnline) {
      const result = await this.adapter.getDraft();
      if (!result.error && result.data) {
        await this.cache.set('draft', result.data);
      }
      return result;
    }
    const cached = await this.cache.get<unknown>('draft');
    return { data: cached, error: cached ? null : { message: 'No cached draft' } };
  }

  async upsertDraft(data: Partial<Omit<RulerDraftRow, 'id' | 'user_id'>>) {
    await this.ensureCache();
    if (this.isOnline) {
      const result = await this.adapter.upsertDraft(data);
      if (!result.error && result.data) {
        const val = Array.isArray(result.data) ? result.data[0] : result.data;
        await this.cache.set('draft', val);
      }
      return result;
    }
    const ts = this.now();
    const existing = (await this.cache.get<Partial<RulerDraftRow>>('draft')) ?? {};
    const merged = { ...existing, ...data, updated_at: ts };
    await this.cache.set('draft', merged);
    await this.cache.addQueueEntry({ table: 'ruler_drafts', operation: 'upsert', data: data as Record<string, unknown>, timestamp: ts });
    return { data: [merged], error: null };
  }

  async deleteDraft() {
    await this.ensureCache();
    if (this.isOnline) {
      const result = await this.adapter.deleteDraft();
      if (!result.error) {
        await this.cache.set('draft', null);
      }
      return result;
    }
    await this.cache.set('draft', null);
    await this.cache.addQueueEntry({ table: 'ruler_drafts', operation: 'delete', data: {}, timestamp: this.now() });
    return { data: null, error: null };
  }

  /* -- achievements -- */

  async getAchievements() {
    await this.ensureCache();
    if (this.isOnline) {
      const result = await this.adapter.getAchievements();
      if (!result.error && result.data) {
        await this.cache.set('achievements', result.data);
      }
      return result;
    }
    const cached = (await this.cache.get<unknown[]>('achievements')) ?? [];
    return { data: cached, error: null };
  }

  async unlockAchievement(achievementKey: string) {
    await this.ensureCache();
    if (this.isOnline) {
      const result = await this.adapter.unlockAchievement(achievementKey);
      if (!result.error && result.data) {
        const achievements = (await this.cache.get<unknown[]>('achievements')) ?? [];
        const arr = Array.isArray(result.data) ? result.data : [result.data];
        achievements.unshift(...arr);
        await this.cache.set('achievements', achievements);
      }
      return result;
    }
    const ts = this.now();
    const id = this.genId();
    const newRec = { id, achievement_key: achievementKey, unlocked_at: ts, viewed: false };
    const achievements = (await this.cache.get<unknown[]>('achievements')) ?? [];
    achievements.unshift(newRec);
    await this.cache.set('achievements', achievements);
    await this.cache.addQueueEntry({ table: 'achievement_records', operation: 'insert', data: { achievement_key: achievementKey }, timestamp: ts });
    return { data: [newRec], error: null };
  }

  async markAchievementViewed(id: string) {
    await this.ensureCache();
    if (this.isOnline) {
      const result = await this.adapter.markAchievementViewed(id);
      if (!result.error) {
        const achievements = (await this.cache.get<Array<Record<string, unknown>>>('achievements')) ?? [];
        const idx = achievements.findIndex((a) => a.id === id);
        if (idx >= 0) {
          achievements[idx] = { ...achievements[idx], viewed: true };
          await this.cache.set('achievements', achievements);
        }
      }
      return result;
    }
    const achievements = (await this.cache.get<Array<Record<string, unknown>>>('achievements')) ?? [];
    const idx = achievements.findIndex((a) => a.id === id);
    if (idx >= 0) {
      achievements[idx] = { ...achievements[idx], viewed: true };
      await this.cache.set('achievements', achievements);
    }
    await this.cache.addQueueEntry({ table: 'achievement_records', operation: 'update', data: { id, viewed: true }, timestamp: this.now(), recordId: id });
    return { data: null, error: null };
  }

  /* -- streak -- */

  async getStreak() {
    await this.ensureCache();
    if (this.isOnline) {
      const result = await this.adapter.getStreak();
      if (!result.error && result.data) {
        await this.cache.set('streak', result.data);
      }
      return result;
    }
    const cached = await this.cache.get<unknown>('streak');
    return { data: cached, error: cached ? null : { message: 'No cached streak' } };
  }

  /* -- profile -- */

  async getProfile() {
    await this.ensureCache();
    if (this.isOnline) {
      const result = await this.adapter.getProfile();
      if (!result.error && result.data) {
        await this.cache.set('profile', result.data);
      }
      return result;
    }
    const cached = await this.cache.get<unknown>('profile');
    return { data: cached, error: cached ? null : { message: 'No cached profile' } };
  }

  async updateProfile(data: Partial<Record<string, unknown>>) {
    await this.ensureCache();
    if (this.isOnline) {
      const result = await this.adapter.updateProfile(data);
      if (!result.error && result.data) {
        const val = Array.isArray(result.data) ? result.data[0] : result.data;
        await this.cache.set('profile', val);
      }
      return result;
    }
    const ts = this.now();
    const existing = (await this.cache.get<Record<string, unknown>>('profile')) ?? {};
    const merged = { ...existing, ...data, updated_at: ts };
    await this.cache.set('profile', merged);
    await this.cache.addQueueEntry({ table: 'profiles', operation: 'update', data, timestamp: ts });
    return { data: [merged], error: null };
  }

  /* -- sync internals -- */

  /** Replay the offline operation queue. Called automatically on reconnect. */
  async replayQueue(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) return;
    this.syncInProgress = true;
    try {
      await this.ensureCache();
      const queue = await this.cache.getQueue();
      for (const entry of queue) {
        try {
          let shouldApply = true;

          // last-write-wins conflict resolution for updates
          if (entry.operation === 'update') {
            shouldApply = await this.checkLastWriteWins(entry.table, entry.timestamp);
          }

          if (!shouldApply) {
            if (entry.id !== undefined) await this.cache.removeQueueEntry(entry.id);
            continue;
          }

          if (entry.operation === 'insert') {
            if (entry.table === 'ruler_logs') await this.adapter.createLog(entry.data as Omit<RulerLogRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>);
            else if (entry.table === 'achievement_records') await this.adapter.unlockAchievement(entry.data.achievement_key as string);
          } else if (entry.operation === 'update') {
            if (entry.table === 'profiles') await this.adapter.updateProfile(entry.data);
            else if (entry.table === 'achievement_records') await this.adapter.markAchievementViewed(entry.data.id as string);
          } else if (entry.operation === 'delete') {
            if (entry.table === 'ruler_logs') await this.adapter.deleteLog(entry.data.id as string);
            else if (entry.table === 'ruler_drafts') await this.adapter.deleteDraft();
          } else if (entry.operation === 'upsert') {
            if (entry.table === 'ruler_drafts') await this.adapter.upsertDraft(entry.data as Partial<Omit<RulerDraftRow, 'id' | 'user_id'>>);
          }

          if (entry.id !== undefined) await this.cache.removeQueueEntry(entry.id);
        } catch {
          // Leave in queue for next retry
        }
      }
      await this.pullLatest();
    } finally {
      this.syncInProgress = false;
    }
  }

  /** Pull the latest data from the backend and refresh the cache. */
  async pullLatest(): Promise<void> {
    const tasks = [
      Promise.resolve(this.adapter.getLogs()).then((r) => {
        if (r && !r.error && r.data) return this.cache.set('logs', r.data);
      }),
      Promise.resolve(this.adapter.getDraft()).then((r) => {
        if (r && !r.error && r.data) return this.cache.set('draft', r.data);
      }),
      Promise.resolve(this.adapter.getAchievements()).then((r) => {
        if (r && !r.error && r.data) return this.cache.set('achievements', r.data);
      }),
      Promise.resolve(this.adapter.getStreak()).then((r) => {
        if (r && !r.error && r.data) return this.cache.set('streak', r.data);
      }),
      Promise.resolve(this.adapter.getProfile()).then((r) => {
        if (r && !r.error && r.data) return this.cache.set('profile', r.data);
      }),
    ];
    await Promise.allSettled(tasks);
  }

  /** Clear the sync queue (useful for testing / reset). */
  async clearQueue(): Promise<void> {
    await this.ensureCache();
    await this.cache.clearQueue();
  }

  /** Get current queue length (useful for UI badges). */
  async getQueueLength(): Promise<number> {
    await this.ensureCache();
    const queue = await this.cache.getQueue();
    return queue.length;
  }

  private async checkLastWriteWins(table: string, localTimestamp: string): Promise<boolean> {
    try {
      let remoteUpdatedAt: string | undefined;
      if (table === 'profiles') {
        const res = await this.adapter.getProfile();
        if (!res.error && res.data && (res.data as Record<string, unknown>).updated_at) {
          remoteUpdatedAt = (res.data as Record<string, unknown>).updated_at as string;
        }
      }
      if (remoteUpdatedAt) {
        return new Date(localTimestamp).getTime() >= new Date(remoteUpdatedAt).getTime();
      }
    } catch {
      // If check fails, default to applying the change
    }
    return true;
  }
}

export const syncAdapter = new InsForgeSyncAdapter();
