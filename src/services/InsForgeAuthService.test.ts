import { describe, it, expect, beforeEach, vi } from 'vitest';
import { insforgeAuthService } from './InsForgeAuthService';

const authMock = vi.hoisted(() => ({
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getCurrentUser: vi.fn(),
  setProfile: vi.fn(),
}));

const databaseMock = vi.hoisted(() => ({
  from: vi.fn(),
}));

const functionsMock = vi.hoisted(() => ({
  invoke: vi.fn(),
}));

vi.mock('@/lib/insforge/client', () => ({
  insforge: {
    auth: authMock,
    database: databaseMock,
    functions: functionsMock,
  },
}));

const sdkUser = {
  id: 'user-1',
  email: 'test@example.com',
  emailVerified: true,
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-02T00:00:00.000Z',
  profile: {
    name: '測試用戶',
    avatar_url: 'https://example.com/avatar.png',
  },
  metadata: null,
};

const createAccountDeletionQuery = (row: unknown = null) => {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }),
  };
  return query;
};

describe('InsForgeAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    databaseMock.from.mockReturnValue(createAccountDeletionQuery());
  });

  it('註冊時應呼叫 InsForge Auth 並映射使用者資料', async () => {
    authMock.signUp.mockResolvedValue({
      data: { user: sdkUser, accessToken: 'token-1' },
      error: null,
    });

    const result = await insforgeAuthService.signUp(' Test@Example.com ', '[REDACTED]', '測試用戶');

    expect(authMock.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: '[REDACTED]',
      name: '測試用戶',
    });
    expect(result).toEqual({
      success: true,
      token: 'token-1',
      user: {
        id: 'user-1',
        email: 'test@example.com',
        displayName: '測試用戶',
        avatar: 'https://example.com/avatar.png',
        timezone: 'Asia/Taipei',
        language: 'zh-TW',
        themePreference: 'system',
        privacyEnabled: false,
        notificationSettings: {},
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-02T00:00:00.000Z',
      },
    });
  });

  it('登入失敗時應回傳 InsForge 錯誤訊息', async () => {
    authMock.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid login credentials' },
    });

    const result = await insforgeAuthService.signIn('test@example.com', 'wrong-password');

    expect(result).toEqual({
      success: false,
      error: 'Invalid login credentials',
    });
  });

  it('登入已刪除帳號時應立刻登出並拒絕恢復登入狀態', async () => {
    authMock.signInWithPassword.mockResolvedValue({
      data: { user: sdkUser, accessToken: 'token-1' },
      error: null,
    });
    authMock.signOut.mockResolvedValue({ error: null });
    databaseMock.from.mockReturnValue(createAccountDeletionQuery({
      user_id: 'user-1',
      deleted_at: '2026-05-14T00:00:00.000Z',
    }));

    const result = await insforgeAuthService.signIn('test@example.com', '[REDACTED]');

    expect(result).toEqual({
      success: false,
      error: '這個帳號已完成刪除，若需要恢復請聯絡維護者',
    });
    expect(databaseMock.from).toHaveBeenCalledWith('account_deletions');
    expect(authMock.signOut).toHaveBeenCalled();
  });

  it('冷啟動時應從 InsForge current user 還原使用者', async () => {
    authMock.getCurrentUser.mockResolvedValue({
      data: { user: sdkUser },
      error: null,
    });

    const user = await insforgeAuthService.getUser();

    expect(authMock.getCurrentUser).toHaveBeenCalled();
    expect(user?.id).toBe('user-1');
    expect(user?.displayName).toBe('測試用戶');
  });

  it('冷啟動遇到已刪除帳號時應登出並回到未登入', async () => {
    authMock.getCurrentUser.mockResolvedValue({
      data: { user: sdkUser },
      error: null,
    });
    authMock.signOut.mockResolvedValue({ error: null });
    databaseMock.from.mockReturnValue(createAccountDeletionQuery({
      user_id: 'user-1',
      deleted_at: '2026-05-14T00:00:00.000Z',
    }));

    const user = await insforgeAuthService.getUser();

    expect(user).toBeNull();
    expect(authMock.signOut).toHaveBeenCalled();
  });

  it('更新個人資料時應寫入 InsForge profile 並回傳 app 使用者格式', async () => {
    authMock.setProfile.mockResolvedValue({
      data: {
        user: {
          ...sdkUser,
          profile: { name: '新名稱', avatar_url: 'https://example.com/new.png' },
          updatedAt: '2026-05-03T00:00:00.000Z',
        },
      },
      error: null,
    });

    const updated = await insforgeAuthService.updateProfile({
      displayName: '新名稱',
      avatar: 'https://example.com/new.png',
    });

    expect(authMock.setProfile).toHaveBeenCalledWith({
      name: '新名稱',
      avatar_url: 'https://example.com/new.png',
    });
    expect(updated.displayName).toBe('新名稱');
    expect(updated.avatar).toBe('https://example.com/new.png');
  });

  it('刪除帳號資料時應呼叫受保護的 Edge Function 清理雲端資料', async () => {
    functionsMock.invoke.mockResolvedValue({
      data: { success: true },
      error: null,
    });

    const result = await insforgeAuthService.deleteAccountData('user-1');

    expect(result).toEqual({ success: true });
    expect(functionsMock.invoke).toHaveBeenCalledWith('delete-account', {
      body: { userId: 'user-1' },
    });
  });
});
