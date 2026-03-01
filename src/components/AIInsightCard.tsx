import React from 'react';
import { AIInsight } from '@/services/AIService';
import { useLanguage } from '@/services/LanguageContext';
import { uiIcons } from './icons/SvgIcons';

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

    // 根據象限選擇主題色
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
                <style>{`
                    .ai-insight-card.loading {
                        background: var(--glass-bg);
                        border: 1px solid var(--glass-border);
                        border-radius: var(--radius-lg);
                        padding: var(--s-8);
                        text-align: center;
                        margin: var(--s-6) 0;
                    }
                    .ai-thinking {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: var(--s-4);
                        color: var(--text-secondary);
                    }
                    .thinking-dots {
                        display: flex;
                        gap: 6px;
                    }
                    .thinking-dots span {
                        width: 8px;
                        height: 8px;
                        background: var(--text-secondary);
                        border-radius: 50%;
                        animation: thinkingBounce 1.4s ease-in-out infinite both;
                    }
                    .thinking-dots span:nth-child(1) { animation-delay: -0.32s; }
                    .thinking-dots span:nth-child(2) { animation-delay: -0.16s; }
                    @keyframes thinkingBounce {
                        0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
                        40% { transform: scale(1); opacity: 1; }
                    }
                `}</style>
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
                            {insight.underlyingPatterns.map((pattern, idx) => (
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

            <style>{`
                .ai-insight-card {
                    background: linear-gradient(135deg, var(--glass-bg) 0%, hsla(0,0%,100%,0.02) 100%);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-lg);
                    padding: var(--s-6);
                    margin: var(--s-6) 0;
                    position: relative;
                    overflow: hidden;
                }
                
                .ai-insight-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: var(--theme-color, var(--text-secondary));
                    opacity: 0.6;
                }

                .ai-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: var(--s-2);
                    padding: var(--s-1) var(--s-3);
                    background: var(--glass-bg);
                    border: 1px solid var(--glass-border);
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: var(--theme-color, var(--text-secondary));
                    margin-bottom: var(--s-4);
                }

                .ai-icon {
                    animation: sparkle 2s ease-in-out infinite;
                }

                @keyframes sparkle {
                    0%, 100% { opacity: 0.7; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.2); }
                }

                .insight-content {
                    display: flex;
                    flex-direction: column;
                    gap: var(--s-4);
                }

                .insight-summary {
                    font-size: 1rem;
                    line-height: 1.7;
                    color: var(--text-primary);
                    margin: 0;
                }

                .section-label {
                    display: block;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: var(--text-secondary);
                    margin-bottom: var(--s-2);
                }

                .insight-patterns {
                    padding: var(--s-3);
                    background: rgba(0,0,0,0.1);
                    border-radius: var(--radius-md);
                }

                .pattern-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: var(--s-2);
                }

                .pattern-tag {
                    padding: 4px 12px;
                    background: var(--glass-bg);
                    border: 1px solid var(--glass-border);
                    border-radius: 16px;
                    font-size: 0.85rem;
                    color: var(--text-primary);
                }

                .suggested-action {
                    padding: var(--s-3);
                    background: hsla(0,0%,100%,0.03);
                    border-left: 3px solid var(--color-green);
                    border-radius: 0 var(--radius-md) var(--radius-md) 0;
                }

                .suggested-action p {
                    margin: 0;
                    color: var(--text-primary);
                    line-height: 1.6;
                }

                .color-theory {
                    display: flex;
                    align-items: flex-start;
                    gap: var(--s-3);
                    padding: var(--s-3);
                    background: var(--glass-bg);
                    border-radius: var(--radius-md);
                }

                .color-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    flex-shrink: 0;
                    margin-top: 4px;
                }

                .color-theory p {
                    margin: 0;
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                    font-style: italic;
                }

                .empathetic-quote {
                    margin: var(--s-2) 0 0;
                    padding: var(--s-4);
                    border-left: 2px solid var(--glass-border);
                    font-style: italic;
                    color: var(--text-secondary);
                    font-size: 0.95rem;
                    line-height: 1.6;
                }

                .regenerate-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: var(--s-2);
                    width: 100%;
                    margin-top: var(--s-4);
                    padding: var(--s-2);
                    background: transparent;
                    border: 1px dashed var(--glass-border);
                    border-radius: var(--radius-md);
                    color: var(--text-secondary);
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: var(--transition-luxe);
                }

                .regenerate-btn:hover {
                    border-color: var(--text-secondary);
                    color: var(--text-primary);
                }

                .regenerate-btn svg {
                    width: 16px;
                    height: 16px;
                }
            `}</style>
        </div>
    );
};

export default AIInsightCard;
