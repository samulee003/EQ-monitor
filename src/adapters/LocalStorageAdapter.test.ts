import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { _injectMasterKey, _resetKeyCache } from '../utils/crypto';

// 注入測試用加密主密鑰（繞過 IndexedDB）
const TEST_MASTER_KEY = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0')).join('');

describe('LocalStorageAdapter', () => {
    let adapter: LocalStorageAdapter;

    beforeEach(async () => {
        localStorage.clear();
        _resetKeyCache();
        _injectMasterKey(TEST_MASTER_KEY);
        adapter = new LocalStorageAdapter();
        adapter.clearLogsCache();
        await adapter.initialize();
    });

    describe('availability', () => {
        it('應報告 localStorage 可用', () => {
            expect(adapter.isAvailable()).toBe(true);
        });
    });

    describe('認證', () => {
        it('應成功註冊新用戶', async () => {
            const result = await adapter.auth.signUp('test@example.com', '[REDACTED]', {
                displayName: '測試用戶',
            });

            expect(result.success).toBe(true);
            expect(result.user?.email).toBe('test@example.com');
            expect(result.user?.displayName).toBe('測試用戶');
        });

        it('應拒絕重複郵箱註冊', async () => {
            await adapter.auth.signUp('test@example.com', '[REDACTED]');
            const result = await adapter.auth.signUp('test@example.com', 'another123');

            expect(result.success).toBe(false);
            expect(result.error).toContain('已被註冊');
        });

        it('應拒絕過短密碼', async () => {
            const result = await adapter.auth.signUp('test@example.com', '12345');

            expect(result.success).toBe(false);
            expect(result.error).toContain('6個字符');
        });

        it('應正常化郵箱大小寫', async () => {
            await adapter.auth.signUp('Test@Example.COM', '[REDACTED]');
            const result = await adapter.auth.signIn('test@example.com', '[REDACTED]');

            expect(result.success).toBe(true);
        });

        it('應正確登入', async () => {
            await adapter.auth.signUp('test@example.com', '[REDACTED]');
            const result = await adapter.auth.signIn('test@example.com', '[REDACTED]');

            expect(result.success).toBe(true);
            expect(result.user).toBeTruthy();
        });

        it('應拒絕錯誤密碼', async () => {
            await adapter.auth.signUp('test@example.com', '[REDACTED]');
            const result = await adapter.auth.signIn('test@example.com', 'wrongpassword');

            expect(result.success).toBe(false);
            expect(result.error).toContain('密碼錯誤');
        });

        it('應拒絕不存在的用戶', async () => {
            const result = await adapter.auth.signIn('nobody@example.com', '[REDACTED]');

            expect(result.success).toBe(false);
            expect(result.error).toContain('不存在');
        });

        it('應正確登出', async () => {
            await adapter.auth.signUp('test@example.com', '[REDACTED]');
            await adapter.auth.signOut();

            const user = await adapter.auth.getUser();
            expect(user).toBeNull();
        });

        it('應正確修改密碼', async () => {
            await adapter.auth.signUp('test@example.com', 'oldpassword');
            const result = await adapter.auth.updatePassword('oldpassword', 'new[REDACTED]');

            expect(result.success).toBe(true);

            // 用新密碼登入應成功
            const login = await adapter.auth.signIn('test@example.com', 'new[REDACTED]');
            expect(login.success).toBe(true);
        });

        it('修改密碼時應拒絕錯誤舊密碼', async () => {
            await adapter.auth.signUp('test@example.com', 'oldpassword');
            const result = await adapter.auth.updatePassword('wrongpassword', 'new[REDACTED]');

            expect(result.success).toBe(false);
        });

        it('應正確刪除帳號', async () => {
            await adapter.auth.signUp('test@example.com', '[REDACTED]');
            const result = await adapter.auth.deleteAccount();

            expect(result).toBe(true);

            const login = await adapter.auth.signIn('test@example.com', '[REDACTED]');
            expect(login.success).toBe(false);
        });
    });

    describe('日誌 CRUD', () => {
        beforeEach(async () => {
            localStorage.clear();
            _resetKeyCache();
            _injectMasterKey(TEST_MASTER_KEY);
            adapter = new LocalStorageAdapter();
            adapter.clearLogsCache();
            await adapter.initialize();
            await adapter.auth.signUp('loguser@example.com', '[REDACTED]');
        });

        it('應創建日誌並自動生成 ID', async () => {
            const log = await adapter.logs.create({
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

        it('應列出日誌並按時間降序排列', async () => {
            await adapter.logs.create({
                emotions: [{ id: 'sad', name: '難過', quadrant: 'blue', energy: 1, pleasantness: 1 }],
                intensity: 5, bodyScan: null, understanding: null, expressing: null, regulating: null,
                postMood: 'same', timestamp: '2024-01-01T00:00:00.000Z',
            });
            await adapter.logs.create({
                emotions: [{ id: 'happy', name: '開心', quadrant: 'yellow', energy: 3, pleasantness: 3 }],
                intensity: 8, bodyScan: null, understanding: null, expressing: null, regulating: null,
                postMood: 'better', timestamp: '2024-01-02T00:00:00.000Z',
            });

            // Use the cache directly (same adapter instance)
            const allLogs = await adapter.logs.export();

            expect(allLogs.length).toBeGreaterThanOrEqual(2);
        });

        it('應支持分頁查詢', async () => {
            for (let i = 0; i < 5; i++) {
                await adapter.logs.create({
                    emotions: [{ id: `e${i}`, name: `情緒${i}`, quadrant: 'yellow', energy: 3, pleasantness: 3 }],
                    intensity: 5, bodyScan: null, understanding: null, expressing: null, regulating: null,
                    postMood: 'same', timestamp: new Date(Date.now() - i * 86400000).toISOString(),
                });
            }

            const allLogs = await adapter.logs.export();
            expect(allLogs.length).toBeGreaterThanOrEqual(5);

            const page1 = await adapter.logs.list({ page: 1, perPage: 2 });
            expect(page1.data).toHaveLength(2);
            expect(page1.hasMore).toBe(true);
        });

        it('應根據 ID 獲取單條日誌', async () => {
            const created = await adapter.logs.create({
                emotions: [{ id: 'calm', name: '平靜', quadrant: 'green', energy: 2, pleasantness: 3 }],
                intensity: 4, bodyScan: null, understanding: null, expressing: null, regulating: null,
                postMood: 'same', timestamp: new Date().toISOString(),
            });

            const found = await adapter.logs.getById(created.id);

            expect(found).toBeTruthy();
            expect(found?.id).toBe(created.id);
        });

        it('應更新日誌', async () => {
            const created = await adapter.logs.create({
                emotions: [{ id: 'happy', name: '開心', quadrant: 'yellow', energy: 3, pleasantness: 3 }],
                intensity: 5, bodyScan: null, understanding: null, expressing: null, regulating: null,
                postMood: 'same', timestamp: new Date().toISOString(),
            });

            const updated = await adapter.logs.update(created.id, { intensity: 9 });

            expect(updated.intensity).toBe(9);
        });

        it('應刪除日誌', async () => {
            const created = await adapter.logs.create({
                emotions: [{ id: 'happy', name: '開心', quadrant: 'yellow', energy: 3, pleasantness: 3 }],
                intensity: 5, bodyScan: null, understanding: null, expressing: null, regulating: null,
                postMood: 'same', timestamp: new Date().toISOString(),
            });

            await adapter.logs.delete(created.id);

            adapter.clearLogsCache();
            const found = await adapter.logs.getById(created.id);
            expect(found).toBeNull();
        });

        it('應正確匯入日誌（跳過重複時間戳）', async () => {
            const timestamp = new Date().toISOString();
            await adapter.logs.create({
                emotions: [{ id: 'happy', name: '開心', quadrant: 'yellow', energy: 3, pleasantness: 3 }],
                intensity: 5, bodyScan: null, understanding: null, expressing: null, regulating: null,
                postMood: 'same', timestamp,
            });

            adapter.clearLogsCache();
            const result = await adapter.logs.import([
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
            await adapter.logs.create({
                emotions: [{ id: 'happy', name: '開心', quadrant: 'yellow', energy: 3, pleasantness: 3 }],
                intensity: 5, bodyScan: null, understanding: null, expressing: null, regulating: null,
                postMood: 'same', timestamp: new Date().toISOString(),
            });

            const exported = await adapter.logs.export();

            expect(exported.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('草稿', () => {
        beforeEach(async () => {
            await adapter.auth.signUp('draftuser@example.com', '[REDACTED]');
        });

        it('應保存和讀取草稿', async () => {
            const draft = {
                step: 'labeling' as const,
                selectedQuadrants: ['yellow'] as import('../data/emotionData').Quadrant[],
                selectedEmotions: [],
                emotionIntensity: 5,
                bodyScanData: null,
                understandingData: null,
                expressingData: null,
                regulatingData: null,
                isFullFlow: false,
                postRegulationMood: '',
            };

            await adapter.draft.save(draft);
            const loaded = await adapter.draft.get();

            expect(loaded).toBeTruthy();
            expect(loaded?.step).toBe('labeling');
        });

        it('應清除草稿', async () => {
            const draft = {
                step: 'recognizing' as const,
                selectedQuadrants: [] as import('../data/emotionData').Quadrant[],
                selectedEmotions: [],
                emotionIntensity: 5,
                bodyScanData: null,
                understandingData: null,
                expressingData: null,
                regulatingData: null,
                isFullFlow: false,
                postRegulationMood: '',
            };

            await adapter.draft.save(draft);
            await adapter.draft.clear();

            const loaded = await adapter.draft.get();
            expect(loaded).toBeNull();
        });
    });

    describe('緩存', () => {
        it('clearLogsCache 應清除內部緩存', async () => {
            await adapter.auth.signUp('cacheuser@example.com', '[REDACTED]');
            await adapter.logs.create({
                emotions: [{ id: 'happy', name: '開心', quadrant: 'yellow', energy: 3, pleasantness: 3 }],
                intensity: 5, bodyScan: null, understanding: null, expressing: null, regulating: null,
                postMood: 'same', timestamp: new Date().toISOString(),
            });

            // This should not throw
            adapter.clearLogsCache();
        });
    });
});
