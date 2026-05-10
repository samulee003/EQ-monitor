/**
 * LocalStorage 數據適配器實現
 * 
 * 當前階段的默認適配器，所有數據存儲於瀏覽器 LocalStorage。
 * 未來可無縫替換為 SupabaseAdapter 等後端適配器。
 */

import { type IDataAdapter } from './IDataAdapter';
import {
  type UserProfile,
  type AuthResult,
  type PaginatedResult,
  type ListOptions,
  type ImportResult,
  type AchievementRecord,
  type StreakInfo,
  type SyncChange,
  type SyncStatus,
  type SyncResult,
  StorageKeys,
} from './types';
import { type RulerLogEntry, type RulerDraft } from '../types/RulerTypes';
import { type UserProgress } from '../types/HabitTypes';
import { encryptData, decryptData, isEncrypted } from '../utils/crypto';
import { hashPassword, verifyPassword, isLegacyHash } from '../utils/passwordHash';

// ============================================
// 工具函數
// ============================================

/** 生成唯一 ID */
const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

/** 確保日誌條目具有有效 ID（用於舊版數據遷移） */
const ensureId = (entry: RulerLogEntry & { id?: string }): RulerLogEntry => {
  return { ...entry, id: entry.id || generateId() };
};

/** 安全解析 JSON */
const safeParse = <T>(json: string | null, fallback: T): T => {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
};

/** 獲取帶用戶前綴的存儲鍵 */
const getUserKey = (baseKey: string, userId?: string | null): string => {
  if (userId) {
    return `${baseKey}_${userId}`;
  }
  return baseKey;
};

// ============================================
// 存儲輔助
// ============================================

class LocalStorageStore {
  private encryptEnabled = true;

  async get<T>(key: string, fallback: T): Promise<T> {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;

    if (this.encryptEnabled && isEncrypted(raw)) {
      const decrypted = await decryptData(raw);
      if (decrypted !== null) {
        return safeParse(decrypted, fallback);
      }
    }

    return safeParse(raw, fallback);
  }

  async set<T>(key: string, value: T): Promise<void> {
    const json = JSON.stringify(value);
    if (this.encryptEnabled) {
      try {
        const encrypted = await encryptData(json);
        localStorage.setItem(key, encrypted);
      } catch {
        localStorage.setItem(key, json);
      }
    } else {
      localStorage.setItem(key, json);
    }
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }
}

const store = new LocalStorageStore();

// ============================================
// LocalStorageAdapter 實現
// ============================================

export class LocalStorageAdapter implements IDataAdapter {
  private currentUserId: string | null = null;
  private authListeners: Set<(user: UserProfile | null) => void> = new Set();

  // ---------- 生命週期 ----------

  async initialize(): Promise<void> {
    const currentUser = await store.get<UserProfile | null>(StorageKeys.CURRENT_USER, null);
    if (currentUser) {
      this.currentUserId = currentUser.id;
    }
  }

