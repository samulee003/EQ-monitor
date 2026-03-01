import React, { useState } from 'react';
import { useLanguage } from '../../services/LanguageContext';
import { uiIcons } from '../icons/SvgIcons';

interface NeuroCheckStepProps {
    onComplete: (data: { sleepHours: number; activityLevel: number }) => void;
}

export const NeuroCheckStep: React.FC<NeuroCheckStepProps> = ({ onComplete }) => {
    const { t } = useLanguage();
    const [postRegulationMood, setPostRegulationMood] = useState<string>('');
    const [sleepHours, setSleepHours] = useState(7);
    const [activityLevel, setActivityLevel] = useState(3);

    const moodOptions = ['感覺輕鬆多了', '平靜了一些', '依然差不多', '產生了新思緒'];

    return (
        <div className="neuro-check-card">
            <div className="summary-icon">{uiIcons.brain}</div>
            <h2>{t('調節後的感覺？')}</h2>
            <p className="summary-desc">{t('觀察一下現在的內在狀態是否有微小的變化？')}</p>

            <div className="mood-shift-options">
                {moodOptions.map(option => (
                    <button
                        key={option}
                        className={`option-chip ${postRegulationMood === option ? 'active' : ''}`}
                        onClick={() => setPostRegulationMood(option)}
                    >
                        {t(option)}
                    </button>
                ))}
            </div>

            <div className="physical-context-collect">
                <div className="collect-item">
                    <label>{t('昨晚睡眠')} ({sleepHours}h)</label>
                    <input 
                        type="range" 
                        min="0" 
                        max="12" 
                        step="0.5" 
                        value={sleepHours} 
                        onChange={(e) => setSleepHours(parseFloat(e.target.value))} 
                    />
                </div>
                <div className="collect-item">
                    <label>{t('今日活動強度')} ({activityLevel}/5)</label>
                    <input 
                        type="range" 
                        min="1" 
                        max="5" 
                        value={activityLevel} 
                        onChange={(e) => setActivityLevel(parseInt(e.target.value))} 
                    />
                </div>
            </div>

            <button
                className="morandi-main-btn"
                disabled={!postRegulationMood}
                onClick={() => onComplete({ sleepHours, activityLevel })}
            >
                {t('完成調節')}
            </button>
        </div>
    );
};

export default NeuroCheckStep;
