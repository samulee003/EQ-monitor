/**
 * HabitService - 習慣追踪與成就服務
 *
 * 所有數據操作通過 dataAdapter，確保與後端遷移兼容。
 * 連續天數計算使用 statisticsUtils 的統一算法。
 */

import { storageService } from '../adapters';
import { type UserProgress } from '../types/HabitTypes';
import { ACHIEVEMENTS } from '../types/AchievementTypes';
import { type RulerLogEntry } from '../types/RulerTypes';
import { calculateStreakDetailed } from '../utils/statisticsUtils';

const DEFAULT_PROGRESS: UserProgress = {
  streak: {
    currentStreak: 0,
    longestStreak: 0,
    lastLogDate: null,
  },
  unlockedAchievements: [],
  totalLogs: 0,
};

class HabitService {
  /**
   * Update user progress after a new log is saved
   */
  async updateProgress(logs: RulerLogEntry[]): Promise<{ newlyUnlocked: string[] }> {
    const currentProgress = (await storageService.getProgress()) || DEFAULT_PROGRESS;
    const totalLogs = logs.length;

    // 使用統一的連續天數計算算法
    const streak = calculateStreakDetailed(logs);

    // Check Achievements
    const newlyUnlocked: string[] = [];
    const uniqueEmotions = new Set(
      logs.flatMap((log) => log.emotions?.map((e) => e.id).filter(Boolean) || [])
    );
    const fullFlowCount = logs.filter((log) => log.isFullFlow).length;

    // Parenting achievement counters
    const repairStrategies = ['暫停卡', '修復對話'];
    const selfCompassionStrategies = ['自我慈悲三步驟', '不完美宣言', '自我慈悲'];
    const pauseStrategyNames = ['暫停卡'];

    const repairCount = logs.filter((log) =>
      log.regulating?.selectedStrategies?.some((s) => repairStrategies.includes(s))
    ).length;

    const selfCompassionCount = logs.filter((log) =>
      log.regulating?.selectedStrategies?.some((s) => selfCompassionStrategies.includes(s))
    ).length;

    const gentleAwarenessCount = logs.filter(
      (log) =>
        log.emotions?.some((e) => e.quadrant === 'red') &&
        log.regulating?.selectedStrategies?.some((s) => pauseStrategyNames.includes(s))
    ).length;

    ACHIEVEMENTS.forEach((achievement) => {
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
      unlockedAchievements: [...currentProgress.unlockedAchievements, ...newlyUnlocked],
    };

    await storageService.saveProgress(updatedProgress);
    return { newlyUnlocked };
  }

  async getProgress(): Promise<UserProgress> {
    return (await storageService.getProgress()) || DEFAULT_PROGRESS;
  }
}

export const habitService = new HabitService();
