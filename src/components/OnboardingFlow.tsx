import React, { useState } from 'react';
import { useLanguage } from '../services/LanguageContext';
import { notificationService } from '../services/NotificationService';
import { uiIcons } from './icons/SvgIcons';

interface OnboardingFlowProps {
    onComplete: () => void;
}

const TOTAL_STEPS = 8;

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
    const { t } = useLanguage();
    const [step, setStep] = useState(1);
    const [reminderHour, setReminderHour] = useState(21);

    const handleNext = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
    const handlePrev = () => setStep(s => Math.max(s - 1, 1));
    
    const handleFinish = async () => {
        await notificationService.setEnabled(true);
        notificationService.setReminderTime(reminderHour, 0);
        onComplete();
    };

    const handleSkip = () => {
        // Skip to reminder setting
        setStep(8);
    };

    const renderProgressDots = () => {
        return (
            <div className="onboarding-progress">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                    <div 
                        key={i} 
                        className={`progress-dot ${step > i ? 'active' : ''} ${step === i + 1 ? 'current' : ''}`}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="onboarding-overlay">
            <div className="onboarding-card fade-in">
                {renderProgressDots()}

                {/* Step 1: Welcome */}
                {step === 1 && (
                    <div className="onboarding-step fade-slide-up">
                        <div className="step-icon leaf-float">{uiIcons.leaf}</div>
                        <h2>{t('歡迎來到 今心')}</h2>
                        <p>{t('這裡是你的情緒避風港。我們會用耶魯大學的 RULER 方法，陪你覺察、理解、調節每一個情緒。')}</p>
                        <div className="disclaimer-box">
                            <p className="disclaimer-title">⚠️ {t('使用須知')}</p>
                            <p className="disclaimer-text">{t('今心是情緒覺察輔助工具，非醫療器材，無法取代專業心理治療。如果您正在經歷嚴重情緒困擾或有自傷念頭，請立即聯繫專業人員。')}</p>
                            <p className="disclaimer-hotline">{t('台灣安心專線')} <strong>1925</strong>｜{t('生命線')} <strong>1909</strong></p>
                        </div>
                        <div className="step-actions">
                            <button className="morandi-main-btn" onClick={handleNext}>{t('我了解，開始導覽')}</button>
                            <button className="skip-link" onClick={handleSkip}>{t('跳過導覽')}</button>
                        </div>
                    </div>
                )}

                {/* Step 2: Four Colors */}
                {step === 2 && (
                    <div className="onboarding-step fade-slide-up">
                        <div className="step-quadrants">
                            <div className="q-box red">R</div>
                            <div className="q-box yellow">U</div>
                            <div className="q-box blue">L</div>
                            <div className="q-box green">E</div>
                        </div>
                        <h2>{t('情緒的四種色彩')}</h2>
                        <p>{t('每種顏色代表不同的能量與愉悅程度。紅色是焦慮憤怒，黃色是興奮快樂，藍色是憂鬱疲憊，綠色是平靜滿足。沒有「好」或「壞」的情緒，只有需要被看見的感受。')}</p>
                        <div className="step-actions">
                            <button className="morandi-outline-btn" onClick={handlePrev}>{t('上一步')}</button>
                            <button className="morandi-main-btn" onClick={handleNext}>{t('下一步')}</button>
                        </div>
                    </div>
                )}

                {/* Step 3: RULER Steps */}
                {step === 3 && (
                    <div className="onboarding-step fade-slide-up">
                        <div className="step-icon breathe">{uiIcons.seedling}</div>
                        <h2>{t('RULER 五步法')}</h2>
                        <div className="ruler-steps-list">
                            <div className="ruler-step-item">
                                <span className="ruler-letter r">R</span>
                                <span>{t('Recognizing - 辨別當下的情緒能量')}</span>
                            </div>
                            <div className="ruler-step-item">
                                <span className="ruler-letter l">L</span>
                                <span>{t('Labeling - 用精準詞彙標記情緒')}</span>
                            </div>
                            <div className="ruler-step-item">
                                <span className="ruler-letter u">U</span>
                                <span>{t('Understanding - 理解情緒的來源')}</span>
                            </div>
                            <div className="ruler-step-item">
                                <span className="ruler-letter e">E</span>
                                <span>{t('Expressing - 表達與宣洩情緒')}</span>
                            </div>
                            <div className="ruler-step-item">
                                <span className="ruler-letter r2">R</span>
                                <span>{t('Regulating - 調節回到平靜')}</span>
                            </div>
                        </div>
                        <div className="step-actions">
                            <button className="morandi-outline-btn" onClick={handlePrev}>{t('上一步')}</button>
                            <button className="morandi-main-btn" onClick={handleNext}>{t('下一步')}</button>
                        </div>
                    </div>
                )}

                {/* Step 4: Body Scan */}
                {step === 4 && (
                    <div className="onboarding-step fade-slide-up">
                        <div className="step-icon pulse">{uiIcons.brain}</div>
                        <h2>{t('聆聽身體的聲音')}</h2>
                        <p>{t('情緒不只在心裡，也在身體裡。透過身體掃描，你可以覺察情緒在身體的哪個部位、是什麼感覺。我們還提供語音引導，幫助你更放鬆地練習。')}</p>
                        <div className="feature-tags">
                            <span className="feature-tag">🎧 {t('語音引導')}</span>
                            <span className="feature-tag">🫀 {t('身體覺察')}</span>
                            <span className="feature-tag">🫁 {t('呼吸練習')}</span>
                        </div>
                        <div className="step-actions">
                            <button className="morandi-outline-btn" onClick={handlePrev}>{t('上一步')}</button>
                            <button className="morandi-main-btn" onClick={handleNext}>{t('下一步')}</button>
                        </div>
                    </div>
                )}

                {/* Step 5: Express & Regulate */}
                {step === 5 && (
                    <div className="onboarding-step fade-slide-up">
                        <div className="step-icon shake">{uiIcons.shredder}</div>
                        <h2>{t('表達與調節')}</h2>
                        <p>{t('寫下讓你困擾的事，然後用「情緒碎紙機」將它撕碎，象徵釋放。或使用呼吸規律器，透過調節呼吸來平復心情。這些都是你的情緒調節工具箱。')}</p>
                        <div className="feature-tags">
                            <span className="feature-tag">📝 {t('書寫宣洩')}</span>
                            <span className="feature-tag">🗑️ {t('碎紙機儀式')}</span>
                            <span className="feature-tag">🫁 {t('呼吸練習')}</span>
                        </div>
                        <div className="step-actions">
                            <button className="morandi-outline-btn" onClick={handlePrev}>{t('上一步')}</button>
                            <button className="morandi-main-btn" onClick={handleNext}>{t('下一步')}</button>
                        </div>
                    </div>
                )}

                {/* Step 6: Privacy */}
                {step === 6 && (
                    <div className="onboarding-step fade-slide-up">
                        <div className="step-icon pulse">{uiIcons.shield}</div>
                        <h2>{t('你的數據，你的隱私')}</h2>
                        <p>{t('所有情緒記錄都保存在你的裝置本地，不會上傳到任何伺服器。我們也提供 PIN 碼鎖定功能，保護你的私密空間。你可以隨時匯出或刪除所有數據。')}</p>
                        <div className="feature-tags">
                            <span className="feature-tag">🔒 {t('本地存儲')}</span>
                            <span className="feature-tag">📱 {t('PIN 保護')}</span>
                            <span className="feature-tag">📤 {t('數據匯出')}</span>
                        </div>
                        <div className="step-actions">
                            <button className="morandi-outline-btn" onClick={handlePrev}>{t('上一步')}</button>
                            <button className="morandi-main-btn" onClick={handleNext}>{t('下一步')}</button>
                        </div>
                    </div>
                )}

                {/* Step 7: Achievements */}
                {step === 7 && (
                    <div className="onboarding-step fade-slide-up">
                        <div className="step-icon bounce">{uiIcons.trophy}</div>
                        <h2>{t('記錄你的成長')}</h2>
                        <p>{t('每次完成情緒覺察，你都在建立更強大的心理韌性。達成連續記錄、探索不同情緒，解鎖成就徽章。在「成長看板」中，你可以回顧自己的情緒趨勢與進步。')}</p>
                        <div className="feature-tags">
                            <span className="feature-tag">🔥 {t('連續記錄')}</span>
                            <span className="feature-tag">🏅 {t('成就徽章')}</span>
                            <span className="feature-tag">📊 {t('成長看板')}</span>
                        </div>
                        <div className="step-actions">
                            <button className="morandi-outline-btn" onClick={handlePrev}>{t('上一步')}</button>
                            <button className="morandi-main-btn" onClick={handleNext}>{t('下一步')}</button>
                        </div>
                    </div>
                )}

                {/* Step 8: Reminder Setting */}
                {step === 8 && (
                    <div className="onboarding-step fade-slide-up">
                        <div className="step-icon pulse">{uiIcons.sparkle}</div>
                        <h2>{t('建立覺察習慣')}</h2>
                        <p>{t('選一個適合你的時間，讓我們每天提醒你停下腳步，聽聽內心的聲音。規律的情緒覺察，是心理健康的重要基石。')}</p>
                        
                        <div className="time-selector">
                            <label>{t('每日提醒時間')}</label>
                            <input 
                                type="range" 
                                min="0" 
                                max="23" 
                                value={reminderHour} 
                                onChange={(e) => setReminderHour(parseInt(e.target.value))}
                            />
                            <div className="selected-time">{String(reminderHour).padStart(2, '0')}:00</div>
                        </div>

                        <div className="step-actions">
                            <button className="morandi-outline-btn" onClick={handlePrev}>{t('上一步')}</button>
                            <button className="morandi-main-btn" onClick={handleFinish}>{t('開始旅程 ✨')}</button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .onboarding-overlay {
                    position: fixed;
                    inset: 0;
                    background: hsla(0, 0%, 10%, 0.92);
                    backdrop-filter: blur(16px);
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
                    padding: var(--s-8) var(--s-6);
                    width: 100%;
                    max-width: 420px;
                    text-align: center;
                    box-shadow: var(--shadow-luxe);
                    max-height: 90vh;
                    overflow-y: auto;
                }
                
                .onboarding-progress {
                    display: flex;
                    justify-content: center;
                    gap: 8px;
                    margin-bottom: var(--s-8);
                    flex-wrap: wrap;
                }
                
                .progress-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: var(--glass-border);
                    transition: all 0.3s ease;
                }
                
                .progress-dot.active {
                    background: var(--color-yellow);
                }
                
                .progress-dot.current {
                    transform: scale(1.3);
                    box-shadow: 0 0 8px var(--color-yellow);
                }
                
                .onboarding-step {
                    display: flex;
                    flex-direction: column;
                    min-height: 380px;
                }
                
                .onboarding-step h2 { 
                    font-size: 1.6rem; 
                    font-weight: 800; 
                    margin-bottom: var(--s-4); 
                    margin-top: 0;
                }
                
                .onboarding-step p { 
                    color: var(--text-secondary); 
                    line-height: 1.7; 
                    margin-bottom: var(--s-6);
                    font-size: 0.95rem;
                }
                
                .step-icon { 
                    width: 72px; 
                    height: 72px; 
                    margin: 0 auto var(--s-6); 
                    color: var(--color-green); 
                    opacity: 0.9; 
                }
                
                .step-icon svg { 
                    width: 100%; 
                    height: 100%; 
                }
                
                .step-actions {
                    margin-top: auto;
                    display: flex;
                    flex-direction: column;
                    gap: var(--s-3);
                }
                
                .skip-link {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 0.85rem;
                    cursor: pointer;
                    padding: var(--s-2);
                    transition: color 0.3s ease;
                }
                
                .skip-link:hover {
                    color: var(--text-primary);
                }
                
                /* RULER Steps List */
                .ruler-steps-list {
                    text-align: left;
                    margin-bottom: var(--s-6);
                    display: flex;
                    flex-direction: column;
                    gap: var(--s-3);
                }
                
                .ruler-step-item {
                    display: flex;
                    align-items: center;
                    gap: var(--s-3);
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                }
                
                .ruler-letter {
                    width: 28px;
                    height: 28px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                    font-size: 0.85rem;
                    color: #1a1a1a;
                    flex-shrink: 0;
                }
                
                .ruler-letter.r { background: var(--color-red); }
                .ruler-letter.l { background: var(--color-yellow); }
                .ruler-letter.u { background: var(--color-blue); }
                .ruler-letter.e { background: var(--color-yellow); }
                .ruler-letter.r2 { background: var(--color-green); }
                
                /* Feature Tags */
                .feature-tags {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: var(--s-2);
                    margin-bottom: var(--s-6);
                }
                
                .feature-tag {
                    padding: var(--s-2) var(--s-3);
                    background: var(--glass-bg);
                    border: 1px solid var(--glass-border);
                    border-radius: 20px;
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                }
                
                /* Quadrant Boxes */
                .step-quadrants {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    width: 110px;
                    margin: 0 auto var(--s-6);
                }
                
                .q-box {
                    width: 50px; 
                    height: 50px; 
                    border-radius: 10px; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    font-weight: 900; 
                    color: rgba(0,0,0,0.5); 
                    font-size: 1.1rem;
                }
                
                .q-box.red { background: var(--color-red); }
                .q-box.yellow { background: var(--color-yellow); }
                .q-box.blue { background: var(--color-blue); }
                .q-box.green { background: var(--color-green); }

                /* Time Selector */
                .time-selector { 
                    margin-bottom: var(--s-6); 
                    padding: var(--s-4);
                    background: var(--glass-bg);
                    border-radius: var(--radius-md);
                    border: 1px solid var(--glass-border);
                }
                
                .time-selector label { 
                    font-size: 0.85rem; 
                    color: var(--text-secondary); 
                    display: block; 
                    margin-bottom: var(--s-4); 
                }
                
                .selected-time { 
                    font-size: 2.2rem; 
                    font-weight: 900; 
                    color: var(--color-yellow); 
                    margin-top: var(--s-3);
                }

                input[type=range] { 
                    width: 100%; 
                    accent-color: var(--color-yellow); 
                }
                
                /* Buttons */
                .morandi-main-btn { 
                    width: 100%; 
                    padding: var(--s-4); 
                    background: var(--text-primary); 
                    color: var(--bg-color); 
                    border: none; 
                    border-radius: var(--radius-md); 
                    font-weight: 700; 
                    cursor: pointer; 
                    transition: var(--transition-luxe);
                    font-size: 0.95rem;
                }
                
                .morandi-main-btn:hover:not(:disabled) { 
                    transform: translateY(-2px); 
                    box-shadow: var(--shadow-luxe); 
                    filter: brightness(1.1); 
                }
                
                .morandi-outline-btn { 
                    width: 100%;
                    background: transparent; 
                    border: 1px solid var(--glass-border); 
                    color: var(--text-secondary); 
                    padding: var(--s-3); 
                    border-radius: var(--radius-md); 
                    cursor: pointer; 
                    transition: var(--transition-luxe); 
                    font-size: 0.9rem;
                    font-weight: 500;
                }
                
                .morandi-outline-btn:hover { 
                    border-color: var(--text-primary); 
                    color: var(--text-primary); 
                }

                /* Animations */
                .leaf-float { 
                    animation: leafFloat 3s ease-in-out infinite; 
                }
                
                @keyframes leafFloat {
                    0%, 100% { transform: translateY(0) rotate(0); }
                    50% { transform: translateY(-8px) rotate(8deg); }
                }
                
                .pulse { 
                    animation: iconPulse 2s ease-in-out infinite; 
                }
                
                @keyframes iconPulse {
                    0%, 100% { transform: scale(1); opacity: 0.85; }
                    50% { transform: scale(1.08); opacity: 1; }
                }
                
                .breathe {
                    animation: breathe 4s ease-in-out infinite;
                }
                
                @keyframes breathe {
                    0%, 100% { transform: scale(1); opacity: 0.85; }
                    50% { transform: scale(1.1); opacity: 1; }
                }
                
                .shake {
                    animation: shake 0.5s ease-in-out infinite;
                }
                
                @keyframes shake {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-3deg); }
                    75% { transform: rotate(3deg); }
                }
                
                .bounce {
                    animation: bounce 1s ease-in-out infinite;
                }
                
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                
                .fade-slide-up { 
                    animation: fadeSlideUp 0.5s ease-out forwards; 
                }
                
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                /* Disclaimer Box */
                .disclaimer-box {
                    background: hsla(30, 50%, 50%, 0.08);
                    border: 1px solid hsla(30, 50%, 60%, 0.25);
                    border-radius: var(--radius-md);
                    padding: var(--s-4);
                    margin-bottom: var(--s-4);
                    text-align: left;
                }
                .disclaimer-title {
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin: 0 0 var(--s-2) 0;
                }
                .disclaimer-text {
                    font-size: 0.78rem;
                    color: var(--text-secondary);
                    line-height: 1.5;
                    margin: 0 0 var(--s-2) 0;
                }
                .disclaimer-hotline {
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                    margin: 0;
                }

                /* Responsive */
                @media (max-width: 400px) {
                    .onboarding-card {
                        padding: var(--s-6) var(--s-4);
                    }
                    .onboarding-step h2 {
                        font-size: 1.4rem;
                    }
                    .step-icon {
                        width: 60px;
                        height: 60px;
                    }
                }
            `}</style>
        </div>
    );
};

export default OnboardingFlow;
