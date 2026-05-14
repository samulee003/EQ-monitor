import React, { useState } from 'react';
import { type Emotion } from '../data/emotionData';
import { useLanguage } from '../services/LanguageContext';
import VoiceRecorder from './VoiceRecorder';
import { expressingIcons } from './icons/SvgIcons';
import { type ExpressingData } from '../types/RulerTypes';
import './ExpressingStep.css';

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
                    <span className="step-title">{t('需要 — 我需要什麼？')}</span>
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
                        data-disabled-hint={`👈 ${t('請先完成表達內容')}`}
                        disabled={(!expression.trim() && !shredded)}
                        onClick={handleComplete}
                    >
                        {shredded ? t('帶著輕鬆的心前進') : t('下一步：調節')}
                    </button>
                )}
            </div>

        </div>
    );
};

export default ExpressingStep;
