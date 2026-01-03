import { RulerLogEntry, RulerDraft } from '../types/RulerTypes';

class StorageService {
    private readonly KEYS = {
        LOGS: 'feelings_logs',
        DRAFT: 'ruler_draft'
    };

    /**
     * Save a completed RULER flow entry
     */
    saveLog(entry: RulerLogEntry): void {
        const logs = this.getLogs();
        const newLogs = [entry, ...logs];
        localStorage.setItem(this.KEYS.LOGS, JSON.stringify(newLogs));
    }

    /**
     * Retrieve all historical logs
     */
    getLogs(): RulerLogEntry[] {
        const stored = localStorage.getItem(this.KEYS.LOGS);
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Save a draft of the current flow
     */
    saveDraft(draft: RulerDraft): void {
        localStorage.setItem(this.KEYS.DRAFT, JSON.stringify(draft));
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
        localStorage.removeItem(this.KEYS.DRAFT);
    }
}

export const storageService = new StorageService();
