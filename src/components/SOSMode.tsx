import React, { useState, useEffect, useRef } from 'react';
import './SOSMode.css';

interface SOSModeProps {
    onComplete?: () => void;
    onBack?: () => void;
}

type SOSStep = 'select' | 'breathe' | 'action' | 'complete';

type SOSScenario = 'yelled' | 'crying' | 'overwhelmed';

interface ScenarioData {
    id: SOSScenario;
    emoji: string;
    title: string;
    subtitle: string;
}

const scenarios: ScenarioData[] = [
    {
        id: 'yelled',
        emoji: '😤',
        title: '剛對孩子發脾氣',
        subtitle: '現在感到愧疚或後悔'
    },
    {
        id: 'crying',
        emoji: '😭',
        title: '孩子一直哭',
        subtitle: '我快崩潰了'
    },
    {
        id: 'overwhelmed',
        emoji: '😫',
        title: '我快受不了了',
        subtitle: '感覺快要失控'
    }
];

// 呼吸引導：與 .breathing-circle CSS 動畫節奏對齊（7s 一輪 = 吸 2.45s / 屏 2.1s / 吐 2.45s）
const BreatheStepView: React.FC<{ onNext: () => void }> = ({ onNext }) => {
    const [phase, setPhase] = React.useState<'inhale' | 'hold' | 'exhale'>('inhale');
    React.useEffect(() => {
        const cycle: { p: 'inhale' | 'hold' | 'exhale'; ms: number }[] = [
            { p: 'inhale', ms: 2450 },
            { p: 'hold', ms: 2100 },
            { p: 'exhale', ms: 2450 },
        ];
        let idx = 0;
        let timer: ReturnType<typeof setTimeout>;
        const run = () => {
            setPhase(cycle[idx].p);
            timer = setTimeout(() => {
                idx = (idx + 1) % cycle.length;
                run();
            }, cycle[idx].ms);
        };
        run();
        return () => clearTimeout(timer);
    }, []);
    const phaseLabel = phase === 'inhale' ? '吸氣' : phase === 'hold' ? '屏息' : '吐氣';
    return (
        <div className="sos-step breathe-step">
            <div className="sos-header">
                <h2>先深呼吸</h2>
                <p className="sos-subtitle">這份感受很難受，它會過去的</p>
            </div>
            <div className="breathing-container">
                <div className="breathing-circle">
                    <div className="breathing-text" aria-live="polite">{phaseLabel}</div>
                </div>
                <p className="breathing-instruction">
                    跟著圓圈的節奏呼吸
                </p>
            </div>
            <button className="sos-primary-btn" onClick={onNext}>
                我準備好了，下一步 →
            </button>
        </div>
    );
};

