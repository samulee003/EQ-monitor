import { insforge } from '@/lib/insforge/client';
import { type AuthResult, type UserProfile } from '@/adapters/types';

type InsForgeProfile = {
  name?: string;
  avatar_url?: string;
  timezone?: string;
  language?: string;
  theme_preference?: string;
  privacy_enabled?: boolean;
  notification_settings?: Record<string, unknown>;
};

type InsForgeUser = {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  profile: InsForgeProfile | null;
  metadata: Record<string, unknown> | null;
};

type InsForgeError = {
  message?: string;
};

type AuthData = {
  user?: InsForgeUser;
  accessToken?: string | null;
  requireEmailVerification?: boolean;
};

type CurrentUserData = {
  user: InsForgeUser | null;
};

type ProfileData = {
  user?: InsForgeUser;
} | InsForgeUser;

const getMessage = (error: InsForgeError | null | undefined, fallback: string): string =>
  error?.message || fallback;

const normalizeEmail = (email: string): string =>
  email.trim().toLowerCase();

const getMetadataString = (metadata: Record<string, unknown> | null, key: string): string | undefined => {
  const value = metadata?.[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
};

const mapUser = (user: InsForgeUser): UserProfile => ({
  id: user.id,
  email: user.email,
  displayName: user.profile?.name || getMetadataString(user.metadata, 'displayName') || user.email.split('@')[0],
  avatar: user.profile?.avatar_url,
  timezone: user.profile?.timezone || 'Asia/Taipei',
  language: user.profile?.language || 'zh-TW',
  themePreference: user.profile?.theme_preference || 'system',
  privacyEnabled: user.profile?.privacy_enabled || false,
  notificationSettings: user.profile?.notification_settings || {},
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const extractProfileUser = (data: ProfileData | null): InsForgeUser | null => {
  if (!data) return null;
  if ('id' in data) return data;
  return data.user ?? null;
};

export class InsForgeAuthService {
  async signUp(email: string, password: string, displayName?: string): Promise<AuthResult> {
    const name = displayName?.trim();
    const { data, error } = await insforge.auth.signUp({
      email: normalizeEmail(email),
      password,
      ...(name ? { name } : {}),
    });

    if (error) return { success: false, error: getMessage(error, '註冊失敗') };

    const authData = data as AuthData | null;
    if (authData?.requireEmailVerification && !authData.user) {
      return { success: false, error: '請先完成電子郵件驗證後再登入' };
    }

    if (!authData?.user) return { success: false, error: '註冊失敗，未取得使用者資料' };

    return {
      success: true,
      user: mapUser(authData.user),
      token: authData.accessToken ?? undefined,
    };
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await insforge.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });

    if (error) return { success: false, error: getMessage(error, '登入失敗') };
    if (!data?.user) return { success: false, error: '登入失敗，未取得使用者資料' };

    return {
      success: true,
      user: mapUser(data.user as InsForgeUser),
      token: data.accessToken,
    };
  }

  async signOut(): Promise<void> {
    const { error } = await insforge.auth.signOut();
    if (error) throw new Error(getMessage(error, '登出失敗'));
  }

  async getUser(): Promise<UserProfile | null> {
    const { data, error } = await insforge.auth.getCurrentUser();
    if (error || !data?.user) return null;
    return mapUser((data as CurrentUserData).user as InsForgeUser);
  }

  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const profilePatch: InsForgeProfile = {};
    if (data.displayName !== undefined) profilePatch.name = data.displayName;
    if (data.avatar !== undefined) profilePatch.avatar_url = data.avatar;
    if (data.timezone !== undefined) profilePatch.timezone = data.timezone;
    if (data.language !== undefined) profilePatch.language = data.language;
    if (data.themePreference !== undefined) profilePatch.theme_preference = data.themePreference;
    if (data.privacyEnabled !== undefined) profilePatch.privacy_enabled = data.privacyEnabled;
    if (data.notificationSettings !== undefined) profilePatch.notification_settings = data.notificationSettings;

    const { data: updated, error } = await insforge.auth.setProfile(profilePatch);
    if (error) throw new Error(getMessage(error, '更新個人資料失敗'));

    const user = extractProfileUser(updated as ProfileData | null);
    if (!user) throw new Error('更新個人資料失敗，未取得使用者資料');
    return mapUser(user);
  }
}

export const insforgeAuthService = new InsForgeAuthService();
