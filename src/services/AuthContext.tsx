import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
    register: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    updateProfile: (data: Partial<User>) => Promise<boolean>;
    changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
    deleteAccount: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 模擬用戶數據庫（使用 localStorage）
const USERS_KEY = 'imxin_users';
const CURRENT_USER_KEY = 'imxin_current_user';

interface StoredUser extends User {
    passwordHash: string;
}

const getUsers = (): Record<string, StoredUser> => {
    try {
        return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    } catch {
        return {};
    }
};

const saveUsers = (users: Record<string, StoredUser>) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const hashPassword = (password: string): string => {
    // 簡單的 hash（實際應用應該使用 bcrypt 等）
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(16);
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 初始化：檢查是否有已登錄用戶
    useEffect(() => {
        const initAuth = () => {
            const currentUser = localStorage.getItem(CURRENT_USER_KEY);
            if (currentUser) {
                try {
                    const userData = JSON.parse(currentUser);
                    setUser(userData);
                } catch {
                    localStorage.removeItem(CURRENT_USER_KEY);
                }
            }
            setIsLoading(false);
        };
        initAuth();
    }, []);

    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const users = getUsers();
            const normalizedEmail = email.toLowerCase().trim();
            const storedUser = users[normalizedEmail];

            if (!storedUser) {
                return { success: false, error: '用戶不存在' };
            }

            const passwordHash = hashPassword(password);
            if (storedUser.passwordHash !== passwordHash) {
                return { success: false, error: '密碼錯誤' };
            }

            // 更新最後登錄時間
            const updatedUser: User = {
                id: storedUser.id,
                email: storedUser.email,
                displayName: storedUser.displayName,
                avatar: storedUser.avatar,
                createdAt: storedUser.createdAt,
                lastLoginAt: new Date().toISOString(),
            };

            storedUser.lastLoginAt = updatedUser.lastLoginAt;
            users[normalizedEmail] = storedUser;
            saveUsers(users);

            setUser(updatedUser);
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));

            return { success: true };
        } catch (error) {
            return { success: false, error: '登錄失敗，請稍後重試' };
        }
    };

    const register = async (
        email: string,
        password: string,
        displayName: string
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            const users = getUsers();
            const normalizedEmail = email.toLowerCase().trim();

            if (users[normalizedEmail]) {
                return { success: false, error: '該郵箱已被註冊' };
            }

            if (password.length < 6) {
                return { success: false, error: '密碼至少需要6個字符' };
            }

            if (displayName.length < 2) {
                return { success: false, error: '昵稱至少需要2個字符' };
            }

            const now = new Date().toISOString();
            const newUser: StoredUser = {
                id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                email: normalizedEmail,
                displayName: displayName.trim(),
                passwordHash: hashPassword(password),
                createdAt: now,
                lastLoginAt: now,
            };

            users[normalizedEmail] = newUser;
            saveUsers(users);

            // 自動登錄
            const userData: User = {
                id: newUser.id,
                email: newUser.email,
                displayName: newUser.displayName,
                createdAt: newUser.createdAt,
                lastLoginAt: newUser.lastLoginAt,
            };

            setUser(userData);
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));

            return { success: true };
        } catch (error) {
            return { success: false, error: '註冊失敗，請稍後重試' };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem(CURRENT_USER_KEY);
    };

    const updateProfile = async (data: Partial<User>): Promise<boolean> => {
        if (!user) return false;

        try {
            const users = getUsers();
            const storedUser = users[user.email];

            if (!storedUser) return false;

            if (data.displayName) {
                storedUser.displayName = data.displayName.trim();
            }
            if (data.avatar !== undefined) {
                storedUser.avatar = data.avatar;
            }

            saveUsers(users);

            const updatedUser: User = { ...user, ...data };
            setUser(updatedUser);
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));

            return true;
        } catch {
            return false;
        }
    };

    const changePassword = async (
        oldPassword: string,
        newPassword: string
    ): Promise<{ success: boolean; error?: string }> => {
        if (!user) return { success: false, error: '未登錄' };

        try {
            const users = getUsers();
            const storedUser = users[user.email];

            if (!storedUser) return { success: false, error: '用戶不存在' };

            if (storedUser.passwordHash !== hashPassword(oldPassword)) {
                return { success: false, error: '原密碼錯誤' };
            }

            if (newPassword.length < 6) {
                return { success: false, error: '新密碼至少需要6個字符' };
            }

            storedUser.passwordHash = hashPassword(newPassword);
            saveUsers(users);

            return { success: true };
        } catch {
            return { success: false, error: '修改失敗' };
        }
    };

    const deleteAccount = async (): Promise<boolean> => {
        if (!user) return false;

        try {
            const users = getUsers();
            delete users[user.email];
            saveUsers(users);

            // 清除該用戶的所有數據
            localStorage.removeItem(`imxin_logs_${user.id}`);
            localStorage.removeItem(`imxin_draft_${user.id}`);
            localStorage.removeItem(`imxin_progress_${user.id}`);

            logout();
            return true;
        } catch {
            return false;
        }
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
