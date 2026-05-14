import React from 'react';
import { settingsStore } from '../adapters';
import { useLanguage } from '../services/LanguageContext';
import { useHabit } from '../services/HabitContext';
import { ACHIEVEMENTS } from '../types/AchievementTypes';
import './AchievementPage.css';

const categoryAccentMap = {
    streak: {
        tone: 'var(--color-yellow)',
        soft: 'rgba(213, 193, 165, 0.18)',
        glow: 'rgba(213, 193, 165, 0.2)',
        label: '節奏足跡',
    },
    emotion: {
        tone: 'var(--color-blue)',
        soft: 'rgba(151, 166, 180, 0.18)',
        glow: 'rgba(151, 166, 180, 0.2)',
        label: '情緒光譜',
    },
    regulation: {
        tone: 'var(--color-green)',
        soft: 'rgba(170, 176, 155, 0.18)',
        glow: 'rgba(170, 176, 155, 0.2)',
        label: '調節練習',
    },
    special: {
        tone: 'var(--color-red)',
        soft: 'rgba(197, 139, 138, 0.18)',
        glow: 'rgba(197, 139, 138, 0.2)',
        label: '里程碑',
    },
    parenting: {
        tone: 'var(--color-green)',
        soft: 'rgba(170, 176, 155, 0.18)',
        glow: 'rgba(170, 176, 155, 0.2)',
        label: '親職守護',
    },
} as const;

const getAchievementProgress = (
    achievementId: string,
    requirement: number,
    totalLogs: number,
    currentStreak: number,
): { current: number; label: string } | null => {
    switch (achievementId) {
        case 'first_log':
            return { current: Math.min(totalLogs, requirement), label: '覺察紀錄' };
        case 'streak_3':
        case 'streak_7':
        case 'streak_30':
            return { current: Math.min(currentStreak, requirement), label: '連續紀錄' };
        default:
            return null;
    }
};

const AchievementPage: React.FC = () => {
    const { progress } = useHabit();
    const { t } = useLanguage();
    const isParentRole = settingsStore.getUserRole() === 'parent';
    const visibleAchievements = ACHIEVEMENTS.filter(a => a.category !== 'parenting' || isParentRole);
    const unlockedCount = progress.unlockedAchievements.length;
    const lockedCount = Math.max(visibleAchievements.length - unlockedCount, 0);
    const unlockRatio = visibleAchievements.length > 0 ? Math.round((unlockedCount / visibleAchievements.length) * 100) : 0;
    const spotlightAchievement = visibleAchievements.find(achievement => progress.unlockedAchievements.includes(achievement.id));
    const heroNarrative = spotlightAchievement
        ? `${t('你已經點亮「')}${t(spotlightAchievement.name)}${t('」，持續練習，讓更多微小但真實的改變被看見。')}`
        : t('每一則記錄、每一次停下來照看自己，都會慢慢累積成屬於你的成長徽章。');

    return (
        <div className="achievement-page fade-in">
            <section className="achievement-hero">
                <div className="achievement-hero-copy">
                    <span className="achievement-kicker">{t('成就殿堂')}</span>
                    <h2>{t('把每一次覺察，收藏成前進的足跡')}</h2>
                    <p>{heroNarrative}</p>
                </div>
                <div className="achievement-hero-orb" aria-hidden="true">
                    <div className="achievement-hero-ring">
                        <span className="achievement-hero-value">{unlockRatio}%</span>
                        <span className="achievement-hero-label">{t('點亮進度')}</span>
                    </div>
                </div>
                <p className="achievement-disclaimer">{t('成就系統為參與激勵工具，不反映心理健康狀態或臨床評估結果。')}</p>
            </section>

            <section className="achievement-summary" aria-label={t('成就摘要')}>
                <article className="summary-card">
                    <span className="summary-label">{t('已解鎖成就')}</span>
                    <strong className="summary-value">{unlockedCount}<span> / {visibleAchievements.length}</span></strong>
                    <p className="summary-note">{t('你已經把覺察練習，留下了可見的證明。')}</p>
                </article>
                <article className="summary-card">
                    <span className="summary-label">{t('目前連續節奏')}</span>
                    <strong className="summary-value">{progress.streak.currentStreak}<span>{t(' 天')}</span></strong>
                    <p className="summary-note">{t('不必完美，能回來記錄，就是延續。')}</p>
                </article>
                <article className="summary-card">
                    <span className="summary-label">{t('累積覺察次數')}</span>
                    <strong className="summary-value">{progress.totalLogs}<span>{t(' 次')}</span></strong>
                    <p className="summary-note">
                        {lockedCount > 0
                            ? `${t('還有')} ${lockedCount} ${t('枚徽章等待你慢慢點亮。')}`
                            : t('所有可見徽章都已點亮，這段旅程很了不起。')}
                    </p>
                </article>
            </section>

            <section className="achievement-section">
                <div className="section-heading">
                    <div>
                        <span className="section-tag">{t('收藏中的徽章')}</span>
                        <h3>{t('成就典藏')}</h3>
                    </div>
                    <p>{t('把你已經走過的努力，整理成一座可回望的殿堂。')}</p>
                </div>

                <div className="achievement-grid">
                    {visibleAchievements.map(achievement => {
                        const isUnlocked = progress.unlockedAchievements.includes(achievement.id);
                        const accent = categoryAccentMap[achievement.category];
                        const progressInfo = getAchievementProgress(
                            achievement.id,
                            achievement.requirement,
                            progress.totalLogs,
                            progress.streak.currentStreak,
                        );
                        const progressPercent = progressInfo
                            ? Math.max(8, Math.min((progressInfo.current / achievement.requirement) * 100, 100))
                            : 0;

                        return (
                            <article
                                key={achievement.id}
                                className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}
                                style={
                                    {
                                        '--achievement-tone': accent.tone,
                                        '--achievement-soft': accent.soft,
                                        '--achievement-glow': accent.glow,
                                    } as React.CSSProperties
                                }
                            >
                                <div className="achievement-card-top">
                                    <span className="achievement-category">{t(accent.label)}</span>
                                    <span className={`achievement-state ${isUnlocked ? 'is-unlocked' : 'is-locked'}`}>
                                        {isUnlocked ? t('已收藏') : t('尚待點亮')}
                                    </span>
                                </div>

                                <div className="achievement-main">
                                    <div className="achievement-icon-box" aria-hidden="true">
                                        <span className="achievement-icon">{achievement.icon}</span>
                                        {!isUnlocked && <span className="achievement-lock">✦</span>}
                                    </div>

                                    <div className="achievement-copy">
                                        <h4>{t(achievement.name)}</h4>
                                        <p>{t(achievement.description)}</p>
                                    </div>
                                </div>

                                <div className="achievement-footer">
                                    {isUnlocked ? (
                                        <p className="achievement-footnote">{t('這枚徽章已納入你的情緒成長收藏。')}</p>
                                    ) : progressInfo ? (
                                        <div className="achievement-progress">
                                            <div className="achievement-progress-track" aria-hidden="true">
                                                <div
                                                    className="achievement-progress-fill"
                                                    style={{ width: `${progressPercent}%` }}
                                                />
                                            </div>
                                            <div className="achievement-progress-meta">
                                                <span>{t(progressInfo.label)}</span>
                                                <strong>{progressInfo.current} / {achievement.requirement}</strong>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="achievement-footnote">{t('保持練習，條件成熟時它會自然亮起。')}</p>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>

        </div>
    );
};

export default AchievementPage;
