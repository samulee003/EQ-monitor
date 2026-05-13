import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { upsertCoachContext } from '@/lib/insforge/coachContext';
import { isMigrationNeeded } from '@/lib/insforge/localStorageMigration';
import { getCoachContext } from '@/lib/insforge/coachContext';
import { insforgeAuthService } from './InsForgeAuthService';
import { type UserProfile } from '@/adapters/types';

export interface User {
    id: string;
    email: string;
    displayName: string;
    avatar?: string;
    createdAt: string;
    lastLoginAt: string;
}

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (email: string, password: string, displayName: string, coachOptIn?: boolean) => Promise<{ success: boolean; error?: string }>;
    continueAsGuest: (displayName?: string) => void;
    logout: () => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<boolean>;
    changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
    deleteAccount: () => Promise<boolean>;
    migrationNeeded: boolean;
    clearMigrationFlag: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toContextUser = (profile: UserProfile): User => ({
    id: profile.id,
    email: profile.email || '',
    displayName: profile.displayName || '',
    avatar: profile.avatar,
    createdAt: profile.createdAt || '',
    lastLoginAt: profile.updatedAt || '',
});

const buildInitialCoachContext = (userId: string, coachOptIn: boolean = false) => ({
    user_id: userId,
    coach_opted_in: coachOptIn,
    last_active: new Date().toISOString(),
    streak_days: 0,
    recent_quadrants: [],
    recent_needs: [],
    avg_intensity: 0,
    subscription_tier: 'free' as const,
    proactive_count_this_month: 0,
    coach_memory_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [migrationNeeded, setMigrationNeeded] = useState(false);

    // 初始化：檢查是否有已登錄用戶
    useEffect(() => {
        const initAuth = async () => {
            try {
                const currentUser = await insforgeAuthService.getUser();
                if (currentUser) {
                    setUser(toContextUser(currentUser));
                }
            } catch {
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        initAuth();
    }, []);

    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        const result = await insforgeAuthService.signIn(email, password);
        if (result.success && result.user) {
            const signedInUserId = result.user.id;
            setUser(toContextUser(result.user));
            getCoachContext(signedInUserId)
                .then(ctx => {
                    if (!ctx) {
                        upsertCoachContext(buildInitialCoachContext(signedInUserId))
                            .catch(err => console.warn('coach_context init failed (non-blocking):', err));
                    }
                    if (isMigrationNeeded(ctx?.migration_completed_at ?? null)) {
                        setMigrationNeeded(true);
                    }
                })
                .catch(() => {/* 非關鍵，忽略 */});
        }
        return result;
    };

    const register = async (
        email: string,
        password: string,
        displayName: string,
        coachOptIn: boolean = false
    ): Promise<{ success: boolean; error?: string }> => {
        const result = await insforgeAuthService.signUp(email, password, displayName);
        if (result.success && result.user) {
            setUser(toContextUser(result.user));

            // Initialize coach_context (fire-and-forget)
            upsertCoachContext(buildInitialCoachContext(result.user.id, coachOptIn))
                .catch(err => console.warn('coach_context init failed (non-blocking):', err));
        }
        return result;
    };

    const continueAsGuest = (displayName: string = '訪客用戶') => {
        const now = new Date().toISOString();
        setUser({
            id: `guest_${Date.now()}`,
            email: '',
            displayName,
            createdAt: now,
            lastLoginAt: now,
        });
    };

    const logout = async () => {
        if (user?.email) {
            try {
                await insforgeAuthService.signOut();
            } catch {
                // 登出即使遠端失敗，也先清除本地 UI 狀態，避免卡在已登入畫面。
            }
        }
        setUser(null);
    };

    const updateProfile = async (data: Partial<User>): Promise<boolean> => {
        if (!user) return false;

        try {
            const updated = await insforgeAuthService.updateProfile(data);
            setUser(toContextUser(updated));
            return true;
        } catch {
            return false;
        }
    };

    const changePassword = async (
        _oldPassword: string,
        _newPassword: string
    ): Promise<{ success: boolean; error?: string }> => {
        return { success: false, error: '請使用忘記密碼流程重設密碼' };
    };

    const deleteAccount = async (): Promise<boolean> => {
        return false;
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        continueAsGuest,
        logout,
        updateProfile,
        changePassword,
        deleteAccount,
        migrationNeeded,
        clearMigrationFlag: () => setMigrationNeeded(false),
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
