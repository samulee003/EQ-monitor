/**
 * 數據適配器類型定義
 * 
 * 統一所有數據層操作類型，為後續遷移至 Supabase 等後端奠定基礎。
 */



// ============================================
// 用戶相關類型
// ============================================

export interface UserProfile {
  id: string;
  email?: string;
  displayName?: string;
  avatar?: string;
  timezone: string;
  language: string;
  themePreference: string;
  privacyEnabled: boolean;
  notificationSettings: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
  token?: string;
}

// ============================================
// 情緒記錄相關類型
// ============================================

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

export interface ListOptions {
  page?: number;
  perPage?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  message: string;
}

// ============================================
// 成就與連續記錄
// ============================================

export interface AchievementRecord {
  id: string;
  achievementKey: string;
  unlockedAt: string;
  viewed: boolean;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastCheckinDate: string | null;
  checkinCount: number;
  weeklyCount: number;
  monthlyCount: number;
}

// ============================================
// 同步相關
// ============================================

export interface SyncChange {
  id: string;
  table: string;
  operation: 'create' | 'update' | 'delete';
  data: unknown;
  timestamp: string;
}

export interface SyncStatus {
  lastSyncAt: string | null;
  pendingChanges: number;
  isOnline: boolean;
}

export interface SyncResult {
  success: boolean;
  conflicts: SyncChange[];
  syncedAt: string;
}

// ============================================
// 設置項枚舉 (避免魔法字符串)
// ============================================

export const StorageKeys = {
  // 核心數據
  LOGS: 'feelings_logs',
  DRAFT: 'ruler_draft',
  PROGRESS: 'user_progress',

  // 用戶認證
  USERS: 'imxin_users',
  CURRENT_USER: 'imxin_current_user',

  // 偏好設置
  LANGUAGE: 'jinxin-language',
  THEME: 'imxin-theme',
  NOTIFICATION_SETTINGS: 'imxin_notification_settings',

  // 隱私
  PRIVACY_PIN: 'imxin_privacy_pin',
  PRIVACY_ENABLED: 'imxin_privacy_enabled',

  // 引導
  ONBOARDING_COMPLETED: 'imxin_onboarding_completed',
  USER_ROLE: 'imxin_user_role',
} as const;

export type StorageKey = typeof StorageKeys[keyof typeof StorageKeys];
