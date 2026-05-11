import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { dataAdapter } from '../adapters';
import { upsertCoachContext } from '@/lib/insforge/coachContext';

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
    logout: () => void;
    updateProfile: (data: Partial<User>) => Promise<boolean>;
    changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
    deleteAccount: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 初始化：檢查是否有已登錄用戶
    useEffect(() => {
        const initAuth = async () => {
            try {
                const currentUser = await dataAdapter.auth.getUser();
                if (currentUser) {
                    setUser({
                        id: currentUser.id,
                        email: currentUser.email || '',
                        displayName: currentUser.displayName || '',
                        avatar: currentUser.avatar,
                        createdAt: currentUser.createdAt || '',
                        lastLoginAt: currentUser.updatedAt || '',
                    });
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
        const result = await dataAdapter.auth.signIn(email, password);
        if (result.success && result.user) {
            setUser({
                id: result.user.id,
                email: result.user.email || '',
                displayName: result.user.displayName || '',
                avatar: result.user.avatar,
                createdAt: result.user.createdAt || '',
                lastLoginAt: result.user.updatedAt || '',
            });
        }
        return result;
    };

    const register = async (
        email: string,
        password: string,
        displayName: string,
        coachOptIn: boolean = false
    ): Promise<{ success: boolean; error?: string }> => {
        const result = await dataAdapter.auth.signUp(email, password, { displayName });
        if (result.success && result.user) {
            setUser({
                id: result.user.id,
                email: result.user.email || '',
                displayName: result.user.displayName || '',
                avatar: result.user.avatar,
                createdAt: result.user.createdAt || '',
                lastLoginAt: result.user.updatedAt || '',
            });

            // Initialize coach_context (fire-and-forget)
            upsertCoachContext({
                user_id: result.user.id,
                coach_opted_in: coachOptIn,
                last_active: new Date().toISOString(),
                streak_days: 0,
                recent_quadrants: [],
                recent_needs: [],
                avg_intensity: 0,
                subscription_tier: 'free',
                proactive_count_this_month: 0,
                coach_memory_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            }).catch(err => console.warn('coach_context init failed (non-blocking):', err));
        }
        return result;
    };

    const logout = () => {
        dataAdapter.auth.signOut();
        setUser(null);
    };

    const updateProfile = async (data: Partial<User>): Promise<boolean> => {
        if (!user) return false;

        try {
            const updated = await dataAdapter.profile.update(data);
            setUser({
                id: updated.id,
                email: updated.email || user.email,
                displayName: updated.displayName || user.displayName,
                avatar: updated.avatar,
                createdAt: user.createdAt,
                lastLoginAt: updated.updatedAt || user.lastLoginAt,
            });
            return true;
        } catch {
            return false;
        }
    };

    const changePassword = async (
        oldPassword: string,
        newPassword: string
    ): Promise<{ success: boolean; error?: string }> => {
        return await dataAdapter.auth.updatePassword(oldPassword, newPassword);
    };

    const deleteAccount = async (): Promise<boolean> => {
        const success = await dataAdapter.auth.deleteAccount();
        if (success) {
            setUser(null);
        }
        return success;
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        deleteAccount,
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
