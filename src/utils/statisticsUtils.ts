import { type RulerLogEntry } from '../types/RulerTypes';
import { type Quadrant } from '../data/emotionData';
import { type StreakData } from '../types/HabitTypes';

/**
 * 情緒統計工具函數
 */

export interface EmotionStats {
    totalEntries: number;
    quadrantDistribution: Record<Quadrant, number>;
    averageIntensity: number;
    mostFrequentEmotion: string | null;
    mostFrequentQuadrant: Quadrant | null;
    streakDays: number;
    weeklyEntries: number;
    monthlyEntries: number;
}

/**
 * 計算情緒統計數據
 */
export function calculateEmotionStats(logs: RulerLogEntry[]): EmotionStats {
    if (logs.length === 0) {
        return {
            totalEntries: 0,
            quadrantDistribution: { red: 0, yellow: 0, blue: 0, green: 0 },
            averageIntensity: 0,
            mostFrequentEmotion: null,
            mostFrequentQuadrant: null,
            streakDays: 0,
            weeklyEntries: 0,
            monthlyEntries: 0,
        };
    }

    // 計算象限分佈
    const quadrantCount: Record<Quadrant, number> = { red: 0, yellow: 0, blue: 0, green: 0 };
    const emotionCount: Record<string, number> = {};
    let totalIntensity = 0;

    logs.forEach(log => {
        log.emotions?.forEach(emotion => {
            if (emotion?.quadrant) {
                quadrantCount[emotion.quadrant]++;
            }
            if (emotion?.name) {
                emotionCount[emotion.name] = (emotionCount[emotion.name] || 0) + 1;
            }
        });
        totalIntensity += log.intensity;
    });

    // 找出最常見的情緒
    let mostFrequentEmotion: string | null = null;
    let maxEmotionCount = 0;
    Object.entries(emotionCount).forEach(([name, count]) => {
        if (count > maxEmotionCount) {
            maxEmotionCount = count;
            mostFrequentEmotion = name;
        }
    });

    // 找出最常見的象限
    let mostFrequentQuadrant: Quadrant | null = null;
    let maxQuadrantCount = 0;
    Object.entries(quadrantCount).forEach(([quadrant, count]) => {
        if (count > maxQuadrantCount) {
            maxQuadrantCount = count;
            mostFrequentQuadrant = quadrant as Quadrant;
        }
    });

    // 計算連續天數
    const streakDays = calculateStreak(logs);

    // 計算本週和本月記錄數
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const weeklyEntries = logs.filter(log => new Date(log.timestamp) >= weekAgo).length;
    const monthlyEntries = logs.filter(log => new Date(log.timestamp) >= monthAgo).length;

    return {
        totalEntries: logs.length,
        quadrantDistribution: quadrantCount,
        averageIntensity: Math.round((totalIntensity / logs.length) * 10) / 10,
        mostFrequentEmotion,
        mostFrequentQuadrant,
        streakDays,
        weeklyEntries,
        monthlyEntries,
    };
}

/**
 * 統一連續天數計算算法
 *
 * 這是項目中唯一的連續天數計算實現。
 * HabitService 和其他模組都應使用此函數，避免算法不一致。
 *
 * 算法邏輯：
 * 1. 將日誌按日期去重（同一天多條記錄算一天）
 * 2. 按日期降序排列
 * 3. 當前連續天數：從最近記錄日開始，必須是今天或昨天
 * 4. 歷史最長連續天數：遍歷所有日期找最長連續段
 */
