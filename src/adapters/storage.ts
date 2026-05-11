/**
 * 統一存儲模組
 *
 * 合併了原 LocalStorageAdapter + StorageService + settingsStore。
 * 所有數據操作通過此模組完成，底層為 localStorage + AES 加密。
 *
 * 🔒 安全功能保留：PBKDF2 密碼哈希、隨機加密金鑰、PIN 哈希
 */

import { StorageKeys } from './types';
import {
  type UserProfile,
  type AuthResult,
  type ImportResult,
  type AchievementRecord,
  type StreakInfo,
} from './types';
import { type RulerLogEntry, type RulerDraft } from '../types/RulerTypes';
import { type UserProgress } from '../types/HabitTypes';
import { encryptData, decryptData, isEncrypted } from '../utils/crypto';
import { hashPassword, verifyPassword, isLegacyHash } from '../utils/passwordHash';

// ============================================
// 工具函數
// ============================================

const generateId = (): string =>
  `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

const ensureId = (entry: RulerLogEntry & { id?: string }): RulerLogEntry => ({
  ...entry,
  id: entry.id || generateId(),
});

const safeParse = <T>(json: string | null, fallback: T): T => {
  if (!json) return fallback;
  try { return JSON.parse(json) as T; }
  catch { return fallback; }
};

const userKey = (base: string, uid?: string | null): string =>
  uid ? `${base}_${uid}` : base;

// ============================================
// 加密存儲底層
// ============================================

async function storeGet<T>(key: string, fallback: T): Promise<T> {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  if (isEncrypted(raw)) {
    const decrypted = await decryptData(raw);
    if (decrypted !== null) return safeParse(decrypted, fallback);
  }
  return safeParse(raw, fallback);
}

async function storeSet<T>(key: string, value: T): Promise<void> {
  const json = JSON.stringify(value);
  const encrypted = await encryptData(json);
  localStorage.setItem(key, encrypted);
}

function storeRemove(key: string): void {
  localStorage.removeItem(key);
}

// ============================================
// 內部類型
// ============================================

interface StoredUser extends UserProfile {
  passwordHash: string;
  lastLoginAt?: string;
}

const toUserProfile = (s: StoredUser): UserProfile => ({
  id: s.id,
  email: s.email,
  displayName: s.displayName,
  avatar: s.avatar,
  timezone: s.timezone || 'Asia/Taipei',
  language: s.language || 'zh-TW',
  themePreference: s.themePreference || 'system',
  privacyEnabled: s.privacyEnabled || false,
  notificationSettings: s.notificationSettings || {},
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
});

// ============================================
// 模組級狀態
// ============================================

let currentUserId: string | null = null;
const authListeners = new Set<(user: UserProfile | null) => void>();

// 日誌緩存
let logsCache: RulerLogEntry[] | null = null;

// 設置緩存（來自原 settingsStore）
const settingsCache = new Map<string, unknown>();
const stringCache = new Map<string, string | null>();

// ============================================
// 初始化
// ============================================

export async function initialize(): Promise<void> {
  const currentUser = await storeGet<UserProfile | null>(StorageKeys.CURRENT_USER, null);
  if (currentUser) currentUserId = currentUser.id;
}

export function isAvailable(): boolean {
  try {
    const t = '__imxin_test__';
    localStorage.setItem(t, '1');
    localStorage.removeItem(t);
    return true;
  } catch { return false; }
}

// ============================================
// 認證
// ============================================

export const auth = {
  async signUp(email: string, password: string, metadata?: Record<string, unknown>): Promise<AuthResult> {
    const users = await storeGet<Record<string, StoredUser>>(StorageKeys.USERS, {});
    const norm = email.toLowerCase().trim();

    if (users[norm]) return { success: false, error: '該郵箱已被註冊' };
    if (password.length < 6) return { success: false, error: '密碼至少需要6個字符' };

    const now = new Date().toISOString();
    const newUser: StoredUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      email: norm,
      displayName: (metadata?.displayName as string || norm.split('@')[0]).trim(),
      passwordHash: await hashPassword(password),
      createdAt: now,
      lastLoginAt: now,
      timezone: 'Asia/Taipei',
      language: 'zh-TW',
      themePreference: 'system',
      privacyEnabled: false,
      notificationSettings: {},
    };

    users[norm] = newUser;
    await storeSet(StorageKeys.USERS, users);

    const profile = toUserProfile(newUser);
    await storeSet(StorageKeys.CURRENT_USER, profile);
    currentUserId = profile.id;
    return { success: true, user: profile };
  },

  async signIn(email: string, password: string): Promise<AuthResult> {
    const users = await storeGet<Record<string, StoredUser>>(StorageKeys.USERS, {});
    const norm = email.toLowerCase().trim();
    const stored = users[norm];

    if (!stored) return { success: false, error: '用戶不存在' };

    const match = await verifyPassword(password, stored.passwordHash);
    if (!match) return { success: false, error: '密碼錯誤' };

    // 自動遷移舊版 DJB2 哈希 → PBKDF2
    if (isLegacyHash(stored.passwordHash)) {
      stored.passwordHash = await hashPassword(password);
    }

    stored.lastLoginAt = new Date().toISOString();
    users[norm] = stored;
    await storeSet(StorageKeys.USERS, users);

    const profile = toUserProfile(stored);
    await storeSet(StorageKeys.CURRENT_USER, profile);
    currentUserId = profile.id;
    return { success: true, user: profile };
  },

  async signOut(): Promise<void> {
    storeRemove(StorageKeys.CURRENT_USER);
    currentUserId = null;
    clearLogsCache();
    settingsCache.clear();
    stringCache.clear();
    authListeners.forEach(cb => cb(null));
  },

  async getUser(): Promise<UserProfile | null> {
    return storeGet<UserProfile | null>(StorageKeys.CURRENT_USER, null);
  },

  onAuthChange(callback: (user: UserProfile | null) => void): () => void {
    authListeners.add(callback);
    return () => authListeners.delete(callback);
  },

  async updatePassword(oldPassword: string, newPassword: string): Promise<AuthResult> {
    const cur = await auth.getUser();
    if (!cur?.email) return { success: false, error: '未登入' };

    const users = await storeGet<Record<string, StoredUser>>(StorageKeys.USERS, {});
    const stored = users[cur.email];
    if (!stored) return { success: false, error: '用戶不存在' };

    if (!(await verifyPassword(oldPassword, stored.passwordHash)))
      return { success: false, error: '原密碼錯誤' };
    if (newPassword.length < 6) return { success: false, error: '新密碼至少需要6個字符' };

    stored.passwordHash = await hashPassword(newPassword);
    users[cur.email] = stored;
    await storeSet(StorageKeys.USERS, users);
    return { success: true };
  },

  async deleteAccount(): Promise<boolean> {
    const cur = await auth.getUser();
    if (!cur?.email) return false;

    const users = await storeGet<Record<string, StoredUser>>(StorageKeys.USERS, {});
    delete users[cur.email];
    await storeSet(StorageKeys.USERS, users);

    storeRemove(userKey(StorageKeys.LOGS, cur.id));
    storeRemove(userKey(StorageKeys.DRAFT, cur.id));
    storeRemove(userKey(StorageKeys.PROGRESS, cur.id));
    storeRemove(StorageKeys.CURRENT_USER);
    currentUserId = null;
    return true;
  },
};

// ============================================
// 日誌 CRUD
// ============================================

async function getAllLogs(): Promise<RulerLogEntry[]> {
  if (logsCache) return logsCache;
  const raw = await storeGet<RulerLogEntry[]>(userKey(StorageKeys.LOGS, currentUserId), []);
  logsCache = raw.map(log => (log as RulerLogEntry & { id?: string }).id ? log : ensureId(log));
  return logsCache;
}

export function clearLogsCache(): void {
  logsCache = null;
}

export const logs = {
  async create(log: Omit<RulerLogEntry, 'id'> & { id?: string }): Promise<RulerLogEntry> {
    await getAllLogs();
    const entry: RulerLogEntry = {
      ...log,
      id: log.id || generateId(),
      timestamp: log.timestamp || new Date().toISOString(),
    };
    if (logsCache) logsCache.unshift(entry);
    await storeSet(userKey(StorageKeys.LOGS, currentUserId), logsCache || [entry]);
    return entry;
  },

  async export(): Promise<RulerLogEntry[]> {
    return getAllLogs();
  },

  async getById(id: string): Promise<RulerLogEntry | null> {
    const all = await getAllLogs();
    return all.find(l => l.id === id) || null;
  },

  async update(id: string, data: Partial<RulerLogEntry>): Promise<RulerLogEntry> {
    const all = await getAllLogs();
    const idx = all.findIndex(l => l.id === id);
    if (idx === -1) throw new Error(`記錄不存在: ${id}`);
    const updated = { ...all[idx], ...data };
    all[idx] = updated;
    logsCache = all;
    await storeSet(userKey(StorageKeys.LOGS, currentUserId), all);
    return updated;
  },

  async delete(id: string): Promise<void> {
    const all = await getAllLogs();
    const filtered = all.filter(l => l.id !== id);
    logsCache = filtered;
    await storeSet(userKey(StorageKeys.LOGS, currentUserId), filtered);
  },

  async import(entries: RulerLogEntry[]): Promise<ImportResult> {
    const existing = await getAllLogs();
    const existingTs = new Set(existing.map(l => l.timestamp));
    const valid = entries.filter(l => l.timestamp && Array.isArray(l.emotions));
    const newEntries = valid.filter(e => !existingTs.has(e.timestamp));
    const skipped = valid.length - newEntries.length;

    if (newEntries.length > 0) {
      const merged = [...newEntries, ...existing].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      logsCache = merged;
      await storeSet(userKey(StorageKeys.LOGS, currentUserId), merged);
    }

    return {
      success: true,
      imported: newEntries.length,
      skipped,
      message: `成功匯入 ${newEntries.length} 筆記錄${skipped > 0 ? `，跳過 ${skipped} 筆重複記錄` : ''}`,
    };
  },
};

// ============================================
// 草稿
// ============================================

export const draft = {
  async save(d: RulerDraft): Promise<void> {
    await storeSet(userKey(StorageKeys.DRAFT, currentUserId), d);
  },
  async get(): Promise<RulerDraft | null> {
    return storeGet<RulerDraft | null>(userKey(StorageKeys.DRAFT, currentUserId), null);
  },
  async clear(): Promise<void> {
    storeRemove(userKey(StorageKeys.DRAFT, currentUserId));
  },
};

// ============================================
// 用戶資料與進度
// ============================================

export const profile = {
  async get(): Promise<UserProfile | null> {
    return auth.getUser();
  },

  async update(data: Partial<UserProfile>): Promise<UserProfile> {
    const cur = await auth.getUser();
    if (!cur) throw new Error('未登入，無法更新資料');

    const updated: UserProfile = { ...cur, ...data, updatedAt: new Date().toISOString() };
    await storeSet(StorageKeys.CURRENT_USER, updated);

    const users = await storeGet<Record<string, StoredUser>>(StorageKeys.USERS, {});
    const stored = users[cur.email || ''];
    if (stored) {
      if (data.displayName) stored.displayName = data.displayName;
      if (data.avatar !== undefined) stored.avatar = data.avatar;
      if (data.themePreference) stored.themePreference = data.themePreference;
      if (data.language) stored.language = data.language;
      if (data.privacyEnabled !== undefined) stored.privacyEnabled = data.privacyEnabled;
      if (data.notificationSettings) stored.notificationSettings = data.notificationSettings as Record<string, unknown>;
      await storeSet(StorageKeys.USERS, users);
    }
    return updated;
  },

  async getProgress(): Promise<UserProgress | null> {
    return storeGet<UserProgress | null>(userKey(StorageKeys.PROGRESS, currentUserId), null);
  },

  async saveProgress(progress: UserProgress): Promise<void> {
    await storeSet(userKey(StorageKeys.PROGRESS, currentUserId), progress);
  },
};

// ============================================
// 成就
// ============================================

const achievementsKey = () => `imxin_achievements_${currentUserId || 'guest'}`;

export const achievements = {
  async list(): Promise<AchievementRecord[]> {
    return storeGet<AchievementRecord[]>(achievementsKey(), []);
  },
  async unlock(key: string): Promise<AchievementRecord> {
    const list = await achievements.list();
    const existing = list.find(a => a.achievementKey === key);
    if (existing) return existing;

    const record: AchievementRecord = {
      id: generateId(),
      achievementKey: key,
      unlockedAt: new Date().toISOString(),
      viewed: false,
    };
    await storeSet(achievementsKey(), [...list, record]);
    return record;
  },
  async markAsViewed(id: string): Promise<void> {
    const list = await achievements.list();
    await storeSet(achievementsKey(), list.map(a => a.id === id ? { ...a, viewed: true } : a));
  },
};

// ============================================
// 連續記錄
// ============================================

const streakKey = () => `imxin_streak_${currentUserId || 'guest'}`;

export const streak = {
  async get(): Promise<StreakInfo | null> {
    return storeGet<StreakInfo | null>(streakKey(), null);
  },
  async update(s: StreakInfo): Promise<void> {
    await storeSet(streakKey(), s);
  },
};

// ============================================
// 通用設置（鍵值對）
// ============================================

export const settings = {
  async get<T>(key: string): Promise<T | null> {
    return storeGet<T | null>(key, null);
  },
  async set<T>(key: string, value: T): Promise<void> {
    await storeSet(key, value);
  },
  remove(key: string): void {
    storeRemove(key);
  },
};

// ============================================
// 同步設置快捷方法（來自原 settingsStore）
// ============================================

function getCached<T>(key: string, fallback?: T): T | null {
  if (settingsCache.has(key)) return settingsCache.get(key) as T;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback ?? null;
    const parsed = JSON.parse(raw) as T;
    settingsCache.set(key, parsed);
    return parsed;
  } catch { return fallback ?? null; }
}

function getString(key: string, fallback?: string): string | null {
  if (stringCache.has(key)) return stringCache.get(key) ?? fallback ?? null;
  try {
    const value = localStorage.getItem(key);
    stringCache.set(key, value);
    return value ?? fallback ?? null;
  } catch { return fallback ?? null; }
}

function setString(key: string, value: string): void {
  stringCache.set(key, value);
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

// --- 快捷方法 ---

export function getLanguage(): 'zh-TW' | 'zh-CN' {
  return getString(StorageKeys.LANGUAGE) === 'zh-CN' ? 'zh-CN' : 'zh-TW';
}
export function setLanguage(lang: 'zh-TW' | 'zh-CN'): void {
  setString(StorageKeys.LANGUAGE, lang);
}

export function getTheme(): 'dark' | 'light' | 'system' {
  const s = getString(StorageKeys.THEME);
  return s === 'dark' || s === 'light' || s === 'system' ? s : 'system';
}
export function setTheme(theme: 'dark' | 'light' | 'system'): void {
  setString(StorageKeys.THEME, theme);
}

export function getNotificationSettings<T>(): T | null {
  return getCached<T>(StorageKeys.NOTIFICATION_SETTINGS);
}
export function setNotificationSettings<T>(s: T): void {
  settingsCache.set(StorageKeys.NOTIFICATION_SETTINGS, s);
  try { localStorage.setItem(StorageKeys.NOTIFICATION_SETTINGS, JSON.stringify(s)); } catch { /* ignore */ }
}

export function hasPrivacyPin(): boolean {
  const s = getString(StorageKeys.PRIVACY_PIN);
  return s !== null && s.length > 0;
}

export async function setPrivacyPin(pin: string): Promise<void> {
  setString(StorageKeys.PRIVACY_PIN, await hashPassword(pin));
}

export async function verifyPrivacyPin(pin: string): Promise<boolean> {
  const stored = getString(StorageKeys.PRIVACY_PIN);
  if (!stored) return false;
  // 兼容舊版明文 PIN
  if (!stored.startsWith('$')) {
    if (pin === stored) { await setPrivacyPin(pin); return true; }
    return false;
  }
  return verifyPassword(pin, stored);
}

export function removePrivacyPin(): void {
  storeRemove(StorageKeys.PRIVACY_PIN);
  storeRemove(StorageKeys.PRIVACY_ENABLED);
  settingsCache.delete(StorageKeys.PRIVACY_PIN);
  settingsCache.delete(StorageKeys.PRIVACY_ENABLED);
  stringCache.delete(StorageKeys.PRIVACY_PIN);
  stringCache.delete(StorageKeys.PRIVACY_ENABLED);
}

export function isPrivacyEnabled(): boolean {
  return getString(StorageKeys.PRIVACY_ENABLED) === 'true';
}
export function setPrivacyEnabled(enabled: boolean): void {
  setString(StorageKeys.PRIVACY_ENABLED, String(enabled));
}

export function isOnboardingCompleted(): boolean {
  return getString(StorageKeys.ONBOARDING_COMPLETED) === 'true';
}
export function setOnboardingCompleted(completed: boolean): void {
  setString(StorageKeys.ONBOARDING_COMPLETED, String(completed));
}

export function getUserRole(): string | null {
  return getString(StorageKeys.USER_ROLE);
}
export function setUserRole(role: string): void {
  setString(StorageKeys.USER_ROLE, role);
}

// ============================================
// StorageService 門面兼容（向後兼容導出）
// ============================================

export const storageService = {
  setUserId: (_userId: string | null): void => { /* 保留向後兼容 */ },
  saveProgress: (p: UserProgress) => profile.saveProgress(p),
  getProgress: () => profile.getProgress(),
  saveLog: (entry: Omit<RulerLogEntry, 'id'> & { id?: string }) => logs.create(entry),
  getLogs: () => logs.export(),
  async importLogs(jsonData: string): Promise<ImportResult> {
    try {
      const parsed = JSON.parse(jsonData);
      if (!Array.isArray(parsed)) return { success: false, imported: 0, skipped: 0, message: '檔案格式錯誤：需要是陣列格式' };
      return logs.import(parsed as RulerLogEntry[]);
    } catch {
      return { success: false, imported: 0, skipped: 0, message: '檔案解析失敗，請確認是有效的 JSON 格式' };
    }
  },
  saveDraft: (d: RulerDraft) => draft.save(d),
  getDraft: () => draft.get(),
  clearDraft: () => draft.clear(),
};

// settingsStore 兼容對象（用於 NotificationService 等的 async get/set）
export const settingsStore = {
  get: async <T>(key: string, fallback?: T): Promise<T | null> => getCached(key, fallback),
  set: async <T>(key: string, value: T): Promise<void> => {
    settingsCache.set(key, value);
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  },
  getCached,
  getString,
  setString,
  remove: (key: string) => {
    settingsCache.delete(key);
    stringCache.delete(key);
    storeRemove(key);
  },
  clearCache: () => { settingsCache.clear(); stringCache.clear(); },
  getLanguage, setLanguage,
  getTheme, setTheme,
  getNotificationSettings, setNotificationSettings,
  hasPrivacyPin, setPrivacyPin, verifyPrivacyPin, removePrivacyPin,
  isPrivacyEnabled, setPrivacyEnabled,
  isOnboardingCompleted, setOnboardingCompleted,
  getUserRole, setUserRole,
};

// dataAdapter 兼容對象（保持消費者無需改動）
export const dataAdapter = {
  auth,
  logs,
  draft,
  profile,
  achievements,
  streak,
  settings,
  initialize,
  isAvailable,
};
