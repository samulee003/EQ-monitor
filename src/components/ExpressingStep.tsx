import React, { useState } from 'react';
import { Emotion } from '../data/emotionData';
import VoiceRecorder from './VoiceRecorder';

interface ExpressingStepProps {
    emotion: Emotion;
    onComplete: (data: { expression: string; prompt: string; mode: string }) => void;
    onBack: () => void;
}

const modes = [
    { id: 'letter', label: '心情書信', icon: '✉️', desc: '寫一封給自己或他人的私密信件' },
    { id: 'shredder', label: '情緒碎紙機', icon: '✂️', desc: '寫下想放下的負累，將其視覺化銷毀' },
    { id: 'free', label: '自由書寫', icon: '✍️', desc: '沒有限制，隨心所欲地記錄' },
];

const ExpressingStep: React.FC<ExpressingStepProps> = ({ emotion, onComplete, onBack }) => {
    const [selectedMode, setSelectedMode] = useState(modes[0]);
    const [expression, setExpression] = useState('');
    const [isShredding, setIsShredding] = useState(false);
    const [shredded, setShredded] = useState(false);

    const handleTranscription = (text: string) => {
        setExpression(prev => prev ? `${prev}\n${text}` : text);
    };

    const handleShred = () => {
        if (!expression.trim()) return;
        setIsShredding(true);
        setTimeout(() => {
            setIsShredding(false);
            setShredded(true);
            setExpression('');
        }, 2000);
    };

    const handleComplete = () => {
        onComplete({
            expression: shredded ? '(內容已銷毀)' : expression,
            prompt: selectedMode.label,
            mode: selectedMode.id
        });
    };

    return (
        <div className="expressing-step fade-in">
            <div className="step-header">
                <button className="nav-btn" onClick={onBack}>← 返回</button>
                <div className="step-label-container">
                    <span className="dot" style={{ backgroundColor: `var(--color-${emotion.quadrant})` }}></span>
                    <span className="step-title">Expressing 宣洩與表達</span>
                </div>
            </div>

            <div className="section-intro">
                <h2>為情緒尋找出口</h2>
                <p>轉化感受為文字，或選擇一個儀式來釋放它們。</p>
            </div>

            <div className="mode-selector">
                {modes.map(m => (
                    <button
                        key={m.id}
                        className={`mode-card ${selectedMode.id === m.id ? 'active' : ''}`}
                        onClick={() => {
                            setSelectedMode(m);
                            setShredded(false);
                            setExpression('');
                        }}
                    >
                        <span className="mode-icon">{m.icon}</span>
                        <div className="mode-info">
                            <span className="mode-label">{m.label}</span>
                            <span className="mode-desc">{m.desc}</span>
                        </div>
                    </button>
                ))}
            </div>

            <div className={`interaction-area ${isShredding ? 'shredding' : ''} ${shredded ? 'shredded' : ''}`}>
                {selectedMode.id === 'shredder' && shredded ? (
                    <div className="shredded-message fade-in">
                        <span className="success-icon">✨</span>
                        <p>那些負擔已經隨風而逝了。</p>
                        <button className="reset-btn" onClick={() => setShredded(false)}>再寫一個</button>
                    </div>
                ) : (
                    <>
                        <div className="input-header">
                            <label className="heading-sm">{selectedMode.label}</label>
                            <VoiceRecorder onTranscription={handleTranscription} />
                        </div>
                        <div className="textarea-container">
                            <textarea
                                className="expression-textarea"
                                placeholder={selectedMode.id === 'shredder' ? "寫下你想揉碎、丟棄的心情..." : "在這裡自由表達..."}
                                value={expression}
                                onChange={(e) => setExpression(e.target.value)}
                                disabled={isShredding}
                            />
                            {isShredding && (
                                <div className="shred-animation">
                                    <div className="shred-line"></div>
                                    <div className="shred-line"></div>
                                    <div className="shred-line"></div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            <div className="action-footer">
                {selectedMode.id === 'shredder' && !shredded ? (
                    <button
                        className="shred-trigger-btn"
                        disabled={!expression.trim() || isShredding}
                        onClick={handleShred}
                    >
                        啟動碎紙機
                    </button>
                ) : (
                    <button
                        className="morandi-main-btn"
                        disabled={(!expression.trim() && !shredded)}
                        onClick={handleComplete}
                    >
                        {shredded ? '帶著輕鬆的心前進' : '下一步：調節'}
                    </button>
                )}
            </div>

            <style>{`
                .expressing-step { display: flex; flex-direction: column; gap: 1.5rem; }
                .step-header { display: flex; justify-content: space-between; align-items: center; }
                .step-label-container { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-secondary); background: var(--glass-bg); padding: 0.4rem 0.8rem; border-radius: 20px; }
                .dot { width: 8px; height: 8px; border-radius: 50%; }
                .section-intro h2 { font-size: 1.5rem; margin-bottom: 0.25rem; }
                .section-intro p { color: var(--text-secondary); font-size: 0.9rem; }

                .mode-selector { display: grid; grid-template-columns: 1fr; gap: 10px; }
                .mode-card { 
                    display: flex; align-items: center; gap: 1rem; padding: 1rem; 
                    background: var(--bg-secondary); border: 1px solid var(--glass-border); 
                    border-radius: var(--radius-md); cursor: pointer; text-align: left;
                    transition: var(--transition);
                }
                .mode-card.active { border-color: var(--text-primary); background: rgba(255,255,255,0.05); }
                .mode-icon { font-size: 1.5rem; }
                .mode-info { display: flex; flex-direction: column; }
                .mode-label { font-weight: 600; font-size: 0.95rem; }
                .mode-desc { font-size: 0.75rem; color: var(--text-secondary); }

                .interaction-area { 
                    background: var(--bg-secondary); border-radius: var(--radius-md); 
                    padding: 1.5rem; min-height: 250px; display: flex; flex-direction: column; 
                    position: relative; overflow: hidden;
                }
                .input-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
                .textarea-container { position: relative; flex: 1; display: flex; }

                .expression-textarea { 
                    width: 100%; min-height: 200px; background: rgba(0,0,0,0.2); 
                    border: 1px solid var(--glass-border); border-radius: var(--radius-sm); 
                    padding: 1rem; color: var(--text-primary); font-family: inherit; 
                    font-size: 1rem; line-height: 1.6; outline: none; resize: none; 
                    transition: all 0.5s ease;
                }

                .shredding .expression-textarea {
                    transform: translateY(100px);
                    opacity: 0;
                }

                .shred-animation {
                    position: absolute; inset: 0; display: flex; flex-direction: column; 
                    justify-content: space-around; padding: 2rem; pointer-events: none;
                }
                .shred-line {
                    height: 2px; background: var(--text-secondary); opacity: 0;
                    width: 100%; transform: scaleX(0);
                }
                .shredding .shred-line {
                    animation: shredLine 0.5s infinite;
                }
                .shredding .shred-line:nth-child(2) { animation-delay: 0.1s; }
                .shredding .shred-line:nth-child(3) { animation-delay: 0.2s; }

                @keyframes shredLine {
                    0% { transform: scaleX(0); opacity: 0; }
                    50% { transform: scaleX(1); opacity: 0.5; }
                    100% { transform: scaleX(0); opacity: 0; }
                }

                .shredded-message { 
                    display: flex; flex-direction: column; align-items: center; 
                    justify-content: center; height: 100%; text-align: center; gap: 1rem;
                }
                .success-icon { font-size: 3rem; }
                .reset-btn { background: none; border: 1px solid var(--text-secondary); color: var(--text-secondary); padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.8rem; cursor: pointer; }

                .shred-trigger-btn { 
                    width: 100%; padding: 1.25rem; background: #B48A89; color: #fff; 
                    font-weight: 700; border: none; border-radius: var(--radius-md); 
                    cursor: pointer; transition: var(--transition);
                }
                .shred-trigger-btn:disabled { opacity: 0.3; }

                .morandi-main-btn { 
                    width: 100%; padding: 1.25rem; background: var(--text-primary); 
                    color: var(--bg-color); font-weight: 700; border: none; 
                    border-radius: var(--radius-md); cursor: pointer; transition: var(--transition);
                }
                .morandi-main-btn:disabled { opacity: 0.3; }
            `}</style>
        </div>
    );
};

export default ExpressingStep;
