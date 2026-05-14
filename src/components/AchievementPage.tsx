import React from 'react';
import { settingsStore } from '../adapters';
import { useLanguage } from '../services/LanguageContext';
import { useHabit } from '../services/HabitContext';
import { ACHIEVEMENTS } from '../types/AchievementTypes';

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

            <style>{`
                .achievement-page {
                    padding: 1rem 1rem 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                }

                .achievement-hero {
                    position: relative;
                    display: grid;
                    grid-template-columns: minmax(0, 1.5fr) minmax(180px, 0.8fr);
                    gap: 1rem;
                    padding: 1.5rem;
                    border-radius: 28px;
                    border: 1px solid var(--glass-border);
                    background:
                        radial-gradient(circle at top right, rgba(213, 193, 165, 0.16), transparent 38%),
                        radial-gradient(circle at bottom left, rgba(151, 166, 180, 0.14), transparent 42%),
                        linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
                    box-shadow: var(--shadow-luxe);
                    overflow: hidden;
                }

                .achievement-hero::after {
                    content: '';
                    position: absolute;
                    inset: auto -40px -50px auto;
                    width: 180px;
                    height: 180px;
                    border-radius: 50%;
                    background: rgba(170, 176, 155, 0.12);
                    filter: blur(22px);
                    pointer-events: none;
                }

                .achievement-hero-copy {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    position: relative;
                    z-index: 1;
                }

                .achievement-kicker,
                .section-tag,
                .summary-label,
                .achievement-category,
                .achievement-state,
                .achievement-progress-meta span {
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    font-size: 0.72rem;
                    font-weight: 700;
                }

                .achievement-kicker {
                    display: inline-flex;
                    align-items: center;
                    width: fit-content;
                    padding: 0.42rem 0.75rem;
                    border-radius: 999px;
                    background: rgba(213, 193, 165, 0.14);
                    color: var(--color-yellow);
                }

                .achievement-hero h2 {
                    margin: 0;
                    font-size: clamp(1.8rem, 4vw, 2.4rem);
                    line-height: 1.15;
                    font-weight: 800;
                    color: var(--text-primary);
                }

                .achievement-hero p,
                .section-heading p,
                .summary-note,
                .achievement-copy p,
                .achievement-footnote,
                .achievement-disclaimer {
                    margin: 0;
                    color: var(--text-secondary);
                    line-height: 1.6;
                }

                .achievement-hero-orb {
                    position: relative;
                    z-index: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .achievement-hero-ring {
                    width: min(190px, 100%);
                    aspect-ratio: 1;
                    border-radius: 50%;
                    padding: 1rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 0.35rem;
                    border: 1px solid rgba(213, 193, 165, 0.28);
                    background:
                        radial-gradient(circle at center, rgba(213, 193, 165, 0.18), transparent 58%),
                        rgba(255, 255, 255, 0.04);
                    box-shadow: inset 0 0 0 10px rgba(255, 255, 255, 0.03);
                    text-align: center;
                }

                .achievement-hero-value {
                    font-size: clamp(2rem, 5vw, 2.8rem);
                    font-weight: 800;
                    color: var(--text-primary);
                }

                .achievement-hero-label {
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                    letter-spacing: 0.08em;
                }

                .achievement-disclaimer {
                    grid-column: 1 / -1;
                    font-size: 0.78rem;
                    opacity: 0.8;
                    position: relative;
                    z-index: 1;
                }

                .achievement-summary {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 0.9rem;
                }

                .summary-card {
                    padding: 1.1rem 1rem;
                    border-radius: 22px;
                    border: 1px solid var(--glass-border);
                    background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
                    box-shadow: var(--shadow-sm);
                    display: flex;
                    flex-direction: column;
                    gap: 0.45rem;
                }

                .summary-label {
                    color: var(--text-secondary);
                }

                .summary-value {
                    font-size: clamp(1.45rem, 3.5vw, 2rem);
                    color: var(--text-primary);
                    font-weight: 800;
                    line-height: 1;
                }

                .summary-value span {
                    font-size: 0.92rem;
                    color: var(--text-secondary);
                    font-weight: 600;
                }

                .summary-note {
                    font-size: 0.82rem;
                }

                .achievement-section {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .section-heading {
                    display: flex;
                    align-items: end;
                    justify-content: space-between;
                    gap: 1rem;
                }

                .section-heading h3 {
                    margin: 0.35rem 0 0;
                    font-size: 1.3rem;
                    font-weight: 800;
                    color: var(--text-primary);
                }

                .section-heading p {
                    max-width: 340px;
                    font-size: 0.9rem;
                    text-align: right;
                }

                .section-tag {
                    color: var(--color-yellow);
                }

                .achievement-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 1rem;
                }

                .achievement-card {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    min-height: 228px;
                    padding: 1.15rem;
                    border-radius: 24px;
                    border: 1px solid color-mix(in srgb, var(--achievement-tone) 22%, var(--glass-border));
                    background:
                        linear-gradient(180deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.02)),
                        linear-gradient(135deg, var(--achievement-soft), transparent 60%);
                    box-shadow: 0 18px 40px -28px var(--achievement-glow);
                    overflow: hidden;
                    transition: transform 220ms ease, box-shadow 220ms ease, opacity 220ms ease;
                }

                .achievement-card::before {
                    content: '';
                    position: absolute;
                    inset: 0 auto auto 0;
                    width: 100%;
                    height: 4px;
                    background: linear-gradient(90deg, var(--achievement-tone), transparent 72%);
                    opacity: 0.9;
                }

                .achievement-card.unlocked:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 24px 48px -26px var(--achievement-glow);
                }

                .achievement-card.locked {
                    opacity: 0.82;
                }

                .achievement-card.locked .achievement-icon-box {
                    background: rgba(255, 255, 255, 0.04);
                    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02);
                }

                .achievement-card.locked .achievement-icon {
                    filter: grayscale(1);
                    opacity: 0.72;
                }

                .achievement-card-top,
                .achievement-main,
                .achievement-footer {
                    position: relative;
                    z-index: 1;
                }

                .achievement-card-top {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 0.75rem;
                }

                .achievement-category {
                    color: var(--achievement-tone);
                }

                .achievement-state {
                    padding: 0.32rem 0.62rem;
                    border-radius: 999px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }

                .achievement-state.is-unlocked {
                    color: var(--achievement-tone);
                    background: color-mix(in srgb, var(--achievement-tone) 12%, transparent);
                }

                .achievement-state.is-locked {
                    color: var(--text-secondary);
                    background: rgba(255, 255, 255, 0.04);
                }

                .achievement-main {
                    display: flex;
                    align-items: center;
                    gap: 0.95rem;
                    flex: 1;
                }

                .achievement-icon-box {
                    position: relative;
                    width: 72px;
                    height: 72px;
                    flex-shrink: 0;
                    border-radius: 22px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background:
                        radial-gradient(circle at top, rgba(255, 255, 255, 0.12), transparent 60%),
                        rgba(255, 255, 255, 0.07);
                    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--achievement-tone) 18%, transparent);
                }

                .achievement-icon {
                    font-size: 2rem;
                    line-height: 1;
                }

                .achievement-lock {
                    position: absolute;
                    right: -2px;
                    bottom: -3px;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.72rem;
                    color: var(--text-primary);
                    background: rgba(26, 26, 26, 0.75);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }

                .achievement-copy {
                    display: flex;
                    flex-direction: column;
                    gap: 0.35rem;
                }

                .achievement-copy h4 {
                    margin: 0;
                    font-size: 1.06rem;
                    line-height: 1.25;
                    font-weight: 800;
                    color: var(--text-primary);
                }

                .achievement-copy p,
                .achievement-footnote,
                .achievement-progress-meta {
                    font-size: 0.84rem;
                }

                .achievement-footer {
                    margin-top: auto;
                }

                .achievement-footnote {
                    min-height: 2.7em;
                }

                .achievement-progress {
                    display: flex;
                    flex-direction: column;
                    gap: 0.45rem;
                }

                .achievement-progress-track {
                    width: 100%;
                    height: 7px;
                    border-radius: 999px;
                    background: rgba(255, 255, 255, 0.07);
                    overflow: hidden;
                }

                .achievement-progress-fill {
                    height: 100%;
                    border-radius: inherit;
                    background: linear-gradient(90deg, var(--achievement-tone), rgba(255, 255, 255, 0.95));
                }

                .achievement-progress-meta {
                    display: flex;
                    justify-content: space-between;
                    gap: 0.75rem;
                    color: var(--text-secondary);
                }

                .achievement-progress-meta strong {
                    color: var(--text-primary);
                }

                @media (max-width: 720px) {
                    .achievement-hero,
                    .achievement-summary,
                    .section-heading {
                        grid-template-columns: 1fr;
                    }

                    .achievement-hero {
                        padding: 1.25rem;
                    }

                    .achievement-hero-orb {
                        justify-content: flex-start;
                    }

                    .achievement-hero-ring {
                        width: 140px;
                    }

                    .achievement-summary {
                        display: grid;
                    }

                    .section-heading {
                        display: flex;
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .section-heading p {
                        max-width: none;
                        text-align: left;
                    }
                }

                @media (max-width: 520px) {
                    .achievement-page {
                        padding-inline: 0.85rem;
                    }

                    .achievement-grid {
                        grid-template-columns: 1fr;
                    }

                    .achievement-main {
                        align-items: flex-start;
                    }

                    .achievement-icon-box {
                        width: 64px;
                        height: 64px;
                    }
                }
            `}</style>
        </div>
    );
};

export default AchievementPage;
