import React, { useState } from 'react';
import { Emotion } from '../data/emotionData';

interface ContextLoggerProps {
    emotion: Emotion;
    onComplete: (data: { what: string; who: string; where: string; note: string }) => void;
    onBack: () => void;
}

const ContextLogger: React.FC<ContextLoggerProps> = ({ emotion, onComplete, onBack }) => {
    const [what, setWhat] = useState('');
    const [who, setWho] = useState('');
    const [where, setWhere] = useState('');
    const [note, setNote] = useState('');

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
            setCustomWhat([...customWhat, newWhat.trim()]);
            setWhat(newWhat.trim());
            setNewWhat('');
            setIsAddingWhat(false);
        } else if (type === 'who' && newWho.trim()) {
            setCustomWho([...customWho, newWho.trim()]);
            setWho(newWho.trim());
            setNewWho('');
            setIsAddingWho(false);
        } else if (type === 'where' && newWhere.trim()) {
            setCustomWhere([...customWhere, newWhere.trim()]);
            setWhere(newWhere.trim());
            setNewWhere('');
            setIsAddingWhere(false);
        }
    };

    return (
        <div className="context-logger-container">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
                <button className="nav-btn" onClick={onBack}>← 返回</button>
                <h3 style={{ margin: 0 }}>
                    你為什麼感到 <span style={{ color: `var(--color-${emotion.quadrant})` }}>{emotion.name}</span>？
                </h3>
            </div>

            <div className="context-section">
                <label>你在做什麼？</label>
                <div className="chip-group">
                    {[...defaultOptions.what, ...customWhat].map(item => (
                        <button
                            key={item}
                            className={`chip ${what === item ? 'active' : ''}`}
                            onClick={() => setWhat(item)}
                        >
                            {item}
                        </button>
                    ))}
                    {!isAddingWhat ? (
                        <button className="chip add-chip" onClick={() => setIsAddingWhat(true)}>+</button>
                    ) : (
                        <div className="add-input-container">
                            <input
                                autoFocus
                                className="add-input"
                                value={newWhat}
                                onChange={(e) => setNewWhat(e.target.value)}
                                onBlur={() => handleAddCustom('what')}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCustom('what')}
                                placeholder="輸入內容..."
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="context-section">
                <label>你和誰在一塊？</label>
                <div className="chip-group">
                    {[...defaultOptions.who, ...customWho].map(item => (
                        <button
                            key={item}
                            className={`chip ${who === item ? 'active' : ''}`}
                            onClick={() => setWho(item)}
                        >
                            {item}
                        </button>
                    ))}
                    {!isAddingWho ? (
                        <button className="chip add-chip" onClick={() => setIsAddingWho(true)}>+</button>
                    ) : (
                        <div className="add-input-container">
                            <input
                                autoFocus
                                className="add-input"
                                value={newWho}
                                onChange={(e) => setNewWho(e.target.value)}
                                onBlur={() => handleAddCustom('who')}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCustom('who')}
                                placeholder="輸入內容..."
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="context-section">
                <label>你在哪裡？</label>
                <div className="chip-group">
                    {[...defaultOptions.where, ...customWhere].map(item => (
                        <button
                            key={item}
                            className={`chip ${where === item ? 'active' : ''}`}
                            onClick={() => setWhere(item)}
                        >
                            {item}
                        </button>
                    ))}
                    {!isAddingWhere ? (
                        <button className="chip add-chip" onClick={() => setIsAddingWhere(true)}>+</button>
                    ) : (
                        <div className="add-input-container">
                            <input
                                autoFocus
                                className="add-input"
                                value={newWhere}
                                onChange={(e) => setNewWhere(e.target.value)}
                                onBlur={() => handleAddCustom('where')}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCustom('where')}
                                placeholder="輸入內容..."
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="context-section">
                <label>寫下更多想法 (選填)</label>
                <textarea
                    placeholder="心情備註..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="context-textarea"
                />
            </div>

            <button
                className="submit-btn"
                disabled={!what || !who || !where}
                onClick={() => onComplete({ what, who, where, note })}
            >
                完成記錄
            </button>

            <style>{`
        .context-section {
          margin-bottom: 2rem;
        }

        .context-section label {
          display: block;
          margin-bottom: 0.75rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .chip-group {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }

        .chip {
          padding: 0.5rem 1.25rem;
          border-radius: 20px;
          background: #1a1a1a;
          border: 1px solid #333;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .chip.active {
          background: white;
          color: black;
          border-color: white;
        }

        .add-chip {
          font-size: 1.2rem;
          font-weight: bold;
          border-style: dashed;
          color: var(--text-secondary);
          width: auto;
          min-width: 44px;
        }

        .add-input-container {
          display: inline-block;
        }

        .add-input {
          background: #1a1a1a;
          border: 1px solid #666;
          border-radius: 20px;
          padding: 0.5rem 1rem;
          color: white;
          font-family: inherit;
          font-size: 0.9rem;
          outline: none;
        }

        .context-textarea {
          width: 100%;
          min-height: 100px;
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 12px;
          padding: 1rem;
          color: white;
          font-family: inherit;
          resize: vertical;
        }

        .submit-btn {
          width: 100%;
          padding: 1.25rem;
          background: white;
          color: black;
          font-weight: 700;
          font-size: 1.1rem;
          border: none;
          margin-top: 1rem;
        }

        .submit-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
      `}</style>
        </div>
    );
};

export default ContextLogger;
