import React, { useState } from 'react';
import { aiService, GrillMeQuestionsResult, GrillMeSynthesisResult } from '../services/AIService';
import { useLanguage } from '../services/LanguageContext';

interface GrillMePanelProps {
    checkInData: any;
    quadrant?: string;
    onClose: () => void;
}

type GrillPhase = 'idle' | 'loading-questions' | 'answering' | 'loading-synthesis' | 'synthesis';

export const GrillMePanel: React.FC<GrillMePanelProps> = ({ checkInData, quadrant = 'default', onClose }) => {
    const { t } = useLanguage();
    const [phase, setPhase] = useState<GrillPhase>('idle');
    const [questions, setQuestions] = useState<GrillMeQuestionsResult | null>(null);
    const [answers, setAnswers] = useState<string[]>(['', '', '']);
    const [synthesis, setSynthesis] = useState<GrillMeSynthesisResult | null>(null);

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

    const handleStart = async () => {
        setPhase('loading-questions');
        const result = await aiService.generateGrillQuestions(checkInData);
        setQuestions(result);
        setPhase('answering');
    };

    const handleSubmitAnswers = async () => {
        if (!questions) return;
        const hasAnswers = answers.some(a => a.trim().length > 0);
        if (!hasAnswers) return;

        setPhase('loading-synthesis');
        const answerPayload = questions.questions.map((q, i) => ({
            id: q.id,
            question: q.text,
            answer: answers[i] || '（未作答）'
        }));
        const result = await aiService.generateGrillSynthesis(checkInData, answerPayload);
        setSynthesis(result);
        setPhase('synthesis');
    };

    const updateAnswer = (index: number, value: string) => {
        setAnswers(prev => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    };

    const themeColor = getThemeColor();

    return (
        <div className="grill-panel fade-in">
            <div className="grill-header">
                <div className="grill-badge" style={{ '--grill-color': themeColor } as React.CSSProperties}>
                    <span>🔥</span>
                    <span>{t('烤問模式')}</span>
                </div>
                <button className="grill-close-btn" onClick={onClose} aria-label={t('關閉')}>✕</button>
            </div>

            {phase === 'idle' && (
                <div className="grill-idle">
                    <p className="grill-intro-text">
                        {t('準備好接受更深的自我探索了嗎？今心將用三個問題挑戰你，帶你看見情緒背後真正的聲音。')}
                    </p>
                    <p className="grill-warning">{t('⚠️ 問題可能讓你感到不舒適——這是成長的信號。')}</p>
                    <button className="grill-start-btn" onClick={handleStart} style={{ '--grill-color': themeColor } as React.CSSProperties}>
                        {t('開始烤問')} 🔥
                    </button>
                </div>
            )}

            {(phase === 'loading-questions' || phase === 'loading-synthesis') && (
                <div className="grill-loading">
                    <div className="grill-fire-dots">
                        <span>🔥</span>
                        <span>🔥</span>
                        <span>🔥</span>
                    </div>
                    <p>{phase === 'loading-questions' ? t('正在準備深度問題...') : t('正在整合你的答案...')}</p>
                </div>
            )}

            {phase === 'answering' && questions && (
                <div className="grill-questions">
                    <p className="grill-questions-intro">{questions.intro}</p>
                    {questions.questions.map((q, i) => (
                        <div key={q.id} className="grill-question-block">
                            <label className="grill-question-label">
                                <span className="grill-q-num" style={{ background: themeColor }}>Q{q.id}</span>
                                <span>{q.text}</span>
                            </label>
                            <textarea
                                className="grill-answer-input"
                                value={answers[i]}
                                onChange={e => updateAnswer(i, e.target.value)}
                                placeholder={t('在這裡寫下你的想法...')}
                                rows={3}
                            />
                        </div>
                    ))}
                    <button
                        className="grill-submit-btn"
                        onClick={handleSubmitAnswers}
                        disabled={!answers.some(a => a.trim().length > 0)}
                        style={{ '--grill-color': themeColor } as React.CSSProperties}
                    >
                        {t('提交答案，看見更深的自己')} →
                    </button>
                </div>
            )}

            {phase === 'synthesis' && synthesis && (
                <div className="grill-synthesis fade-in">
                    <div className="synthesis-section core-need">
                        <span className="synthesis-label">{t('核心需求')}</span>
                        <p className="synthesis-highlight" style={{ color: themeColor }}>{synthesis.coreNeed}</p>
                    </div>

                    <div className="synthesis-section hidden-belief">
                        <span className="synthesis-label">{t('隱藏信念')}</span>
                        <p className="synthesis-belief-text">「{synthesis.hiddenBelief}」</p>
                    </div>

                    <div className="synthesis-section deeper-truth">
                        <span className="synthesis-label">{t('深層洞察')}</span>
                        <p>{synthesis.deeperTruth}</p>
                    </div>

                    <div className="synthesis-section reframe">
                        <span className="synthesis-label">{t('另一種視角')}</span>
                        <p>{synthesis.reframe}</p>
                    </div>

                    <div className="synthesis-section micro-experiment">
                        <span className="synthesis-label">🧪 {t('七天微實驗')}</span>
                        <p>{synthesis.microExperiment}</p>
                    </div>

                    <blockquote className="synthesis-closing-challenge">
                        {synthesis.closingChallenge}
                    </blockquote>

                    <button className="grill-done-btn" onClick={onClose}>
                        {t('帶著這份洞察離開')} ✓
                    </button>
                </div>
            )}

            <style>{`
                .grill-panel {
                    background: linear-gradient(135deg, var(--glass-bg) 0%, hsla(0,0%,100%,0.02) 100%);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-lg);
                    padding: var(--s-6);
                    margin: var(--s-6) 0;
                    position: relative;
                }
                .grill-panel::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 3px;
                    background: linear-gradient(90deg, var(--color-red), var(--color-yellow));
                    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
                }
                .grill-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: var(--s-4);
                }
                .grill-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: var(--s-2);
                    padding: var(--s-1) var(--s-3);
                    background: var(--glass-bg);
                    border: 1px solid var(--glass-border);
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: var(--grill-color, var(--color-red));
                }
                .grill-close-btn {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 1rem;
                    cursor: pointer;
                    padding: var(--s-1) var(--s-2);
                    border-radius: var(--radius-sm);
                    transition: var(--transition-luxe);
                }
                .grill-close-btn:hover { color: var(--text-primary); }
                .grill-idle {
                    display: flex;
                    flex-direction: column;
                    gap: var(--s-4);
                }
                .grill-intro-text {
                    color: var(--text-primary);
                    line-height: 1.7;
                    margin: 0;
                }
                .grill-warning {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    margin: 0;
                    padding: var(--s-3);
                    background: rgba(0,0,0,0.1);
                    border-radius: var(--radius-md);
                }
                .grill-start-btn {
                    padding: var(--s-3) var(--s-6);
                    background: linear-gradient(135deg, rgba(220,80,60,0.15), rgba(220,140,60,0.15));
                    border: 1px solid var(--grill-color, var(--color-red));
                    border-radius: var(--radius-md);
                    color: var(--grill-color, var(--color-red));
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: var(--transition-luxe);
                    width: 100%;
                }
                .grill-start-btn:hover {
                    background: linear-gradient(135deg, rgba(220,80,60,0.25), rgba(220,140,60,0.25));
                }
                .grill-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: var(--s-4);
                    padding: var(--s-8) 0;
                    color: var(--text-secondary);
                }
                .grill-fire-dots {
                    display: flex;
                    gap: var(--s-2);
                    font-size: 1.5rem;
                }
                .grill-fire-dots span {
                    animation: fireFlicker 1.2s ease-in-out infinite both;
                }
                .grill-fire-dots span:nth-child(1) { animation-delay: 0s; }
                .grill-fire-dots span:nth-child(2) { animation-delay: 0.2s; }
                .grill-fire-dots span:nth-child(3) { animation-delay: 0.4s; }
                @keyframes fireFlicker {
                    0%, 100% { opacity: 0.4; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
                .grill-questions {
                    display: flex;
                    flex-direction: column;
                    gap: var(--s-5);
                }
                .grill-questions-intro {
                    font-style: italic;
                    color: var(--text-secondary);
                    margin: 0 0 var(--s-2);
                    padding-bottom: var(--s-4);
                    border-bottom: 1px solid var(--glass-border);
                }
                .grill-question-block {
                    display: flex;
                    flex-direction: column;
                    gap: var(--s-2);
                }
                .grill-question-label {
                    display: flex;
                    align-items: flex-start;
                    gap: var(--s-3);
                    font-size: 0.95rem;
                    color: var(--text-primary);
                    line-height: 1.5;
                }
                .grill-q-num {
                    flex-shrink: 0;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    color: white;
                    font-size: 0.7rem;
                    font-weight: 700;
                    margin-top: 1px;
                }
                .grill-answer-input {
                    width: 100%;
                    padding: var(--s-3);
                    background: var(--glass-bg);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-md);
                    color: var(--text-primary);
                    font-size: 0.9rem;
                    line-height: 1.6;
                    resize: vertical;
                    font-family: inherit;
                    transition: border-color 0.2s;
                    box-sizing: border-box;
                }
                .grill-answer-input:focus {
                    outline: none;
                    border-color: var(--text-secondary);
                }
                .grill-answer-input::placeholder { color: var(--text-secondary); opacity: 0.6; }
                .grill-submit-btn {
                    padding: var(--s-3) var(--s-5);
                    background: linear-gradient(135deg, rgba(220,80,60,0.15), rgba(220,140,60,0.15));
                    border: 1px solid var(--grill-color, var(--color-red));
                    border-radius: var(--radius-md);
                    color: var(--grill-color, var(--color-red));
                    font-size: 0.95rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: var(--transition-luxe);
                    width: 100%;
                }
                .grill-submit-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }
                .grill-submit-btn:not(:disabled):hover {
                    background: linear-gradient(135deg, rgba(220,80,60,0.25), rgba(220,140,60,0.25));
                }
                .grill-synthesis {
                    display: flex;
                    flex-direction: column;
                    gap: var(--s-4);
                }
                .synthesis-section {
                    padding: var(--s-4);
                    background: hsla(0,0%,100%,0.03);
                    border-radius: var(--radius-md);
                }
                .synthesis-label {
                    display: block;
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: var(--text-secondary);
                    margin-bottom: var(--s-2);
                }
                .synthesis-highlight {
                    font-size: 1.15rem;
                    font-weight: 700;
                    margin: 0;
                }
                .synthesis-belief-text {
                    font-style: italic;
                    color: var(--text-primary);
                    font-size: 1rem;
                    margin: 0;
                }
                .synthesis-section p { margin: 0; line-height: 1.7; color: var(--text-primary); }
                .micro-experiment {
                    border-left: 3px solid var(--color-green);
                    border-radius: 0 var(--radius-md) var(--radius-md) 0;
                    background: hsla(var(--color-green-hsl, 120,40%,50%), 0.05);
                }
                .synthesis-closing-challenge {
                    margin: var(--s-2) 0 0;
                    padding: var(--s-4);
                    border-left: 2px solid var(--glass-border);
                    font-style: italic;
                    color: var(--text-secondary);
                    font-size: 0.95rem;
                    line-height: 1.6;
                }
                .grill-done-btn {
                    padding: var(--s-3) var(--s-5);
                    background: var(--glass-bg);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-md);
                    color: var(--text-primary);
                    font-size: 0.9rem;
                    cursor: pointer;
                    width: 100%;
                    transition: var(--transition-luxe);
                }
                .grill-done-btn:hover { border-color: var(--text-secondary); }
            `}</style>
        </div>
    );
};

export default GrillMePanel;
