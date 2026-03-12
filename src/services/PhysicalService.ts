/**
 * PhysicalService.ts
 * Integrates physical health data (simulated) to provide physiological context to emotional states.
 */

export interface PhysicalData {
    sleepHours: number;
    steps: number;
    heartRateVariability?: number; // HRV is a key indicator of stress resilience
}

class PhysicalService {
    /**
     * getDailyStats
     * Simulate fetching health data from a source like Apple Health or Google Fit.
     */
    async getDailyStats(): Promise<PhysicalData> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Return mock data that could influence emotional outlook
        // We simulate a "low sleep" day to trigger specific AI insights
        return {
            sleepHours: 5.5,
            steps: 3200,
            heartRateVariability: 45
        };
    }

    /**
     * getCorrelationMessage
     * Analyzes physical data to find possible emotional triggers.
     */
    analyzeCorrelation(data: PhysicalData): string | null {
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
