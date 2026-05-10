/**
 * 存儲模組類型定義
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
