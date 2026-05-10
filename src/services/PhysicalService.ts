/**
 * PhysicalService.ts
 * Integrates physical health data to provide physiological context to emotional states.
 *
 * NOTE: Currently no real health data source is connected.
 * - getDailyStats() returns null until Apple HealthKit / Google Fit integration is ready.
 * - Users can save manual stats via saveManualStats() for a basic self-report flow.
 * - AI insights will gracefully handle null physical data (no misleading advice from fake data).
 */

export interface PhysicalData {
    sleepHours: number;
    steps: number;
    heartRateVariability?: number; // HRV is a key indicator of stress resilience
}

class PhysicalService {
    /**
     * getDailyStats
     * Returns daily physical health data if available.
     * Currently returns null — no real data source connected yet.
     * Future: integrate Apple HealthKit / Google Fit API.
     */
    async getDailyStats(): Promise<PhysicalData | null> {
        // No real data source available yet.
        // Returning null instead of fake data to prevent misleading AI analysis.
        return null;
    }

    /**
     * saveManualStats
     * Allows users to manually input their physical data for the day.
     * Data is stored per-day and can be retrieved via getDailyStats().
     */
    async saveManualStats(data: PhysicalData): Promise<void> {
        try {
            const key = `imxin_physical_${new Date().toISOString().split('T')[0]}`;
            localStorage.setItem(key, JSON.stringify(data));
        } catch {
            // Silently fail — physical data is optional
        }
    }

    /**
     * analyzeCorrelation
     * Analyzes physical data to find possible emotional triggers.
     * Returns null if no data is provided.
     */
    analyzeCorrelation(data: PhysicalData | null): string | null {
        if (!data) return null;

        if (data.sleepHours < 6) {
            return "昨晚睡眠較少，睡眠與情緒調節相互影響。如有持續睡眠困擾，建議諮詢醫師。";
        }
        if (data.steps < 3000) {
            return "今日活動量較少，身體活動與情緒狀態存在關聯。請依照自己的狀態調整。";
        }
        return null;
    }
}

export const physicalService = new PhysicalService();
