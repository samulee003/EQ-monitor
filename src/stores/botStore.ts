/**
 * Bot Store - Bot 後端數據狀態管理
 *
 * 使用 Zustand 管理與 Bot 後端同步的用戶統計、週報數據與加載狀態。
 * 與 appStore.ts 風格保持一致。
 */

import { create } from 'zustand';
import { botSyncService, type DashboardSummary, type WeeklyReport, type BotSyncError } from '../services/BotSyncService';
import { logger } from '../utils/logger';

interface BotState {
  // 數據
  summary: DashboardSummary | null;
  weeklyReport: WeeklyReport | null;

  // 加載狀態
  isLoadingSummary: boolean;
  isLoadingWeekly: boolean;

  // 錯誤狀態
  summaryError: BotSyncError | null;
  weeklyError: BotSyncError | null;

  // 最後更新時間
  lastSummaryFetch: number | null;
  lastWeeklyFetch: number | null;

  // Actions
  fetchSummary: (lineUserId: string) => Promise<void>;
  fetchWeeklyReport: (lineUserId: string) => Promise<void>;
  clearErrors: () => void;
  reset: () => void;
}

const initialState = {
  summary: null,
  weeklyReport: null,
  isLoadingSummary: false,
  isLoadingWeekly: false,
  summaryError: null,
  weeklyError: null,
  lastSummaryFetch: null,
  lastWeeklyFetch: null,
};

export const useBotStore = create<BotState>((set) => ({
  ...initialState,

  fetchSummary: async (lineUserId: string) => {
    set({ isLoadingSummary: true, summaryError: null });
    try {
      const result = await botSyncService.getDashboardSummary(lineUserId);
      if (result.error) {
        set({ summaryError: result.error, isLoadingSummary: false });
        logger.warn('[botStore] fetchSummary failed', { error: result.error.message });
      } else {
        set({
          summary: result.data,
          lastSummaryFetch: Date.now(),
          isLoadingSummary: false,
        });
      }
    } catch (err) {
      const error: BotSyncError = {
        message: err instanceof Error ? err.message : '未知錯誤',
      };
      set({ summaryError: error, isLoadingSummary: false });
      logger.error('[botStore] fetchSummary exception', { error: error.message });
    }
  },

  fetchWeeklyReport: async (lineUserId: string) => {
    set({ isLoadingWeekly: true, weeklyError: null });
    try {
      const result = await botSyncService.getWeeklyReport(lineUserId);
      if (result.error) {
        set({ weeklyError: result.error, isLoadingWeekly: false });
        logger.warn('[botStore] fetchWeeklyReport failed', { error: result.error.message });
      } else {
        set({
          weeklyReport: result.data,
          lastWeeklyFetch: Date.now(),
          isLoadingWeekly: false,
        });
      }
    } catch (err) {
      const error: BotSyncError = {
        message: err instanceof Error ? err.message : '未知錯誤',
      };
      set({ weeklyError: error, isLoadingWeekly: false });
      logger.error('[botStore] fetchWeeklyReport exception', { error: error.message });
    }
  },

  clearErrors: () => set({ summaryError: null, weeklyError: null }),

  reset: () => set(initialState),
}));
