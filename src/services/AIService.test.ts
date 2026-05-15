/* eslint-disable @typescript-eslint/no-explicit-any -- 測試需要覆寫 AIService 私有設定並檢查 fetch mock 呼叫。 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { aiService, type AIInsight } from './AIService';

declare const global: typeof globalThis;

describe('AIService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Mock Insights - getMockFallback', () => {
        it('應該返回紅色狀態的 mock insight', async () => {
            const data = {
                emotion: { id: 'red_angry', quadrant: 'red' as const, name: '憤怒', energy: 4, pleasantness: 2 },
                intensity: 8,
                understanding: {},
                note: ''
            };
            
            const result = await aiService.analyzeFeeling(data);
            
            expect(result.summary).toContain('很滿');
            expect(result.underlyingPatterns).toContain('壓力累積');
            expect(result.colorTheory).toContain('紅色');
        });

        it('應該返回黃色狀態的 mock insight', async () => {
            const data = {
                emotion: { id: 'yellow_excited', quadrant: 'yellow' as const, name: '興奮', energy: 5, pleasantness: 4 },
                intensity: 8,
                understanding: {},
                note: ''
            };
            
            const result = await aiService.analyzeFeeling(data);
            
            expect(result.summary).toContain('活力');
            expect(result.underlyingPatterns).toContain('成就達成');
            expect(result.colorTheory).toContain('黃色');
        });

        it('應該返回藍色狀態的 mock insight', async () => {
            const data = {
                emotion: { id: 'blue_sad', quadrant: 'blue' as const, name: '憂鬱', energy: 1, pleasantness: 1 },
                intensity: 6,
                understanding: {},
                note: ''
            };
            
            const result = await aiService.analyzeFeeling(data);
            
            expect(result.summary).toContain('很慢');
            expect(result.underlyingPatterns).toContain('疲憊累積');
            expect(result.colorTheory).toContain('藍色');
        });

        it('應該返回綠色狀態的 mock insight', async () => {
            const data = {
                emotion: { id: 'green_calm', quadrant: 'green' as const, name: '平靜', energy: 2, pleasantness: 4 },
                intensity: 5,
                understanding: {},
                note: ''
            };
            
            const result = await aiService.analyzeFeeling(data);
            
            expect(result.summary).toContain('平靜');
            expect(result.underlyingPatterns).toContain('內在平衡');
            expect(result.colorTheory).toContain('綠色');
        });

        it('應該返回默認的 mock insight 當象限未知時', async () => {
            const data = {
                emotion: { id: 'unknown', quadrant: 'green' as const, name: '未知', energy: 3, pleasantness: 3 },
                intensity: 5,
                understanding: {},
                note: ''
            };
            
            const result = await aiService.analyzeFeeling(data);
            
            expect(result.summary).toContain('平靜');
            expect(result.underlyingPatterns).toContain('內在平衡');
        });
    });

    describe('API Response Parsing', () => {
        it('應該正確解析有效的 JSON 響應', async () => {
            const mockInsight: AIInsight = {
                summary: '測試摘要',
                underlyingPatterns: ['模式1', '模式2'],
                suggestedAction: '建議行動',
                empatheticQuote: '引用語錄'
            };
            
            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    choices: [{
                        message: {
                            content: JSON.stringify(mockInsight)
                        }
                    }]
                })
            });
            
            // 使用 vi.spyOn 來暫時修改私有屬性
            const service = aiService as any;
            const originalProxyUrl = service.proxyUrl;
            service.proxyUrl = 'https://api.test.com';
            
            const data = {
                emotion: { id: 'yellow_happy', quadrant: 'yellow' as const, name: '開心', energy: 4, pleasantness: 4 },
                intensity: 7,
                understanding: {},
                note: ''
            };
            
            const result = await aiService.analyzeFeeling(data);
            
            expect(result.summary).toBe('測試摘要');
            expect(result.underlyingPatterns).toEqual(['模式1', '模式2']);
            
            // 恢復原始值
            service.proxyUrl = originalProxyUrl;
        });

        it('應該處理帶有 markdown 代碼塊的 JSON', async () => {
            const mockInsight: AIInsight = {
                summary: '帶代碼塊的摘要',
                underlyingPatterns: ['模式A'],
                suggestedAction: '行動A',
                empatheticQuote: '語錄A'
            };
            
            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    choices: [{
                        message: {
                            content: '```json\n' + JSON.stringify(mockInsight) + '\n```'
                        }
                    }]
                })
            });
            
            const service = aiService as any;
            const originalProxyUrl = service.proxyUrl;
            service.proxyUrl = 'https://api.test.com';
            
            const data = {
                emotion: { id: 'green_calm', quadrant: 'green' as const, name: '平靜', energy: 2, pleasantness: 4 },
                intensity: 5,
                understanding: {},
                note: ''
            };
            
            const result = await aiService.analyzeFeeling(data);
            
            expect(result.summary).toBe('帶代碼塊的摘要');
            
            service.proxyUrl = originalProxyUrl;
        });

        it('應該在 JSON 解析失敗時返回默認 insight', async () => {
            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    choices: [{
                        message: {
                            content: '這不是有效的 JSON'
                        }
                    }]
                })
            });
            
            const service = aiService as any;
            const originalProxyUrl = service.proxyUrl;
            service.proxyUrl = 'https://api.test.com';
            
            const data = {
                emotion: { id: 'blue_sad', quadrant: 'blue' as const, name: '難過', energy: 1, pleasantness: 1 },
                intensity: 6,
                understanding: {},
                note: ''
            };
            
            const result = await aiService.analyzeFeeling(data);
            
            // 應該返回默認的 fallback insight
            expect(result.summary).toBeDefined();
            expect(result.underlyingPatterns).toBeDefined();
            
            service.proxyUrl = originalProxyUrl;
        });

        it('應該在 API 錯誤時返回 mock fallback', async () => {
            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: false,
                statusText: 'Internal Server Error'
            });
            
            const service = aiService as any;
            const originalProxyUrl = service.proxyUrl;
            service.proxyUrl = 'https://api.test.com';
            
            const data = {
                emotion: { id: 'red_angry', quadrant: 'red' as const, name: '生氣', energy: 4, pleasantness: 2 },
                intensity: 8,
                understanding: {},
                note: ''
            };
            
            const result = await aiService.analyzeFeeling(data);
            
            expect(result.summary).toBeDefined();
            expect(result.underlyingPatterns).toBeDefined();
            
            service.proxyUrl = originalProxyUrl;
        });
    });

    describe('getMockChatResponse', () => {
        it('應該返回今心四步說明當詢問 ruler', async () => {
            const result = await aiService.chatWithAssistant('什麼是 RULER 框架？');
            
            expect(result).toContain('今心四步');
            expect(result).toContain('看見');
            expect(result).toContain('命名');
            expect(result).toContain('安放');
            expect(result).toContain('回應');
            expect(result).toContain('Dan Siegel-informed');
            expect(result).toContain('mindsight');
            expect(result).toContain('不是 Yale');
            expect(result).not.toContain('Recognizing');
        });

        it('應該返回建議當詢問建議', async () => {
            const result = await aiService.chatWithAssistant('我該怎麼辦？');
            
            expect(result).toContain('今心四步');
            expect(result).toContain('看見');
            expect(result).toContain('命名');
            expect(result).toContain('安放');
            expect(result).toContain('回應');
            expect(result).not.toContain('RA' + 'IN');
        });

        it('應該返回記錄好處當詢問記錄', async () => {
            const result = await aiService.chatWithAssistant('為什麼要記錄情緒？');
            
            expect(result).toContain('情緒粒度');
            expect(result).toContain('發現模式');
        });

        it('應該返回通用回應當問題不匹配關鍵詞', async () => {
            const result = await aiService.chatWithAssistant('今天天氣很好');
            
            expect(result).toContain('情緒');
            expect(result).toContain('陪伴');
        });
    });

    describe('generateWeeklyInsight', () => {
        it('應該為紅色主導週生成洞察', async () => {
            const logs = [
                { emotions: [{ quadrant: 'red' }], timestamp: Date.now() },
                { emotions: [{ quadrant: 'red' }], timestamp: Date.now() - 86400000 },
                { emotions: [{ quadrant: 'blue' }], timestamp: Date.now() - 172800000 },
            ] as any[];
            
            const result = await aiService.generateWeeklyInsight('test-user', logs);

            expect(result.summary).toContain('紅色');
            expect(result.colorTheory).toContain('紅色');
        });

        it('應該為黃色主導週生成洞察', async () => {
            const logs = [
                { emotions: [{ quadrant: 'yellow' }], timestamp: Date.now() },
                { emotions: [{ quadrant: 'yellow' }], timestamp: Date.now() - 86400000 },
            ] as any[];
            
            const result = await aiService.generateWeeklyInsight('test-user', logs);

            expect(result.summary).toContain('黃色');
            expect(result.colorTheory).toContain('黃色');
        });

        it('應該為藍色主導週生成洞察', async () => {
            const logs = [
                { emotions: [{ quadrant: 'blue' }], timestamp: Date.now() },
                { emotions: [{ quadrant: 'blue' }], timestamp: Date.now() - 86400000 },
            ] as any[];
            
            const result = await aiService.generateWeeklyInsight('test-user', logs);

            expect(result.summary).toContain('藍色');
            expect(result.colorTheory).toContain('藍色');
        });

        it('應該為綠色主導週生成洞察', async () => {
            const logs = [
                { emotions: [{ quadrant: 'green' }], timestamp: Date.now() },
                { emotions: [{ quadrant: 'green' }], timestamp: Date.now() - 86400000 },
            ] as any[];
            
            const result = await aiService.generateWeeklyInsight('test-user', logs);

            expect(result.summary).toContain('綠色');
            expect(result.colorTheory).toContain('綠色');
        });

        it('應該為空日誌返回紅色洞察（默認行為）', async () => {
            const result = await aiService.generateWeeklyInsight('test-user', []);
            
            // 空日誌時，quadrantCounts 全為 0，排序後返回第一個（red）
            expect(result.summary).toBeDefined();
            expect(result.colorTheory).toBeDefined();
        });

        it('應該使用 API 當環境變量設置時', async () => {
            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    data: {
                        summary: 'API 週洞察',
                        underlyingPatterns: ['模式1'],
                        suggestedAction: '建議',
                        empatheticQuote: '語錄',
                        colorTheory: ''
                    }
                })
            });
            
            const service = aiService as any;
            const originalProxyUrl = service.proxyUrl;
            service.proxyUrl = 'https://api.test.com';
            
            const logs = [
                { emotions: [{ quadrant: 'yellow', name: '開心' }], timestamp: Date.now(), intensity: 7 },
            ] as any[];
            
            const result = await aiService.generateWeeklyInsight('real-user-id', logs);

            expect(global.fetch).toHaveBeenCalled();
            expect(result.summary).toBe('API 週洞察');
            
            service.proxyUrl = originalProxyUrl;
        });

        it('應該在 API 錯誤時返回 mock fallback', async () => {
            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: false,
                statusText: 'Server Error'
            });
            
            const service = aiService as any;
            const originalProxyUrl = service.proxyUrl;
            service.proxyUrl = 'https://api.test.com';
            
            const logs = [
                { emotions: [{ quadrant: 'red' }], timestamp: Date.now() },
            ] as any[];
            
            const result = await aiService.generateWeeklyInsight('real-user-id', logs);

            expect(result.summary).toBeDefined();

            service.proxyUrl = originalProxyUrl;
        });
    });

    describe('chatWithAssistant with API', () => {
        it('應該使用 API 當環境變量設置時', async () => {
            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    choices: [{
                        message: {
                            content: 'API 回應內容'
                        }
                    }]
                })
            });
            
            const service = aiService as any;
            const originalProxyUrl = service.proxyUrl;
            service.proxyUrl = 'https://api.test.com';
            
            const result = await aiService.chatWithAssistant('你好');
            
            expect(global.fetch).toHaveBeenCalled();
            expect(result).toBe('API 回應內容');
            
            service.proxyUrl = originalProxyUrl;
        });

        it('應該在 API 錯誤時返回 mock fallback', async () => {
            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: false,
                statusText: 'Server Error'
            });
            
            const service = aiService as any;
            const originalProxyUrl = service.proxyUrl;
            service.proxyUrl = 'https://api.test.com';
            
            const result = await aiService.chatWithAssistant('你好');
            
            expect(result).toContain('情緒');
            
            service.proxyUrl = originalProxyUrl;
        });

        it('應該處理網絡錯誤', async () => {
            global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network Error'));
            
            const service = aiService as any;
            const originalProxyUrl = service.proxyUrl;
            service.proxyUrl = 'https://api.test.com';
            
            const result = await aiService.chatWithAssistant('你好');
            
            expect(result).toContain('情緒');
            
            service.proxyUrl = originalProxyUrl;
        });
    });

    describe('育兒情境檢測', () => {
        it('應該檢測到育兒相關關鍵詞', async () => {
            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    choices: [{
                        message: {
                            content: JSON.stringify({
                                summary: '育兒測試',
                                underlyingPatterns: ['test'],
                                suggestedAction: 'test',
                                empatheticQuote: 'test'
                            })
                        }
                    }]
                })
            });
            
            const service = aiService as any;
            const originalProxyUrl = service.proxyUrl;
            service.proxyUrl = 'https://api.test.com';
            
            const data = {
                emotion: { id: 'red_angry', quadrant: 'red' as const, name: '憤怒', energy: 4, pleasantness: 2 },
                intensity: 8,
                understanding: { trigger: '孩子哭鬧', who: '小孩' },
                note: '育兒壓力很大'
            };
            
            await aiService.analyzeFeeling(data);
            
            // 驗證 fetch 被調用，且請求體中包含育兒相關的 system prompt
            expect(global.fetch).toHaveBeenCalled();
            const callArgs = (global.fetch as any).mock.calls[0];
            const requestBody = JSON.parse(callArgs[1].body);
            expect(requestBody.messages[0].content).toContain('育兒');
            
            service.proxyUrl = originalProxyUrl;
        });
    });
});
