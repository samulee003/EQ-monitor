import React, { useEffect, useState } from 'react';
import { useHabit } from '../services/HabitContext';
import { Achievement } from '../types/AchievementTypes';
import { useLanguage } from '../services/LanguageContext';

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
                clearNewlyUnlocked();
            }, 4000);
            
            return () => clearTimeout(timer);
        }
    }, [newlyUnlocked, current, clearNewlyUnlocked]);

    if (!current) return null;

    return (
        <div className="achievement-toast-overlay">
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

            <style>{`
                .achievement-toast-overlay {
                    position: fixed;
                    top: 24px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 9999;
                    pointer-events: none;
                }
                .achievement-toast-card {
                    background: var(--bg-secondary);
                    border: 1px solid var(--glass-border);
                    padding: var(--s-4) var(--s-6);
                    border-radius: var(--radius-luxe);
                    display: flex;
                    align-items: center;
                    gap: var(--s-4);
                    box-shadow: var(--shadow-luxe);
                    backdrop-filter: var(--glass-blur);
                    animation: toastSlideDown 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                               toastSlideUp 0.6s 3.4s cubic-bezier(0.36, 0, 0.66, -0.56) forwards;
                    min-width: 280px;
                }
                
                @keyframes toastSlideDown {
                    from { transform: translateY(-100px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes toastSlideUp {
                    from { transform: translateY(0); opacity: 1; }
                    to { transform: translateY(-100px); opacity: 0; }
                }

                .achievement-icon-wrapper {
                    position: relative;
                    width: 50px;
                    height: 50px;
                    background: var(--glass-bg);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.8rem;
                }
                .achievement-sparkles {
                    position: absolute;
                    inset: -4px;
                    border-radius: 50%;
                    border: 2px dashed var(--color-yellow);
                    animation: rotateSparkle 10s linear infinite;
                    opacity: 0.4;
                }
                @keyframes rotateSparkle {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .achievement-info { display: flex; flex-direction: column; }
                .achievement-tag { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1.5px; color: var(--color-yellow); font-weight: 800; margin-bottom: 2px; }
                .achievement-name { font-size: 1.1rem; font-weight: 800; margin: 0; color: var(--text-primary); }
                .achievement-desc { font-size: 0.8rem; color: var(--text-secondary); margin: 0; }
            `}</style>
        </div>
    );
};

export default AchievementToast;
