import React, { useState } from 'react';
import { Emotion } from '../data/emotionData';

interface ExpressingStepProps {
    emotion: Emotion;
    onComplete: (data: { expression: string; prompt: string }) => void;
    onBack: () => void;
}

const prompts = [
    { id: 'want', label: '我想要...', placeholder: '例如：我想要有更多休息時間' },
    { id: 'need', label: '我需要...', placeholder: '例如：我需要有人聽我說話' },
    { id: 'grateful', label: '我感謝...', placeholder: '例如：我感謝朋友的陪伴' },
    { id: 'sorry', label: '我感到抱歉...', placeholder: '例如：我為自己的反應感到抱歉' },
    { id: 'proud', label: '我為自己感到...', placeholder: '例如：我為自己的堅持感到驕傲' },
    { id: 'free', label: '自由書寫', placeholder: '寫下任何你想表達的...' },
];

import VoiceRecorder from './VoiceRecorder';

const ExpressingStep: React.FC<ExpressingStepProps> = ({ emotion, onComplete, onBack }) => {
    const [selectedPrompt, setSelectedPrompt] = useState(prompts[5]);
    const [expression, setExpression] = useState('');

    const handleTranscription = (text: string) => {
        setExpression(prev => prev ? `${prev}\n${text}` : text);
    };

    return (
        <div className="expressing-step fade-in">
            <div className="step-header">
                <button className="nav-btn" onClick={onBack}>← 返回</button>
                <div className="step-label-container">
                    <span className="dot" style={{ backgroundColor: `var(--color-${emotion.quadrant})` }}></span>
                    <span className="step-title">Expressing 表達</span>
                </div>
            </div>

            <div className="section-intro">
                <h2>表達你的感受</h2>
                <p>讓情緒轉化為文字，為心靈尋找出口。您也可以使用語音轉文字來表達。</p>
            </div>

            <VoiceRecorder onTranscription={handleTranscription} />

            <div className="prompt-selection">
                <label className="heading-sm">選擇一個引導句</label>
                <div className="prompt-row">
                    {prompts.map(p => (
                        <button
                            key={p.id}
                            className={`morandi-chip ${selectedPrompt.id === p.id ? 'active' : ''}`}
                            onClick={() => setSelectedPrompt(p)}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="input-card">
                <label className="heading-sm" style={{ marginBottom: '1rem', display: 'block' }}>{selectedPrompt.label}</label>
                <textarea
                    className="expression-textarea"
                    placeholder={selectedPrompt.placeholder}
                    value={expression}
                    onChange={(e) => setExpression(e.target.value)}
                />
            </div>

            <button
                className="morandi-main-btn"
                onClick={() => onComplete({ expression, prompt: selectedPrompt.label })}
            >
                下一步：調節
            </button>

            <style>{`
        .expressing-step { display: flex; flex-direction: column; gap: 2rem; }
        .step-header { display: flex; justify-content: space-between; align-items: center; }
        .step-label-container { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-secondary); background: var(--glass-bg); padding: 0.4rem 0.8rem; border-radius: 20px; }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .section-intro h2 { font-size: 1.5rem; margin-bottom: 0.5rem; }
        .section-intro p { color: var(--text-secondary); font-size: 0.9rem; }
        
        .prompt-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 0.5rem; }
        .morandi-chip { padding: 0.5rem 1rem; border-radius: 20px; background: var(--glass-bg); border: 1px solid var(--glass-border); color: var(--text-primary); cursor: pointer; transition: var(--transition); font-size: 0.9rem; }
        .morandi-chip.active { background: var(--text-primary); color: var(--bg-color); border-color: var(--text-primary); }
        
        .input-card { background: var(--bg-secondary); border-radius: var(--radius-md); padding: 1.5rem; }
        .expression-textarea { width: 100%; min-height: 200px; background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); padding: 1rem; color: var(--text-primary); font-family: inherit; font-size: 1rem; line-height: 1.6; outline: none; resize: vertical; transition: var(--transition); }
        .expression-textarea:focus { border-color: var(--text-secondary); }
        
        .morandi-main-btn { width: 100%; padding: 1.25rem; background: var(--text-primary); color: var(--bg-color); font-weight: 700; font-size: 1.1rem; border: none; border-radius: var(--radius-md); margin-top: 1rem; cursor: pointer; transition: var(--transition); }
        .morandi-main-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
      `}</style>
        </div>
    );
};

export default ExpressingStep;
