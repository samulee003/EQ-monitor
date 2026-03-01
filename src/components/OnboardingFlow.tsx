import React, { useState } from 'react';
import { useLanguage } from '../services/LanguageContext';
import { notificationService } from '../services/NotificationService';
import { uiIcons } from './icons/SvgIcons';

interface OnboardingFlowProps {
    onComplete: () => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
    const { t } = useLanguage();
    const [step, setStep] = useState(1);
    const [reminderHour, setReminderHour] = useState(21);

    const handleNext = () => setStep(s => s + 1);
    
    const handleFinish = async () => {
        await notificationService.setEnabled(true);
        notificationService.setReminderTime(reminderHour, 0);
        onComplete();
    };

    return (
        <div className="onboarding-overlay">
            <div className="onboarding-card fade-in">
                <div className="onboarding-progress">
                    <div className="progress-dot active"></div>
                    <div className={`progress-dot ${step >= 2 ? 'active' : ''}`}></div>
                    <div className={`progress-dot ${step >= 3 ? 'active' : ''}`}></div>
                </div>

                {step === 1 && (
                    <div className="onboarding-step fade-slide-up">
                        <div className="step-icon leaf-float">{uiIcons.leaf}</div>
                        <h2>{t('歡迎來到 今心')}</h2>
                        <p>{t('這裡是你的情緒避風港。我們會用耶魯大學的 RULER 方法，陪你覺察、理解、調節每一個情緒。')}</p>
                        <button className="morandi-main-btn" onClick={handleNext}>{t('下一步')}</button>
                    </div>
                )}

                {step === 2 && (
                    <div className="onboarding-step fade-slide-up">
                        <div className="step-quadrants">
                            <div className="q-box red">R</div>
                            <div className="q-box yellow">U</div>
                            <div className="q-box blue">L</div>
                            <div className="q-box green">E</div>
                        </div>
                        <h2>{t('情緒的四種色彩')}</h2>
                        <p>{t('每種顏色代表不同的能量與愉悅程度。沒有「好」或「壞」的情緒，只有需要被看見的感受。')}</p>
                        <button className="morandi-main-btn" onClick={handleNext}>{t('下一步')}</button>
                    </div>
                )}

                {step === 3 && (
                    <div className="onboarding-step fade-slide-up">
                        <div className="step-icon pulse">{uiIcons.sparkle}</div>
                        <h2>{t('建立覺察習慣')}</h2>
                        <p>{t('選一個適合你的時間，讓我們每天提醒你停下腳步，聽聽內心的聲音。')}</p>
                        
                        <div className="time-selector">
                            <label>{t('提醒時間')}</label>
                            <input 
                                type="range" 
                                min="0" 
                                max="23" 
                                value={reminderHour} 
                                onChange={(e) => setReminderHour(parseInt(e.target.value))}
                            />
                            <div className="selected-time">{reminderHour}:00</div>
                        </div>

                        <button className="morandi-main-btn" onClick={handleFinish}>{t('開始旅程 ✨')}</button>
                    </div>
                )}
            </div>

            <style>{`
                .onboarding-overlay {
                    position: fixed;
                    inset: 0;
                    background: hsla(0, 0%, 10%, 0.9);
                    backdrop-filter: blur(12px);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: var(--s-6);
                }
                .onboarding-card {
                    background: var(--bg-secondary);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-luxe);
                    padding: var(--s-10) var(--s-8);
                    width: 100%;
                    max-width: 400px;
                    text-align: center;
                    box-shadow: var(--shadow-luxe);
                }
                .onboarding-progress {
                    display: flex;
                    justify-content: center;
                    gap: 12px;
                    margin-bottom: var(--s-10);
                }
                .progress-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: var(--glass-border);
                    transition: all 0.3s ease;
                }
                .progress-dot.active {
                    background: var(--color-yellow);
                    transform: scale(1.3);
                    box-shadow: 0 0 10px var(--color-yellow);
                }
                .onboarding-step h2 { font-size: 1.8rem; font-weight: 800; margin-bottom: var(--s-4); }
                .onboarding-step p { color: var(--text-secondary); line-height: 1.6; margin-bottom: var(--s-10); }
                
                .step-icon { width: 80px; height: 80px; margin: 0 auto var(--s-8); color: var(--color-green); opacity: 0.8; }
                .step-icon svg { width: 100%; height: 100%; }
                
                .step-quadrants {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    width: 120px;
                    margin: 0 auto var(--s-8);
                }
                .q-box {
                    width: 54px; height: 54px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
                    font-weight: 900; color: rgba(0,0,0,0.5); font-size: 1.2rem;
                }
                .q-box.red { background: var(--color-red); }
                .q-box.yellow { background: var(--color-yellow); }
                .q-box.blue { background: var(--color-blue); }
                .q-box.green { background: var(--color-green); }

                .time-selector { margin-bottom: var(--s-10); }
                .time-selector label { font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: var(--s-4); }
                .selected-time { font-size: 2.5rem; font-weight: 900; color: var(--color-yellow); margin-top: var(--s-4); }

                input[type=range] { width: 100%; accent-color: var(--color-yellow); }

                .leaf-float { animation: leafFloat 3s ease-in-out infinite; }
                @keyframes leafFloat {
                    0%, 100% { transform: translateY(0) rotate(0); }
                    50% { transform: translateY(-10px) rotate(10deg); }
                }
                .pulse { animation: iconPulse 2s ease-in-out infinite; }
                @keyframes iconPulse {
                    0%, 100% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.1); opacity: 1; }
                }
                .fade-slide-up { animation: fadeSlideUp 0.6s ease-out forwards; }
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default OnboardingFlow;
