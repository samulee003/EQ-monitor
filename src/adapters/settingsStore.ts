import { logger } from '../utils/logger';

/**
 * SettingsStore - 統一鍵值存儲（內部緩存 + 異步兼容）
 *
 * 用於簡單的用戶偏好設置（語言、主題、通知等）。
 * 底層仍為 localStorage，但通過統一工具訪問，便於未來遷移。
 *
 * 🔄 緩存策略：
 * - 讀取：先查緩存，未命中再讀 localStorage
 * - 寫入：同時更新緩存和 localStorage
 * - getCached(): 同步讀取緩存（僅限已初始化場景）
 * - get(): 異步讀取（未來可替換為遠端存儲）
 *
 * ⚠️ 注意：此工具僅用於簡單設置項。核心數據（日誌、用戶資料等）
 * 必須使用 dataAdapter（async），以確保後端遷移兼容性。
 *
 * 🔒 安全：隱私 PIN 使用 PBKDF2 哈希存儲，不保存明文。
 */

import { StorageKeys } from './types';
import { hashPassword, verifyPassword } from '../utils/passwordHash';

class SettingsStore {
  private cache = new Map<string, unknown>();
  private stringCache = new Map<string, string | null>();

  // ---------- 核心讀寫方法 ----------

  /**
   * 異步讀取（未來可替換為遠端存儲）
   * 當前實現：先查緩存，再讀 localStorage
   */
  async get<T>(key: string, fallback?: T): Promise<T | null> {
    // 1. 先查緩存
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }

    // 2. 讀取 localStorage
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback ?? null;
      const parsed = JSON.parse(raw) as T;
      this.cache.set(key, parsed);
      return parsed;
    } catch {
      return fallback ?? null;
    }
  }

  /**
   * 同步讀取緩存（僅限已初始化場景）
   * 用於 React 組件中需要同步訪問的場景（如初始狀態判斷）
   */
  getCached<T>(key: string, fallback?: T): T | null {
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }

    // 降級：同步讀取 localStorage 並緩存
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback ?? null;
      const parsed = JSON.parse(raw) as T;
      this.cache.set(key, parsed);
      return parsed;
    } catch {
      return fallback ?? null;
    }
  }

  /**
   * 同步讀取字符串（向後兼容）
   */
  getString(key: string, fallback?: string): string | null {
    if (this.stringCache.has(key)) {
      return this.stringCache.get(key) ?? fallback ?? null;
    }

    try {
      const value = localStorage.getItem(key);
      this.stringCache.set(key, value);
      return value ?? fallback ?? null;
    } catch {
      return fallback ?? null;
    }
  }

  /**
   * 異步寫入（同時更新緩存和 localStorage）
   */
  async set<T>(key: string, value: T): Promise<void> {
    this.cache.set(key, value);
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      logger.error(`[SettingsStore] Failed to set ${key}`, { error: String(e) });
    }
  }

  /**
   * 同步寫入字符串（同時更新緩存）
   */
  setString(key: string, value: string): void {
    this.stringCache.set(key, value);
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      logger.error(`[SettingsStore] Failed to set ${key}`, { error: String(e) });
    }
  }

  /**
   * 刪除（同時清除緩存）
   */
  remove(key: string): void {
    this.cache.delete(key);
    this.stringCache.delete(key);
    try {
      localStorage.removeItem(key);
    } catch (e) {
      logger.error(`[SettingsStore] Failed to remove ${key}`, { error: String(e) });
    }
  }

  /**
   * 清除所有緩存（用於登出或調試）
   */
  clearCache(): void {
    this.cache.clear();
    this.stringCache.clear();
  }

  // ---------- 常用設置快捷方法 ----------

  getLanguage(): 'zh-TW' | 'zh-CN' {
    const saved = this.getString(StorageKeys.LANGUAGE);
    return saved === 'zh-CN' ? 'zh-CN' : 'zh-TW';
  }

  setLanguage(lang: 'zh-TW' | 'zh-CN'): void {
    this.setString(StorageKeys.LANGUAGE, lang);
  }

  getTheme(): 'dark' | 'light' | 'system' {
    const saved = this.getString(StorageKeys.THEME);
    if (saved === 'dark' || saved === 'light' || saved === 'system') {
      return saved;
    }
    return 'system';
  }

  setTheme(theme: 'dark' | 'light' | 'system'): void {
    this.setString(StorageKeys.THEME, theme);
  }

  getNotificationSettings<T>(): T | null {
    return this.getCached<T>(StorageKeys.NOTIFICATION_SETTINGS);
  }

  setNotificationSettings<T>(settings: T): void {
    // 同步寫入緩存 + localStorage
    this.cache.set(StorageKeys.NOTIFICATION_SETTINGS, settings);
    try {
      localStorage.setItem(StorageKeys.NOTIFICATION_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      logger.error('[SettingsStore] Failed to set notification settings', { error: String(e) });
    }
  }

  /**
   * 檢查是否已設定隱私 PIN
   *
   * 同步方法：僅檢查存儲中是否存在 PIN 哈希值。
   * 用於初始 UI 狀態判斷（如：決定是否顯示解鎖介面）。
   */
  hasPrivacyPin(): boolean {
    const stored = this.getString(StorageKeys.PRIVACY_PIN);
    return stored !== null && stored.length > 0;
  }

  /**
   * 設定隱私 PIN（哈希存儲）
   *
   * 🔒 安全：PIN 經 PBKDF2 哈希後存儲，不保存明文。
   * 此方法為異步，因 PBKDF2 計算需要時間。
   *
   * @param pin 4 位數明文 PIN
   */
  async setPrivacyPin(pin: string): Promise<void> {
    const hashed = await hashPassword(pin);
    this.setString(StorageKeys.PRIVACY_PIN, hashed);
  }

  /**
   * 驗證隱私 PIN
   *
   * 🔒 安全：比對用戶輸入與存儲的哈希值。
   * 自動兼容舊版明文 PIN（驗證成功後自動遷移為哈希）。
   *
   * @param pin 用戶輸入的 PIN
   * @returns 是否匹配
   */
  async verifyPrivacyPin(pin: string): Promise<boolean> {
    const stored = this.getString(StorageKeys.PRIVACY_PIN);
    if (!stored) return false;

    // 兼容舊版明文 PIN（4 位純數字，無前綴）
    if (!stored.startsWith('$')) {
      if (pin === stored) {
        await this.setPrivacyPin(pin);
        return true;
      }
      return false;
    }

    return verifyPassword(pin, stored);
  }

  removePrivacyPin(): void {
    this.remove(StorageKeys.PRIVACY_PIN);
    this.remove(StorageKeys.PRIVACY_ENABLED);
  }

  isPrivacyEnabled(): boolean {
    return this.getString(StorageKeys.PRIVACY_ENABLED) === 'true';
  }

  setPrivacyEnabled(enabled: boolean): void {
    this.setString(StorageKeys.PRIVACY_ENABLED, String(enabled));
  }

  isOnboardingCompleted(): boolean {
    return this.getString(StorageKeys.ONBOARDING_COMPLETED) === 'true';
  }

  setOnboardingCompleted(completed: boolean): void {
    this.setString(StorageKeys.ONBOARDING_COMPLETED, String(completed));
  }

  getUserRole(): string | null {
    return this.getString(StorageKeys.USER_ROLE);
  }

  setUserRole(role: string): void {
    this.setString(StorageKeys.USER_ROLE, role);
  }
}

export const settingsStore = new SettingsStore();