const SOSMode: React.FC<SOSModeProps> = ({ onComplete, onBack }) => {
    const [step, setStep] = useState<SOSStep>('select');
    const [selectedScenario, setSelectedScenario] = useState<SOSScenario | null>(null);
    const [timer, setTimer] = useState<number>(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    const handleScenarioSelect = (scenario: SOSScenario) => {
        setSelectedScenario(scenario);
        setStep('breathe');
    };

    const startBreathing = () => {
        setStep('action');
    };

    const startTimer = (seconds: number) => {
        setTimer(seconds);
        setIsTimerRunning(true);
        timerRef.current = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    setIsTimerRunning(false);
                    if (timerRef.current) clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleComplete = () => {
        setStep('complete');
    };

    const renderSelectStep = () => (
        <div className="sos-step select-step">
            <div className="sos-header">
                <h2>情緒急救</h2>
                <p className="sos-subtitle">選擇你現在的情境，我們陪你一起處理</p>
            </div>

            <div className="scenario-grid">
                {scenarios.map(scenario => (
                    <button
                        key={scenario.id}
                        className="scenario-card"
                        onClick={() => handleScenarioSelect(scenario.id)}
                    >
                        <span className="scenario-emoji">{scenario.emoji}</span>
                        <span className="scenario-title">{scenario.title}</span>
                        <span className="scenario-subtitle">{scenario.subtitle}</span>
                    </button>
                ))}
            </div>

            {onBack && (
                <button className="sos-back-btn" onClick={onBack}>
                    ← 返回首頁
                </button>
            )}
        </div>
    );

    const renderBreatheStep = () => <BreatheStepView onNext={startBreathing} />;

    const renderActionStep = () => {
        if (!selectedScenario) return null;

        const actions: Record<SOSScenario, { title: string; steps: { icon: string; title: string; desc: string }[] }> = {
            yelled: {
                title: '修復',
                steps: [
                    {
                        icon: '🧘',
                        title: '先照顧自己（30秒）',
                        desc: '深呼吸 3 次，告訴自己：「我盡力了」'
                    },
                    {
                        icon: '🤗',
                        title: '回到孩子身邊',
                        desc: '蹲下來看著孩子的眼睛，說：「對不起，我愛你」'
                    },
                    {
                        icon: '💝',
                        title: '擁抱',
                        desc: '不需要說太多，身體接觸比語言重要'
                    }
                ]
            },
            crying: {
                title: '暫停',
                steps: [
                    {
                        icon: '✅',
                        title: '安全確認',
                        desc: '孩子在一個安全的地方嗎？如果是，你可以暫時離開一下'
                    },
                    {
                        icon: '⏱️',
                        title: '給自己 2 分鐘',
                        desc: '關上房門，戴上耳機，告訴自己：「這會過去的」'
                    },
                    {
                        icon: '🔄',
                        title: '回來後',
                        desc: '不需要立刻解決問題，先擁抱孩子讓他知道你在'
                    }
                ]
            },
            overwhelmed: {
                title: '陪伴自己',
                steps: [
                    {
                        icon: '📞',
                        title: '打給可以傾聽的人',
                        desc: '不需要建議，只需要有人聽你說'
                    },
                    {
                        icon: '🚪',
                        title: '暫時離開現場',
                        desc: '把孩子交給另一個照顧者，去一個安靜的角落'
                    },
                    {
                        icon: '🆘',
                        title: '如果你覺得可能傷害孩子或自己',
                        desc: '請立即撥打 1925 或尋求協助'
                    }
                ]
            }
        };

        const action = actions[selectedScenario];

        return (
            <div className="sos-step action-step">
                <div className="sos-header">
                    <h2>{action.title}</h2>
                    <p className="sos-subtitle">一步一步來，不用急</p>
                </div>

                <div className="action-steps">
                    {action.steps.map((step, index) => (
                        <div key={index} className="action-step-item">
                            <div className="action-step-number">{index + 1}</div>
                            <div className="action-step-content">
                                <div className="action-step-icon">{step.icon}</div>
                                <div className="action-step-text">
                                    <h4>{step.title}</h4>
                                    <p>{step.desc}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {selectedScenario === 'crying' && (
                    <div className="timer-section">
                        {!isTimerRunning && timer === 0 ? (
                            <button 
                                className="timer-btn"
                                onClick={() => startTimer(120)}
                            >
                                ▶️ 開始 2 分鐘計時器
                            </button>
                        ) : (
                            <div className="timer-display">
                                <span className="timer-count">{formatTime(timer)}</span>
                                <span className="timer-label">深呼吸，這會過去的</span>
                            </div>
                        )}
                    </div>
                )}

                <button className="sos-primary-btn" onClick={handleComplete}>
                    我做到了 ✅
                </button>
            </div>
        );
    };

    const renderCompleteStep = () => (
        <div className="sos-step complete-step">
            <div className="complete-illustration">
                <span className="complete-emoji">💚</span>
            </div>
            
            <h2>你做得很好</h2>
            <p className="complete-message">
                修復比完美更重要。<br/>
                願意面對自己的情緒，並採取行動，<br/>
                這已經是很棒的父母的表現。
            </p>

            <div className="complete-actions">
                <button className="sos-primary-btn" onClick={onComplete}>
                    記錄這次修復（可選）→
                </button>
                <button className="sos-secondary-btn" onClick={onBack}>
                    返回首頁
                </button>
            </div>
        </div>
    );

    return (
        <div className="sos-mode">
            <div className="sos-container">
                {step === 'select' && renderSelectStep()}
                {step === 'breathe' && renderBreatheStep()}
                {step === 'action' && renderActionStep()}
                {step === 'complete' && renderCompleteStep()}
            </div>
        </div>
    );
};

export default SOSMode;
