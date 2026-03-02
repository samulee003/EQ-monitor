import { RulerLogEntry, RulerDraft } from '../types/RulerTypes';

export interface ImportResult {
    success: boolean;
    imported: number;
    skipped: number;
    message: string;
}

class StorageService {
    private userId: string | null = null;

    /**
     * Set current user ID for data isolation
     */
    setUserId(userId: string | null): void {
        this.userId = userId;
    }

    /**
     * Get storage key with user prefix
     */
    private getKey(baseKey: string): string {
        if (this.userId) {
            return `${baseKey}_${this.userId}`;
        }
        return baseKey;
    }

    private readonly KEYS = {
        LOGS: 'feelings_logs',
        DRAFT: 'ruler_draft',
        PROGRESS: 'user_progress'
    };

    /**
     * Save user progress (streak, achievements)
     */
    saveProgress(progress: any): void {
        localStorage.setItem(this.getKey(this.KEYS.PROGRESS), JSON.stringify(progress));
    }

    /**
     * Get user progress
     */
    getProgress(): any {
        const stored = localStorage.getItem(this.getKey(this.KEYS.PROGRESS));
        return stored ? JSON.parse(stored) : null;
    }


    /**
     * Save a completed RULER flow entry
     */
    saveLog(entry: RulerLogEntry): void {
        const logs = this.getLogs();
        const newLogs = [entry, ...logs];
        localStorage.setItem(this.getKey(this.KEYS.LOGS), JSON.stringify(newLogs));
    }

    /**
     * Retrieve all historical logs
     */
    getLogs(): RulerLogEntry[] {
        const stored = localStorage.getItem(this.getKey(this.KEYS.LOGS));
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Import logs from JSON data
     * Validates data structure and merges with existing logs (skipping duplicates by timestamp)
     */
    importLogs(jsonData: string): ImportResult {
        try {
            const parsed = JSON.parse(jsonData);

            // Validate that it's an array
            if (!Array.isArray(parsed)) {
                return {
                    success: false,
                    imported: 0,
                    skipped: 0,
                    message: '檔案格式錯誤：需要是陣列格式'
                };
            }

            // Validate each entry has required fields
            const validEntries: RulerLogEntry[] = [];
            for (const entry of parsed) {
                if (entry.timestamp && entry.emotion && typeof entry.emotion === 'object') {
                    validEntries.push(entry);
                }
            }

            if (validEntries.length === 0) {
                return {
                    success: false,
                    imported: 0,
                    skipped: parsed.length,
                    message: '沒有找到有效的記錄'
                };
            }

            // Get existing logs and their timestamps
            const existingLogs = this.getLogs();
            const existingTimestamps = new Set(existingLogs.map(log => log.timestamp));

            // Filter out duplicates
            const newEntries = validEntries.filter(entry => !existingTimestamps.has(entry.timestamp));
            const skippedCount = validEntries.length - newEntries.length;

            if (newEntries.length === 0) {
                return {
                    success: true,
                    imported: 0,
                    skipped: skippedCount,
                    message: `所有 ${skippedCount} 筆記錄已存在，無需匯入`
                };
            }

            // Merge and sort by timestamp (newest first)
            const mergedLogs = [...newEntries, ...existingLogs].sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            localStorage.setItem(this.getKey(this.KEYS.LOGS), JSON.stringify(mergedLogs));

            return {
                success: true,
                imported: newEntries.length,
                skipped: skippedCount,
                message: `成功匯入 ${newEntries.length} 筆記錄${skippedCount > 0 ? `，跳過 ${skippedCount} 筆重複記錄` : ''}`
            };
        } catch (e) {
            console.error('Import failed:', e);
            return {
                success: false,
                imported: 0,
                skipped: 0,
                message: '檔案解析失敗，請確認是有效的 JSON 格式'
            };
        }
    }

    /**
     * Save a draft of the current flow
     */
    saveDraft(draft: RulerDraft): void {
        localStorage.setItem(this.getKey(this.KEYS.DRAFT), JSON.stringify(draft));
    }

    /**
     * Retrieve the current draft if it exists
     */
    getDraft(): RulerDraft | null {
        const stored = localStorage.getItem(this.KEYS.DRAFT);
        return stored ? JSON.parse(stored) : null;
    }

    /**
     * Clear the current draft
     */
    clearDraft(): void {
        localStorage.removeItem(this.getKey(this.KEYS.DRAFT));
    }
}

export const storageService = new StorageService();

