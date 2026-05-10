/**
 * 數據適配器統一導出
 *
 * 使用方式:
 * ```ts
 * import { dataAdapter } from '@/adapters';
 * const logs = await dataAdapter.logs.export();
 * ```
 */

// 統一存儲模組
export {
  dataAdapter,
  settingsStore,
  storageService,
  // 核心操作（可直接使用，無需通過 dataAdapter）
  auth,
  logs,
  draft,
  profile,
  achievements,
  streak,
  settings,
  initialize,
  isAvailable,
  clearLogsCache,
  // 設置快捷方法
  getLanguage, setLanguage,
  getTheme, setTheme,
  getNotificationSettings, setNotificationSettings,
  hasPrivacyPin, setPrivacyPin, verifyPrivacyPin, removePrivacyPin,
  isPrivacyEnabled, setPrivacyEnabled,
  isOnboardingCompleted, setOnboardingCompleted,
  getUserRole, setUserRole,
} from './storage';

export * from './types';

// Bot 後端同步服務（獨立於數據適配器，但通過統一入口暴露便於發現）
export {
  botSyncService,
  type DashboardSummary,
  type WeeklyReport,
  type QuadrantDistribution,
  type BotSyncError,
  type BotSyncResult,
} from '../services/BotSyncService';
