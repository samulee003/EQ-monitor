import React, { useState } from 'react';
import { Emotion, psychologicalNeeds } from '../data/emotionData';

import { UnderstandingData } from '../types/RulerTypes';

interface UnderstandingStepProps {
    emotion: Emotion;
    onComplete: (data: UnderstandingData) => void;
    onBack: () => void;
}

const UnderstandingStep: React.FC<UnderstandingStepProps> = ({ emotion, onComplete, onBack }) => {
    const [trigger, setTrigger] = useState('');
    const [message, _setMessage] = useState(''); // Kept for type compatibility if needed, but not currently used in UI
    const [selectedNeed, setSelectedNeed] = useState<string | null>(null);
    const [what, setWhat] = useState('');
    const [who, setWho] = useState('');
    const [where, setWhere] = useState('');

    // Update aura color on mount
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

    const defaultOptions = {
        what: ['工作', '學習', '社交', '放鬆', '運動', '用餐', '通勤', '家務'],
        who: ['獨自一人', '家人', '朋友', '伴侶', '同事', '陌生人'],
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
                <button className="nav-btn" onClick={onBack}>← 返回</button>
                <div className="step-label-container">
                    <span className="dot" style={{ backgroundColor: `var(--color-${emotion.quadrant})` }}></span>
                    <span className="step-title">Understanding 理解核心</span>
                </div>
            </div>

            <div className="section-intro">
                <h2>探索你的 <span style={{ color: `var(--color-${emotion.quadrant})` }}>{emotion.name}</span></h2>
                <p>我們的情緒往往指向內在某些未被滿足的需求。</p>
            </div>

            <div className="input-card">
                <div className="question-field">
                    <label className="heading-sm">1. 發生了什麼？ (Trigger)</label>
                    <textarea
                        className="morandi-textarea"
                        placeholder="簡單描述觸發這個情緒的事件..."
                        value={trigger}
                        onChange={(e) => setTrigger(e.target.value)}
                    />
                </div>

                <div className="question-field">
                    <label className="heading-sm">2. 核心需求 (Underlying Need)</label>
                    <p className="field-desc">在這個場景中，你最渴望得到的是什麼？</p>
                    <div className="needs-grid">
                        {psychologicalNeeds.map(need => (
                            <button
                                key={need.id}
                                className={`need-card ${selectedNeed === need.label ? 'active' : ''}`}
                                onClick={() => setSelectedNeed(need.label)}
                            >
                                <div className="need-icon-wrapper">
                                    <span className="need-icon">{need.icon}</span>
                                </div>
                                <div className="need-info">
                                    <span className="need-label">{need.label}</span>
                                    <span className="need-desc">{need.desc}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="context-sections">
                <div className="context-group">
                    <label className="heading-sm">當下的情境</label>
                    <div className="context-grid">
                        <div className="sub-group">
                            <span>類型</span>
                            <div className="chip-grid">
                                {[...defaultOptions.what, ...customWhat].map(item => (
                                    <button key={item} className={`morandi-chip ${what === item ? 'active' : ''}`} onClick={() => setWhat(item)}>{item}</button>
                                ))}
                                {!isAddingWhat ? (
                                    <button className="morandi-chip add" onClick={() => setIsAddingWhat(true)}>+</button>
                                ) : (
                                    <input autoFocus className="morandi-input" value={newWhat} onChange={(e) => setNewWhat(e.target.value)} onBlur={() => handleAddCustom('what')} onKeyDown={(e) => e.key === 'Enter' && handleAddCustom('what')} placeholder="..." />
                                )}
                            </div>
                        </div>

                        <div className="sub-group">
                            <span>對象</span>
                            <div className="chip-grid">
                                {[...defaultOptions.who, ...customWho].map(item => (
                                    <button key={item} className={`morandi-chip ${who === item ? 'active' : ''}`} onClick={() => setWho(item)}>{item}</button>
                                ))}
                                {!isAddingWho ? (
                                    <button className="morandi-chip add" onClick={() => setIsAddingWho(true)}>+</button>
                                ) : (
                                    <input autoFocus className="morandi-input" value={newWho} onChange={(e) => setNewWho(e.target.value)} onBlur={() => handleAddCustom('who')} onKeyDown={(e) => e.key === 'Enter' && handleAddCustom('who')} placeholder="..." />
                                )}
                            </div>
                        </div>

                        <div className="sub-group">
                            <span>位置</span>
                            <div className="chip-grid">
                                {[...defaultOptions.where, ...customWhere].map(item => (
                                    <button key={item} className={`morandi-chip ${where === item ? 'active' : ''}`} onClick={() => setWhere(item)}>{item}</button>
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

            <button className="morandi-main-btn" disabled={!canProceed} onClick={() => onComplete({ trigger, message, what, who, where, need: selectedNeed })}>
                下一步：表達宣洩
            </button>

            <style>{`
                .understanding-step { display: flex; flex-direction: column; gap: var(--s-8); }
                .step-header { display: flex; justify-content: space-between; align-items: center; }
                .step-label-container { 
                    display: flex; align-items: center; gap: var(--s-2); 
                    font-size: 0.75rem; font-weight: 800; letter-spacing: 1px;
                    color: var(--text-secondary); background: var(--glass-bg); 
                    padding: var(--s-1) var(--s-4); border-radius: 30px;
                    border: 1px solid var(--glass-border); backdrop-filter: var(--glass-blur);
                    text-transform: uppercase;
                }
                .dot { width: 8px; height: 8px; border-radius: 50%; opacity: 0.6; }
                
                .section-intro h2 { font-size: 1.8rem; font-weight: 800; margin-bottom: var(--s-2); letter-spacing: -0.5px; }
                .section-intro p { color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6; }
                
                .input-card { 
                    background: var(--bg-secondary); border-radius: var(--radius-luxe); 
                    padding: var(--s-8) var(--s-6); display: flex; flex-direction: column; gap: var(--s-8);
                    border: 1px solid var(--glass-border); box-shadow: var(--shadow-luxe);
                }
                .field-desc { font-size: 0.8rem; color: var(--text-secondary); margin: calc(-1 * var(--s-2)) 0 var(--s-4) 0; opacity: 0.7; }
                
                .morandi-textarea { 
                    width: 100%; min-height: 100px; background: hsla(0, 0%, 0%, 0.2); 
                    border: 1px solid var(--glass-border); border-radius: var(--radius-md); 
                    padding: var(--s-4); color: var(--text-primary); font-family: inherit; 
                    resize: vertical; outline: none; transition: var(--transition-luxe);
                    font-size: 0.95rem; line-height: 1.6;
                }
                .morandi-textarea:focus { border-color: var(--text-secondary); background: hsla(0, 0%, 0%, 0.3); }

                .needs-grid { display: flex; flex-direction: column; gap: var(--s-3); }
                .need-card { 
                    display: flex; align-items: center; gap: var(--s-5); padding: var(--s-4) var(--s-5); 
                    background: var(--glass-bg); border: 1px solid var(--glass-border); 
                    border-radius: var(--radius-md); cursor: pointer; text-align: left;
                    transition: var(--transition-luxe);
                }
                .need-card:hover { border-color: hsla(0, 0%, 100%, 0.2); background: var(--glass-border); transform: translateX(4px); }
                .need-card.active { background: hsla(0, 0%, 100%, 0.05); border-color: var(--text-primary); box-shadow: var(--shadow-luxe); transform: scale(1.02); }
                
                .need-icon-wrapper {
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: hsla(0, 0%, 100%, 0.03);
                    border-radius: 14px;
                    border: 1px solid var(--glass-border);
                    transition: var(--transition-luxe);
                }
                .need-card.active .need-icon-wrapper {
                    background: var(--text-primary);
                    border-color: var(--text-primary);
                }

                .need-icon { 
                    font-size: 1.5rem; 
                    filter: sepia(0.3) saturate(0.4) brightness(0.85);
                    opacity: 0.6;
                    transition: var(--transition-luxe);
                }
                .need-card.active .need-icon {
                    filter: brightness(0) invert(1);
                    opacity: 1;
                }
                
                .need-info { display: flex; flex-direction: column; }
                .need-label { font-weight: 700; font-size: 0.95rem; letter-spacing: 0.5px; }
                .need-desc { font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px; }
                
                .context-sections { 
                    background: var(--bg-secondary); padding: var(--s-6); 
                    border-radius: var(--radius-luxe); border: 1px solid var(--glass-border);
                    box-shadow: var(--shadow-luxe);
                }
                .context-grid { display: flex; flex-direction: column; gap: var(--s-6); }
                .sub-group span { font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: var(--s-2); text-transform: uppercase; letter-spacing: 1px; }
                .chip-grid { display: flex; flex-wrap: wrap; gap: var(--s-2); }
                
                .morandi-chip { 
                    padding: var(--s-2) var(--s-5); border-radius: 30px; 
                    background: var(--glass-bg); border: 1px solid var(--glass-border); 
                    color: var(--text-secondary); cursor: pointer; transition: var(--transition-luxe); 
                    font-size: 0.9rem; font-weight: 500;
                }
                .morandi-chip:hover { border-color: hsla(0, 0%, 100%, 0.2); color: var(--text-primary); }
                .morandi-chip.active { background: var(--text-primary); color: var(--bg-color); border-color: var(--text-primary); font-weight: 700; box-shadow: var(--shadow-sm); }
                .morandi-chip.add { border-style: dashed; opacity: 0.6; }
                
                .morandi-input { 
                    background: var(--glass-bg); border: 1px solid var(--text-secondary); 
                    border-radius: 30px; padding: var(--s-2) var(--s-5); color: var(--text-primary); 
                    font-family: inherit; outline: none; width: 100px; font-size: 0.9rem; 
                    transition: var(--transition-luxe);
                }

                .morandi-main-btn:disabled { opacity: 0.15; filter: grayscale(1); transform: none; }
            `}</style>
        </div>
    );
};

export default UnderstandingStep;
