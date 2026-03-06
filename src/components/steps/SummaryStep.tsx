import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../services/LanguageContext';
import { uiIcons } from '../icons/SvgIcons';
import AIInsightCard from '../AIInsightCard';
import { aiService, AIInsight } from '../../services/AIService';
import { storageService } from '../../services/StorageService';
import { Emotion } from '../../data/emotionData';

interface SummaryStepProps {
    selectedEmotions: Emotion[];
    isFullFlow: boolean;
    onReset: () => void;
    onContinueFullFlow?: () => void;
}

export const SummaryStep: React.FC<SummaryStepProps> = ({
    selectedEmotions,
    isFullFlow,
    onReset,
    onContinueFullFlow
}) => {
    const { t } = useLanguage();
    const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
    const [isAILoading, setIsAILoading] = useState(false);

    // 生成 AI 洞察
    const generateAIInsight = async (force = false) => {
        if (!force && aiInsight) return;
        
        setIsAILoading(true);
        try {
            const history = storageService.getLogs().slice(0, 5);
            const insight = await aiService.analyzeFeeling(
                {
                    emotion: selectedEmotions[0],
                    intensity: 5,
                },
                history,
                { sleepHours: 7, activityLevel: 3, heartRate: 0 }
            );
            setAiInsight(insight);
        } catch (error) {
            console.error('AI Insight generation failed:', error);
        } finally {
            setIsAILoading(false);
        }
    };

    // 當組件掛載時自動生成洞察
    useEffect(() => {
        if (!aiInsight && !isAILoading) {
            generateAIInsight();
        }
    }, []);

    const primaryEmotion = selectedEmotions[0];
    const quadrant = primaryEmotion?.quadrant;

    // 快速調節建議（適合父母情境）
    const getQuickRegulateChips = () => {
        const chips: Record<string, string[]> = {
            red: ['🧘 深呼吸三次', '🚪 暫時離開現場一分鐘', '🖐️ 五感接地'],
            yellow: ['🙏 感恩清單', '💃 放首歌動一動'],
            blue: ['☕ 泡杯熱飲', '💕 對自己說句好話', '🤝 請伴侶或家人換班', '📱 讓孩子暫時看影片沒關係'],
            green: ['🌸 三次深呼吸', '📖 讀一段文字']
        };
        return chips[quadrant] || chips.green;
    };

    return (
        <div className="summary-card">
            {/* Confetti celebration */}
            <div className="confetti-container">
                {[...Array(12)].map((_, i) => (
                    <div
                        key={i}
                        className="confetti-piece"
                        style={{
                            '--delay': `${i * 0.1}s`,
                            '--x': `${(Math.random() - 0.5) * 200}px`,
                            '--rotation': `${Math.random() * 360}deg`,
                            '--color': ['var(--color-red)', 'var(--color-yellow)', 'var(--color-blue)', 'var(--color-green)'][i % 4]
                        } as React.CSSProperties}
                    />
                ))}
            </div>
            <div className="summary-icon celebration-bounce">{uiIcons.sparkle}</div>
            <h2>{t('覺察之旅完成')}</h2>

            <div className="ruler-checklist">
                <div className="checklist-item done">
                    <span className="step-tag r">N</span>
                    <span>{t('覺察當下的感受')}</span>
                </div>
                <div className="checklist-item done">
                    <span className="step-tag l">N</span>
                    <span>{t('命名情緒：')}<b>{selectedEmotions.map(e => t(e.name)).join('、')}</b></span>
                </div>
                {isFullFlow && (
                    <>
                        <div className="checklist-item done">
                            <span className="step-tag u">L</span>
                            <span>{t('定位觸發因素')}</span>
                        </div>
                        <div className="checklist-item done">
                            <span className="step-tag e">N</span>
                            <span>{t('表達內在需求')}</span>
                        </div>
                        <div className="checklist-item done">
                            <span className="step-tag r2">C</span>
                            <span>{t('選擇回應方式')}</span>
                        </div>
                    </>
                )}
            </div>

            {/* AI 洞察卡片 */}
            <AIInsightCard
                insight={aiInsight}
                isLoading={isAILoading}
                onRegenerate={() => generateAIInsight(true)}
                quadrant={quadrant}
            />

            {!isFullFlow && onContinueFullFlow && (
                <div className="quick-regulate-section">
                    <p className="quick-regulate-title">{t('💡 想試試快速調節嗎？')}</p>
                    <div className="quick-regulate-chips">
                        {getQuickRegulateChips().map(chip => (
                            <span key={chip} className="regulate-chip">{t(chip)}</span>
                        ))}
                    </div>
                    <button className="morandi-outline-btn" onClick={onContinueFullFlow}>
                        {t('開啟完整覺察練習')}
                    </button>
                </div>
            )}

            <button className="morandi-main-btn" onClick={onReset}>{t('返回')}</button>
        </div>
    );
};

export default SummaryStep;
