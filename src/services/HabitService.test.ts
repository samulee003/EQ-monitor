/* eslint-disable @typescript-eslint/no-explicit-any -- 測試使用 Vitest mock 呼叫紀錄檢查 storageService。 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { habitService } from './HabitService';
import { storageService } from '../adapters/storage';
import { type RulerLogEntry } from '../types/RulerTypes';

// Mock storage
vi.mock('../adapters/storage', () => ({
    storageService: {
        getProgress: vi.fn(),
        saveProgress: vi.fn(),
    }
}));

describe('HabitService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('calculateStreak', () => {
        it('應計算連續三天的當前連續天數', async () => {
            const today = new Date().toISOString();
            const yesterday = new Date(Date.now() - 86400000).toISOString();
            const twoDaysAgo = new Date(Date.now() - 172800000).toISOString();

            const logs: RulerLogEntry[] = [
                { timestamp: today, emotions: [{ id: 'happy', name: '開心', quadrant: 'yellow', energy: 3, pleasantness: 3 }] } as RulerLogEntry,
                { timestamp: yesterday, emotions: [{ id: 'calm', name: '平靜', quadrant: 'green', energy: 2, pleasantness: 3 }] } as RulerLogEntry,
                { timestamp: twoDaysAgo, emotions: [{ id: 'sad', name: '難過', quadrant: 'blue', energy: 2, pleasantness: 2 }] } as RulerLogEntry,
            ];

            await habitService.updateProgress(logs);

            const savedProgress = (storageService.saveProgress as any).mock.calls[0][0];
            expect(savedProgress.streak.currentStreak).toBe(3);
        });

        it('間隔一天時當前連續天數應為 1', async () => {
            const today = new Date().toISOString();
            const threeDaysAgo = new Date(Date.now() - 259200000).toISOString();

            const logs: RulerLogEntry[] = [
                { timestamp: today, emotions: [{ id: 'happy', name: '開心', quadrant: 'yellow', energy: 3, pleasantness: 3 }] } as RulerLogEntry,
                { timestamp: threeDaysAgo, emotions: [{ id: 'sad', name: '難過', quadrant: 'blue', energy: 2, pleasantness: 2 }] } as RulerLogEntry,
            ];

            await habitService.updateProgress(logs);

            const savedProgress = (storageService.saveProgress as any).mock.calls[0][0];
            // 今天有記錄，但昨天沒有，所以當前連續應該是 1
            expect(savedProgress.streak.currentStreak).toBe(1);
        });

        it('應正確計算歷史最長連續天數', async () => {
            const today = new Date().toISOString();
            const yesterday = new Date(Date.now() - 86400000).toISOString();
            const fiveDaysAgo = new Date(Date.now() - 432000000).toISOString();
            const sixDaysAgo = new Date(Date.now() - 518400000).toISOString();
            const sevenDaysAgo = new Date(Date.now() - 604800000).toISOString();

            const logs: RulerLogEntry[] = [
                { timestamp: today, emotions: [{ id: 'happy', name: '開心', quadrant: 'yellow', energy: 3, pleasantness: 3 }] } as RulerLogEntry,
                { timestamp: yesterday, emotions: [{ id: 'calm', name: '平靜', quadrant: 'green', energy: 2, pleasantness: 3 }] } as RulerLogEntry,
                // 間隔兩天
                { timestamp: fiveDaysAgo, emotions: [{ id: 'sad', name: '難過', quadrant: 'blue', energy: 2, pleasantness: 2 }] } as RulerLogEntry,
                { timestamp: sixDaysAgo, emotions: [{ id: 'angry', name: '生氣', quadrant: 'red', energy: 3, pleasantness: 1 }] } as RulerLogEntry,
                { timestamp: sevenDaysAgo, emotions: [{ id: 'anxious', name: '焦慮', quadrant: 'red', energy: 3, pleasantness: 2 }] } as RulerLogEntry,
            ];

            await habitService.updateProgress(logs);

            const savedProgress = (storageService.saveProgress as any).mock.calls[0][0];
            expect(savedProgress.streak.longestStreak).toBeGreaterThanOrEqual(2);
        });

        it('昨天有記錄時連續天數應繼續計算', async () => {
            const yesterday = new Date(Date.now() - 86400000).toISOString();
            const twoDaysAgo = new Date(Date.now() - 172800000).toISOString();

            const logs: RulerLogEntry[] = [
                { timestamp: yesterday, emotions: [{ id: 'calm', name: '平靜', quadrant: 'green', energy: 2, pleasantness: 3 }] } as RulerLogEntry,
                { timestamp: twoDaysAgo, emotions: [{ id: 'sad', name: '難過', quadrant: 'blue', energy: 2, pleasantness: 2 }] } as RulerLogEntry,
            ];

            await habitService.updateProgress(logs);

            const savedProgress = (storageService.saveProgress as any).mock.calls[0][0];
            // 昨天有記錄，連續應該繼續計算
            expect(savedProgress.streak.currentStreak).toBeGreaterThanOrEqual(2);
        });

        it('無日誌時連續天數應為 0', async () => {
            const logs: RulerLogEntry[] = [];

            await habitService.updateProgress(logs);

            const savedProgress = (storageService.saveProgress as any).mock.calls[0][0];
            expect(savedProgress.streak.currentStreak).toBe(0);
            expect(savedProgress.streak.longestStreak).toBe(0);
            expect(savedProgress.streak.lastLogDate).toBeNull();
        });
    });

    describe('checkAchievements', () => {
        it('首次記錄應解鎖 first_log 成就', async () => {
            (storageService.getProgress as any).mockReturnValue({
                streak: { currentStreak: 0, longestStreak: 0, lastLogDate: null },
                unlockedAchievements: [],
                totalLogs: 0
            });

            const logs: RulerLogEntry[] = [
                { timestamp: new Date().toISOString(), emotions: [{ id: 'happy', name: '開心', quadrant: 'yellow', energy: 3, pleasantness: 3 }] } as RulerLogEntry,
            ];

            const result = await habitService.updateProgress(logs);

            expect(result.newlyUnlocked).toContain('first_log');
        });

        it('連續三天應解鎖 streak_3 成就', async () => {
            const today = new Date().toISOString();
            const yesterday = new Date(Date.now() - 86400000).toISOString();
            const twoDaysAgo = new Date(Date.now() - 172800000).toISOString();

            (storageService.getProgress as any).mockReturnValue({
                streak: { currentStreak: 0, longestStreak: 0, lastLogDate: null },
                unlockedAchievements: [],
                totalLogs: 0
            });

            const logs: RulerLogEntry[] = [
                { timestamp: today, emotions: [{ id: 'happy', name: '開心', quadrant: 'yellow', energy: 3, pleasantness: 3 }] } as RulerLogEntry,
                { timestamp: yesterday, emotions: [{ id: 'calm', name: '平靜', quadrant: 'green', energy: 2, pleasantness: 3 }] } as RulerLogEntry,
                { timestamp: twoDaysAgo, emotions: [{ id: 'sad', name: '難過', quadrant: 'blue', energy: 2, pleasantness: 2 }] } as RulerLogEntry,
            ];

            const result = await habitService.updateProgress(logs);

            expect(result.newlyUnlocked).toContain('streak_3');
        });

        it('連續七天應解鎖 streak_7 成就', async () => {
            const logs: RulerLogEntry[] = [];
            for (let i = 0; i < 7; i++) {
                logs.push({
                    timestamp: new Date(Date.now() - i * 86400000).toISOString(),
                    emotions: [{ id: 'happy', name: '開心', quadrant: 'yellow', energy: 3, pleasantness: 3 }]
                } as RulerLogEntry);
            }

            (storageService.getProgress as any).mockReturnValue({
                streak: { currentStreak: 0, longestStreak: 0, lastLogDate: null },
                unlockedAchievements: [],
                totalLogs: 0
            });

            const result = await habitService.updateProgress(logs);

            expect(result.newlyUnlocked).toContain('streak_7');
        });

        it('連續三十天應解鎖 streak_30 成就', async () => {
            const logs: RulerLogEntry[] = [];
            for (let i = 0; i < 30; i++) {
                logs.push({
                    timestamp: new Date(Date.now() - i * 86400000).toISOString(),
                    emotions: [{ id: 'happy', name: '開心', quadrant: 'yellow', energy: 3, pleasantness: 3 }]
                } as RulerLogEntry);
            }

            (storageService.getProgress as any).mockReturnValue({
                streak: { currentStreak: 0, longestStreak: 0, lastLogDate: null },
                unlockedAchievements: [],
                totalLogs: 0
            });

            const result = await habitService.updateProgress(logs);

            expect(result.newlyUnlocked).toContain('streak_30');
        });

        it('記錄十種不同情緒應解鎖 emotions_10 成就', async () => {
            const logs: RulerLogEntry[] = [];
            for (let i = 0; i < 10; i++) {
                logs.push({
                    timestamp: new Date(Date.now() - i * 86400000).toISOString(),
                    emotions: [{ id: `emotion${i}`, name: `情緒${i}`, quadrant: 'yellow', energy: 3, pleasantness: 3 }]
                } as RulerLogEntry);
            }

            (storageService.getProgress as any).mockReturnValue({
                streak: { currentStreak: 0, longestStreak: 0, lastLogDate: null },
                unlockedAchievements: [],
                totalLogs: 0
            });

            const result = await habitService.updateProgress(logs);

            expect(result.newlyUnlocked).toContain('emotions_10');
        });

        it('完成五次完整 RULER 流程應解鎖 full_ruler_5 成就', async () => {
            const logs: RulerLogEntry[] = [];
            for (let i = 0; i < 5; i++) {
                logs.push({
                    timestamp: new Date(Date.now() - i * 86400000).toISOString(),
                    emotions: [{ id: 'happy', name: '開心', quadrant: 'yellow', energy: 3, pleasantness: 3 }],
                    isFullFlow: true
                } as RulerLogEntry);
            }

            (storageService.getProgress as any).mockReturnValue({
                streak: { currentStreak: 0, longestStreak: 0, lastLogDate: null },
                unlockedAchievements: [],
                totalLogs: 0
            });

            const result = await habitService.updateProgress(logs);

            expect(result.newlyUnlocked).toContain('full_ruler_5');
        });

        it('使用修復策略三次應解鎖 repair_master 成就', async () => {
            const logs: RulerLogEntry[] = [];
            for (let i = 0; i < 3; i++) {
                logs.push({
                    timestamp: new Date(Date.now() - i * 86400000).toISOString(),
                    emotions: [{ id: 'happy', name: '開心', quadrant: 'yellow', energy: 3, pleasantness: 3 }],
                    regulating: { selectedStrategies: ['暫停卡'] }
                } as RulerLogEntry);
            }

            (storageService.getProgress as any).mockReturnValue({
                streak: { currentStreak: 0, longestStreak: 0, lastLogDate: null },
                unlockedAchievements: [],
                totalLogs: 0
            });

            const result = await habitService.updateProgress(logs);

            expect(result.newlyUnlocked).toContain('repair_master');
        });

        it('在紅色象限使用暫停卡五次應解鎖 gentle_awareness 成就', async () => {
            const logs: RulerLogEntry[] = [];
            for (let i = 0; i < 5; i++) {
                logs.push({
                    timestamp: new Date(Date.now() - i * 86400000).toISOString(),
                    emotions: [{ id: 'angry', name: '生氣', quadrant: 'red', energy: 3, pleasantness: 1 }],
                    regulating: { selectedStrategies: ['暫停卡'] }
                } as RulerLogEntry);
            }

            (storageService.getProgress as any).mockReturnValue({
                streak: { currentStreak: 0, longestStreak: 0, lastLogDate: null },
                unlockedAchievements: [],
                totalLogs: 0
            });

            const result = await habitService.updateProgress(logs);

            expect(result.newlyUnlocked).toContain('gentle_awareness');
        });

        it('使用自我慈悲策略十次應解鎖 self_compassion 成就', async () => {
            const logs: RulerLogEntry[] = [];
            for (let i = 0; i < 10; i++) {
                logs.push({
                    timestamp: new Date(Date.now() - i * 86400000).toISOString(),
                    emotions: [{ id: 'sad', name: '難過', quadrant: 'blue', energy: 2, pleasantness: 2 }],
                    regulating: { selectedStrategies: ['自我慈悲三步驟'] }
                } as RulerLogEntry);
            }

            (storageService.getProgress as any).mockReturnValue({
                streak: { currentStreak: 0, longestStreak: 0, lastLogDate: null },
                unlockedAchievements: [],
                totalLogs: 0
            });

            const result = await habitService.updateProgress(logs);

            expect(result.newlyUnlocked).toContain('self_compassion');
        });

        it('已解鎖的成就不應重複解鎖', async () => {
            (storageService.getProgress as any).mockReturnValue({
                streak: { currentStreak: 0, longestStreak: 0, lastLogDate: null },
                unlockedAchievements: ['first_log'],
                totalLogs: 5
            });

            const logs: RulerLogEntry[] = [
                { timestamp: new Date().toISOString(), emotions: [{ id: 'happy', name: '開心', quadrant: 'yellow', energy: 3, pleasantness: 3 }] } as RulerLogEntry,
            ];

            const result = await habitService.updateProgress(logs);

            expect(result.newlyUnlocked).not.toContain('first_log');
        });
    });

    describe('getProgress', () => {
        it('應返回已保存的進度數據', async () => {
            const mockProgress = {
                streak: { currentStreak: 5, longestStreak: 10, lastLogDate: '2024-01-01' },
                unlockedAchievements: ['first_log', 'streak_3'],
                totalLogs: 20
            };

            (storageService.getProgress as any).mockResolvedValue(mockProgress);

            const result = await habitService.getProgress();

            expect(result).toEqual(mockProgress);
        });

        it('無進度數據時應返回預設值', async () => {
            (storageService.getProgress as any).mockResolvedValue(null);

            const result = await habitService.getProgress();

            expect(result).toEqual({
                streak: { currentStreak: 0, longestStreak: 0, lastLogDate: null },
                unlockedAchievements: [],
                totalLogs: 0
            });
        });
    });
});
