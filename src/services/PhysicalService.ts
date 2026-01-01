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
            return "昨晚睡眠不足 6 小時，這可能會降低你的情緒調節能力及抗壓力。";
        }
        if (data.steps < 3000) {
            return "今日體力活動較少，適度的運動或許能幫助改善低落或焦慮感。";
        }
        return null;
    }
}

export const physicalService = new PhysicalService();
