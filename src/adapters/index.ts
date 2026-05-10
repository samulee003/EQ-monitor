/**
 * 數據適配器統一導出
 * 
 * 使用方式:
 * ```ts
 * import { dataAdapter } from '@/adapters';
 * const logs = await dataAdapter.logs.list();
 * ```
 */

export type { IDataAdapter } from './IDataAdapter';
export { LocalStorageAdapter, localStorageAdapter } from './LocalStorageAdapter';
export { settingsStore } from './settingsStore';
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

// 全局默認適配器實例
// 未來切換至 Supabase 時，只需更改此行
import { localStorageAdapter } from './LocalStorageAdapter';
export const dataAdapter = localStorageAdapter;
