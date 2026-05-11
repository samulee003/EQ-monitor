import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { dataAdapter } from '../adapters';
import { _injectMasterKey, _resetKeyCache } from '../utils/crypto';

// 注入測試用加密主密鑰
const TEST_MASTER_KEY = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0')).join('');

vi.mock('../adapters', () => ({
    dataAdapter: {
        auth: {
            getUser: vi.fn(),
            signIn: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
            updatePassword: vi.fn(),
            deleteAccount: vi.fn(),
        },
        profile: {
            update: vi.fn(),
        },
    },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        _resetKeyCache();
        _injectMasterKey(TEST_MASTER_KEY);
        (dataAdapter.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    });

    it('初始狀態應為未登入且加載完成', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
    });

    it('應成功登入', async () => {
        const mockUser = {
            id: 'user_1',
            email: 'test@example.com',
            displayName: '測試用戶',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-02',
        };
        (dataAdapter.auth.signIn as ReturnType<typeof vi.fn>).mockResolvedValue({
            success: true,
            user: mockUser,
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
            const loginResult = await result.current.login('test@example.com', 'password123');
            expect(loginResult.success).toBe(true);
        });

        expect(result.current.user).toBeTruthy();
        expect(result.current.user?.email).toBe('test@example.com');
        expect(result.current.isAuthenticated).toBe(true);
    });

    it('登入失敗時應保持未登入狀態', async () => {
        (dataAdapter.auth.signIn as ReturnType<typeof vi.fn>).mockResolvedValue({
            success: false,
            error: '密碼錯誤',
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
            const loginResult = await result.current.login('test@example.com', 'wrong');
            expect(loginResult.success).toBe(false);
            expect(loginResult.error).toBe('密碼錯誤');
        });

        expect(result.current.isAuthenticated).toBe(false);
    });

    it('應成功註冊', async () => {
        const mockUser = {
            id: 'user_2',
            email: 'new@example.com',
            displayName: '新用戶',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
        };
        (dataAdapter.auth.signUp as ReturnType<typeof vi.fn>).mockResolvedValue({
            success: true,
            user: mockUser,
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
            const registerResult = await result.current.register('new@example.com', 'password123', '新用戶');
            expect(registerResult.success).toBe(true);
        });

        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user?.displayName).toBe('新用戶');
    });

    it('應正確登出', async () => {
        const mockUser = {
            id: 'user_3',
            email: 'test@example.com',
            displayName: '測試用戶',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
        };
        (dataAdapter.auth.signIn as ReturnType<typeof vi.fn>).mockResolvedValue({
            success: true,
            user: mockUser,
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
            await result.current.login('test@example.com', 'password123');
        });
        expect(result.current.isAuthenticated).toBe(true);

        act(() => {
            result.current.logout();
        });

        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
    });

    it('useAuth 在 Provider 外使用應拋出錯誤', () => {
        expect(() => {
            renderHook(() => useAuth());
        }).toThrow('useAuth must be used within an AuthProvider');
    });

    it('應正確更改密碼', async () => {
        (dataAdapter.auth.updatePassword as ReturnType<typeof vi.fn>).mockResolvedValue({
            success: true,
        });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
            const changeResult = await result.current.changePassword('oldpass', 'newpass123');
            expect(changeResult.success).toBe(true);
        });
    });

    it('初始化時應恢復已登入用戶', async () => {
        const existingUser = {
            id: 'user_4',
            email: 'existing@example.com',
            displayName: '已存在用戶',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-02',
        };
        (dataAdapter.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue(existingUser);

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true);
        });

        expect(result.current.user).toBeTruthy();
        expect(result.current.user?.email).toBe('existing@example.com');
    });
});
