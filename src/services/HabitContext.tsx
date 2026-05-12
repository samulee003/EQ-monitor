import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { dataAdapter } from '../adapters';
import { habitService } from './HabitService';
import { type UserProgress } from '../types/HabitTypes';
import { type Achievement, ACHIEVEMENTS } from '../types/AchievementTypes';
import { useAuth } from './AuthContext';

interface HabitContextType {
    progress: UserProgress;
    newlyUnlocked: Achievement[];
    clearNewlyUnlocked: (id?: string) => void;
    refreshProgress: () => Promise<Achievement[]>;
}

const DEFAULT_PROGRESS: UserProgress = {
    streak: { currentStreak: 0, longestStreak: 0, lastLogDate: null },
    unlockedAchievements: [],
    totalLogs: 0,
};

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export const HabitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const userId = user?.id;
    const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS);
    const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // 異步加載初始進度
    useEffect(() => {
        const loadProgress = async () => {
            try {
                const p = await habitService.getProgress();
                setProgress(p);
            } catch {
                setProgress(DEFAULT_PROGRESS);
            } finally {
                setIsInitialized(true);
            }
        };
        loadProgress();
    }, []);

    const refreshProgress = useCallback(async (): Promise<Achievement[]> => {
        try {
            const logs = await dataAdapter.logs.export();
            const { newlyUnlocked: ids } = await habitService.updateProgress(logs, userId);
            const updatedProgress = await habitService.getProgress();
            setProgress(updatedProgress);

            if (ids.length > 0) {
                const newAchievements = ACHIEVEMENTS.filter(a => ids.includes(a.id));
                setNewlyUnlocked(prev => [...prev, ...newAchievements]);
                return newAchievements;
            }
            return [];
        } catch {
            return [];
        }
    }, [userId]);

    const clearNewlyUnlocked = useCallback((id?: string) => {
        if (id) {
            setNewlyUnlocked(prev => prev.filter(a => a.id !== id));
        } else {
            setNewlyUnlocked([]);
        }
    }, []);

    // 初始化完成前顯示默認值，避免閃爍
    if (!isInitialized) {
        return (
            <HabitContext.Provider value={{
                progress: DEFAULT_PROGRESS,
                newlyUnlocked: [],
                clearNewlyUnlocked,
                refreshProgress,
            }}>
                {children}
            </HabitContext.Provider>
        );
    }

    return (
        <HabitContext.Provider value={{ progress, newlyUnlocked, clearNewlyUnlocked, refreshProgress }}>
            {children}
        </HabitContext.Provider>
    );
};

export const useHabit = () => {
    const context = useContext(HabitContext);
    if (!context) {
        throw new Error('useHabit must be used within a HabitProvider');
    }
    return context;
};
