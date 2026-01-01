import React, { useState } from 'react';
import { Emotion } from '../data/emotionData';

interface UnderstandingStepProps {
    emotion: Emotion;
    onComplete: (data: { trigger: string; message: string; what: string; who: string; where: string }) => void;
    onBack: () => void;
}

const UnderstandingStep: React.FC<UnderstandingStepProps> = ({ emotion, onComplete, onBack }) => {
    const [trigger, setTrigger] = useState('');
    const [message, setMessage] = useState('');
    const [what, setWhat] = useState('');
    const [who, setWho] = useState('');
    const [where, setWhere] = useState('');

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

    const canProceed = what && who && where;

    return (
        <div className="understanding-step fade-in">
            <div className="step-header">
                <button className="nav-btn" onClick={onBack}>← 返回</button>
                <div className="step-label-container">
                    <span className="dot" style={{ backgroundColor: `var(--color-${emotion.quadrant})` }}></span>
                    <span className="step-title">Understanding 理解</span>
                </div>
            </div>

            <div className="section-intro">
                <h2>探索你的 <span style={{ color: `var(--color-${emotion.quadrant})` }}>{emotion.name}</span></h2>
                <p>讓我們一起深入了解這個情緒背後的來源與訊息。</p>
            </div>

            <div className="input-card">
                <div className="question-field">
                    <label className="heading-sm">觸發事件</label>
                    <textarea
                        className="morandi-textarea"
                        placeholder="是什麼原因讓你有了這種感覺？"
                        value={trigger}
                        onChange={(e) => setTrigger(e.target.value)}
                    />
                </div>

                <div className="question-field">
                    <label className="heading-sm">情感訊息</label>
                    <textarea
                        className="morandi-textarea"
                        placeholder="這個情緒正在試著告訴你什麼？"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                </div>
            </div>

            <div className="context-sections">
                <div className="context-group">
                    <label className="heading-sm">活動類型</label>
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

                <div className="context-group">
                    <label className="heading-sm">陪伴對象</label>
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

                <div className="context-group">
                    <label className="heading-sm">目前位置</label>
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

            <button className="morandi-main-btn" disabled={!canProceed} onClick={() => onComplete({ trigger, message, what, who, where })}>
                下一步：表達
            </button>

            <style>{`
        .understanding-step { display: flex; flex-direction: column; gap: 2rem; }
        .step-header { display: flex; justify-content: space-between; align-items: center; }
        .step-label-container { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-secondary); background: var(--glass-bg); padding: 0.4rem 0.8rem; border-radius: 20px; }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .section-intro h2 { font-size: 1.5rem; margin-bottom: 0.5rem; }
        .section-intro p { color: var(--text-secondary); font-size: 0.9rem; }
        
        .input-card { background: var(--bg-secondary); border-radius: var(--radius-md); padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
        .morandi-textarea { width: 100%; min-height: 80px; background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); padding: 1rem; color: var(--text-primary); font-family: inherit; resize: vertical; outline: none; transition: var(--transition); }
        .morandi-textarea:focus { border-color: var(--text-secondary); }
        
        .context-sections { display: flex; flex-direction: column; gap: 1.5rem; }
        .chip-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .morandi-chip { padding: 0.5rem 1rem; border-radius: 20px; background: var(--glass-bg); border: 1px solid var(--glass-border); color: var(--text-primary); cursor: pointer; transition: var(--transition); font-size: 0.9rem; }
        .morandi-chip.active { background: var(--text-primary); color: var(--bg-color); border-color: var(--text-primary); }
        .morandi-chip.add { border-style: dashed; color: var(--text-secondary); }
        .morandi-input { background: var(--glass-bg); border: 1px solid var(--text-secondary); border-radius: 20px; padding: 0.5rem 1rem; color: var(--text-primary); font-family: inherit; outline: none; width: 80px; font-size: 0.9rem; }
        
        .morandi-main-btn { width: 100%; padding: 1.25rem; background: var(--text-primary); color: var(--bg-color); font-weight: 700; font-size: 1.1rem; border: none; border-radius: var(--radius-md); margin-top: 1rem; cursor: pointer; transition: var(--transition); }
        .morandi-main-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .morandi-main-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
      `}</style>
        </div>
    );
};

export default UnderstandingStep;
