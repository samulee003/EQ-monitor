import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storageService, ImportResult } from './StorageService';

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
        localStorage.clear();
        vi.clearAllMocks();
    });

    describe('saveLog & getLogs', () => {
        it('should save and retrieve logs', () => {
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

            storageService.saveLog(mockLog);
            const logs = storageService.getLogs();

            expect(logs).toHaveLength(1);
            expect(logs[0].emotions[0].name).toBe('開心的');
        });

        it('should prepend new logs to existing logs', () => {
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

            storageService.saveLog(log1);
            storageService.saveLog(log2);
            const logs = storageService.getLogs();

            expect(logs).toHaveLength(2);
            expect(logs[0].timestamp).toBe('2024-01-02T00:00:00.000Z');
        });
    });

    describe('saveDraft & getDraft', () => {
        it('should save and retrieve draft', () => {
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

            storageService.saveDraft(draft);
            const retrieved = storageService.getDraft();

            expect(retrieved).toEqual(draft);
        });

        it('should return null when no draft exists', () => {
            const draft = storageService.getDraft();
            expect(draft).toBeNull();
        });

        it('should clear draft', () => {
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

            storageService.saveDraft(draft);
            storageService.clearDraft();
            const retrieved = storageService.getDraft();

            expect(retrieved).toBeNull();
        });
    });

    describe('importLogs', () => {
        it('should import valid JSON array', () => {
            const validData = JSON.stringify([
                {
                    timestamp: '2024-01-01T00:00:00.000Z',
                    emotion: { id: 'happy', name: '開心的', quadrant: 'yellow', energy: 3, pleasantness: 3 },
                },
            ]);

            const result = storageService.importLogs(validData);

            expect(result.success).toBe(true);
            expect(result.imported).toBe(1);
        });

        it('should reject invalid JSON', () => {
            const invalidData = 'not valid json';
            const result = storageService.importLogs(invalidData);

            expect(result.success).toBe(false);
        });

        it('should reject non-array JSON', () => {
            const nonArrayData = JSON.stringify({ key: 'value' });
            const result = storageService.importLogs(nonArrayData);

            expect(result.success).toBe(false);
            expect(result.message).toContain('陣列格式');
        });

        it('should skip entries without required fields', () => {
            const dataWithInvalid = JSON.stringify([
                { timestamp: '2024-01-01T00:00:00.000Z' }, // missing emotion
                { emotion: { id: 'happy', name: '開心' } }, // missing timestamp
            ]);

            const result = storageService.importLogs(dataWithInvalid);

            expect(result.success).toBe(true);
            expect(result.imported).toBe(0);
            expect(result.skipped).toBe(2);
        });

        it('should skip duplicate entries', () => {
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

            storageService.saveLog(existingLog);

            const duplicateData = JSON.stringify([
                {
                    timestamp: '2024-01-01T00:00:00.000Z',
                    emotion: { id: 'happy', name: '開心的', quadrant: 'yellow', energy: 3, pleasantness: 3 },
                },
            ]);

            const result = storageService.importLogs(duplicateData);

            expect(result.success).toBe(true);
            expect(result.imported).toBe(0);
            expect(result.skipped).toBe(1);
        });
    });

    describe('saveProgress & getProgress', () => {
        it('should save and retrieve progress', () => {
            const progress = {
                streak: 5,
                totalEntries: 10,
                achievements: ['first_entry', 'streak_3'],
            };

            storageService.saveProgress(progress);
            const retrieved = storageService.getProgress();

            expect(retrieved).toEqual(progress);
        });

        it('should return null when no progress exists', () => {
            const progress = storageService.getProgress();
            expect(progress).toBeNull();
        });
    });

    describe('user isolation', () => {
        it('should use user-specific keys when userId is set', () => {
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

            storageService.saveLog(mockLog);

            expect(localStorage.setItem).toHaveBeenCalledWith(
                'feelings_logs_user123',
                expect.any(String)
            );
        });

        it('should use default keys when userId is null', () => {
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

            storageService.saveLog(mockLog);

            expect(localStorage.setItem).toHaveBeenCalledWith(
                'feelings_logs',
                expect.any(String)
            );
        });
    });
});