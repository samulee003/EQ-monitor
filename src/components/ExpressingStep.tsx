import React, { useState } from 'react';
import { Emotion } from '../data/emotionData';
import { useLanguage } from '../services/LanguageContext';
import VoiceRecorder from './VoiceRecorder';
import { expressingIcons } from './icons/SvgIcons';
import { ExpressingData } from '../types/RulerTypes';

interface ExpressingStepProps {
    emotion: Emotion;
    onComplete: (data: ExpressingData) => void;
    onBack: () => void;
}

const ExpressingStep: React.FC<ExpressingStepProps> = ({ emotion, onComplete, onBack }) => {
    const { t } = useLanguage();

    // Define localized modes inside component to use t()
    const modes = [
        { id: 'letter', label: t('心情書信'), icon: expressingIcons.letter, desc: t('寫一封給自己或他人的私密信件') },
        { id: 'shredder', label: t('情緒碎紙機'), icon: expressingIcons.shredder, desc: t('寫下想放下的負累，將其視覺化銷毀') },
        { id: 'free', label: t('自由書寫'), icon: expressingIcons.freewrite, desc: t('沒有限制，隨心所欲地記錄') },
    ];

    const [selectedMode, setSelectedMode] = useState(modes[0]);
    const [expression, setExpression] = useState('');
    const [isShredding, setIsShredding] = useState(false);
    const [shredded, setShredded] = useState(false);
    const shredTimeoutRef = React.useRef<number | null>(null);

    const handleTranscription = (text: string) => {
        setExpression(prev => prev ? `${prev}\n${text}` : text);
    };

    const handleShred = () => {
        if (!expression.trim()) return;
        setIsShredding(true);
        shredTimeoutRef.current = window.setTimeout(() => {
            setIsShredding(false);
            setShredded(true);
            setExpression('');
        }, 2000);
    };

    const skipShredding = () => {
        if (shredTimeoutRef.current) {
            clearTimeout(shredTimeoutRef.current);
        }
        setIsShredding(false);
        setShredded(true);
        setExpression('');
    };

    const handleComplete = () => {
        onComplete({
            expression: shredded ? t('(內容已銷毀)') : expression,
            prompt: selectedMode.label,
            mode: selectedMode.id
        });
    };

    return (
        <div className="expressing-step fade-in">
            <div className="step-header">
                <button className="nav-btn" onClick={onBack}>{t('← 返回')}</button>
                <div className="step-label-container">
                    <span className="dot" style={{ backgroundColor: `var(--color-${emotion.quadrant})` }}></span>
                    <span className="step-title">{t('Expressing 宣洩與表達')}</span>
                </div>
            </div>

            <div className="section-intro">
                <h2>{t('為情緒尋找出口')}</h2>
                <p>{t('轉化感受為文字，或選擇一個儀式來釋放它們。')}</p>
            </div>

            <div className="mode-selector" role="radiogroup" aria-label={t('選擇表達方式')}>
                {modes.map(m => (
                    <button
                        key={m.id}
                        role="radio"
                        aria-checked={selectedMode.id === m.id}
                        className={`mode-card ${selectedMode.id === m.id ? 'active' : ''}`}
                        onClick={() => {
                            setSelectedMode(m);
                            setShredded(false);
                            setExpression('');
                        }}
                    >
                        <div className="mode-icon-wrapper">
                            <span className="mode-icon">{m.icon}</span>
                        </div>
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
                        <p>{t('那些負擔已經隨風而逝了。')}</p>
                        <button className="reset-btn" onClick={() => setShredded(false)}>{t('再寫一個')}</button>
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
                                placeholder={selectedMode.id === 'shredder' ? t("寫下你想揉碎、丟棄的心情...") : t("在這裡自由表達...")}
                                value={expression}
                                onChange={(e) => setExpression(e.target.value)}
                                disabled={isShredding}
                            />
                            {isShredding && (
                                <div
                                    className="shred-animation"
                                    onClick={skipShredding}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={t('碎紙中... 點擊跳過')}
                                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && skipShredding()}
                                >
                                    <div className="shred-line" aria-hidden="true"></div>
                                    <div className="shred-line" aria-hidden="true"></div>
                                    <div className="shred-line" aria-hidden="true"></div>
                                    <span className="skip-hint" aria-hidden="true">{t('點擊跳過')}</span>
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
                        {t('啟動碎紙機')}
                    </button>
                ) : (
                    <button
                        className="morandi-main-btn"
                        disabled={(!expression.trim() && !shredded)}
                        onClick={handleComplete}
                    >
                        {shredded ? t('帶著輕鬆的心前進') : t('下一步：調節')}
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
                    display: flex; align-items: center; gap: var(--s-5); padding: var(--s-4) var(--s-5); 
                    background: var(--bg-secondary); border: 1px solid var(--glass-border); 
                    border-radius: var(--radius-md); cursor: pointer; text-align: left;
                    transition: var(--transition-luxe);
                }
                .mode-card.active { border-color: var(--text-primary); background: hsla(0,0%,100%,0.05); box-shadow: var(--shadow-luxe); transform: scale(1.02); }
                
                .mode-icon-wrapper {
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: hsla(0,0%,100%,0.03);
                    border-radius: 14px;
                    border: 1px solid var(--glass-border);
                    transition: var(--transition-luxe);
                    flex-shrink: 0;
                }
                .mode-card.active .mode-icon-wrapper {
                    background: var(--text-primary);
                    border-color: var(--text-primary);
                }

                .mode-icon-wrapper, .mode-info { pointer-events: none; }
                .mode-icon { 
                    width: 22px;
                    height: 22px;
                    color: var(--text-secondary);
                    opacity: 0.7;
                    transition: var(--transition-luxe);
                }
                .mode-icon svg { width: 100%; height: 100%; }
                .mode-card:hover .mode-icon { opacity: 0.9; color: var(--text-primary); }
                .mode-card.active .mode-icon {
                    color: var(--bg-color);
                    opacity: 1;
                }

                .mode-info { display: flex; flex-direction: column; }
                .mode-label { font-weight: 700; font-size: 0.95rem; letter-spacing: 0.5px; }
                .mode-desc { font-size: 0.75rem; color: var(--text-secondary); line-height: 1.3; }

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
                    justify-content: space-around; padding: 2rem; cursor: pointer;
                    align-items: center;
                }
                .skip-hint {
                    position: absolute;
                    bottom: 1rem;
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                    opacity: 0.7;
                    animation: fadeInOut 1.5s ease-in-out infinite;
                }
                @keyframes fadeInOut {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 0.9; }
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
                .morandi-main-btn:disabled { 
                    opacity: 0.4; 
                    filter: grayscale(0.5); 
                    transform: none; 
                    cursor: not-allowed;
                }
                .morandi-main-btn:disabled::after {
                    content: '👈 ${t('請先完成表達內容')}';
                    display: block;
                    font-size: 0.7rem;
                    font-weight: 400;
                    opacity: 0.7;
                    margin-top: 4px;
                }
            `}</style>
        </div>
    );
};

export default ExpressingStep;
