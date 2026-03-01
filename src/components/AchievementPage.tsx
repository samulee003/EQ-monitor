import React from 'react';
import { useHabit } from '../services/HabitContext';
import { ACHIEVEMENTS } from '../types/AchievementTypes';
import { useLanguage } from '../services/LanguageContext';
import { uiIcons } from './icons/SvgIcons';

const AchievementPage: React.FC = () => {
    const { progress } = useHabit();
    const { t } = useLanguage();

    return (
        <div className="achievement-page fade-in">
            <div className="achievement-header">
                <h2>{t('榮耀勳章')}</h2>
                <p>{t('記錄你的心靈成長足跡，已解鎖')} {progress.unlockedAchievements.length} / {ACHIEVEMENTS.length}</p>
            </div>

            <div className="achievement-grid">
                {ACHIEVEMENTS.map(achievement => {
                    const isUnlocked = progress.unlockedAchievements.includes(achievement.id);
                    return (
                        <div key={achievement.id} className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}>
                            <div className="achievement-icon-box">
                                <span className="achievement-icon">{achievement.icon}</span>
                                {!isUnlocked && <div className="lock-overlay">{uiIcons.trash /* Replace with lock if available */}</div>}
                            </div>
                            <div className="achievement-info">
                                <h4>{t(achievement.name)}</h4>
                                <p>{t(achievement.description)}</p>
                            </div>
                            {isUnlocked && <div className="unlocked-badge">✓</div>}
                        </div>
                    );
                })}
            </div>

            <style>{`
                .achievement-page { padding: 1rem; }
                .achievement-header { text-align: center; margin-bottom: 2.5rem; }
                .achievement-header h2 { font-size: 1.8rem; font-weight: 800; margin-bottom: 0.5rem; }
                .achievement-header p { color: var(--text-secondary); font-size: 0.9rem; }

                .achievement-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                    gap: 1.2rem;
                }

                .achievement-card {
                    background: var(--bg-secondary);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-md);
                    padding: 1.5rem 1rem;
                    text-align: center;
                    position: relative;
                    transition: var(--transition-luxe);
                }
                .achievement-card.locked { opacity: 0.5; filter: grayscale(1); }
                .achievement-card.unlocked { 
                    border-color: var(--color-yellow); 
                    background: linear-gradient(135deg, var(--bg-secondary) 0%, rgba(213, 193, 165, 0.05) 100%);
                    box-shadow: var(--shadow-sm);
                }
                .achievement-card.unlocked:hover { transform: translateY(-5px); box-shadow: var(--shadow-luxe); }

                .achievement-icon-box {
                    width: 60px;
                    height: 60px;
                    background: var(--glass-bg);
                    border-radius: 50%;
                    margin: 0 auto 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    position: relative;
                }
                .lock-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); border-radius: 50%; font-size: 1rem; opacity: 0.5; }

                .achievement-info h4 { margin: 0 0 0.5rem 0; font-size: 1rem; font-weight: 800; }
                .achievement-info p { margin: 0; font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4; }

                .unlocked-badge {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: var(--color-yellow);
                    color: var(--bg-color);
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    font-size: 0.7rem;
                    font-weight: 900;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                @media (max-width: 400px) {
                    .achievement-grid { grid-template-columns: 1fr 1fr; }
                }
            `}</style>
        </div>
    );
};

export default AchievementPage;
