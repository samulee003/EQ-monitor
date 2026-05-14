import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { insforgeAuthService } from './InsForgeAuthService';
import { upsertCoachContext, getCoachContext } from '@/lib/insforge/coachContext';
import { isMigrationNeeded } from '@/lib/insforge/localStorageMigration';

vi.mock('./InsForgeAuthService', () => ({
    insforgeAuthService: {
        getUser: vi.fn(),
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        updateProfile: vi.fn(),
        deleteAccountData: vi.fn(),
    },
}));

vi.mock('@/lib/insforge/coachContext', () => ({
    upsertCoachContext: vi.fn().mockResolvedValue(null),
    getCoachContext: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/insforge/localStorageMigration', () => ({
    isMigrationNeeded: vi.fn(() => false),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
);

const mockUser = {
    id: 'user_1',
    email: 'test@example.com',
    displayName: '測試用戶',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-02',
    timezone: 'Asia/Taipei',
    language: 'zh-TW',
    themePreference: 'system',
    privacyEnabled: false,
    notificationSettings: {},
};

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(insforgeAuthService.getUser).mockResolvedValue(null);
        vi.mocked(isMigrationNeeded).mockReturnValue(false);
    });

    it('初始狀態應為未登入且加載完成', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
    });

    it('應透過 InsForgeAuthService 成功登入', async () => {
        vi.mocked(insforgeAuthService.signIn).mockResolvedValue({
            success: true,
            user: mockUser,
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        await act(async () => {
            const loginResult = await result.current.login('test@example.com', '[REDACTED]');
            expect(loginResult.success).toBe(true);
        });

        expect(insforgeAuthService.signIn).toHaveBeenCalledWith('test@example.com', '[REDACTED]');
        expect(result.current.user?.email).toBe('test@example.com');
        expect(result.current.isAuthenticated).toBe(true);
    });

    it('登入失敗時應保持未登入狀態', async () => {
        vi.mocked(insforgeAuthService.signIn).mockResolvedValue({
            success: false,
            error: '密碼錯誤',
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        await act(async () => {
            const loginResult = await result.current.login('test@example.com', 'wrong');
            expect(loginResult).toEqual({ success: false, error: '密碼錯誤' });
        });

        expect(result.current.isAuthenticated).toBe(false);
    });

    it('應透過 InsForgeAuthService 成功註冊並初始化 coach_context', async () => {
        vi.mocked(insforgeAuthService.signUp).mockResolvedValue({
            success: true,
            user: { ...mockUser, id: 'user_2', email: 'new@example.com', displayName: '新用戶' },
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        await act(async () => {
            const registerResult = await result.current.register('new@example.com', '[REDACTED]', '新用戶', true);
            expect(registerResult.success).toBe(true);
        });

        expect(insforgeAuthService.signUp).toHaveBeenCalledWith('new@example.com', '[REDACTED]', '新用戶');
        expect(upsertCoachContext).toHaveBeenCalledWith(expect.objectContaining({
            user_id: 'user_2',
            coach_opted_in: true,
        }));
        expect(result.current.user?.displayName).toBe('新用戶');
    });

    it('訪客模式不應建立 InsForge 帳號', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        act(() => {
            result.current.continueAsGuest('訪客用戶');
        });

        expect(insforgeAuthService.signUp).not.toHaveBeenCalled();
        expect(result.current.user?.email).toBe('');
        expect(result.current.user?.displayName).toBe('訪客用戶');
        expect(result.current.isAuthenticated).toBe(true);
    });

    it('應正確登出', async () => {
        vi.mocked(insforgeAuthService.signIn).mockResolvedValue({
            success: true,
            user: mockUser,
        });
        vi.mocked(insforgeAuthService.signOut).mockResolvedValue(undefined);

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        await act(async () => {
            await result.current.login('test@example.com', '[REDACTED]');
        });

        await act(async () => {
            await result.current.logout();
        });

        expect(insforgeAuthService.signOut).toHaveBeenCalled();
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
    });

    it('useAuth 在 Provider 外使用應拋出錯誤', () => {
        expect(() => {
            renderHook(() => useAuth());
        }).toThrow('useAuth must be used within an AuthProvider');
    });

    it('更改密碼應提示使用忘記密碼流程', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
            const changeResult = await result.current.changePassword('oldpass', 'newpass123');
            expect(changeResult).toEqual({
                success: false,
                error: '請使用忘記密碼流程重設密碼',
            });
        });
    });

    it('刪除帳號資料時應清除雲端資料、登出並重置登入狀態', async () => {
        vi.mocked(insforgeAuthService.signIn).mockResolvedValue({
            success: true,
            user: mockUser,
        });
        vi.mocked(insforgeAuthService.deleteAccountData).mockResolvedValue({ success: true });
        vi.mocked(insforgeAuthService.signOut).mockResolvedValue(undefined);

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        await act(async () => {
            await result.current.login('test@example.com', '[REDACTED]');
        });

        await act(async () => {
            const deleted = await result.current.deleteAccount();
            expect(deleted).toBe(true);
        });

        expect(insforgeAuthService.deleteAccountData).toHaveBeenCalledWith('user_1');
        expect(insforgeAuthService.signOut).toHaveBeenCalled();
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
    });

    it('初始化時應恢復已登入用戶', async () => {
        vi.mocked(insforgeAuthService.getUser).mockResolvedValue(mockUser);

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true);
        });

        expect(result.current.user?.email).toBe('test@example.com');
    });

    it('登入後若本機資料尚未遷移，應標記 migrationNeeded', async () => {
        vi.mocked(insforgeAuthService.signIn).mockResolvedValue({
            success: true,
            user: mockUser,
        });
        vi.mocked(getCoachContext).mockResolvedValue({ migration_completed_at: null } as Awaited<ReturnType<typeof getCoachContext>>);
        vi.mocked(isMigrationNeeded).mockReturnValue(true);

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        await act(async () => {
            await result.current.login('test@example.com', '[REDACTED]');
        });

        await waitFor(() => {
            expect(result.current.migrationNeeded).toBe(true);
        });
    });
});
