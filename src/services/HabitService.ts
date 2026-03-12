import { storageService } from './StorageService';
import { UserProgress, StreakData } from '../types/HabitTypes';
import { ACHIEVEMENTS } from '../types/AchievementTypes';
import { RulerLogEntry } from '../types/RulerTypes';

const DEFAULT_PROGRESS: UserProgress = {
    streak: {
        currentStreak: 0,
        longestStreak: 0,
        lastLogDate: null
    },
    unlockedAchievements: [],
    totalLogs: 0
};

class HabitService {
    /**
     * Update user progress after a new log is saved
     */
    updateProgress(logs: RulerLogEntry[]): { newlyUnlocked: string[] } {
        const currentProgress = storageService.getProgress() || DEFAULT_PROGRESS;
        const totalLogs = logs.length;
        
        // Update Streak
        const streak = this.calculateStreak(logs);
        
        // Check Achievements
        const newlyUnlocked: string[] = [];
        const uniqueEmotions = new Set(logs.flatMap(log => log.emotions?.map(e => e.id).filter(Boolean) || []));
        const fullFlowCount = logs.filter(log => log.isFullFlow).length;

        // Parenting achievement counters
        const repairStrategies = ['暫停卡', '修復對話'];
        const selfCompassionStrategies = ['自我慈悲三步驟', '不完美宣言', '自我慈悲'];
        const pauseStrategyNames = ['暫停卡'];

        const repairCount = logs.filter(log =>
            log.regulating?.selectedStrategies?.some(s => repairStrategies.includes(s))
        ).length;

        const selfCompassionCount = logs.filter(log =>
            log.regulating?.selectedStrategies?.some(s => selfCompassionStrategies.includes(s))
        ).length;

        // Count times user chose "暫停" in high-energy negative emotions (red quadrant)
        const gentleAwarenessCount = logs.filter(log =>
            log.emotions?.some(e => e.quadrant === 'red') &&
            log.regulating?.selectedStrategies?.some(s => pauseStrategyNames.includes(s))
        ).length;

        ACHIEVEMENTS.forEach(achievement => {
            if (currentProgress.unlockedAchievements.includes(achievement.id)) return;

            let isUnlocked = false;
            switch (achievement.id) {
                case 'first_log':
                    isUnlocked = totalLogs >= 1;
                    break;
                case 'streak_3':
                    isUnlocked = streak.currentStreak >= 3;
                    break;
                case 'streak_7':
                    isUnlocked = streak.currentStreak >= 7;
                    break;
                case 'streak_30':
                    isUnlocked = streak.currentStreak >= 30;
                    break;
                case 'emotions_10':
                    isUnlocked = uniqueEmotions.size >= 10;
                    break;
                case 'full_ruler_5':
                    isUnlocked = fullFlowCount >= 5;
                    break;
                case 'repair_master':
                    isUnlocked = repairCount >= 3;
                    break;
                case 'gentle_awareness':
                    isUnlocked = gentleAwarenessCount >= 5;
                    break;
                case 'self_compassion':
                    isUnlocked = selfCompassionCount >= 10;
                    break;
            }

            if (isUnlocked) {
                newlyUnlocked.push(achievement.id);
            }
        });

        const updatedProgress: UserProgress = {
            streak,
            totalLogs,
            unlockedAchievements: [...currentProgress.unlockedAchievements, ...newlyUnlocked]
        };

        storageService.saveProgress(updatedProgress);
        return { newlyUnlocked };
    }

    private calculateStreak(logs: RulerLogEntry[]): StreakData {
        if (logs.length === 0) {
            return { currentStreak: 0, longestStreak: 0, lastLogDate: null };
        }

        const sortedLogs = [...logs].sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        const lastLogDateStr = new Date(sortedLogs[0].timestamp).toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let currentStreak = 0;
        let longestStreak = 0;
        
        // Simple streak calculation: count consecutive days backwards
        const dates = new Set(sortedLogs.map(log => new Date(log.timestamp).toISOString().split('T')[0]));
        const sortedDates = Array.from(dates).sort((a, b) => b.localeCompare(a));

        if (sortedDates[0] === today || sortedDates[0] === yesterdayStr) {
            currentStreak = 1;
            for (let i = 0; i < sortedDates.length - 1; i++) {
                const current = new Date(sortedDates[i]);
                const next = new Date(sortedDates[i+1]);
                const diffDays = Math.round((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        }

        // Longest streak calculation
        let tempStreak = 1;
        for (let i = 0; i < sortedDates.length - 1; i++) {
            const current = new Date(sortedDates[i]);
            const next = new Date(sortedDates[i+1]);
            const diffDays = Math.round((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                tempStreak++;
            } else {
                longestStreak = Math.max(longestStreak, tempStreak);
                tempStreak = 1;
            }
        }
        longestStreak = Math.max(longestStreak, tempStreak);

        return {
            currentStreak,
            longestStreak,
            lastLogDate: lastLogDateStr
        };
    }

    getProgress(): UserProgress {
        return storageService.getProgress() || DEFAULT_PROGRESS;
    }
}

export const habitService = new HabitService();