  isAvailable(): boolean {
    try {
      const test = '__imxin_test__';
      localStorage.setItem(test, '1');
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  // ---------- 認證 ----------

  auth = {
    signUp: async (email: string, password: string, metadata?: Record<string, unknown>): Promise<AuthResult> => {
      const users = await store.get<Record<string, StoredUser>>(StorageKeys.USERS, {});
      const normalizedEmail = email.toLowerCase().trim();

      if (users[normalizedEmail]) {
        return { success: false, error: '該郵箱已被註冊' };
      }

      if (password.length < 6) {
        return { success: false, error: '密碼至少需要6個字符' };
      }

      const now = new Date().toISOString();
      const newUser: StoredUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        email: normalizedEmail,
        displayName: (metadata?.displayName as string || normalizedEmail.split('@')[0]).trim(),
        passwordHash: await hashPassword(password),
        createdAt: now,
        lastLoginAt: now,
        timezone: 'Asia/Taipei',
        language: 'zh-TW',
        themePreference: 'system',
        privacyEnabled: false,
        notificationSettings: {},
      };

      users[normalizedEmail] = newUser;
      await store.set(StorageKeys.USERS, users);

      const userProfile = toUserProfile(newUser);
      await store.set(StorageKeys.CURRENT_USER, userProfile);

      return { success: true, user: userProfile };
    },

    signIn: async (email: string, password: string): Promise<AuthResult> => {
      const users = await store.get<Record<string, StoredUser>>(StorageKeys.USERS, {});
      const normalizedEmail = email.toLowerCase().trim();
      const storedUser = users[normalizedEmail];

      if (!storedUser) {
        return { success: false, error: '用戶不存在' };
      }

      const isMatch = await verifyPassword(password, storedUser.passwordHash);
      if (!isMatch) {
        return { success: false, error: '密碼錯誤' };
      }

      // 自動遷移：若為舊版 DJB2 哈希，升級為 PBKDF2
      if (isLegacyHash(storedUser.passwordHash)) {
        storedUser.passwordHash = await hashPassword(password);
      }

      storedUser.lastLoginAt = new Date().toISOString();
      users[normalizedEmail] = storedUser;
      await store.set(StorageKeys.USERS, users);

      const userProfile = toUserProfile(storedUser);
      await store.set(StorageKeys.CURRENT_USER, userProfile);

      return { success: true, user: userProfile };
    },

    signInWithOAuth: async (_provider: 'google' | 'github'): Promise<void> => {
      throw new Error('OAuth 登入需要後端支持');
    },

    signOut: async (): Promise<void> => {
      store.remove(StorageKeys.CURRENT_USER);
      this.currentUserId = null;
      this.authListeners.forEach(cb => cb(null));
    },

    getUser: async (): Promise<UserProfile | null> => {
      return await store.get<UserProfile | null>(StorageKeys.CURRENT_USER, null);
    },

    onAuthChange: (callback: (user: UserProfile | null) => void): (() => void) => {
      this.authListeners.add(callback);
      return () => this.authListeners.delete(callback);
    },

    updatePassword: async (oldPassword: string, newPassword: string): Promise<AuthResult> => {
      const currentUser = await this.auth.getUser();
      if (!currentUser?.email) {
        return { success: false, error: '未登入' };
      }

      const users = await store.get<Record<string, StoredUser>>(StorageKeys.USERS, {});
      const storedUser = users[currentUser.email];

      if (!storedUser) {
        return { success: false, error: '用戶不存在' };
      }

      const isMatch = await verifyPassword(oldPassword, storedUser.passwordHash);
      if (!isMatch) {
        return { success: false, error: '原密碼錯誤' };
      }

      if (newPassword.length < 6) {
        return { success: false, error: '新密碼至少需要6個字符' };
      }

      storedUser.passwordHash = await hashPassword(newPassword);
      users[currentUser.email] = storedUser;
      await store.set(StorageKeys.USERS, users);

      return { success: true };
    },

    deleteAccount: async (): Promise<boolean> => {
      const currentUser = await this.auth.getUser();
      if (!currentUser?.email) return false;

      const users = await store.get<Record<string, StoredUser>>(StorageKeys.USERS, {});
      delete users[currentUser.email];
      await store.set(StorageKeys.USERS, users);

      store.remove(getUserKey(StorageKeys.LOGS, currentUser.id));
      store.remove(getUserKey(StorageKeys.DRAFT, currentUser.id));
      store.remove(getUserKey(StorageKeys.PROGRESS, currentUser.id));
      store.remove(StorageKeys.CURRENT_USER);

      this.currentUserId = null;
      return true;
    },
  };

  // ---------- 情緒記錄 ----------

  logs = {
    create: async (log: Omit<RulerLogEntry, 'id'> & { id?: string }): Promise<RulerLogEntry> => {
      await this.logsInternal.getAll();
      const newLog: RulerLogEntry = {
        ...log,
        id: log.id || generateId(),
        timestamp: log.timestamp || new Date().toISOString(),
      };
      // 使用緩存 append 而非全量寫入
      this.logsInternal.append(newLog);
      return newLog;
    },

    list: async (options?: ListOptions): Promise<PaginatedResult<RulerLogEntry>> => {
      const allLogs = await this.logsInternal.getAll();
      const page = options?.page || 1;
      const perPage = options?.perPage || 10;
      const order = options?.order || 'desc';

      const sorted = [...allLogs].sort((a, b) => {
        const aTime = new Date(a.timestamp).getTime();
        const bTime = new Date(b.timestamp).getTime();
        return order === 'asc' ? aTime - bTime : bTime - aTime;
      });

      const start = (page - 1) * perPage;
      const end = start + perPage;
      const data = sorted.slice(start, end);

      return {
        data,
        total: allLogs.length,
        page,
        perPage,
        hasMore: end < allLogs.length,
      };
    },

    getById: async (id: string): Promise<RulerLogEntry | null> => {
      const logs = await this.logsInternal.getAll();
      return logs.find(log => log.id === id) || null;
    },

    update: async (id: string, data: Partial<RulerLogEntry>): Promise<RulerLogEntry> => {
      const logs = await this.logsInternal.getAll();
      const index = logs.findIndex(log => log.id === id);

      if (index === -1) {
        throw new Error(`記錄不存在: ${id}`);
      }

      const updated = { ...logs[index], ...data };
      logs[index] = updated;
      await this.logsInternal.saveAll(logs);
      return updated;
    },

    delete: async (id: string): Promise<void> => {
      const logs = await this.logsInternal.getAll();
      const filtered = logs.filter(log => log.id !== id);
      await this.logsInternal.saveAll(filtered);
    },

    import: async (logs: RulerLogEntry[]): Promise<ImportResult> => {
      const existingLogs = await this.logsInternal.getAll();
      const existingTimestamps = new Set(existingLogs.map(log => log.timestamp));

      const validEntries = logs.filter(log => log.timestamp && Array.isArray(log.emotions));
      const newEntries = validEntries.filter(entry => !existingTimestamps.has(entry.timestamp));
      const skippedCount = validEntries.length - newEntries.length;

      if (newEntries.length > 0) {
        const merged = [...newEntries, ...existingLogs].sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        await this.logsInternal.saveAll(merged);
      }

      return {
        success: true,
        imported: newEntries.length,
        skipped: skippedCount,
        message: `成功匯入 ${newEntries.length} 筆記錄${skippedCount > 0 ? `，跳過 ${skippedCount} 筆重複記錄` : ''}`,
      };
    },

    export: async (): Promise<RulerLogEntry[]> => {
      return await this.logsInternal.getAll();
    },
  };

  // 內部輔助：帶緩存的日誌讀寫
  private logsCache: RulerLogEntry[] | null = null;
  private logsDirty = false;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  private logsInternal = {
    getAll: async (): Promise<RulerLogEntry[]> => {
      if (this.logsCache) return this.logsCache;
      const raw = await store.get<RulerLogEntry[]>(getUserKey(StorageKeys.LOGS, this.currentUserId), []);
      // 遷移舊版數據：確保每條記錄都有 id
      this.logsCache = raw.map(log => (log as RulerLogEntry & { id?: string }).id ? log : ensureId(log));
      return this.logsCache;
    },

    saveAll: async (logs: RulerLogEntry[]): Promise<void> => {
      this.logsCache = logs;
      this.logsDirty = true;
      this.debounceFlush();
    },

    append: async (log: RulerLogEntry): Promise<void> => {
      if (this.logsCache) {
        this.logsCache.unshift(log);
      }
      // 立即寫入 localStorage，確保數據一致性
      // 防抖僅用於 update/delete 等批量操作
      await store.set(getUserKey(StorageKeys.LOGS, this.currentUserId), this.logsCache || [log]);
    },
  };

  /** 防抖刷新：300ms 內多次寫入只觸發一次 localStorage 寫入 */
  private debounceFlush(): void {
    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.flushTimer = setTimeout(async () => {
      await this.flushToStorage();
    }, 300);
  }

  /** 立即將緩存數據寫入 localStorage */
  private async flushToStorage(): Promise<void> {
    if (!this.logsDirty || !this.logsCache) return;
    this.logsDirty = false;
    await store.set(getUserKey(StorageKeys.LOGS, this.currentUserId), this.logsCache);
  }

  /** 清除日誌緩存（用於登出或測試） */
  clearLogsCache(): void {
    this.logsCache = null;
    this.logsDirty = false;
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }

  // ---------- 草稿 ----------

  draft = {
    save: async (draft: RulerDraft): Promise<void> => {
      await store.set(getUserKey(StorageKeys.DRAFT, this.currentUserId), draft);
    },

    get: async (): Promise<RulerDraft | null> => {
      return await store.get<RulerDraft | null>(getUserKey(StorageKeys.DRAFT, this.currentUserId), null);
    },

    clear: async (): Promise<void> => {
      store.remove(getUserKey(StorageKeys.DRAFT, this.currentUserId));
    },
  };

  // ---------- 用戶資料與進度 ----------

  profile = {
    get: async (): Promise<UserProfile | null> => {
      return this.auth.getUser();
    },

    update: async (data: Partial<UserProfile>): Promise<UserProfile> => {
      const current = await this.auth.getUser();
      if (!current) {
        throw new Error('未登入，無法更新資料');
      }

      const updated: UserProfile = { ...current, ...data, updatedAt: new Date().toISOString() };
      await store.set(StorageKeys.CURRENT_USER, updated);

      const users = await store.get<Record<string, StoredUser>>(StorageKeys.USERS, {});
      const stored = users[current.email || ''];
      if (stored) {
        if (data.displayName) stored.displayName = data.displayName;
        if (data.avatar !== undefined) stored.avatar = data.avatar;
        if (data.themePreference) stored.themePreference = data.themePreference;
        if (data.language) stored.language = data.language;
        if (data.privacyEnabled !== undefined) stored.privacyEnabled = data.privacyEnabled;
        if (data.notificationSettings) stored.notificationSettings = data.notificationSettings as Record<string, unknown>;
        await store.set(StorageKeys.USERS, users);
      }

      return updated;
    },

    getProgress: async (): Promise<UserProgress | null> => {
      return await store.get<UserProgress | null>(getUserKey(StorageKeys.PROGRESS, this.currentUserId), null);
    },

    saveProgress: async (progress: UserProgress): Promise<void> => {
      await store.set(getUserKey(StorageKeys.PROGRESS, this.currentUserId), progress);
    },
  };

  // ---------- 成就 ----------

  achievements = {
    list: async (): Promise<AchievementRecord[]> => {
      return await store.get<AchievementRecord[]>(`imxin_achievements_${this.currentUserId || 'guest'}`, []);
    },

    unlock: async (key: string): Promise<AchievementRecord> => {
      const list = await this.achievements.list();
      if (list.some(a => a.achievementKey === key)) {
        return list.find(a => a.achievementKey === key)!;
      }

      const record: AchievementRecord = {
        id: generateId(),
        achievementKey: key,
        unlockedAt: new Date().toISOString(),
        viewed: false,
      };

      await store.set(`imxin_achievements_${this.currentUserId || 'guest'}`, [...list, record]);
      return record;
    },

    markAsViewed: async (id: string): Promise<void> => {
      const list = await this.achievements.list();
      const updated = list.map(a => a.id === id ? { ...a, viewed: true } : a);
      await store.set(`imxin_achievements_${this.currentUserId || 'guest'}`, updated);
    },
  };

  // ---------- 連續記錄 ----------

  streak = {
    get: async (): Promise<StreakInfo | null> => {
      return await store.get<StreakInfo | null>(`imxin_streak_${this.currentUserId || 'guest'}`, null);
    },

    update: async (streak: StreakInfo): Promise<void> => {
      await store.set(`imxin_streak_${this.currentUserId || 'guest'}`, streak);
    },
  };

  // ---------- 通用設置 ----------

  settings = {
    get: async <T = unknown>(key: string): Promise<T | null> => {
      return await store.get<T | null>(key, null);
    },

    set: async <T = unknown>(_key: string, value: T): Promise<void> => {
      await store.set(_key, value);
    },

    remove: async (key: string): Promise<void> => {
      store.remove(key);
    },
  };

  // ---------- 同步 ----------

  sync = {
    getStatus: (): SyncStatus => ({
      lastSyncAt: null,
      pendingChanges: 0,
      isOnline: navigator.onLine,
    }),

    push: async (_changes: SyncChange[]): Promise<SyncResult> => ({
      success: true,
      conflicts: [],
      syncedAt: new Date().toISOString(),
    }),

    pull: async (_since: string | null): Promise<SyncChange[]> => [],
  };
}

// ============================================
// 內部類型與工具
// ============================================

interface StoredUser extends UserProfile {
  passwordHash: string;
  lastLoginAt?: string;
}

const toUserProfile = (stored: StoredUser): UserProfile => ({
  id: stored.id,
  email: stored.email,
  displayName: stored.displayName,
  avatar: stored.avatar,
  timezone: stored.timezone || 'Asia/Taipei',
  language: stored.language || 'zh-TW',
  themePreference: stored.themePreference || 'system',
  privacyEnabled: stored.privacyEnabled || false,
  notificationSettings: stored.notificationSettings || {},
  createdAt: stored.createdAt,
  updatedAt: stored.updatedAt,
});

// ============================================
// 單例導出
// ============================================

export const localStorageAdapter = new LocalStorageAdapter();
