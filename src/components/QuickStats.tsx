import React, { useMemo, useState, useEffect } from 'react';
import { dataAdapter } from '../adapters';
import { type RulerLogEntry } from '../types/RulerTypes';
import { calculateEmotionStats, getHealthRecommendation } from '../utils/statisticsUtils';
import { getGreeting, isToday } from '../utils/dateUtils';
import { useLanguage } from '../services/LanguageContext';
import { uiIcons } from './icons/SvgIcons';
import './QuickStats.css';

const QuickStats: React.FC = () => {
    const { t, language } = useLanguage();
    const [logs, setLogs] = useState<RulerLogEntry[]>([]);

    useEffect(() => {
        const loadLogs = async () => {
            const data = await dataAdapter.logs.export();
            setLogs(data);
        };
        loadLogs();
    }, []);

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
                    {stats.streakDays >= 7 ? '!' : stats.streakDays >= 3 ? '+' : '○'}
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

        </div>
    );
};

export default QuickStats;