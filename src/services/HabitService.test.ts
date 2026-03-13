import { describe, it, expect, beforeEach, vi } from 'vitest';
import { habitService } from './HabitService';
import { storageService } from './StorageService';
import { RulerLogEntry } from '../types/RulerTypes';

// Mock StorageService
vi.mock('./StorageService', () => ({
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
        it('應該計算連續天數', () => {
            const today = new Date().toISOString();
            const yesterday = new Date(Date.now() - 86400000).toISOString();
            const twoDaysAgo = new Date(Date.now() - 172800000).toISOString();
            
            const logs: RulerLogEntry[] = [
                { timestamp: today, emotions: [{ id: 'happy', name: '開心', quadrant: 'yellow', energy: 3, pleasantness: 3 }] } as RulerLogEntry,
                { timestamp: yesterday, emotions: [{ id: 'calm', name: '平靜', quadrant: 'green', energy: 2, pleasantness: 3 }] } as RulerLogEntry,
                { timestamp: twoDaysAgo, emotions: [{ id: 'sad', name: '難過', quadrant: 'blue', energy: 2, pleasantness: 2 }] } as RulerLogEntry,
            ];
            
            habitService.updateProgress(logs);
            
            const savedProgress = (storageService.saveProgress as any).mock.calls[0][0];
            expect(savedProgress.streak.currentStreak).toBe(3);
        });

        it('應該處理間隔天數', () => {
            const today = new Date().toISOString();
            const threeDaysAgo = new Date(Date.now() - 259200000).toISOString();
            
            const logs: RulerLogEntry[] = [
                { timestamp: today, emotions: [{ id: 'happy', name: '開心', quadrant: 'yellow', energy: 3, pleasantness: 3 }] } as RulerLogEntry,
                { timestamp: threeDaysAgo, emotions: [{ id: 'sad', name: '難過', quadrant: 'blue', energy: 2, pleasantness: 2 }] } as RulerLogEntry,
            ];
            
            habitService.updateProgress(logs);
            
            const savedProgress = (storageService.saveProgress as any).mock.calls[0][0];
            // 今天有記錄，但昨天沒有，所以當前連續應該是 1
            expect(savedProgress.streak.currentStreak).toBe(1);
        });

        it('應該計算最長連續天數', () => {
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
            
            habitService.updateProgress(logs);
            
            const savedProgress = (storageService.saveProgress as any).mock.calls[0][0];
            expect(savedProgress.streak.longestStreak).toBeGreaterThanOrEqual(2);
        });

        it('應該處理昨天記錄但今天沒有的情況', () => {
            const yesterday = new Date(Date.now() - 86400000).toISOString();
            const twoDaysAgo = new Date(Date.now() - 172800000).toISOString();
            
            const logs: RulerLogEntry[] = [
                { timestamp: yesterday, emotions: [{ id: 'calm', name: '平靜', quadrant: 'green', energy: 2, pleasantness: 3 }] } as RulerLogEntry,
                { timestamp: twoDaysAgo, emotions: [{ id: 'sad', name: '難過', quadrant: 'blue', energy: 2, pleasantness: 2 }] } as RulerLogEntry,
            ];
            
            habitService.updateProgress(logs);
            
            const savedProgress = (storageService.saveProgress as any).mock.calls[0][0];
            // 昨天有記錄，連續應該繼續計算
            expect(savedProgress.streak.currentStreak).toBeGreaterThanOrEqual(2);
        });

        it('應該處理空日誌', () => {
            const logs: RulerLogEntry[] = [];
            
            habitService.updateProgress(logs);
            
            const savedProgress = (storageService.saveProgress as any).mock.calls[0][0];
            expect(savedProgress.streak.currentStreak).toBe(0);
            expect(savedProgress.streak.longestStreak).toBe(0);
            expect(savedProgress.streak.lastLogDate).toBeNull();
        });
    });

    describe('checkAchievements', () => {
        it('應該解鎖 first_log 成就', () => {
            (storageService.getProgress as any).mockReturnValue({
                streak: { currentStreak: 0, longestStreak: 0, lastLogDate: null },
                unlockedAchievements: [],
                totalLogs: 0
            });
            
            const logs: RulerLogEntry[] = [
                { timestamp: new Date().toISOString(), emotions: [{ id: 'happy', name: '開心', quadrant: 'yellow', energy: 3, pleasantness: 3 }] } as RulerLogEntry,
            ];
            
            const result = habitService.updateProgress(logs);
            
            expect(result.newlyUnlocked).toContain('first_log');
        });

        it('應該解鎖 streak_3 成就', () => {
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
            
            const result = habitService.updateProgress(logs);
            
            expect(result.newlyUnlocked).toContain('streak_3');
        });

        it('應該解鎖 streak_7 成就', () => {
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
            
            const result = habitService.updateProgress(logs);
            
            expect(result.newlyUnlocked).toContain('streak_7');
        });

        it('應該解鎖 streak_30 成就', () => {
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
            
            const result = habitService.updateProgress(logs);
            
            expect(result.newlyUnlocked).toContain('streak_30');
        });

        it('應該解鎖 emotions_10 成就', () => {
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
            
            const result = habitService.updateProgress(logs);
            
            expect(result.newlyUnlocked).toContain('emotions_10');
        });

        it('應該解鎖 full_ruler_5 成就', () => {
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
            
            const result = habitService.updateProgress(logs);
            
            expect(result.newlyUnlocked).toContain('full_ruler_5');
        });

        it('應該解鎖 repair_master 成就', () => {
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
            
            const result = habitService.updateProgress(logs);
            
            expect(result.newlyUnlocked).toContain('repair_master');
        });

        it('應該解鎖 gentle_awareness 成就', () => {
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
            
            const result = habitService.updateProgress(logs);
            
            expect(result.newlyUnlocked).toContain('gentle_awareness');
        });

        it('應該解鎖 self_compassion 成就', () => {
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
            
            const result = habitService.updateProgress(logs);
            
            expect(result.newlyUnlocked).toContain('self_compassion');
        });

        it('不應該重複解鎖已獲得的成就', () => {
            (storageService.getProgress as any).mockReturnValue({
                streak: { currentStreak: 0, longestStreak: 0, lastLogDate: null },
                unlockedAchievements: ['first_log'],
                totalLogs: 5
            });
            
            const logs: RulerLogEntry[] = [
                { timestamp: new Date().toISOString(), emotions: [{ id: 'happy', name: '開心', quadrant: 'yellow', energy: 3, pleasantness: 3 }] } as RulerLogEntry,
            ];
            
            const result = habitService.updateProgress(logs);
            
            expect(result.newlyUnlocked).not.toContain('first_log');
        });
    });

    describe('getProgress', () => {
        it('應該返回當前進度', () => {
            const mockProgress = {
                streak: { currentStreak: 5, longestStreak: 10, lastLogDate: '2024-01-01' },
                unlockedAchievements: ['first_log', 'streak_3'],
                totalLogs: 20
            };
            
            (storageService.getProgress as any).mockReturnValue(mockProgress);
            
            const result = habitService.getProgress();
            
            expect(result).toEqual(mockProgress);
        });

        it('應該在沒有進度時返回默認值', () => {
            (storageService.getProgress as any).mockReturnValue(null);
            
            const result = habitService.getProgress();
            
            expect(result).toEqual({
                streak: { currentStreak: 0, longestStreak: 0, lastLogDate: null },
                unlockedAchievements: [],
                totalLogs: 0
            });
        });
    });
});
