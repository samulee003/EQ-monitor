/**
 * 數據適配器接口
 * 
 * 所有數據操作必須通過此接口，禁止直接訪問 localStorage。
 * 未來遷移至 Supabase 時，只需實現新的 Adapter 即可無縫切換。
 */

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
} from './types';
import { type RulerLogEntry, type RulerDraft } from '../types/RulerTypes';
import { type UserProgress } from '../types/HabitTypes';

export interface IDataAdapter {
  // ============================================
  // 生命週期
  // ============================================

  /** 初始化適配器（異步準備連線等） */
  initialize(): Promise<void>;

  /** 當前適配器是否可用 */
  isAvailable(): boolean;

  // ============================================
  // 認證
  // ============================================

  auth: {
    /** 郵箱密碼註冊 */
    signUp(email: string, password: string, metadata?: Record<string, unknown>): Promise<AuthResult>;

    /** 郵箱密碼登入 */
    signIn(email: string, password: string): Promise<AuthResult>;

    /** OAuth 登入 */
    signInWithOAuth(provider: 'google' | 'github'): Promise<void>;

    /** 登出 */
    signOut(): Promise<void>;

    /** 獲取當前用戶 */
    getUser(): Promise<UserProfile | null>;

    /** 監聽認證狀態變化 */
    onAuthChange(callback: (user: UserProfile | null) => void): () => void;

    /** 更新密碼 */
    updatePassword(oldPassword: string, newPassword: string): Promise<AuthResult>;

    /** 刪除帳號 */
    deleteAccount(): Promise<boolean>;
  };

  // ============================================
  // 情緒記錄 (CRUD)
  // ============================================

  logs: {
    /** 創建記錄 */
    create(log: Omit<RulerLogEntry, 'id'> & { id?: string }): Promise<RulerLogEntry>;

    /** 分頁查詢 */
    list(options?: ListOptions): Promise<PaginatedResult<RulerLogEntry>>;

    /** 根據 ID 查詢 */
    getById(id: string): Promise<RulerLogEntry | null>;

    /** 更新記錄 */
    update(id: string, data: Partial<RulerLogEntry>): Promise<RulerLogEntry>;

    /** 刪除記錄 */
    delete(id: string): Promise<void>;

    /** 批量導入 */
    import(logs: RulerLogEntry[]): Promise<ImportResult>;

    /** 導出全部 */
    export(): Promise<RulerLogEntry[]>;
  };

  // ============================================
  // 草稿
  // ============================================

  draft: {
    /** 保存當前流程草稿 */
    save(draft: RulerDraft): Promise<void>;

    /** 讀取草稿 */
    get(): Promise<RulerDraft | null>;

    /** 清除草稿 */
    clear(): Promise<void>;
  };

  // ============================================
  // 用戶資料與進度
  // ============================================

  profile: {
    /** 獲取用戶資料 */
    get(): Promise<UserProfile | null>;

    /** 更新用戶資料 */
    update(data: Partial<UserProfile>): Promise<UserProfile>;

    /** 獲取進度 */
    getProgress(): Promise<UserProgress | null>;

    /** 保存進度 */
    saveProgress(progress: UserProgress): Promise<void>;
  };

  // ============================================
  // 成就系統
  // ============================================

  achievements: {
    /** 列出所有已解鎖成就 */
    list(): Promise<AchievementRecord[]>;

    /** 解鎖成就 */
    unlock(key: string): Promise<AchievementRecord>;

    /** 標記為已查看 */
    markAsViewed(id: string): Promise<void>;
  };

  // ============================================
  // 連續記錄
  // ============================================

  streak: {
    /** 獲取連續記錄 */
    get(): Promise<StreakInfo | null>;

    /** 更新連續記錄 */
    update(streak: StreakInfo): Promise<void>;
  };

  // ============================================
  // 通用設置 (鍵值對)
  // ============================================

  settings: {
    /** 讀取設置 */
    get<T = unknown>(key: string): Promise<T | null>;

    /** 寫入設置 */
    set<T = unknown>(key: string, value: T): Promise<void>;

    /** 刪除設置 */
    remove(key: string): Promise<void>;
  };

  // ============================================
  // 同步 (供離線/雲端同步使用)
  // ============================================

  sync: {
    /** 獲取同步狀態 */
    getStatus(): SyncStatus;

    /** 推送本地變更到後端 */
    push(changes: SyncChange[]): Promise<SyncResult>;

    /** 從後端拉取變更 */
    pull(since: string | null): Promise<SyncChange[]>;
  };
}
