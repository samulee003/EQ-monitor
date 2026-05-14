import React, { useEffect, useState } from 'react';
import { useHabit } from '../services/HabitContext';
import { type Achievement } from '../types/AchievementTypes';
import { useLanguage } from '../services/LanguageContext';
import './AchievementToast.css';

const AchievementToast: React.FC = () => {
    const { newlyUnlocked, clearNewlyUnlocked } = useHabit();
    const { t } = useLanguage();
    const [current, setCurrent] = useState<Achievement | null>(null);

    useEffect(() => {
        if (newlyUnlocked.length > 0 && !current) {
            const next = newlyUnlocked[0];
            setCurrent(next);
            
            // Show for 4 seconds, then clear and check for next
            const timer = setTimeout(() => {
                setCurrent(null);
                clearNewlyUnlocked(next.id);
            }, 4000);
            
            return () => clearTimeout(timer);
        }
    }, [newlyUnlocked, current, clearNewlyUnlocked]);

    if (!current) return null;

    return (
        <div className="achievement-toast-overlay" role="status" aria-live="polite" aria-atomic="true">
            <div className="achievement-toast-card">
                <div className="achievement-icon-wrapper">
                    <span className="achievement-icon">{current.icon}</span>
                    <div className="achievement-sparkles"></div>
                </div>
                <div className="achievement-info">
                    <div className="achievement-tag">{t('解鎖成就')}</div>
                    <h3 className="achievement-name">{t(current.name)}</h3>
                    <p className="achievement-desc">{t(current.description)}</p>
                </div>
            </div>

        </div>
    );
};

export default AchievementToast;
