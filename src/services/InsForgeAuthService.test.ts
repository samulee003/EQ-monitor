import { describe, it, expect, beforeEach, vi } from 'vitest';
import { insforgeAuthService } from './InsForgeAuthService';

const authMock = vi.hoisted(() => ({
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getCurrentUser: vi.fn(),
  setProfile: vi.fn(),
}));

vi.mock('@/lib/insforge/client', () => ({
  insforge: {
    auth: authMock,
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

describe('InsForgeAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
