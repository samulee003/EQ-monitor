import React, { useState, useMemo } from 'react';
import { emotions, Quadrant, Emotion } from '../data/emotionData';
import { storageService } from '../services/StorageService';
import { useLanguage } from '../services/LanguageContext';
import { useHabit } from '../services/HabitContext';

interface QuickCheckInProps {
    onComplete: () => void;
    onCancel: () => void;
}

type QuickStep = 'quadrant' | 'emotion' | 'note' | 'done';

const QuickCheckIn: React.FC<QuickCheckInProps> = ({ onComplete, onCancel }) => {
    const { t } = useLanguage();
    const { refreshProgress } = useHabit();
    const [step, setStep] = useState<QuickStep>('quadrant');
    const [selectedQuadrant, setSelectedQuadrant] = useState<Quadrant | null>(null);
    const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
    const [note, setNote] = useState('');

    const quadrantEmotions = useMemo(() => {
        if (!selectedQuadrant) return [];
        return emotions
            .filter(e => e.quadrant === selectedQuadrant)
            .sort(() => 0.5 - Math.random())
            .slice(0, 12);
    }, [selectedQuadrant]);

    const handleQuadrantSelect = (q: Quadrant) => {
        setSelectedQuadrant(q);
        setStep('emotion');
    };

    const handleEmotionSelect = (e: Emotion) => {
        setSelectedEmotion(e);
        setStep('note');
    };

    const handleSave = () => {
        if (!selectedEmotion) return;
        storageService.saveLog({
            emotions: [selectedEmotion],
            intensity: 5,
            bodyScan: null,
            understanding: null,
            expressing: note ? { expression: note, prompt: '', mode: 'quick' } : null,
            regulating: null,
            postMood: '',
            timestamp: new Date().toISOString(),
            isFullFlow: false,
        });
        refreshProgress();
        setStep('done');
        setTimeout(onComplete, 1200);
    };

    const quadrants: { key: Quadrant; label: string; color: string; desc: string }[] = [
        { key: 'red', label: t('高能量 / 不舒服'), color: 'var(--color-red)', desc: t('焦慮、憤怒、壓力') },
        { key: 'yellow', label: t('高能量 / 舒服'), color: 'var(--color-yellow)', desc: t('興奮、快樂、動力') },
        { key: 'blue', label: t('低能量 / 不舒服'), color: 'var(--color-blue)', desc: t('疲憊、難過、倦怠') },
        { key: 'green', label: t('低能量 / 舒服'), color: 'var(--color-green)', desc: t('平靜、滿足、放鬆') },
    ];

    return (
        <div className="quick-checkin fade-in">
            {step !== 'done' && (
                <div className="quick-header">
                    <button className="quick-back-btn" onClick={step === 'quadrant' ? onCancel : () => setStep(step === 'note' ? 'emotion' : 'quadrant')}>
                        {step === 'quadrant' ? t('取消') : t('< 返回')}
                    </button>
                    <span className="quick-badge">{t('快速記錄')}</span>
                </div>
            )}

            {step === 'quadrant' && (
                <div className="quick-step fade-slide-in">
                    <h2>{t('此刻的感覺？')}</h2>
                    <p className="quick-subtitle">{t('選一個最接近的區域')}</p>
                    <div className="quadrant-grid">
                        {quadrants.map(q => (
                            <button
                                key={q.key}
                                className="quadrant-btn"
                                style={{ borderColor: q.color }}
                                onClick={() => handleQuadrantSelect(q.key)}
                            >
                                <span className="q-dot" style={{ background: q.color }} />
                                <span className="q-label">{q.label}</span>
                                <span className="q-desc">{q.desc}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {step === 'emotion' && (
                <div className="quick-step fade-slide-in">
                    <h2>{t('更精準地說...')}</h2>
                    <p className="quick-subtitle">{t('選一個最貼合的詞')}</p>
                    <div className="emotion-bubbles">
                        {quadrantEmotions.map(e => (
                            <button
                                key={e.id}
                                className={`emotion-bubble ${selectedEmotion?.id === e.id ? 'active' : ''}`}
                                style={{ borderColor: `var(--color-${selectedQuadrant})` }}
                                onClick={() => handleEmotionSelect(e)}
                            >
                                {e.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {step === 'note' && (
                <div className="quick-step fade-slide-in">
                    <h2>{selectedEmotion?.name}</h2>
                    <p className="quick-subtitle">{t('想說點什麼嗎？（可跳過）')}</p>
                    <textarea
                        className="quick-note"
                        placeholder={t('一句話記錄此刻...')}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                        autoFocus
                    />
                    <button className="morandi-main-btn" onClick={handleSave}>
                        {t('完成記錄')}
                    </button>
                </div>
            )}

            {step === 'done' && (
                <div className="quick-step quick-done fade-slide-in">
                    <div className="done-check">&#10003;</div>
                    <h2>{t('已記錄')}</h2>
                    <p className="quick-subtitle">{t('深呼吸，你已經很努力了')}</p>
                </div>
            )}

            <style>{`
                .quick-checkin {
                    width: 100%;
                    min-height: 400px;
                    display: flex;
                    flex-direction: column;
                }
                .quick-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: var(--s-6);
                }
                .quick-back-btn {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    font-size: 0.9rem;
                    padding: var(--s-2);
                }
                .quick-back-btn:hover { color: var(--text-primary); }
                .quick-badge {
                    font-size: 0.7rem;
                    font-weight: 700;
                    padding: 4px 12px;
                    background: hsla(45, 60%, 55%, 0.15);
                    color: var(--color-yellow);
                    border-radius: 20px;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                }
                .quick-step {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: var(--s-4);
                }
                .quick-step h2 {
                    font-size: 1.6rem;
                    font-weight: 800;
                    margin: 0;
                    letter-spacing: -0.5px;
                }
                .quick-subtitle {
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    margin: 0 0 var(--s-4) 0;
                }
                .quadrant-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: var(--s-3);
                }
                .quadrant-btn {
                    background: var(--bg-secondary);
                    border: 2px solid var(--glass-border);
                    border-radius: var(--radius-md);
                    padding: var(--s-5) var(--s-4);
                    text-align: left;
                    cursor: pointer;
                    transition: var(--transition-luxe);
                    display: flex;
                    flex-direction: column;
                    gap: var(--s-2);
                }
                .quadrant-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: var(--shadow-luxe);
                }
                .q-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                }
                .q-label {
                    font-weight: 700;
                    font-size: 0.95rem;
                    color: var(--text-primary);
                }
                .q-desc {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                }
                .emotion-bubbles {
                    display: flex;
                    flex-wrap: wrap;
                    gap: var(--s-2);
                }
                .emotion-bubble {
                    padding: var(--s-2) var(--s-4);
                    background: var(--glass-bg);
                    border: 1px solid var(--glass-border);
                    border-radius: 24px;
                    color: var(--text-primary);
                    cursor: pointer;
                    font-size: 0.9rem;
                    font-weight: 500;
                    transition: var(--transition-luxe);
                }
                .emotion-bubble:hover {
                    transform: translateY(-2px);
                    background: var(--glass-border);
                }
                .emotion-bubble.active {
                    background: var(--text-primary);
                    color: var(--bg-color);
                    font-weight: 700;
                    box-shadow: var(--shadow-sm);
                }
                .quick-note {
                    width: 100%;
                    background: var(--bg-secondary);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-md);
                    padding: var(--s-4);
                    color: var(--text-primary);
                    font-family: inherit;
                    font-size: 1rem;
                    resize: none;
                    outline: none;
                    transition: var(--transition-luxe);
                }
                .quick-note:focus { border-color: var(--text-secondary); }
                .quick-note::placeholder { color: var(--text-secondary); opacity: 0.5; }
                .quick-done {
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    min-height: 300px;
                }
                .done-check {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: var(--color-green);
                    color: #1a1a1a;
                    font-size: 2rem;
                    font-weight: 900;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: celebrationBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
                @keyframes celebrationBounce {
                    0% { transform: scale(0.5); opacity: 0; }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); opacity: 1; }
                }
                .fade-slide-in {
                    animation: fadeSlideIn 0.5s ease-out forwards;
                }
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .morandi-main-btn {
                    width: 100%;
                    padding: var(--s-4);
                    background: var(--text-primary);
                    color: var(--bg-color);
                    border: none;
                    border-radius: var(--radius-md);
                    font-weight: 800;
                    cursor: pointer;
                    transition: var(--transition-luxe);
                    letter-spacing: 1px;
                    margin-top: var(--s-4);
                }
                .morandi-main-btn:hover { transform: translateY(-2px); box-shadow: var(--shadow-luxe); filter: brightness(1.1); }
            `}</style>
        </div>
    );
};

export default QuickCheckIn;
