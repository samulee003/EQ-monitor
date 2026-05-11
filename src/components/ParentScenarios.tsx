import React, { useState } from 'react';
import { useLanguage } from '../services/LanguageContext';
import './ParentScenarios.css';


interface ParentScenariosProps {
    onDismiss: () => void;
}

interface Scenario {
    id: string;
    label: string;
    emoji: string;
    quadrant: 'red' | 'blue';
    comfort: string;
    steps: string[];
}

const ParentScenarios: React.FC<ParentScenariosProps> = ({ onDismiss }) => {
    const { t } = useLanguage();
    const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
    const [currentStep, setCurrentStep] = useState(0);

    const scenarios: Scenario[] = [
        {
            id: 'yelled',
            label: t('我剛對孩子發了脾氣'),
            emoji: '~',
            quadrant: 'red',
            comfort: t('你不是壞父母。你只是一個累壞了的人類。能意識到這一點，就已經是愛的表現。'),
            steps: [
                t('先深呼吸三次，讓自己的心跳慢下來'),
                t('走到孩子身邊，蹲下來與他平視'),
                t('用平靜的語氣說：「剛才媽媽/爸爸太大聲了，對不起」'),
                t('問孩子：「你現在還好嗎？需要抱抱嗎？」'),
                t('不需要解釋太多，擁抱比道理更重要'),
            ],
        },
        {
            id: 'crying',
            label: t('孩子一直哭我快崩潰'),
            emoji: '?',
            quadrant: 'red',
            comfort: t('孩子的哭聲會觸發你的「戰或逃」反應，這是正常的生理機制，不是你的錯。'),
            steps: [
                t('確認孩子安全後，給自己 30 秒離開現場'),
                t('用冰水洗手或洗臉，啟動「潛水反射」平復心跳'),
                t('告訴自己：「哭是孩子表達需求的方式，不是我的失敗」'),
                t('回到孩子身邊，輕輕拍背說：「我在這裡」'),
            ],
        },
        {
            id: 'not_good_enough',
            label: t('我感覺自己不是好父母'),
            emoji: '!',
            quadrant: 'blue',
            comfort: t('完美的父母不存在。「夠好的父母」才是孩子真正需要的——而你已經是了。'),
            steps: [
                t('把手放在胸口，感受自己的心跳'),
                t('對自己說：「這很辛苦，但很多父母都有這種感覺」'),
                t('列出今天你為孩子做的一件小事'),
                t('允許自己不完美，這就是最好的示範'),
            ],
        },
        {
            id: 'exhausted',
            label: t('我好累想要獨處'),
            emoji: '~',
            quadrant: 'blue',
            comfort: t('需要休息不是自私，是必需。你無法從空杯子裡倒出水來。'),
            steps: [
                t('評估：孩子現在安全嗎？能交給伴侶或家人 10 分鐘嗎？'),
                t('如果可以，到另一個房間，關上門'),
                t('不做任何事，只是坐著呼吸 5 分鐘'),
                t('如果無法離開，戴上耳機聽 3 分鐘白噪音'),
            ],
        },
    ];

    const handleSelect = (scenario: Scenario) => {
        setActiveScenario(scenario);
        setCurrentStep(0);
    };

    const handleNextStep = () => {
        if (!activeScenario) return;
        if (currentStep < activeScenario.steps.length - 1) {
            setCurrentStep(s => s + 1);
        }
    };

    return (
        <div className="parent-scenarios fade-in">
            {!activeScenario ? (
                <>
                    <div className="scenarios-header">
                        <button className="quick-back-btn" onClick={onDismiss}>{t('< 返回')}</button>
                        <span className="quick-badge parent-badge">{t('親職支援')}</span>
                    </div>
                    <h2 className="scenarios-title">{t('現在怎麼了？')}</h2>
                    <p className="scenarios-subtitle">{t('選擇最接近的情境，我們會立刻幫助你')}</p>
                    <div className="scenario-list">
                        {scenarios.map(s => (
                            <button key={s.id} className="scenario-btn" onClick={() => handleSelect(s)}>
                                <span className="scenario-emoji">{s.emoji}</span>
                                <span className="scenario-label">{s.label}</span>
                                <span className="scenario-arrow">&rarr;</span>
                            </button>
                        ))}
                    </div>
                </>
            ) : (
                <div className="scenario-active fade-slide-in">
                    <button className="quick-back-btn" onClick={() => setActiveScenario(null)}>{t('< 其他情境')}</button>

                    <div className="comfort-card" style={{ borderColor: activeScenario.quadrant === 'red' ? 'var(--color-red)' : 'var(--color-blue)' }}>
                        <span className="comfort-emoji">{activeScenario.emoji}</span>
                        <p className="comfort-text">{activeScenario.comfort}</p>
                    </div>

                    <h3 className="steps-title">{t('你現在可以做的：')}</h3>
                    <div className="action-steps">
                        {activeScenario.steps.map((stepText, i) => (
                            <div key={i} className={`action-step ${i <= currentStep ? 'visible' : 'hidden'} ${i === currentStep ? 'current' : ''}`}>
                                <span className="step-number">{i + 1}</span>
                                <span className="step-text">{stepText}</span>
                            </div>
                        ))}
                    </div>

                    {currentStep < activeScenario.steps.length - 1 ? (
                        <button className="morandi-main-btn" onClick={handleNextStep}>
                            {t('下一步')}
                        </button>
                    ) : (
                        <button className="morandi-main-btn" onClick={onDismiss}>
                            {t('我好多了')}
                        </button>
                    )}
                </div>
            )}


        </div>
    );
};

export default ParentScenarios;
