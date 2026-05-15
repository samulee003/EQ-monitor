import React from 'react';
import { type AIInsight } from '../services/AIService';
import { useLanguage } from '../services/LanguageContext';
import { uiIcons } from './icons/SvgIcons';
import './AIInsightCard.css';

interface AIInsightCardProps {
    insight: AIInsight | null;
    isLoading: boolean;
    onRegenerate?: () => void;
    quadrant?: string;
}

export const AIInsightCard: React.FC<AIInsightCardProps> = ({
    insight,
    isLoading,
    onRegenerate,
    quadrant = 'default'
}) => {
    const { t } = useLanguage();

    // 根據狀態色彩選擇主題色
    const getThemeColor = () => {
        const colors: Record<string, string> = {
            red: 'var(--color-red)',
            yellow: 'var(--color-yellow)',
            blue: 'var(--color-blue)',
            green: 'var(--color-green)',
            default: 'var(--text-secondary)'
        };
        return colors[quadrant] || colors.default;
    };

    if (isLoading) {
        return (
            <div className="ai-insight-card loading">
                <div className="ai-thinking">
                    <div className="thinking-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <p>{t('正在傾聽你的內在...')}</p>
                </div>
            </div>
        );
    }

    if (!insight) return null;

    return (
        <div className="ai-insight-card fade-in">
            <div className="ai-badge" style={{ '--theme-color': getThemeColor() } as React.CSSProperties}>
                <span className="ai-icon">✨</span>
                <span>{t('今心洞察')}</span>
            </div>

            <div className="insight-content">
                <p className="insight-summary">{insight.summary}</p>

                {insight.underlyingPatterns && insight.underlyingPatterns.length > 0 && (
                    <div className="insight-patterns">
                        <span className="section-label">{t('潛在模式')}</span>
                        <div className="pattern-tags">
                            {insight.underlyingPatterns.map((pattern: string, idx: number) => (
                                <span key={idx} className="pattern-tag">{t(pattern)}</span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="suggested-action">
                    <span className="section-label">{t('微行動建議')}</span>
                    <p>{insight.suggestedAction}</p>
                </div>

                {insight.colorTheory && (
                    <div className="color-theory">
                        <span className="color-dot" style={{ background: getThemeColor() }}></span>
                        <p>{insight.colorTheory}</p>
                    </div>
                )}

                <blockquote className="empathetic-quote">
                    {insight.empatheticQuote}
                </blockquote>
            </div>

            {onRegenerate && (
                <button className="regenerate-btn" onClick={onRegenerate}>
                    {uiIcons.refresh}
                    <span>{t('重新生成')}</span>
                </button>
            )}

        </div>
    );
};

export default AIInsightCard;
