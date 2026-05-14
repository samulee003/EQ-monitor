import React, { useState } from 'react';
import { useLanguage } from '../services/LanguageContext';
import { notificationService } from '../services/NotificationService';
import { settingsStore } from '../adapters';
import { uiIcons } from './icons/SvgIcons';
import './OnboardingFlow.css';

interface OnboardingFlowProps {
    onComplete: () => void;
}

const TOTAL_STEPS = 9;

export type UserRole = 'general' | 'parent' | 'student' | 'professional';

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
    const { t } = useLanguage();
    const [step, setStep] = useState(1);
    const [reminderHour, setReminderHour] = useState(21);
    const [userRole, setUserRole] = useState<UserRole>('general');

    const handleNext = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
    const handlePrev = () => setStep(s => Math.max(s - 1, 1));
    
    const handleFinish = async () => {
        await notificationService.setEnabled(true);
        notificationService.setReminderTime(reminderHour, 0);
        settingsStore.setUserRole(userRole);
        onComplete();
    };

    const handleSkip = () => {
        // Skip to reminder setting
        setStep(9);
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
                        <div className="agentic-intro">
                            <p>{t('今心不只是情緒記錄工具，也有一位會主動陪你整理下一步的教練。')}</p>
                            <p>{t('你可以把它想成隨身情緒教練：看見你的紀錄、提醒你回到當下，必要時帶你做呼吸或緊急安定練習。')}</p>
                        </div>
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

                {/* Step 2: Role Selection */}
                {step === 2 && (
                    <div className="onboarding-step fade-slide-up">
                        <div className="step-icon pulse">{uiIcons.sparkle}</div>
                        <h2>{t('你是什麼身份？')}</h2>
                        <p>{t('選擇最符合的角色，我們會為你客製化體驗。')}</p>
                        <div className="role-grid">
                            {([
                                { key: 'parent' as UserRole, label: t('父母'), icon: '育', desc: t('育兒情境、親職策略') },
                                { key: 'general' as UserRole, label: t('通用'), icon: '通', desc: t('一般情緒管理') },
                                { key: 'student' as UserRole, label: t('學生'), icon: '學', desc: t('學業與社交壓力') },
                                { key: 'professional' as UserRole, label: t('職場'), icon: '職', desc: t('工作壓力管理') },
                            ]).map(role => (
                                <button
                                    key={role.key}
                                    className={`role-btn ${userRole === role.key ? 'active' : ''}`}
                                    onClick={() => setUserRole(role.key)}
                                >
                                    <span className="role-icon">{role.icon}</span>
                                    <span className="role-label">{role.label}</span>
                                    <span className="role-desc">{role.desc}</span>
                                </button>
                            ))}
                        </div>
                        <div className="step-actions">
                            <button className="morandi-outline-btn" onClick={handlePrev}>{t('上一步')}</button>
                            <button className="morandi-main-btn" onClick={handleNext}>{t('下一步')}</button>
                        </div>
                    </div>
                )}

                {/* Step 3: Four Colors */}
                {step === 3 && (
                    <div className="onboarding-step fade-slide-up">
                        <div className="step-quadrants">
                            <div className="q-box red"></div>
                            <div className="q-box yellow"></div>
                            <div className="q-box blue"></div>
                            <div className="q-box green"></div>
                        </div>
                        <h2>{t('情緒的四種色彩')}</h2>
                        <p>{t('每種顏色代表不同的能量與愉悅程度。紅色是焦慮憤怒，黃色是興奮快樂，藍色是憂鬱疲憊，綠色是平靜滿足。沒有「好」或「壞」的情緒，只有需要被看見的感受。')}</p>
                        <div className="step-actions">
                            <button className="morandi-outline-btn" onClick={handlePrev}>{t('上一步')}</button>
                            <button className="morandi-main-btn" onClick={handleNext}>{t('下一步')}</button>
                        </div>
                    </div>
                )}

                {/* Step 4: Pause Flow Steps */}
                {step === 4 && (
                    <div className="onboarding-step fade-slide-up">
                        <div className="step-icon breathe">{uiIcons.seedling}</div>
                        <h2>{t('覺察五步練習')}</h2>
                        <div className="ruler-steps-list">
                            <div className="ruler-step-item">
                                <span className="ruler-letter r">N</span>
                                <span>{t('覺察 — 我現在有什麼感覺？')}</span>
                            </div>
                            <div className="ruler-step-item">
                                <span className="ruler-letter l">N</span>
                                <span>{t('命名 — 這個感覺叫什麼？')}</span>
                            </div>
                            <div className="ruler-step-item">
                                <span className="ruler-letter u">L</span>
                                <span>{t('定位 — 身體哪裡有感覺？')}</span>
                            </div>
                            <div className="ruler-step-item">
                                <span className="ruler-letter e">N</span>
                                <span>{t('需要 — 此刻我需要什麼？')}</span>
                            </div>
                            <div className="ruler-step-item">
                                <span className="ruler-letter r2">C</span>
                                <span>{t('選擇 — 我想怎麼回應？')}</span>
                            </div>
                        </div>
                        <div className="step-actions">
                            <button className="morandi-outline-btn" onClick={handlePrev}>{t('上一步')}</button>
                            <button className="morandi-main-btn" onClick={handleNext}>{t('下一步')}</button>
                        </div>
                    </div>
                )}

                {/* Step 5: Body Scan */}
                {step === 5 && (
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

                {/* Step 6: Express & Regulate */}
                {step === 6 && (
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

                {/* Step 7: Privacy */}
                {step === 7 && (
                    <div className="onboarding-step fade-slide-up">
                        <div className="step-icon pulse">{uiIcons.shield}</div>
                        <h2>{t('你的數據，你的隱私')}</h2>
                        <p>{t('基本記錄會先留在你的裝置。登入並同意雲端備份後，主動教練才會用你的情緒輪廓提供更個人化的提醒；你可以隨時匯出或刪除資料。')}</p>
                        <div className="feature-tags">
                            <span className="feature-tag">🔒 {t('本機優先')}</span>
                            <span className="feature-tag">📱 {t('PIN 保護')}</span>
                            <span className="feature-tag">📤 {t('可匯出刪除')}</span>
                        </div>
                        <div className="step-actions">
                            <button className="morandi-outline-btn" onClick={handlePrev}>{t('上一步')}</button>
                            <button className="morandi-main-btn" onClick={handleNext}>{t('下一步')}</button>
                        </div>
                    </div>
                )}

                {/* Step 8: Achievements */}
                {step === 8 && (
                    <div className="onboarding-step fade-slide-up">
                        <div className="step-icon bounce">{uiIcons.trophy}</div>
                        <h2>{t('讓教練看見你的模式')}</h2>
                        <p>{t('每次記錄都會變成教練理解你的線索。它會把最近的情緒、觸發點與需求整理成洞察，提醒你下一次可以更早照顧自己。')}</p>
                        <div className="feature-tags">
                            <span className="feature-tag">✦ {t('主動提醒')}</span>
                            <span className="feature-tag">📊 {t('週報洞察')}</span>
                            <span className="feature-tag">🏆 {t('成就鼓勵')}</span>
                        </div>
                        <div className="step-actions">
                            <button className="morandi-outline-btn" onClick={handlePrev}>{t('上一步')}</button>
                            <button className="morandi-main-btn" onClick={handleNext}>{t('下一步')}</button>
                        </div>
                    </div>
                )}

                {/* Step 9: Reminder Setting */}
                {step === 9 && (
                    <div className="onboarding-step fade-slide-up">
                        <div className="step-icon pulse">{uiIcons.sparkle}</div>
                        <h2>{t('設定主動關心時間')}</h2>
                        <p>{t('選一個你通常願意停下來的時間。今心會用溫和提醒把你帶回覺察，而不是等到情緒爆滿才開始處理。')}</p>
                        
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

        </div>
    );
};

export default OnboardingFlow;
