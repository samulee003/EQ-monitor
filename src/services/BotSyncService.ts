import { logger } from '../utils/logger';

/**
 * BotSyncService - 與 Bot 後端 API 通信的數據同步層
 *
 * 提供與今心 Bot 後端 /api/dashboard/:lineUserId/* 端點的通信能力，
 * 用於獲取用戶摘要與週報數據。
 */

export interface DashboardSummary {
  totalSessions: number;
  streakDays: number;
  lastSessionDate: string | null;
}

export interface QuadrantDistribution {
  red: number;
  yellow: number;
  blue: number;
  green: number;
}

export interface WeeklyReport {
  totalSessions: number;
  quadrantDistribution: QuadrantDistribution;
}

export interface BotSyncError {
  message: string;
  status?: number;
}

export type BotSyncResult<T> =
  | { data: T; error: null }
  | { data: null; error: BotSyncError };

class BotSyncService {
  private baseUrl: string;

  constructor() {
    // 優先從環境變量讀取，其次從本地設置讀取，最後使用默認值
    const envUrl = import.meta.env.VITE_BOT_API_URL;
    const settingsUrl = this.getSettingsApiUrl();
    this.baseUrl = envUrl || settingsUrl || 'http://localhost:3000';
  }

  private getSettingsApiUrl(): string | null {
    try {
      return localStorage.getItem('imxin_bot_api_url');
    } catch {
      return null;
    }
  }

  /**
   * 動態更新 API Base URL（用於設置頁面或開發調試）
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, '');
    try {
      localStorage.setItem('imxin_bot_api_url', this.baseUrl);
    } catch (e) {
      logger.warn('[BotSyncService] Failed to persist API URL', { error: String(e) });
    }
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  private async request<T>(endpoint: string): Promise<BotSyncResult<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        logger.error('[BotSyncService] API error', {
          endpoint,
          status: response.status,
          body: errorBody,
        });
        return {
          data: null,
          error: {
            message: `API 錯誤: ${response.statusText}`,
            status: response.status,
          },
        };
      }

      const data = (await response.json()) as T;
      return { data, error: null };
    } catch (err) {
      logger.error('[BotSyncService] Network error', {
        endpoint,
        error: String(err),
      });
      return {
        data: null,
        error: {
          message: err instanceof Error ? err.message : '網絡請求失敗',
        },
      };
    }
  }

  /**
   * 獲取用戶儀表盤摘要
   */
  async getDashboardSummary(lineUserId: string): Promise<BotSyncResult<DashboardSummary>> {
    if (!lineUserId.trim()) {
      return {
        data: null,
        error: { message: 'lineUserId 不能為空' },
      };
    }
    return this.request<DashboardSummary>(`/api/dashboard/${encodeURIComponent(lineUserId)}/summary`);
  }

  /**
   * 獲取用戶週報數據
   */
  async getWeeklyReport(lineUserId: string): Promise<BotSyncResult<WeeklyReport>> {
    if (!lineUserId.trim()) {
      return {
        data: null,
        error: { message: 'lineUserId 不能為空' },
      };
    }
    return this.request<WeeklyReport>(`/api/dashboard/${encodeURIComponent(lineUserId)}/weekly-report`);
  }
}

export const botSyncService = new BotSyncService();
