import React, { useState, useMemo } from 'react';
import { Emotion } from '../data/emotionData';
import { useLanguage } from '../services/LanguageContext';

interface ContextLoggerProps {
    emotion: Emotion;
    onComplete: (data: { what: string; who: string; where: string; note: string }) => void;
    onBack: () => void;
}

const ContextLogger: React.FC<ContextLoggerProps> = ({ emotion, onComplete, onBack }) => {
    const { t } = useLanguage();
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

    const defaultOptions = useMemo(() => ({
        what: [t('工作'), t('學習'), t('社交'), t('放鬆'), t('運動'), t('用餐'), t('通勤'), t('家務')],
        who: [t('獨自一人'), t('家人'), t('朋友'), t('伴侶'), t('同事'), t('陌生人')],
        where: [t('家中'), t('辦公室'), t('戶外'), t('餐廳'), t('學校'), t('公共交通')],
    }), [t]);

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
                <button className="nav-btn" onClick={onBack}>{t('← 返回')}</button>
                <h3 style={{ margin: 0 }}>
                    {t('你為什麼感到')} <span style={{ color: `var(--color-${emotion.quadrant})` }}>{t(emotion.name)}</span>？
                </h3>
            </div>

            <div className="context-section">
                <label>{t('你在做什麼？')}</label>
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
                                placeholder={t('輸入內容...')}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="context-section">
                <label>{t('你和誰在一塊？')}</label>
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
                                placeholder={t('輸入內容...')}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="context-section">
                <label>{t('你在哪裡？')}</label>
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
                                placeholder={t('輸入內容...')}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="context-section">
                <label>{t('寫下更多想法 (選填)')}</label>
                <textarea
                    placeholder={t('心情備註...')}
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
                {t('完成記錄')}
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
          padding: 0.6rem 1.25rem;
          border-radius: 20px;
          background: var(--bg-secondary);
          border: 1px solid var(--glass-border);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
        }

        .chip:hover {
          border-color: var(--text-secondary);
          transform: translateY(-1px);
        }

        .chip.active {
          background: var(--text-primary);
          color: var(--bg-color);
          border-color: var(--text-primary);
          font-weight: 600;
        }

        .add-chip {
          font-size: 1.2rem;
          font-weight: bold;
          border-style: dashed;
          color: var(--text-secondary);
          width: auto;
          min-width: 44px;
          justify-content: center;
        }

        .add-chip:hover {
          color: var(--text-primary);
          border-color: var(--text-primary);
        }

        .add-input-container {
          display: inline-block;
        }

        .add-input {
          background: var(--bg-secondary);
          border: 1px solid var(--text-secondary);
          border-radius: 20px;
          padding: 0.6rem 1rem;
          color: var(--text-primary);
          font-family: inherit;
          font-size: 0.9rem;
          outline: none;
          min-height: 44px;
          transition: border-color 0.2s ease;
        }

        .add-input:focus {
          border-color: var(--color-yellow);
          box-shadow: 0 0 0 3px hsla(43, 40%, 70%, 0.1);
        }

        .context-textarea {
          width: 100%;
          min-height: 100px;
          background: var(--bg-secondary);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 1rem;
          color: var(--text-primary);
          font-family: inherit;
          resize: vertical;
          transition: border-color 0.2s ease;
        }

        .context-textarea:focus {
          outline: none;
          border-color: var(--color-yellow);
          box-shadow: 0 0 0 3px hsla(43, 40%, 70%, 0.1);
        }

        .submit-btn {
          width: 100%;
          padding: 1.25rem;
          background: var(--text-primary);
          color: var(--bg-color);
          font-weight: 700;
          font-size: 1.1rem;
          border: none;
          border-radius: var(--radius-md);
          margin-top: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: var(--shadow-luxe);
          filter: brightness(1.1);
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
