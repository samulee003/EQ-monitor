import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StorageKeys } from '../adapters';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
    theme: Theme;
    actualTheme: 'dark' | 'light';
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>('system');
    const [actualTheme, setActualTheme] = useState<'dark' | 'light'>('dark');

    useEffect(() => {
        const saved = localStorage.getItem(StorageKeys.THEME);
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as Theme;
                if (['dark', 'light', 'system'].includes(parsed)) {
                    setThemeState(parsed);
                }
            } catch { }
        }
    }, []);

    // 檢測系統主題偏好
    const getSystemTheme = useCallback((): 'dark' | 'light' => {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return 'light';
        }
        return 'dark';
    }, []);

    // 更新實際主題
    useEffect(() => {
        const newActualTheme = theme === 'system' ? getSystemTheme() : theme;
        setActualTheme(newActualTheme);
        
        // 應用到 document
        document.documentElement.setAttribute('data-theme', newActualTheme);
        
        // 更新 meta theme-color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', newActualTheme === 'dark' ? '#1a1a1a' : '#fdfaf3');
        }
    }, [theme, getSystemTheme]);

    // 監聽系統主題變化
    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
        const handleChange = () => {
            setActualTheme(getSystemTheme());
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme, getSystemTheme]);

    // 持久化主題設置
    useEffect(() => {
        localStorage.setItem(StorageKeys.THEME, JSON.stringify(theme));
    }, [theme]);

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeState(prev => {
            if (prev === 'dark') return 'light';
            if (prev === 'light') return 'system';
            return 'dark';
        });
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, actualTheme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export default ThemeContext;
