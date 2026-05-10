import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storageService } from './StorageService';
import { localStorageAdapter } from '../adapters/LocalStorageAdapter';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
        removeItem: vi.fn((key: string) => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; }),
    };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('StorageService', () => {
    beforeEach(() => {
        localStorageMock.clear();
        localStorageAdapter.clearLogsCache();
    });

    describe('saveLog & getLogs', () => {
        it('', async () => {
            const mockLog = {
                emotions: [{ id: 'happy', name: '開心的', quadrant: 'yellow' as const, energy: 3, pleasantness: 3 }],
                intensity: 7,
                bodyScan: null,
                understanding: null,
                expressing: null,
                regulating: null,
                postMood: 'better',
                timestamp: '2024-01-01T00:00:00.000Z',
            };

            await storageService.saveLog(mockLog);
            const logs = await storageService.getLogs();

            expect(logs).toHaveLength(1);
            expect(logs[0].emotions[0].name).toBe('開心的');
        });

        it('', async () => {
            const log1 = {
                emotions: [{ id: 'happy', name: '開心的', quadrant: 'yellow' as const, energy: 3, pleasantness: 3 }],
                intensity: 5,
                bodyScan: null,
                understanding: null,
                expressing: null,
                regulating: null,
                postMood: 'same',
                timestamp: '2024-01-01T00:00:00.000Z',
            };

            const log2 = {
                emotions: [{ id: 'sad', name: '難過的', quadrant: 'blue' as const, energy: 2, pleasantness: 2 }],
                intensity: 6,
                bodyScan: null,
                understanding: null,
                expressing: null,
                regulating: null,
                postMood: 'better',
                timestamp: '2024-01-02T00:00:00.000Z',
            };

            await storageService.saveLog(log1);
            await storageService.saveLog(log2);
            const logs = await storageService.getLogs();

            expect(logs).toHaveLength(2);
            expect(logs[0].timestamp).toBe('2024-01-02T00:00:00.000Z');
        });
    });

    describe('saveDraft & getDraft', () => {
        it('', async () => {
            const draft = {
                step: 'recognizing' as const,
                selectedQuadrants: ['yellow' as const],
                selectedEmotions: [],
                emotionIntensity: 5,
                bodyScanData: null,
                understandingData: null,
                expressingData: null,
                regulatingData: null,
                isFullFlow: false,
                postRegulationMood: '',
            };

            await storageService.saveDraft(draft);
            const retrieved = await storageService.getDraft();

            expect(retrieved).toEqual(draft);
        });

        it('', async () => {
            const draft = await storageService.getDraft();
            expect(draft).toBeNull();
        });

        it('', async () => {
            const draft = {
                step: 'recognizing' as const,
                selectedQuadrants: [],
                selectedEmotions: [],
                emotionIntensity: 0,
                bodyScanData: null,
                understandingData: null,
                expressingData: null,
                regulatingData: null,
                isFullFlow: false,
                postRegulationMood: '',
            };

            await storageService.saveDraft(draft);
            await storageService.clearDraft();
            const retrieved = await storageService.getDraft();

            expect(retrieved).toBeNull();
        });
    });

    describe('importLogs', () => {
        it('', async () => {
            const validData = JSON.stringify([
                {
                    timestamp: '2024-01-01T00:00:00.000Z',
                    emotions: [{ id: 'happy', name: '開心的', quadrant: 'yellow', energy: 3, pleasantness: 3 }],
                    intensity: 5,
                    postMood: 'same',
                },
            ]);

            const result = await storageService.importLogs(validData);

            expect(result.success).toBe(true);
            expect(result.imported).toBe(1);
        });

        it('', async () => {
            const invalidData = 'not valid json';
            const result = await storageService.importLogs(invalidData);

            expect(result.success).toBe(false);
        });

        it('', async () => {
            const nonArrayData = JSON.stringify({ key: 'value' });
            const result = await storageService.importLogs(nonArrayData);

            expect(result.success).toBe(false);
            expect(result.message).toContain('陣列格式');
        });

        it('', async () => {
            const dataWithInvalid = JSON.stringify([
                { timestamp: '2024-01-01T00:00:00.000Z' },
                { emotions: [{ id: 'happy', name: '開心' }] },
            ]);

            const result = await storageService.importLogs(dataWithInvalid);

            expect(result.success).toBe(true);
            expect(result.imported).toBe(0);
            expect(result.skipped).toBe(0);
        });

        it('', async () => {
            const existingLog = {
                emotions: [{ id: 'happy', name: '開心的', quadrant: 'yellow' as const, energy: 3, pleasantness: 3 }],
                intensity: 5,
                bodyScan: null,
                understanding: null,
                expressing: null,
                regulating: null,
                postMood: 'same',
                timestamp: '2024-01-01T00:00:00.000Z',
            };

            await storageService.saveLog(existingLog);

            const duplicateData = JSON.stringify([
                {
                    timestamp: '2024-01-01T00:00:00.000Z',
                    emotions: [{ id: 'happy', name: '開心的', quadrant: 'yellow', energy: 3, pleasantness: 3 }],
                },
            ]);

            const result = await storageService.importLogs(duplicateData);

            expect(result.success).toBe(true);
            expect(result.imported).toBe(0);
            expect(result.skipped).toBe(1);
        });
    });

    describe('saveProgress & getProgress', () => {
        it('', async () => {
            const progress: import('../types/HabitTypes').UserProgress = {
                streak: {
                    currentStreak: 5,
                    longestStreak: 7,
                    lastLogDate: new Date().toISOString().split('T')[0],
                },
                totalLogs: 10,
                unlockedAchievements: ['first_entry', 'streak_3'],
            };

            await storageService.saveProgress(progress);
            const retrieved = await storageService.getProgress();

            expect(retrieved).toEqual(progress);
        });

        it('', async () => {
            const progress = await storageService.getProgress();
            expect(progress).toBeNull();
        });
    });

    describe('user isolation', () => {
        it('', async () => {
            storageService.setUserId('user123');

            const mockLog = {
                emotions: [{ id: 'happy', name: '開心的', quadrant: 'yellow' as const, energy: 3, pleasantness: 3 }],
                intensity: 5,
                bodyScan: null,
                understanding: null,
                expressing: null,
                regulating: null,
                postMood: 'same',
                timestamp: '2024-01-01T00:00:00.000Z',
            };

            await storageService.saveLog(mockLog);

            // 驗證 localStorage.setItem 被調用（數據已加密存儲）
            expect(localStorage.setItem).toHaveBeenCalled();
            const setItemCalls = (localStorage.setItem as ReturnType<typeof vi.fn>).mock.calls;
            const logsCall = setItemCalls.find((call: string[]) => call[0]?.includes('feelings_logs'));
            expect(logsCall).toBeTruthy();
        });

        it('', async () => {
            storageService.setUserId(null);

            const mockLog = {
                emotions: [{ id: 'happy', name: '開心的', quadrant: 'yellow' as const, energy: 3, pleasantness: 3 }],
                intensity: 5,
                bodyScan: null,
                understanding: null,
                expressing: null,
                regulating: null,
                postMood: 'same',
                timestamp: '2024-01-01T00:00:00.000Z',
            };

            await storageService.saveLog(mockLog);

            // 驗證 localStorage.setItem 被調用（數據已加密存儲）
            expect(localStorage.setItem).toHaveBeenCalled();
            const setItemCalls = (localStorage.setItem as ReturnType<typeof vi.fn>).mock.calls;
            const logsCall = setItemCalls.find((call: string[]) => call[0]?.includes('feelings_logs'));
            expect(logsCall).toBeTruthy();
        });
    });
});