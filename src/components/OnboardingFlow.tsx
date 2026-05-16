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
    const [notificationFeedback, setNotificationFeedback] = useState('');

    const handleNext = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
    const handlePrev = () => setStep(s => Math.max(s - 1, 1));
    
    const handleFinish = () => {
        settingsStore.setUserRole(userRole);
        notificationService.setReminderTime(reminderHour, 0);

        // Notification permission can be blocked or delayed by mobile/in-app browsers.
        // Do not make onboarding completion depend on that optional permission path.
        void notificationService.setEnabled(true).catch(() => {
            // Users can retry from the reminder test button or settings later.
        });
        onComplete();
    };

    const handleTestReminder = async () => {
        setNotificationFeedback('');
        notificationService.setReminderTime(reminderHour, 0);
        const enabled = await notificationService.setEnabled(true);
        if (!enabled) {
            setNotificationFeedback(t('這個瀏覽器目前沒有通知權限。請先允許通知，或改用 Safari / Chrome / 加入主畫面後再試。'));
            return;
        }
        notificationService.sendTestNotification(userRole);
        setNotificationFeedback(t('已送出測試提醒。如果沒有看到，請檢查瀏覽器通知權限。'));
    };

    const handleTryNow = () => {
        settingsStore.setUserRole(userRole);
        onComplete();
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
                    <div className="onboarding-step is-welcome-step fade-slide-up">
                        <div className="step-icon leaf-float">{uiIcons.leaf}</div>
                        <h2>{t('歡迎來到 今心')}</h2>
                        <div className="agentic-intro">
                            <p>{t('今心不只是情緒記錄工具，也有一位會主動陪你整理下一步的阿念教練。')}</p>
                            <p>{t('阿念會看見你的紀錄、接續你的情緒線索，必要時帶你做呼吸或緊急安定練習。用得越久，它越能看懂你的節奏。')}</p>
                        </div>
                        <div className="disclaimer-box">
                            <p className="disclaimer-title">⚠️ {t('使用須知')}</p>
                            <p className="disclaimer-text">{t('今心是情緒覺察輔助工具，非醫療器材，無法取代專業心理治療。如果您正在經歷嚴重情緒困擾或有自傷念頭，請立即聯繫專業人員。')}</p>
                            <p className="disclaimer-hotline">{t('台灣安心專線')} <strong>1925</strong>｜{t('生命線')} <strong>1909</strong></p>
                        </div>
                        <div className="step-actions">
                            <button className="morandi-main-btn" onClick={handleNext}>{t('看完整導覽')}</button>
                            <button className="skip-link" onClick={handleTryNow}>{t('先試一次')}</button>
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
                                { key: 'parent' as UserRole, label: t('照顧孩子的父母'), desc: t('親子衝突、照顧壓力、修復關係') },
                                { key: 'general' as UserRole, label: t('一般日常使用'), desc: t('情緒整理、壓力覺察、照顧自己') },
                                { key: 'student' as UserRole, label: t('學生'), desc: t('課業、人際、考試壓力') },
                                { key: 'professional' as UserRole, label: t('職場工作者'), desc: t('工作壓力、溝通、下班復原') },
                            ]).map(role => (
                                <button
                                    key={role.key}
                                    className={`role-btn ${userRole === role.key ? 'active' : ''}`}
                                    onClick={() => setUserRole(role.key)}
                                >
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

                {/* Step 3: Four States */}
                {step === 3 && (
                    <div className="onboarding-step fade-slide-up">
                        <div className="step-quadrants">
                            <div className="q-box red"></div>
                            <div className="q-box yellow"></div>
                            <div className="q-box blue"></div>
                            <div className="q-box green"></div>
                        </div>
                        <h2>{t('情緒的四種常見狀態')}</h2>
                        <p>{t('情緒心理學常用「身體喚醒程度」和「感受愉悅度」來理解當下狀態：高喚醒又不舒服時，可能是緊張、憤怒或焦慮；高喚醒又舒服時，可能是興奮、期待或有活力；低喚醒又不舒服時，可能是低落、疲憊或失望；低喚醒又舒服時，可能是平靜、放鬆或安心。這不是診斷，也不是把情緒分好壞，而是先幫你看見身體和感受正在往哪裡走。')}</p>
                        <div className="step-actions">
                            <button className="morandi-outline-btn" onClick={handlePrev}>{t('上一步')}</button>
                            <button className="morandi-main-btn" onClick={handleNext}>{t('下一步')}</button>
                        </div>
                    </div>
                )}

                {/* Step 4: ImXin Flow Steps */}
                {step === 4 && (
                    <div className="onboarding-step fade-slide-up">
                        <div className="step-icon breathe">{uiIcons.seedling}</div>
                        <h2>{t('知心四式練習')}</h2>
                        <div className="ruler-steps-list">
                            <div className="ruler-step-item">
                                <span className="ruler-letter r">1</span>
                                <span>{t('心照 — 心照一念，我現在落在哪個狀態？')}</span>
                            </div>
                            <div className="ruler-step-item">
                                <span className="ruler-letter l">2</span>
                                <span>{t('喚名 — 喚其真名，這個感覺比較像什麼？')}</span>
                            </div>
                            <div className="ruler-step-item">
                                <span className="ruler-letter u">3</span>
                                <span>{t('安神 — 安住心神，它在提醒我哪個需要？')}</span>
                            </div>
                            <div className="ruler-step-item">
                                <span className="ruler-letter e">4</span>
                                <span>{t('動念 — 一念可轉，我可以先做哪一小步？')}</span>
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

                {/* Step 6: 安放與回應 */}
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
                        <h2>{t('資料怎麼保存')}</h2>
                        <p>{t('未登入時，情緒練習記錄會留在這台裝置的瀏覽器儲存空間，其中情緒記錄會用本機加密格式保存。登入或註冊並同意後，今心才會把必要的記錄與教練脈絡同步到雲端，讓阿念接續你的狀態；你可以匯出本機記錄，登入後也可以刪除帳號雲端資料。')}</p>
                        <div className="feature-tags">
                            <span className="feature-tag">{t('未登入：本機保存')}</span>
                            <span className="feature-tag">{t('登入同意才同步')}</span>
                            <span className="feature-tag">{t('可匯出 / 刪帳')}</span>
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
                        <h2>{t('讓今心整理你的模式')}</h2>
                        <p>{t('每次記錄都會變成你回看自己的線索。今心會在成長頁整理最近的情緒、觸發點與需要；若你有登入並開啟阿念主動關心，才會使用這些脈絡提供更個人化的提醒。')}</p>
                        <div className="feature-tags">
                            <span className="feature-tag">{t('每日提醒')}</span>
                            <span className="feature-tag">{t('週洞察')}</span>
                            <span className="feature-tag">{t('成就收藏')}</span>
                        </div>
                        <div className="step-actions">
                            <button className="morandi-outline-btn" onClick={handlePrev}>{t('上一步')}</button>
                            <button className="morandi-main-btn" onClick={handleNext}>{t('下一步')}</button>
                        </div>
                    </div>
                )}

                {/* Step 9: Reminder Setting */}
                {step === 9 && (
                    <div className="onboarding-step reminder-step fade-slide-up">
                        <div className="step-icon pulse">{uiIcons.sparkle}</div>
                        <h2>{t('提醒時間與內容')}</h2>
                        <p>{t('到點會跳一則瀏覽器通知，提醒你回來看一眼。')}</p>
                        
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

                        <div className="reminder-preview" aria-label={t('提醒訊息預覽')}>
                            <span>{t('提醒會像這樣')}</span>
                            <strong>{t('今心 • 每日心情記錄')}</strong>
                            <p>{t(notificationService.getDailyReminderPreview(userRole))}</p>
                        </div>
                        <p className="reminder-permission-note">
                            {t('看不到通知通常是權限或內建瀏覽器限制；可改用 Safari / Chrome 或加入主畫面。')}
                        </p>
                        <button type="button" className="morandi-outline-btn reminder-test-btn" onClick={handleTestReminder}>
                            {t('試發提醒')}
                        </button>
                        {notificationFeedback && <p className="reminder-feedback">{notificationFeedback}</p>}

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