export function calculateStreakDetailed(logs: RulerLogEntry[]): StreakData {
    if (logs.length === 0) {
        return { currentStreak: 0, longestStreak: 0, lastLogDate: null };
    }

    // 按日期去重（YYYY-MM-DD 格式確保跨時區一致性）
    const dateSet = new Set<string>();
    logs.forEach(log => {
        dateSet.add(new Date(log.timestamp).toISOString().split('T')[0]);
    });

    const sortedDates = Array.from(dateSet).sort((a, b) => b.localeCompare(a));
    const lastLogDate = sortedDates[0] ?? null;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // 當前連續天數：必須從今天或昨天開始計算
    let currentStreak = 0;
    if (sortedDates[0] === today || sortedDates[0] === yesterday) {
        currentStreak = 1;
        for (let i = 0; i < sortedDates.length - 1; i++) {
            const curr = new Date(sortedDates[i]);
            const next = new Date(sortedDates[i + 1]);
            const diffDays = Math.round(
                (curr.getTime() - next.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (diffDays === 1) {
                currentStreak++;
            } else {
                break;
            }
        }
    }

    // 歷史最長連續天數
    let longestStreak = 0;
    let tempStreak = 1;
    for (let i = 0; i < sortedDates.length - 1; i++) {
        const curr = new Date(sortedDates[i]);
        const next = new Date(sortedDates[i + 1]);
        const diffDays = Math.round(
            (curr.getTime() - next.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays === 1) {
            tempStreak++;
        } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
        }
    }
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    return { currentStreak, longestStreak, lastLogDate };
}

/**
 * 計算連續記錄天數（簡化版，僅返回數字）
 * 內部調用 calculateStreakDetailed 以保持算法一致性。
 */
function calculateStreak(logs: RulerLogEntry[]): number {
    return calculateStreakDetailed(logs).currentStreak;
}

/**
 * 計算情緒趨勢 (上升、平穩、下降)
 */
export function calculateTrend(logs: RulerLogEntry[], days: number = 7): 'up' | 'down' | 'stable' {
    if (logs.length < 2) return 'stable';

    const now = new Date();
    const periodAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const recentLogs = logs.filter(log => new Date(log.timestamp) >= periodAgo);
    
    if (recentLogs.length < 2) return 'stable';

    // 按時間排序
    const sorted = [...recentLogs].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // 計算前半和後半的平均強度
    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, mid);
    const secondHalf = sorted.slice(mid);

    const firstAvg = firstHalf.reduce((sum, log) => sum + log.intensity, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, log) => sum + log.intensity, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;

    if (diff > 1) return 'up';
    if (diff < -1) return 'down';
    return 'stable';
}

/**
 * 獲取情緒健康建議
 */
export function getHealthRecommendation(stats: EmotionStats): string {
    const { quadrantDistribution, averageIntensity, streakDays } = stats;
    const total = Object.values(quadrantDistribution).reduce((a, b) => a + b, 0);
    
    if (total === 0) return '開始記錄你的情緒，邁出自我覺察的第一步！';

    const redRatio = quadrantDistribution.red / total;
    const blueRatio = quadrantDistribution.blue / total;
    const greenRatio = quadrantDistribution.green / total;
    const yellowRatio = quadrantDistribution.yellow / total;

    // 根據數據給出建議
    if (streakDays >= 7) {
        return `太棒了！你已經連續記錄 ${streakDays} 天，保持這個好習慣！`;
    }

    if (redRatio > 0.4) {
        return '最近似乎有些壓力。試著每天花幾分鐘做深呼吸練習。';
    }

    if (blueRatio > 0.4) {
        return '最近似乎比較低落。試著回想三件讓你感恩的事情。';
    }

    if (greenRatio > 0.4) {
        return '你最近狀態很不錯！保持這種平衡的感覺。';
    }

    if (yellowRatio > 0.4) {
        return '你最近充滿活力！將這種正能量分享給身邊的人吧。';
    }

    if (averageIntensity > 7) {
        return '你的情緒強度較高。試著透過運動或冥想來平衡。';
    }

    if (streakDays > 0) {
        return `你已經連續記錄 ${streakDays} 天了！繼續保持對情緒的覺察。`;
    }

    return '記錄情緒是自我成長的第一步，今天就開始記錄吧！';
}

/**
 * 計算情緒多樣性指數 (0-100)
 */
export function calculateDiversityIndex(logs: RulerLogEntry[]): number {
    if (logs.length === 0) return 0;

    const uniqueEmotions = new Set<string>();
    const uniqueQuadrants = new Set<Quadrant>();

    logs.forEach(log => {
        log.emotions?.forEach(emotion => {
            if (emotion?.id) {
                uniqueEmotions.add(emotion.id);
            }
            if (emotion?.quadrant) {
                uniqueQuadrants.add(emotion.quadrant);
            }
        });
    });

    // 計算多樣性 (考慮情緒數量和象限覆蓋)
    const emotionScore = Math.min(uniqueEmotions.size / 20, 1) * 50;
    const quadrantScore = (uniqueQuadrants.size / 4) * 50;

    return Math.round(emotionScore + quadrantScore);
}