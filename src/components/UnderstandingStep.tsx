import React, { useState } from 'react';
import { type Emotion, psychologicalNeeds } from '../data/emotionData';
import { useLanguage } from '../services/LanguageContext';
import { needsIcons } from './icons/SvgIcons';
import { type UnderstandingData, type InteractionCycle } from '../types/RulerTypes';
import { settingsStore } from '../adapters';
import './UnderstandingStep.css';

interface UnderstandingStepProps {
    emotion: Emotion;
    onComplete: (data: UnderstandingData) => void;
    onBack: () => void;
}

// Map need IDs to SVG icons
const needIconMap: Record<string, React.ReactNode> = {
    respect: needsIcons.respect,
    safety: needsIcons.safety,
    connection: needsIcons.connection,
    autonomy: needsIcons.autonomy,
    meaning: needsIcons.meaning,
    rest: needsIcons.rest,
    respite: needsIcons.respite,
    growth: needsIcons.growth,
};

const UnderstandingStep: React.FC<UnderstandingStepProps> = ({ emotion, onComplete, onBack }) => {
    const { t } = useLanguage();
    const [trigger, setTrigger] = useState('');
    const [message] = useState(''); // Kept for type compatibility if needed, but not currently used in UI
    const [selectedNeed, setSelectedNeed] = useState<string | null>(null);
    const [what, setWhat] = useState('');
    const [who, setWho] = useState('');
    const [where, setWhere] = useState('');

    // NOTE: --aura-color controls the global body background gradient (see index.css).
    // TODO: Refactor to use a React ref or context instead of document.documentElement.
    React.useEffect(() => {
        document.documentElement.style.setProperty('--aura-color', `hsla(var(--h-${emotion.quadrant}), var(--s-${emotion.quadrant}), var(--l-${emotion.quadrant}), 0.2)`);
    }, [emotion.quadrant]);

    const [customWhat, setCustomWhat] = useState<string[]>([]);
    const [customWho, setCustomWho] = useState<string[]>([]);
    const [customWhere, setCustomWhere] = useState<string[]>([]);

    const [isAddingWhat, setIsAddingWhat] = useState(false);
    const [newWhat, setNewWhat] = useState('');
    const [isAddingWho, setIsAddingWho] = useState(false);
    const [newWho, setNewWho] = useState('');
    const [isAddingWhere, setIsAddingWhere] = useState(false);
    const [newWhere, setNewWhere] = useState('');
    const [showInteractionCycle, setShowInteractionCycle] = useState(false);
    const [interactionCycle, setInteractionCycle] = useState<InteractionCycle>({ myReaction: '', childReaction: '', reflection: '' });

    const isParentRole = settingsStore.getUserRole() === 'parent';
    const isParentingContext = isParentRole && (what === '育兒' || what === '管教衝突') && who === '孩子';

    const defaultOptions = {
        what: ['育兒', '管教衝突', '工作', '學習', '社交', '放鬆', '運動', '用餐', '通勤', '家務'],
        who: ['孩子', '獨自一人', '家人', '朋友', '伴侶', '同事', '陌生人'],
        where: ['家中', '辦公室', '戶外', '餐廳', '學校', '公共交通'],
    };

    const handleAddCustom = (type: 'what' | 'who' | 'where') => {
        if (type === 'what' && newWhat.trim()) {
            setCustomWhat(prev => [...prev, newWhat.trim()]);
            setWhat(newWhat.trim());
            setNewWhat('');
            setIsAddingWhat(false);
        } else if (type === 'who' && newWho.trim()) {
            setCustomWho(prev => [...prev, newWho.trim()]);
            setWho(newWho.trim());
            setNewWho('');
            setIsAddingWho(false);
        } else if (type === 'where' && newWhere.trim()) {
            setCustomWhere(prev => [...prev, newWhere.trim()]);
            setWhere(newWhere.trim());
            setNewWhere('');
            setIsAddingWhere(false);
        }
    };

    const canProceed = what && who && where && selectedNeed;

    return (
        <div className="understanding-step fade-in">
            <div className="step-header">
                <button className="nav-btn" onClick={onBack}>{t('← 返回')}</button>
                <div className="step-label-container">
                    <span className="dot" style={{ backgroundColor: `var(--color-${emotion.quadrant})` }}></span>
                    <span className="step-title">{t('定位 — 發生了什麼？')}</span>
                </div>
            </div>

            <div className="section-intro">
                <h2>{t('探索你的')} <span style={{ color: `var(--color-${emotion.quadrant})` }}>{t(emotion.name)}</span></h2>
                <p>{t('我們的情緒往往指向內在某些未被滿足的需求。')}</p>
            </div>

            <div className="input-card">
                <div className="question-field">
                    <label className="heading-sm">{t('1. 發生了什麼？ (Trigger)')}</label>
                    <textarea
                        className="morandi-textarea"
                        placeholder={t('簡單描述觸發這個情緒的事件...')}
                        value={trigger}
                        onChange={(e) => setTrigger(e.target.value)}
                    />
                </div>

                <div className="question-field">
                    <label className="heading-sm">{t('2. 核心需求 (Underlying Need)')}</label>
                    <p className="field-desc">{t('在這個場景中，你最渴望得到的是什麼？')}</p>
                    <div className="needs-grid">
                        {psychologicalNeeds.map(need => (
                            <button
                                key={need.id}
                                className={`need-card ${selectedNeed === need.label ? 'active' : ''}`}
                                onClick={() => setSelectedNeed(need.label)}
                            >
                                <div className="need-icon-wrapper">
                                    <span className="need-icon">{needIconMap[need.id] || need.icon}</span>
                                </div>
                                <div className="need-info">
                                    <span className="need-label">{t(need.label)}</span>
                                    <span className="need-desc">{t(need.desc)}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="context-sections">
                <div className="context-group">
                    <label className="heading-sm">{t('當下的情境')}</label>
                    <div className="context-grid">
                        <div className="sub-group">
                            <span>{t('類型')}</span>
                            <div className="chip-grid">
                                {[...defaultOptions.what, ...customWhat].map(item => (
                                    <button key={item} className={`morandi-chip ${what === item ? 'active' : ''}`} onClick={() => setWhat(item)}>{t(item)}</button>
                                ))}
                                {!isAddingWhat ? (
                                    <button className="morandi-chip add" onClick={() => setIsAddingWhat(true)}>+</button>
                                ) : (
                                    <input autoFocus className="morandi-input" value={newWhat} onChange={(e) => setNewWhat(e.target.value)} onBlur={() => handleAddCustom('what')} onKeyDown={(e) => e.key === 'Enter' && handleAddCustom('what')} placeholder="..." />
                                )}
                            </div>
                        </div>

                        <div className="sub-group">
                            <span>{t('對象')}</span>
                            <div className="chip-grid">
                                {[...defaultOptions.who, ...customWho].map(item => (
                                    <button key={item} className={`morandi-chip ${who === item ? 'active' : ''}`} onClick={() => setWho(item)}>{t(item)}</button>
                                ))}
                                {!isAddingWho ? (
                                    <button className="morandi-chip add" onClick={() => setIsAddingWho(true)}>+</button>
                                ) : (
                                    <input autoFocus className="morandi-input" value={newWho} onChange={(e) => setNewWho(e.target.value)} onBlur={() => handleAddCustom('who')} onKeyDown={(e) => e.key === 'Enter' && handleAddCustom('who')} placeholder="..." />
                                )}
                            </div>
                        </div>

                        <div className="sub-group">
                            <span>{t('位置')}</span>
                            <div className="chip-grid">
                                {[...defaultOptions.where, ...customWhere].map(item => (
                                    <button key={item} className={`morandi-chip ${where === item ? 'active' : ''}`} onClick={() => setWhere(item)}>{t(item)}</button>
                                ))}
                                {!isAddingWhere ? (
                                    <button className="morandi-chip add" onClick={() => setIsAddingWhere(true)}>+</button>
                                ) : (
                                    <input autoFocus className="morandi-input" value={newWhere} onChange={(e) => setNewWhere(e.target.value)} onBlur={() => handleAddCustom('where')} onKeyDown={(e) => e.key === 'Enter' && handleAddCustom('where')} placeholder="..." />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isParentingContext && !showInteractionCycle && (
                <button className="interaction-cycle-toggle" onClick={() => setShowInteractionCycle(true)}>
                    {t('+ 記錄親子互動循環（選填）')}
                </button>
            )}

            {showInteractionCycle && (
                <div className="interaction-cycle-card fade-in">
                    <h3 className="cycle-title">{t('親子互動循環')}</h3>
                    <p className="cycle-desc">{t('記錄互動模式，幫助你看見循環、打破循環')}</p>
                    <div className="cycle-fields">
                        <div className="cycle-field">
                            <label>{t('我的反應是什麼？')}</label>
                            <input
                                className="morandi-input"
                                placeholder={t('例：我提高了音量')}
                                value={interactionCycle.myReaction}
                                onChange={(e) => setInteractionCycle(prev => ({ ...prev, myReaction: e.target.value }))}
                            />
                        </div>
                        <div className="cycle-field">
                            <label>{t('孩子的反應是什麼？')}</label>
                            <input
                                className="morandi-input"
                                placeholder={t('例：孩子哭了 / 更抗拒了')}
                                value={interactionCycle.childReaction}
                                onChange={(e) => setInteractionCycle(prev => ({ ...prev, childReaction: e.target.value }))}
                            />
                        </div>
                        <div className="cycle-field">
                            <label>{t('事後回想，我希望怎麼做？')}</label>
                            <input
                                className="morandi-input"
                                placeholder={t('例：先深呼吸再回應')}
                                value={interactionCycle.reflection}
                                onChange={(e) => setInteractionCycle(prev => ({ ...prev, reflection: e.target.value }))}
                            />
                        </div>
                    </div>
                </div>
            )}

            <button className="morandi-main-btn" disabled={!canProceed} onClick={() => onComplete({
                trigger, message, what, who, where, need: selectedNeed,
                interactionCycle: showInteractionCycle && interactionCycle.myReaction ? interactionCycle : undefined
            })}>
                {t('下一步：表達宣洩')}
            </button>

        </div>
    );
};

export default UnderstandingStep;
