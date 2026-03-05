import React, { useMemo } from 'react';
import { storageService } from '../services/StorageService';
import { calculateEmotionStats, getHealthRecommendation } from '../utils/statisticsUtils';
import { getGreeting, isToday } from '../utils/dateUtils';
import { useLanguage } from '../services/LanguageContext';
import { uiIcons } from './icons/SvgIcons';

const QuickStats: React.FC = () => {
    const { t, language } = useLanguage();
    const logs = useMemo(() => storageService.getLogs(), []);
    const stats = useMemo(() => calculateEmotionStats(logs), [logs]);
    const recommendation = useMemo(() => getHealthRecommendation(stats), [stats]);

    const todayLog = useMemo(() => {
        return logs.find(log => isToday(log.timestamp));
    }, [logs]);

    const greeting = getGreeting(language);

    if (logs.length === 0) {
        return null;
    }

    return (
        <div className="quick-stats fade-in">
            <div className="stats-greeting">
                <span className="greeting-emoji">
                    {stats.streakDays >= 7 ? '🔥' : stats.streakDays >= 3 ? '⭐' : '🌿'}
                </span>
                <div className="greeting-text">
                    <h3>{greeting}</h3>
                    {todayLog ? (
                        <p className="today-status">{t('今天已經記錄了情緒')}</p>
                    ) : (
                        <p className="today-status pending">{t('今天還沒記錄喔')}</p>
                    )}
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-item">
                    <span className="stat-value">{stats.streakDays}</span>
                    <span className="stat-label">{t('近期連續')}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{stats.totalEntries}</span>
                    <span className="stat-label">{t('總記錄')}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{stats.weeklyEntries}</span>
                    <span className="stat-label">{t('本週')}</span>
                </div>
            </div>

            <div className="recommendation-card">
                <div className="rec-icon">{uiIcons.sparkle}</div>
                <p className="rec-text">{t(recommendation)}</p>
            </div>

            <style>{`
                .quick-stats {
                    background: var(--bg-secondary);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-lg);
                    padding: 1.5rem;
                    margin-bottom: 1.5rem;
                }

                .stats-greeting {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .greeting-emoji {
                    font-size: 2.5rem;
                    animation: bounce 2s ease-in-out infinite;
                }

                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }

                .greeting-text h3 {
                    font-size: 1.4rem;
                    font-weight: 800;
                    margin: 0 0 0.25rem 0;
                    color: var(--text-primary);
                }

                .today-status {
                    font-size: 0.85rem;
                    color: var(--color-green);
                    margin: 0;
                }

                .today-status.pending {
                    color: var(--color-yellow);
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .stat-item {
                    text-align: center;
                    padding: 1rem;
                    background: var(--glass-bg);
                    border-radius: var(--radius-md);
                    border: 1px solid var(--glass-border);
                }

                .stat-value {
                    display: block;
                    font-size: 1.8rem;
                    font-weight: 800;
                    color: var(--color-yellow);
                    line-height: 1.2;
                }

                .stat-label {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .recommendation-card {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.75rem;
                    padding: 1rem;
                    background: linear-gradient(135deg, rgba(213, 193, 165, 0.1), rgba(170, 176, 155, 0.1));
                    border-radius: var(--radius-md);
                    border: 1px solid var(--glass-border);
                }

                .rec-icon {
                    width: 20px;
                    height: 20px;
                    color: var(--color-yellow);
                    flex-shrink: 0;
                    margin-top: 2px;
                }

                .rec-icon svg {
                    width: 100%;
                    height: 100%;
                }

                .rec-text {
                    font-size: 0.85rem;
                    color: var(--text-primary);
                    margin: 0;
                    line-height: 1.5;
                }

                @media (max-width: 480px) {
                    .stats-grid {
                        grid-template-columns: repeat(3, 1fr);
                        gap: 0.5rem;
                    }
                    .stat-item {
                        padding: 0.75rem;
                    }
                    .stat-value {
                        font-size: 1.4rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default QuickStats;