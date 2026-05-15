import React, { useState, useEffect, useMemo } from 'react';
import { type Emotion, type Quadrant } from '../data/emotionData';
import { useLanguage } from '../services/LanguageContext';
import { regulationIcons } from './icons/SvgIcons';
import { type RegulatingData } from '../types/RulerTypes';
import { settingsStore } from '../adapters';
import './RegulatingStep.css';

interface RegulatingStepProps {
    emotion: Emotion;
    onComplete: (data: RegulatingData) => void;
    onBack: () => void;
}

const RegulatingStep: React.FC<RegulatingStepProps> = ({ emotion, onComplete, onBack }) => {
    const { t } = useLanguage();
    const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
    const isParentRole = settingsStore.getUserRole() === 'parent';

    type StrategyItem = { icon: React.ReactNode; title: string; desc: string; type?: 'interactive'; recommended?: boolean; parentOnly?: boolean };
    const strategiesByQuadrant: Record<Quadrant, StrategyItem[]> = useMemo(() => {
        const all: Record<Quadrant, StrategyItem[]> = {
            red: [
                { icon: regulationIcons.breathing, title: t('引導式深呼吸'), desc: t('進入跟隨節奏的呼吸練習'), type: 'interactive', recommended: true },
                { icon: regulationIcons.grounding, title: t('5-4-3-2-1 接地法'), desc: t('透過感官重新連結當下'), type: 'interactive', recommended: true },
                { icon: regulationIcons.pauseCard, title: t('暫停卡'), desc: t('安全離開現場 30 秒，告訴孩子「媽媽/爸爸需要冷靜一下」'), recommended: true, parentOnly: true },
                { icon: regulationIcons.repair, title: t('修復對話'), desc: t('吼完孩子後的重新連結：蹲下、道歉、擁抱'), parentOnly: true },
                { icon: regulationIcons.running, title: t('強效宣洩'), desc: t('進行 30 秒的身心快速擺動') },
                { icon: regulationIcons.water, title: t('冰水刺激'), desc: t('利用溫差快速平復情緒') },
            ],
            yellow: [
                { icon: regulationIcons.gratitude, title: t('感恩清單'), desc: t('寫三件此刻讓你感到美好的事'), recommended: true },
                { icon: regulationIcons.sparkle, title: t('傳遞喜悦'), desc: t('發送一則讚美訊息給他人') },
                { icon: regulationIcons.target, title: t('目標設定'), desc: t('趁著能量高設定今天的小目標') },
                { icon: regulationIcons.dance, title: t('慶祝舞動'), desc: t('放一首歌，隨意地動一動身體') },
            ],
            blue: [
                { icon: regulationIcons.coffee, title: t('暖心儀式'), desc: t('為自己準備一杯有溫度的飲品'), recommended: true },
                { icon: regulationIcons.selfCompassion, title: t('自我慈悲三步驟'), desc: t('承認痛苦 → 記住你不孤單 → 對自己說溫柔的話'), recommended: true, parentOnly: true },
                { icon: regulationIcons.imperfectParent, title: t('不完美宣言'), desc: t('「我不需要是完美的父母，我只需要是在場的父母」'), parentOnly: true },
                { icon: regulationIcons.tidy, title: t('微小掌控'), desc: t('整理三件桌上的雜物') },
                { icon: regulationIcons.selfLove, title: t('自我慈悲'), desc: t('對自己說一句溫柔的鼓勵') },
                { icon: regulationIcons.plant, title: t('觀察植物'), desc: t('凝視一片葉子或窗外的景色') },
            ],
            green: [
                { icon: regulationIcons.meditate, title: t('三分鐘靜坐'), desc: t('純粹地與當下的平靜同在'), recommended: true },
                { icon: regulationIcons.parentMindful, title: t('親子正念遊戲'), desc: t('和孩子一起深呼吸三次，比比看誰吹的泡泡更大'), parentOnly: true },
                { icon: regulationIcons.book, title: t('慢讀時刻'), desc: t('細讀一段優美的文字') },
                { icon: regulationIcons.doodle, title: t('隨意塗鴉'), desc: t('不帶目的地記錄線條與色彩') },
                { icon: regulationIcons.offline, title: t('數位離線'), desc: t('給自己 10 分鐘的無擾空間') },
            ],
        };
        // Filter out parent-only strategies for non-parent users
        if (!isParentRole) {
            for (const q of Object.keys(all) as Quadrant[]) {
                all[q] = all[q].filter(s => !s.parentOnly);
            }
        }
        return all;
    }, [t, isParentRole]);

    const [activeInteractive, setActiveInteractive] = useState<string | null>(null);
    const [breatheStage, setBreatheStage] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
    const [groundingStep, setGroundingStep] = useState(0);
    const [isReflecting, setIsReflecting] = useState(false);
    const [reflectionText, setReflectionText] = useState('');

    const strategies = strategiesByQuadrant[emotion.quadrant];

    // NOTE: --aura-color controls the global body background gradient (see index.css).
    // TODO: Refactor to use a React ref or context instead of document.documentElement.
    useEffect(() => {
        document.documentElement.style.setProperty('--aura-color', `hsla(var(--h-${emotion.quadrant}), var(--s-${emotion.quadrant}), var(--l-${emotion.quadrant}), 0.2)`);
    }, [emotion.quadrant]);

    // Breathing Pacer Logic
    useEffect(() => {
        if (activeInteractive === t('引導式深呼吸')) {
            let timer: ReturnType<typeof setTimeout> | undefined;
            const cycle = () => {
                setBreatheStage('inhale');
                timer = setTimeout(() => {
                    setBreatheStage('hold');
                    timer = setTimeout(() => {
                        setBreatheStage('exhale');
                        timer = setTimeout(cycle, 6000);
                    }, 4000);
                }, 4000);
            };
            cycle();
            return () => {
                if (timer) clearTimeout(timer);
            };
        }
    }, [activeInteractive]);

    const toggleStrategy = (title: string, type?: string) => {
        if (type === 'interactive') {
            setActiveInteractive(title);
            return;
        }
        setSelectedStrategies(prev =>
            prev.includes(title) ? prev.filter(s => s !== title) : [...prev, title]
        );
    };

    const handleInteractiveComplete = () => {
        setIsReflecting(true);
    };

    const finishReflection = () => {
        setSelectedStrategies(prev => Array.from(new Set([...prev, activeInteractive!])));
        setActiveInteractive(null);
        setIsReflecting(false);
        setReflectionText('');
    };

    const groundingTasks = [
        t("觀察 5 個你能看到的物品"),
        t("感受 4 個你能觸碰到的質地"),
        t("聆聽 3 個你能聽到的聲音"),
        t("分辨 2 個你能聞到的氣味"),
        t("品味 1 個你能想到的美好滋味")
    ];

    return (
        <div className="regulating-step fade-in">
            {activeInteractive ? (
                <div className="interactive-overlay fade-in">
                    <button className="close-overlay" aria-label="關閉" onClick={() => setActiveInteractive(null)}>✕</button>
                    {activeInteractive === t('引導式深呼吸') && (
                        <div className="breathing-session">
                            <div className={`pacer-circle ${breatheStage}`}>
                                <div className="pacer-text">
                                    {breatheStage === 'inhale' ? t('吸氣...') : breatheStage === 'hold' ? t('屏息') : t('吐氣...')}
                                </div>
                            </div>
                            <p className="breathing-desc">{t('放鬆肩膀，跟隨圓圈的節奏')}</p>
                            <button className="confirm-pacer-btn" onClick={() => handleInteractiveComplete()}>{t('我感覺好多了')}</button>
                        </div>
                    )}
                    {activeInteractive === t('5-4-3-2-1 接地法') && (
                        <div className="grounding-session">
                            <div className="task-card">
                                <span className="task-count">{5 - groundingStep}</span>
                                <p className="task-text">{groundingTasks[groundingStep]}</p>
                            </div>
                            <div className="task-progress">
                                {groundingTasks.map((_, i) => (
                                    <div key={i} className={`progress-dot ${i <= groundingStep ? 'active' : ''}`}></div>
                                ))}
                            </div>
                            {groundingStep < 4 ? (
                                <button className="next-task-btn" onClick={() => setGroundingStep(s => s + 1)}>{t('完成這項')}</button>
                            ) : (
                                <button className="confirm-pacer-btn" onClick={() => handleInteractiveComplete()}>{t('回到現下')}</button>
                            )}
                        </div>
                    )}

                    {isReflecting && (
                        <div className="reflection-overlay fade-in">
                            <div className="reflection-card">
                                <h3>{t('此刻的感覺？')}</h3>
                                <p>{t('在練習之後，試著捕捉這一刻內在的微小轉變...')}</p>
                                <textarea
                                    className="morandi-textarea"
                                    placeholder={t("我感覺到...")}
                                    value={reflectionText}
                                    onChange={(e) => setReflectionText(e.target.value)}
                                    autoFocus
                                />
                                <button className="confirm-pacer-btn" onClick={finishReflection}>{t('完成紀錄')}</button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <div className="step-header">
                        <button className="nav-btn" onClick={onBack}>{t('← 返回')}</button>
                        <div className="step-label-container">
                            <span className="dot" style={{ backgroundColor: `var(--color-${emotion.quadrant})` }}></span>
                            <span className="step-title">{t('動念 — 我想如何回應？')}</span>
                        </div>
                    </div>

                    <div className="section-intro">
                        <h2>{t('選擇你的動念方式')}</h2>
                        <p>{t('選擇一個引導式練習，或幾項簡單的動作來恢復平衡。')}</p>
                    </div>

                    <div className="strategies-grid">
                        {strategies.map(s => (
                            <button
                                key={s.title}
                                type="button"
                                className={`strategy-item ${s.type === 'interactive' ? 'interactive' : ''} ${selectedStrategies.includes(s.title) ? 'active' : ''}`}
                                onClick={() => toggleStrategy(s.title, s.type)}
                            >
                                <div className="strategy-icon-wrapper">
                                    <div className="strategy-icon">{s.icon}</div>
                                </div>
                                <div className="strategy-meta">
                                    <div className="strategy-title-row">
                                        <h3>{s.title}</h3>
                                        {s.recommended && <span className="recommend-badge">{t('推薦')}</span>}
                                    </div>
                                    <p>{s.desc}</p>
                                </div>
                                {selectedStrategies.includes(s.title) && <div className="checked-mark">✓</div>}
                            </button>
                        ))}
                    </div>

                    <button className="morandi-main-btn" disabled={selectedStrategies.length === 0} onClick={() => onComplete({ selectedStrategies })}>
                        {t('完成本次練習')}
                    </button>
                </>
            )}

        </div>
    );
};

export default RegulatingStep;
