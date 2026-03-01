import { Achievement } from './AchievementTypes';

export interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastLogDate: string | null; // YYYY-MM-DD
}

export interface UserProgress {
    streak: StreakData;
    unlockedAchievements: string[]; // Achievement IDs
    totalLogs: number;
}

export interface WeeklyInsight {
    summary: string;
    dominantQuadrant: string;
    intensityAverage: number;
    suggestions: string[];
}
