/**
 * ResilienceService.ts
 * Logic to calculate emotional engagement metrics and prepare data for the Growth Dashboard.
 *
 * ⚠️ 重要聲明：此處的「參與度指標」（原名「韌性分數」）反映使用者的記錄參與程度，
 * 並非臨床心理韌性評估。它不對應任何標準化心理量表（如 Connor-Davidson Resilience Scale），
 * 不應用於評估個人心理健康狀態。
 */
import { type Quadrant, PostMoodOptions } from '../data/emotionData';
import { type RulerLogEntry } from '../types/RulerTypes';


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

export interface GranularityData {
    uniqueEmotions: string[];
    totalPossible: number;
    score: number;
    level: 'beginner' | 'growing' | 'rich' | 'expert';
}

export interface StrategyDiversityData {
    usedStrategies: string[];
    totalPossible: number;
    score: number;
    level: 'starter' | 'developing' | 'diverse' | 'master';
}

// All available strategies across all quadrants
const ALL_STRATEGIES = [
    '引導式深呼吸', '5-4-3-2-1 接地法', '強效宣洩', '冰水刺激',
    '感恩清單', '傳遞喜悅', '目標設定', '慶祝舞動',
    '暖心儀式', '微小掌控', '自我慈悲', '觀察植物',
    '三分鐘靜坐', '慢讀時刻', '隨意塗鴉', '數位離線'
];

class ResilienceService {
    /**
     * getDashboardData
     * 計算每日「參與度指標」——反映使用者完成覺察流程的深度與主觀回饋。
     * 注意：此分數為參與激勵指標，非臨床韌性評估工具。
     */
    getDashboardData(logs: RulerLogEntry[]): DailyResilience[] {
        // Sort oldest → newest for consistent day ordering
        const sorted = [...logs].sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        // Group by date and calculate average resilience
        const days: Record<string, { total: number, count: number, emotion: string }> = {};

        // Process last 7 days for the chart
        sorted.forEach((entry: RulerLogEntry) => {
            const date = new Date(entry.timestamp).toLocaleDateString();
            if (!days[date]) {
                days[date] = { total: 0, count: 0, emotion: entry.emotions?.[0]?.name || '未知' };
            }

            let entryScore = 50; // Base score

            // Bonus for completing full check-in flow
            if (entry.understanding && entry.expressing && entry.regulating) {
                entryScore += 20;
            }

            // Bonus for reported positive shift
            if (entry.postMood === PostMoodOptions.MUCH_BETTER) entryScore += 30;
            if (entry.postMood === PostMoodOptions.SOMEWHAT_CALM) entryScore += 15;

            days[date].total += entryScore;
            days[date].count += 1;
        });

        return Object.entries(days).map(([date, data]) => ({
            date,
            score: Math.min(100, Math.round(data.total / data.count)),
            dominantEmotion: data.emotion
        })).slice(-7); // Last 7 days
    }

    getOverallScore(logs: RulerLogEntry[]): number {
        const data = this.getDashboardData(logs);
        if (data.length === 0) return 0;
        const avg = data.reduce((acc, curr) => acc + curr.score, 0) / data.length;
        return Math.round(avg);
    }

    /**
     * getHeatmapData
     * Returns data for the last 30 days for heatmap visualization.
     * Optimized: O(N) log processing + O(30) iteration
     */
    getHeatmapData(logs: RulerLogEntry[]): HeatmapDay[] {
        const today = new Date();
        const heatmap: HeatmapDay[] = [];

        // Sort oldest → newest so the last item is the latest log of each day
        const sorted = [...logs].sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        // Pre-process logs into a Map for O(1) lookup
        const logsByDate = new Map<string, RulerLogEntry[]>();
        sorted.forEach(log => {
            const dateStr = new Date(log.timestamp).toLocaleDateString();
            if (!logsByDate.has(dateStr)) {
                logsByDate.set(dateStr, []);
            }
            logsByDate.get(dateStr)?.push(log);
        });

        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = date.toLocaleDateString();

            const dayLogs = logsByDate.get(dateStr) || [];

            if (dayLogs.length > 0) {
                // Use the most recent log of the day
                const latest = dayLogs[dayLogs.length - 1];
                heatmap.push({
                    date: dateStr,
                    intensity: latest.intensity || 5,
                    quadrant: latest.emotions?.[0]?.quadrant || 'gray',
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
    getIntensityData(logs: RulerLogEntry[]): IntensityData[] {
        const sorted = [...logs].sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        return sorted.slice(-7).map((log: RulerLogEntry) => ({
            label: new Date(log.timestamp).toLocaleDateString([], { month: 'numeric', day: 'numeric' }),
            value: log.intensity || 5
        }));
    }

    /**
     * getEmotionalGranularity
     * Calculates the diversity of emotions the user has identified.
     * Higher granularity = better emotional awareness (Lisa Feldman Barrett's research)
     */
    getEmotionalGranularity(logs: RulerLogEntry[]): GranularityData {
        const uniqueEmotions = new Set<string>();

        logs.forEach((log: RulerLogEntry) => {
            log.emotions?.forEach(emotion => {
                if (emotion?.name) {
                    uniqueEmotions.add(emotion.name);
                }
            });
        });

        const uniqueList = Array.from(uniqueEmotions);
        const totalPossible = 100; // Total emotions in emotionData.ts
        const score = Math.round((uniqueList.length / totalPossible) * 100);

        let level: GranularityData['level'] = 'beginner';
        if (score >= 30) level = 'expert';
        else if (score >= 15) level = 'rich';
        else if (score >= 5) level = 'growing';

        return {
            uniqueEmotions: uniqueList,
            totalPossible,
            score,
            level
        };
    }

    /**
     * getStrategyDiversity
     * Calculates the variety of regulation strategies the user has practiced.
     * More diverse strategies = better emotional flexibility
     */
    getStrategyDiversity(logs: RulerLogEntry[]): StrategyDiversityData {
        const usedStrategies = new Set<string>();

        logs.forEach((log: RulerLogEntry) => {
            if (log.regulating?.selectedStrategies) {
                log.regulating.selectedStrategies.forEach((s: string) => usedStrategies.add(s));
            }
        });

        const usedList = Array.from(usedStrategies);
        const totalPossible = ALL_STRATEGIES.length;
        const score = Math.round((usedList.length / totalPossible) * 100);

        let level: StrategyDiversityData['level'] = 'starter';
        if (score >= 75) level = 'master';
        else if (score >= 50) level = 'diverse';
        else if (score >= 25) level = 'developing';

        return {
            usedStrategies: usedList,
            totalPossible,
            score,
            level
        };
    }
}

export const resilienceService = new ResilienceService();
