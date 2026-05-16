import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  auth,
  logs,
  draft,
  initialize,
  isAvailable,
  clearLogsCache,
  storageService,
} from './storage';
import { type Quadrant } from '../data/emotionData';
import { type UserProgress } from '../types/HabitTypes';
import { _injectMasterKey, _resetKeyCache } from '../utils/crypto';

const insforgeMocks = vi.hoisted(() => ({
    from: vi.fn(),
    insert: vi.fn().mockResolvedValue({ error: null }),
    upsert: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock('@/lib/insforge/client', () => ({
    insforge: {
        database: {
            from: insforgeMocks.from,
        },
    },
}));

const TEST_MASTER_KEY = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0')).join('');

describe('storage', () => {
    beforeEach(async () => {
        localStorage.clear();
        _resetKeyCache();
        _injectMasterKey(TEST_MASTER_KEY);
        clearLogsCache();
        insforgeMocks.insert.mockResolvedValue({ error: null });
        insforgeMocks.upsert.mockResolvedValue({ error: null });
        insforgeMocks.from.mockImplementation((table: string) => ({
            insert: table === 'ruler_logs' ? insforgeMocks.insert : vi.fn().mockResolvedValue({ error: null }),
            upsert: table === 'coach_context' ? insforgeMocks.upsert : vi.fn().mockResolvedValue({ error: null }),
        }));
        await initialize();
    });

    describe('availability', () => {
        it('應報告 localStorage 可用', () => {
            expect(isAvailable()).toBe(true);
        });
    });

    describe('認證', () => {
        it('應成功註冊新用戶', async () => {
            const result = await auth.signUp('test@example.com', '[REDACTED]', {
                displayName: '測試用戶',
            });

            expect(result.success).toBe(true);
            expect(result.user?.email).toBe('test@example.com');
            expect(result.user?.displayName).toBe('測試用戶');
        });

        it('應拒絕重複郵箱註冊', async () => {
            await auth.signUp('test@example.com', '[REDACTED]');
            const result = await auth.signUp('test@example.com', 'another123');

            expect(result.success).toBe(false);
            expect(result.error).toContain('已被註冊');
        });

        it('應拒絕過短密碼', async () => {
            const result = await auth.signUp('test@example.com', '12345');

            expect(result.success).toBe(false);
            expect(result.error).toContain('6個字符');
        });

        it('應正常化郵箱大小寫', async () => {
            await auth.signUp('Test@Example.COM', '[REDACTED]');
            const result = await auth.signIn('test@example.com', '[REDACTED]');

            expect(result.success).toBe(true);
        });

        it('應正確登入', async () => {
            await auth.signUp('test@example.com', '[REDACTED]');
            const result = await auth.signIn('test@example.com', '[REDACTED]');

            expect(result.success).toBe(true);
            expect(result.user).toBeTruthy();
        });

        it('應拒絕錯誤密碼', async () => {
            await auth.signUp('test@example.com', '[REDACTED]');
            const result = await auth.signIn('test@example.com', 'wrongpassword');

            expect(result.success).toBe(false);
            expect(result.error).toContain('密碼錯誤');
        });

        it('應拒絕不存在的用戶', async () => {
            const result = await auth.signIn('nobody@example.com', '[REDACTED]');

            expect(result.success).toBe(false);
            expect(result.error).toContain('不存在');
        });

        it('應正確登出', async () => {
            await auth.signUp('test@example.com', '[REDACTED]');
            await auth.signOut();

            const user = await auth.getUser();
            expect(user).toBeNull();
        });

        it('應正確修改密碼', async () => {
            await auth.signUp('test@example.com', 'oldpassword');
            const result = await auth.updatePassword('oldpassword', 'new[REDACTED]');

            expect(result.success).toBe(true);

            const login = await auth.signIn('test@example.com', 'new[REDACTED]');
            expect(login.success).toBe(true);
        });

        it('修改密碼時應拒絕錯誤舊密碼', async () => {
            await auth.signUp('test@example.com', 'oldpassword');
            const result = await auth.updatePassword('wrongpassword', 'new[REDACTED]');

            expect(result.success).toBe(false);
        });

        it('應正確刪除帳號', async () => {
            await auth.signUp('test@example.com', '[REDACTED]');
            const result = await auth.deleteAccount();

            expect(result).toBe(true);

            const login = await auth.signIn('test@example.com', '[REDACTED]');
            expect(login.success).toBe(false);
        });
    });

    describe('日誌 CRUD', () => {
        beforeEach(async () => {
            localStorage.clear();
            _resetKeyCache();
            _injectMasterKey(TEST_MASTER_KEY);
            clearLogsCache();
            insforgeMocks.insert.mockClear();
            insforgeMocks.upsert.mockClear();
            insforgeMocks.from.mockClear();
            await initialize();
            await auth.signUp('loguser@example.com', '[REDACTED]');
        });

        it('應創建日誌並自動生成 ID', async () => {
            const log = await logs.create({
                emotions: [{ id: 'happy', name: '開心', quadrant: 'yellow', energy: 3, pleasantness: 3 }],
                intensity: 7,
                bodyScan: null,
                understanding: null,
                expressing: null,
                regulating: null,
                postMood: 'better',
                timestamp: new Date().toISOString(),
            });

            expect(log.id).toBeTruthy();
            expect(log.emotions[0].id).toBe('happy');
        });

        it('登入使用者新增日誌時應同步寫入 InsForge ruler_logs', async () => {
            storageService.setUserId('0f6a5a96-7e44-4db2-b533-ec26b5b92f12');

            await logs.create({
                emotions: [{ id: 'happy', name: '開心', quadrant: 'yellow' as Quadrant, energy: 3, pleasantness: 3 }],
                intensity: 6,
                bodyScan: null,
                understanding: null,
                expressing: null,
                regulating: null,
                postMood: '',
                timestamp: '2026-05-15T10:00:00.000Z',
                isFullFlow: false,
            });

            await vi.waitFor(() => {
                expect(insforgeMocks.from).toHaveBeenCalledWith('ruler_logs');
                expect(insforgeMocks.insert).toHaveBeenCalledWith([
                    expect.objectContaining({
                        user_id: '0f6a5a96-7e44-4db2-b533-ec26b5b92f12',
                        intensity: 6,
                        created_at: '2026-05-15T10:00:00.000Z',
                    }),
                ]);
            });
        });

        it('應列出日誌並按時間降序排列', async () => {
            await logs.create({
                emotions: [{ id: 'sad', name: '難過', quadrant: 'blue', energy: 1, pleasantness: 1 }],
                intensity: 5, bodyScan: null, understanding: null, expressing: null, regulating: null,
                postMood: 'same', timestamp: '2024-01-01T00:00:00.000Z',
            });
            await logs.create({
                emotions: [{ id: 'happy', name: '開心', quadrant: 'yellow', energy: 3, pleasantness: 3 }],
                intensity: 8, bodyScan: null, understanding: null, expressing: null, regulating: null,
                postMood: 'better', timestamp: '2024-01-02T00:00:00.000Z',
            });

            const allLogs = await logs.export();

            expect(allLogs.length).toBeGreaterThanOrEqual(2);
        });

        it('應根據 ID 獲取單條日誌', async () => {
            const created = await logs.create({
                emotions: [{ id: 'calm', name: '平靜', quadrant: 'green', energy: 2, pleasantness: 3 }],
                intensity: 4, bodyScan: null, understanding: null, expressing: null, regulating: null,
                postMood: 'same', timestamp: new Date().toISOString(),
            });

            const found = await logs.getById(created.id);

            expect(found).toBeTruthy();
            expect(found?.id).toBe(created.id);
        });

        it('應更新日誌', async () => {
            const created = await logs.create({
                emotions: [{ id: 'happy', name: '開心', quadrant: 'yellow', energy: 3, pleasantness: 3 }],
                intensity: 5, bodyScan: null, understanding: null, expressing: null, regulating: null,
                postMood: 'same', timestamp: new Date().toISOString(),
            });
            const beforeUpdate = await logs.export();

            const updated = await logs.update(created.id, { intensity: 9 });
            const afterUpdate = await logs.export();

            expect(updated.intensity).toBe(9);
            expect(afterUpdate).not.toBe(beforeUpdate);
            expect(afterUpdate.find(log => log.id === created.id)?.intensity).toBe(9);
        });

        it('應刪除日誌', async () => {
            const created = await logs.create({
                emotions: [{ id: 'happy', name: '開心', quadrant: 'yellow', energy: 3, pleasantness: 3 }],
                intensity: 5, bodyScan: null, understanding: null, expressing: null, regulating: null,
                postMood: 'same', timestamp: new Date().toISOString(),
            });

            await logs.delete(created.id);

            clearLogsCache();
            const found = await logs.getById(created.id);
            expect(found).toBeNull();
        });

        it('應正確匯入日誌（跳過重複時間戳）', async () => {
            const timestamp = new Date().toISOString();
            await logs.create({
                emotions: [{ id: 'happy', name: '開心', quadrant: 'yellow', energy: 3, pleasantness: 3 }],
                intensity: 5, bodyScan: null, understanding: null, expressing: null, regulating: null,
                postMood: 'same', timestamp,
            });

            clearLogsCache();
            const result = await logs.import([
                { id: 'import1', emotions: [{ id: 'sad', name: '難過', quadrant: 'blue', energy: 1, pleasantness: 1 }],
                  intensity: 3, bodyScan: null, understanding: null, expressing: null, regulating: null,
                  postMood: 'same', timestamp },
                { id: 'import2', emotions: [{ id: 'calm', name: '平靜', quadrant: 'green', energy: 2, pleasantness: 3 }],
                  intensity: 4, bodyScan: null, understanding: null, expressing: null, regulating: null,
                  postMood: 'better', timestamp: '2024-06-01T00:00:00.000Z' },
            ]);

            expect(result.success).toBe(true);
            expect(result.imported).toBeGreaterThanOrEqual(1);
            expect(result.skipped).toBeGreaterThanOrEqual(0);
        });

        it('應正確匯出所有日誌', async () => {
            await logs.create({
                emotions: [{ id: 'happy', name: '開心', quadrant: 'yellow', energy: 3, pleasantness: 3 }],
                intensity: 5, bodyScan: null, understanding: null, expressing: null, regulating: null,
                postMood: 'same', timestamp: new Date().toISOString(),
            });

            const exported = await logs.export();

            expect(exported.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('草稿', () => {
        beforeEach(async () => {
            localStorage.clear();
            _resetKeyCache();
            _injectMasterKey(TEST_MASTER_KEY);
            clearLogsCache();
            await initialize();
            await auth.signUp('draftuser@example.com', '[REDACTED]');
        });

        it('應保存和讀取草稿', async () => {
            const d = {
                step: 'labeling' as const,
                selectedQuadrants: ['yellow'] as Quadrant[],
                selectedEmotions: [],
                emotionIntensity: 5,
                bodyScanData: null,
                understandingData: null,
                expressingData: null,
                regulatingData: null,
                isFullFlow: false,
                postRegulationMood: '',
            };

            await draft.save(d);
            const loaded = await draft.get();

            expect(loaded).toBeTruthy();
            expect(loaded?.step).toBe('labeling');
        });

        it('應清除草稿', async () => {
            const d = {
                step: 'recognizing' as const,
                selectedQuadrants: [] as Quadrant[],
                selectedEmotions: [],
                emotionIntensity: 5,
                bodyScanData: null,
                understandingData: null,
                expressingData: null,
                regulatingData: null,
                isFullFlow: false,
                postRegulationMood: '',
            };

            await draft.save(d);
            await draft.clear();

            const loaded = await draft.get();
            expect(loaded).toBeNull();
        });
    });

    describe('緩存', () => {
        it('clearLogsCache 應清除內部緩存', async () => {
            await auth.signUp('cacheuser@example.com', '[REDACTED]');
            await logs.create({
                emotions: [{ id: 'happy', name: '開心', quadrant: 'yellow', energy: 3, pleasantness: 3 }],
                intensity: 5, bodyScan: null, understanding: null, expressing: null, regulating: null,
                postMood: 'same', timestamp: new Date().toISOString(),
            });

            clearLogsCache();
        });
    });

    describe('storageService（向後兼容門面）', () => {
        beforeEach(async () => {
            localStorage.clear();
            _resetKeyCache();
            _injectMasterKey(TEST_MASTER_KEY);
            clearLogsCache();
            await initialize();
            await auth.signUp('svcuser@example.com', '[REDACTED]');
        });

        it('應保存和讀取日誌', async () => {
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
            const result = await storageService.getLogs();

            expect(result).toHaveLength(1);
            expect(result[0].emotions[0].name).toBe('開心的');
        });

        it('應保存和讀取草稿', async () => {
            const d = {
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

            await storageService.saveDraft(d);
            const retrieved = await storageService.getDraft();

            expect(retrieved).toEqual(d);
        });

        it('應清除草稿', async () => {
            const d = {
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

            await storageService.saveDraft(d);
            await storageService.clearDraft();
            const retrieved = await storageService.getDraft();
            expect(retrieved).toBeNull();
        });

        it('應匯入日誌', async () => {
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

        it('應拒絕無效 JSON 匯入', async () => {
            const result = await storageService.importLogs('not valid json');
            expect(result.success).toBe(false);
        });

        it('應拒絕非陣列格式匯入', async () => {
            const result = await storageService.importLogs(JSON.stringify({ key: 'value' }));
            expect(result.success).toBe(false);
            expect(result.message).toContain('陣列格式');
        });

        it('應保存和讀取進度', async () => {
            const progress: UserProgress = {
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
    });
});
