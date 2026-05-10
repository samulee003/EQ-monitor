import { logger } from '../utils/logger';
/**
 * StorageService - 數據存儲服務
 * 
 * 此服務現為 IDataAdapter 的輕量門面，所有實際存儲操作委派給適配器。
 * 未來遷移至後端時，無需修改此文件——只需在適配器層切換實現。
 */

import { dataAdapter } from '../adapters';
import { type ImportResult } from '../adapters/types';
import { type RulerLogEntry, type RulerDraft } from '../types/RulerTypes';
import { type UserProgress } from '../types/HabitTypes';

// 向後兼容的導出接口
export type { ImportResult } from '../adapters/types';

class StorageService {
  /**
   * Set current user ID for data isolation
   * @deprecated 適配器自動管理用戶 ID，此方法保留向後兼容
   */
  setUserId(_userId: string | null): void {
    // LocalStorageAdapter 已自動從 CURRENT_USER 讀取用戶 ID
    // 未來如需手動切換用戶，可在此擴展
  }

  // ---------- 進度 ----------

  /**
   * Save user progress (streak, achievements)
   */
  async saveProgress(progress: UserProgress): Promise<void> {
    await dataAdapter.profile.saveProgress(progress);
  }

  /**
   * Get user progress
   */
  async getProgress(): Promise<UserProgress | null> {
    return await dataAdapter.profile.getProgress();
  }

  // ---------- 日誌 ----------

  /**
   * Save a completed check-in flow entry
   */
  async saveLog(entry: Omit<RulerLogEntry, 'id'> & { id?: string }): Promise<void> {
    await dataAdapter.logs.create(entry);
  }

  /**
   * Retrieve all historical logs
   */
  async getLogs(): Promise<RulerLogEntry[]> {
    const result = await dataAdapter.logs.export();
    return result;
  }

  /**
   * Import logs from JSON data
   * Validates data structure and merges with existing logs (skipping duplicates by timestamp)
   */
  async importLogs(jsonData: string): Promise<ImportResult> {
    try {
      const parsed = JSON.parse(jsonData);

      if (!Array.isArray(parsed)) {
        return {
          success: false,
          imported: 0,
          skipped: 0,
          message: '檔案格式錯誤：需要是陣列格式',
        };
      }

      return await dataAdapter.logs.import(parsed as RulerLogEntry[]);
    } catch (e) {
      logger.error('[StorageService] Import failed', { error: String(e) });
      return {
        success: false,
        imported: 0,
        skipped: 0,
        message: '檔案解析失敗，請確認是有效的 JSON 格式',
      };
    }
  }

  // ---------- 草稿 ----------

  /**
   * Save a draft of the current flow
   */
  async saveDraft(draft: RulerDraft): Promise<void> {
    await dataAdapter.draft.save(draft);
  }

  /**
   * Retrieve the current draft if it exists
   */
  async getDraft(): Promise<RulerDraft | null> {
    return await dataAdapter.draft.get();
  }

  /**
   * Clear the current draft
   */
  async clearDraft(): Promise<void> {
    await dataAdapter.draft.clear();
  }
}

// 單例導出
export const storageService = new StorageService();
