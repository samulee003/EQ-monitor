import React, { createContext, useContext, useState, useEffect } from 'react';
import { habitService } from './HabitService';
import { UserProgress } from '../types/HabitTypes';
import { Achievement, ACHIEVEMENTS } from '../types/AchievementTypes';

interface HabitContextType {
    progress: UserProgress;
    newlyUnlocked: Achievement[];
    clearNewlyUnlocked: () => void;
    refreshProgress: () => Achievement[];
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export const HabitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [progress, setProgress] = useState<UserProgress>(habitService.getProgress());
    const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);

    const refreshProgress = () => {
        const logs = JSON.parse(localStorage.getItem('feelings_logs') || '[]');
        const { newlyUnlocked: ids } = habitService.updateProgress(logs);
        const updatedProgress = habitService.getProgress();
        setProgress(updatedProgress);

        if (ids.length > 0) {
            const newAchievements = ACHIEVEMENTS.filter(a => ids.includes(a.id));
            setNewlyUnlocked(prev => [...prev, ...newAchievements]);
            return newAchievements;
        }
        return [];
    };

    const clearNewlyUnlocked = () => {
        setNewlyUnlocked([]);
    };

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
