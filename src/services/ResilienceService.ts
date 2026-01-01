/**
 * ResilienceService.ts
 * Logic to calculate emotional resilience and prepare data for the Growth Dashboard.
 */
import { Quadrant } from '../data/emotionData';

export interface DailyResilience {
    date: string;
    score: number;
    dominantEmotion: string;
}

export interface HeatmapDay {
    date: string;
    intensity?: number;
    quadrant?: Quadrant | string;
    count?: number;
    hasData: boolean;
}

export interface IntensityData {
    label: string;
    value: number;
}

class ResilienceService {
    /**
     * calculateResilience
     * Logic: Resilience increases when a user completes a Full RULER flow
     * and reports a positive shift in the 'neuroCheck'.
     */
    getDashboardData(): DailyResilience[] {
        const logs = JSON.parse(localStorage.getItem('feelings_logs') || '[]');

        // Group by date and calculate average resilience
        const days: Record<string, { total: number, count: number, emotion: string }> = {};

        // Process last 7 days for the chart
        logs.forEach((entry: any) => {
            const date = new Date(entry.timestamp).toLocaleDateString();
            if (!days[date]) {
                days[date] = { total: 0, count: 0, emotion: entry.emotion?.name || '未知' };
            }

            let entryScore = 50; // Base score

            // Bonus for completing full RULER flow
            if (entry.understanding && entry.expressing && entry.regulating) {
                entryScore += 20;
            }

            // Bonus for reported positive shift
            if (entry.postMood === '感覺輕鬆多了') entryScore += 30;
            if (entry.postMood === '平靜了一些') entryScore += 15;

            days[date].total += entryScore;
            days[date].count += 1;
        });

        return Object.entries(days).map(([date, data]) => ({
            date,
            score: Math.min(100, Math.round(data.total / data.count)),
            dominantEmotion: data.emotion
        })).reverse().slice(-7); // Last 7 days
    }

    getOverallScore(): number {
        const data = this.getDashboardData();
        if (data.length === 0) return 0;
        const avg = data.reduce((acc, curr) => acc + curr.score, 0) / data.length;
        return Math.round(avg);
    }

    /**
     * getHeatmapData
     * Returns data for the last 30 days for heatmap visualization.
     */
    getHeatmapData(): HeatmapDay[] {
        const logs = JSON.parse(localStorage.getItem('feelings_logs') || '[]');
        const today = new Date();
        const heatmap: HeatmapDay[] = [];

        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = date.toLocaleDateString();

            const dayLogs = logs.filter((log: any) =>
                new Date(log.timestamp).toLocaleDateString() === dateStr
            );

            if (dayLogs.length > 0) {
                // Use the most frequent quadrant or the last one
                const latest = dayLogs[0];
                heatmap.push({
                    date: dateStr,
                    intensity: latest.intensity || 5,
                    quadrant: latest.emotion?.quadrant || 'gray',
                    count: dayLogs.length,
                    hasData: true
                });
            } else {
                heatmap.push({
                    date: dateStr,
                    hasData: false
                });
            }
        }
        return heatmap;
    }

    /**
     * getIntensityData
     * Returns last 7 logs with intensity values for bar chart.
     */
    getIntensityData(): IntensityData[] {
        const logs = JSON.parse(localStorage.getItem('feelings_logs') || '[]');
        return logs.slice(0, 7).map((log: any) => ({
            label: new Date(log.timestamp).toLocaleDateString([], { month: 'numeric', day: 'numeric' }),
            value: log.intensity || 5
        })).reverse();
    }
}

export const resilienceService = new ResilienceService();
