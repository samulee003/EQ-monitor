import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storageService } from './StorageService';
import { RulerLogEntry } from '../types/RulerTypes';

describe('StorageService', () => {
    beforeEach(() => {
        // 重置 localStorage mock
        vi.clearAllMocks();
        localStorage.clear();
    });

    describe('getLogs', () => {
        it('應該返回空數組當沒有記錄時', () => {
            vi.spyOn(localStorage, 'getItem').mockReturnValue(null);
            const logs = storageService.getLogs();
            expect(logs).toEqual([]);
        });

        it('應該正確解析記錄', () => {
            const mockLogs: RulerLogEntry[] = [
                {
                    emotions: [{ id: 'happy', name: '快樂的', quadrant: 'yellow', energy: 3, pleasantness: 4 }],
                    intensity: 7,
                    bodyScan: { location: '胸口', sensation: '溫暖' },
                    understanding: { trigger: '收到好消息', message: '', what: '工作', who: '同事', where: '辦公室', need: '成就' },
                    expressing: { expression: '很開心！', prompt: '自由書寫', mode: 'free' },
                    regulating: { selectedStrategies: ['breathing'] },
                    postMood: '感覺輕鬆多了',
                    timestamp: '2026-01-01T00:00:00.000Z',
                }
            ];
            vi.spyOn(localStorage, 'getItem').mockReturnValue(JSON.stringify(mockLogs));
            
            const logs = storageService.getLogs();
            expect(logs).toHaveLength(1);
            expect(logs[0].emotions[0].name).toBe('快樂的');
        });
    });

    describe('saveLog', () => {
        it('應該將新記錄添加到列表開頭', () => {
            const existingLogs: RulerLogEntry[] = [
                {
                    emotions: [{ id: 'old', name: '舊的', quadrant: 'blue', energy: 2, pleasantness: 2 }],
                    intensity: 5,
                    bodyScan: null,
                    understanding: null,
                    expressing: null,
                    regulating: null,
                    postMood: '',
                    timestamp: '2026-01-01T00:00:00.000Z',
                }
            ];
            vi.spyOn(localStorage, 'getItem').mockReturnValue(JSON.stringify(existingLogs));

            const newLog: RulerLogEntry = {
                emotions: [{ id: 'new', name: '新的', quadrant: 'green', energy: 3, pleasantness: 4 }],
                intensity: 8,
                bodyScan: null,
                understanding: null,
                expressing: null,
                regulating: null,
                postMood: '',
                timestamp: '2026-01-02T00:00:00.000Z',
            };

            storageService.saveLog(newLog);

            const setItemCalls = vi.mocked(localStorage.setItem).mock.calls;
            expect(setItemCalls).toHaveLength(1);
            
            const savedData = JSON.parse(setItemCalls[0][1]);
            expect(savedData).toHaveLength(2);
            expect(savedData[0].emotions[0].name).toBe('新的'); // 新記錄在開頭
        });
    });

    describe('importLogs', () => {
        it('應該成功導入有效數據', () => {
            vi.spyOn(localStorage, 'getItem').mockReturnValue('[]');
            
            const importData = JSON.stringify([
                {
                    emotion: { id: 'test', name: '測試', quadrant: 'red', energy: 4, pleasantness: 2 },
                    intensity: 6,
                    timestamp: '2026-01-01T00:00:00.000Z',
                }
            ]);

            const result = storageService.importLogs(importData);
            
            expect(result.success).toBe(true);
            expect(result.imported).toBe(1);
        });

        it('應該跳過重複記錄', () => {
            const existingLog = {
                emotion: { id: 'test', name: '測試', quadrant: 'red', energy: 4, pleasantness: 2 },
                intensity: 6,
                timestamp: '2026-01-01T00:00:00.000Z',
            };
            vi.spyOn(localStorage, 'getItem').mockReturnValue(JSON.stringify([existingLog]));

            const result = storageService.importLogs(JSON.stringify([existingLog]));
            
            expect(result.success).toBe(true);
            expect(result.imported).toBe(0);
            expect(result.skipped).toBe(1);
        });

        it('應該處理無效 JSON', () => {
            const result = storageService.importLogs('invalid json');
            
            expect(result.success).toBe(false);
            expect(result.imported).toBe(0);
        });
    });
});
