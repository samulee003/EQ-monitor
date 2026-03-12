import React, { useState } from 'react';
import MoodMeter from './MoodMeter';
import EmotionGrid from './EmotionGrid';
import BodyScan from './BodyScan';
import UnderstandingStep from './UnderstandingStep';
import ExpressingStep from './ExpressingStep';
import RegulatingStep from './RegulatingStep';
import RulerProgress from './RulerProgress';
import SummaryStep from './steps/SummaryStep';
import NeuroCheckStep from './steps/NeuroCheckStep';
import CenteringStep from './steps/CenteringStep';
import QuickStats from './QuickStats';
import QuickCheckIn from './QuickCheckIn';
import ParentScenarios from './ParentScenarios';
import { useRulerFlow } from '../hooks/useRulerFlow';
import { useLanguage } from '../services/LanguageContext';
import { Emotion } from '../data/emotionData';

// 高風險情緒 ID：選擇時提供安全資源
const HIGH_RISK_EMOTION_IDS = new Set([
    'hopeless', 'helpless', 'desolate',     // 絕望的、無望的、孤寂的
    'miserable', 'despondent', 'depressed',  // 悲慘的、消沈的、抑鬱的
    'enraged', 'furious', 'panicked',        // 憤怒的、暴怒的、驚惶失措的
]);

type QuickMode = null | 'quick' | 'parent';

const CheckInFlow: React.FC = () => {
    const { t } = useLanguage();
    const [showCrisisModal, setShowCrisisModal] = useState(false);
    const [quickMode, setQuickMode] = useState<QuickMode>(null);
    const isParentRole = localStorage.getItem('imxin_user_role') === 'parent';
    const {
        step,
        selectedQuadrants,
        selectedEmotions,
        showResumePrompt,
        isFullFlow,
        postRegulationMood,
        setStep,
        setIsFullFlow,
        setPostRegulationMood,
        setShowResumePrompt,
        resumeDraft,
        resetFlow,
        handleMoodComplete,
        handleBodyScanComplete,
        handleEmotionSelect,
        handleUnderstandingComplete,
        handleExpressingComplete,
        handleRegulatingComplete,
        handleNeuroCheckComplete
    } = useRulerFlow();

    const handleEmotionSelectWithCrisisCheck = (emotions: Emotion[]) => {
        handleEmotionSelect(emotions);
        const hasHighRisk = emotions.some(e => HIGH_RISK_EMOTION_IDS.has(e.id));
        if (hasHighRisk) {
            setShowCrisisModal(true);
        }
    };

    const handleContinueFullFlow = () => {
        setIsFullFlow(true);
        setStep('understanding');
    };

    return (
        <div className="check-in-flow fade-in">
            {/* Quick mode views */}
            {quickMode === 'quick' && (
                <QuickCheckIn
                    onComplete={() => { setQuickMode(null); resetFlow(); }}
                    onCancel={() => setQuickMode(null)}
                />
            )}
            {quickMode === 'parent' && (
                <ParentScenarios onDismiss={() => setQuickMode(null)} />
            )}

            {/* Show QuickStats + Quick Entry Buttons on home screen */}
            {!quickMode && step === 'recognizing' && !showResumePrompt && (
                <>
                    <QuickStats />
                    <div className="quick-entry-buttons">
                        <button className="quick-entry-btn" onClick={() => setQuickMode('quick')}>
                            <span className="qe-icon">&#9889;</span>
                            <div className="qe-text">
                                <span className="qe-title">{t('快速記錄')}</span>
                                <span className="qe-desc">{t('< 60 秒完成')}</span>
                            </div>
                        </button>
                        {isParentRole && (
                            <button className="quick-entry-btn parent-entry" onClick={() => setQuickMode('parent')}>
                                <span className="qe-icon">&#128588;</span>
                                <div className="qe-text">
                                    <span className="qe-title">{t('親職支援')}</span>
                                    <span className="qe-desc">{t('即時行動指引')}</span>
                                </div>
                            </button>
                        )}
                    </div>
                </>
            )}

            {!quickMode && step !== 'summary' && !showResumePrompt && (
                <RulerProgress
                    currentStep={step}
                    isFullFlow={isFullFlow}
                    selectedQuadrant={selectedQuadrants[0] || undefined}
                />
            )}

            {!quickMode && <div key={step} className="flow-content-wrapper fade-slide-in">
                {showResumePrompt && (
                    <div className="resume-prompt-overlay fade-in">
                        <div className="resume-card">
                            <h3>{t('繼續之前的旅程？')}</h3>
                            <p>{t('我們為你保留了上一次的覺察進度。')}</p>
                            <div className="resume-actions">
                                <button className="morandi-main-btn" onClick={resumeDraft}>{t('繼續')}</button>
                                <button className="morandi-outline-btn" onClick={() => { setShowResumePrompt(false); resetFlow(); }}>{t('重新開始')}</button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'recognizing' && (
                    <MoodMeter
                        onSelectQuadrants={(qs) => handleMoodComplete(qs, 5)}
                    />
                )}

                {step === 'centering' && selectedQuadrants.length > 0 && (
                    <CenteringStep quadrant={selectedQuadrants[0]} />
                )}

                {step === 'bodyScan' && selectedQuadrants.length > 0 && (
                    <BodyScan
                        quadrant={selectedQuadrants[0]}
                        onComplete={handleBodyScanComplete}
                        onBack={() => setStep('recognizing')}
                    />
                )}

                {step === 'labeling' && selectedQuadrants.length > 0 && (
                    <EmotionGrid
                        quadrants={selectedQuadrants}
                        onSelectEmotions={handleEmotionSelectWithCrisisCheck}
                        onBack={() => setStep('bodyScan')}
                    />
                )}

                {step === 'understanding' && selectedEmotions.length > 0 && (
                    <UnderstandingStep
                        emotion={selectedEmotions[0]}
                        onComplete={handleUnderstandingComplete}
                        onBack={() => setStep('labeling')}
                    />
                )}

                {step === 'expressing' && selectedEmotions.length > 0 && (
                    <ExpressingStep
                        emotion={selectedEmotions[0]}
                        onComplete={handleExpressingComplete}
                        onBack={() => setStep('understanding')}
                    />
                )}

                {step === 'regulating' && selectedEmotions.length > 0 && (
                    <RegulatingStep
                        emotion={selectedEmotions[0]}
                        onComplete={handleRegulatingComplete}
                        onBack={() => setStep('expressing')}
                    />
                )}

                {step === 'neuroCheck' && (
                    <NeuroCheckStep
                        onComplete={({ sleepHours, activityLevel }) => 
                            handleNeuroCheckComplete({ sleepHours, activityLevel })
                        }
                    />
                )}

                {step === 'summary' && selectedEmotions.length > 0 && (
                    <SummaryStep
                        selectedEmotions={selectedEmotions}
                        isFullFlow={isFullFlow}
                        onReset={resetFlow}
                        onContinueFullFlow={!isFullFlow ? handleContinueFullFlow : undefined}
                    />
                )}
            </div>}

            {/* 危機介入彈窗 */}
            {showCrisisModal && (
                <div className="crisis-modal-overlay fade-in" role="dialog" aria-modal="true" aria-label={t('心理支持資源')}>
                    <div className="crisis-modal">
                        <div className="crisis-icon">🤝</div>
                        <h3>{t('你不需要獨自面對')}</h3>
                        <p>{t('你剛才選擇了一個很沉重的情緒。今心陪伴你覺察，但如果你正在經歷嚴重的痛苦，專業的支持更能幫助你。')}</p>
                        <div className="crisis-hotlines">
                            <a href="tel:1925" className="crisis-hotline-btn">
                                📞 {t('安心專線')} <strong>1925</strong>
                                <span>{t('24小時免費')}</span>
                            </a>
                            <a href="tel:1909" className="crisis-hotline-btn">
                                📞 {t('生命線')} <strong>1909</strong>
                                <span>{t('24小時免費')}</span>
                            </a>
                        </div>
                        <button
                            className="crisis-continue-btn"
                            onClick={() => setShowCrisisModal(false)}
                        >
                            {t('我知道了，繼續覺察')}
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                .check-in-flow { width: 100%; position: relative; }

                .quick-entry-buttons {
                    display: grid;
                    grid-template-columns: ${isParentRole ? '1fr 1fr' : '1fr'};
                    gap: var(--s-3);
                    margin-bottom: var(--s-6);
                }
                .quick-entry-btn {
                    display: flex;
                    align-items: center;
                    gap: var(--s-3);
                    padding: var(--s-4);
                    background: var(--bg-secondary);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-md);
                    cursor: pointer;
                    transition: var(--transition-luxe);
                    text-align: left;
                }
                .quick-entry-btn:hover {
                    border-color: hsla(0,0%,100%,0.2);
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-sm);
                }
                .quick-entry-btn.parent-entry {
                    border-color: hsla(0, 50%, 60%, 0.2);
                }
                .quick-entry-btn.parent-entry:hover {
                    border-color: hsla(0, 50%, 60%, 0.4);
                }
                .qe-icon {
                    font-size: 1.4rem;
                    flex-shrink: 0;
                }
                .qe-text {
                    display: flex;
                    flex-direction: column;
                }
                .qe-title {
                    font-weight: 700;
                    font-size: 0.85rem;
                    color: var(--text-primary);
                }
                .qe-desc {
                    font-size: 0.7rem;
                    color: var(--text-secondary);
                }
                
                .flow-content-wrapper { position: relative; min-height: 450px; }
                .fade-slide-in { animation: fadeSlideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(20px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                .summary-card, .neuro-check-card { 
                    text-align: center; padding: var(--s-12) var(--s-8); 
                    background: var(--bg-secondary); border-radius: var(--radius-luxe); 
                    border: 1px solid var(--glass-border); box-shadow: var(--shadow-luxe); 
                    position: relative; overflow: hidden;
                }
                .summary-card::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at top right, hsla(0,0%,100%,0.03), transparent); pointer-events: none; }
                .summary-icon { 
                    width: 80px; 
                    height: 80px; 
                    margin: 0 auto var(--s-4); 
                    color: var(--text-primary); 
                    opacity: 0.8;
                    filter: drop-shadow(0 0 20px rgba(255,255,255,0.2)); 
                }
                .summary-icon svg { width: 100%; height: 100%; }
                .summary-icon.celebration-bounce { animation: celebrationBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                
                @keyframes celebrationBounce {
                    0% { transform: scale(0.5); opacity: 0; }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); opacity: 0.8; }
                }

                /* Confetti celebration */
                .confetti-container {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 0;
                    height: 0;
                    pointer-events: none;
                    z-index: 10;
                }
                .confetti-piece {
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    background: var(--color);
                    border-radius: 2px;
                    animation: confettiBurst 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
                    animation-delay: var(--delay);
                    opacity: 0;
                }
                @keyframes confettiBurst {
                    0% { 
                        transform: translate(0, 0) rotate(0deg) scale(0); 
                        opacity: 1; 
                    }
                    20% { 
                        opacity: 1; 
                        transform: translate(var(--x), -80px) rotate(180deg) scale(1); 
                    }
                    100% { 
                        opacity: 0; 
                        transform: translate(var(--x), 40px) rotate(var(--rotation)) scale(0.5); 
                    }
                }
                .summary-desc { color: var(--text-secondary); margin-bottom: var(--s-10); font-size: 1.05rem; line-height: 1.6; }

                .ruler-checklist { text-align: left; display: flex; flex-direction: column; gap: var(--s-4); margin-bottom: var(--s-10); }
                .checklist-item { display: flex; align-items: center; gap: var(--s-4); font-size: 0.95rem; font-weight: 500; }
                .step-tag { 
                    width: 28px; height: 28px; border-radius: 50%; display: flex; 
                    align-items: center; justify-content: center; font-size: 0.75rem; 
                    font-weight: 800; color: #1a1a1a; flex-shrink: 0;
                }
                .step-tag.r { background: var(--color-red); }
                .step-tag.l { background: var(--color-yellow); }
                .step-tag.u { background: var(--color-blue); }
                .step-tag.e { background: var(--color-yellow); }
                .step-tag.r2 { background: var(--color-green); }

                .mood-shift-options { display: flex; flex-wrap: wrap; gap: var(--s-3); justify-content: center; margin-bottom: var(--s-10); }
                .option-chip { 
                    padding: var(--s-2) var(--s-5); background: var(--glass-bg); 
                    border: 1px solid var(--glass-border); border-radius: 30px; 
                    color: var(--text-secondary); cursor: pointer; transition: var(--transition-luxe);
                    font-size: 0.9rem; font-weight: 500;
                }
                .option-chip:hover { border-color: hsla(0,0%,100%,0.2); color: var(--text-primary); }
                .option-chip.active { background: var(--text-primary); color: var(--bg-color); font-weight: 700; box-shadow: var(--shadow-sm); }

                .physical-context-collect {
                    margin: var(--s-8) 0;
                    padding: var(--s-4);
                    background: rgba(0,0,0,0.1);
                    border-radius: var(--radius-md);
                    display: flex;
                    flex-direction: column;
                    gap: var(--s-4);
                }
                .collect-item { text-align: left; }
                .collect-item label { font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 4px; }
                .collect-item input[type=range] { width: 100%; accent-color: var(--color-yellow); }

                .morandi-main-btn { 
                    width: 100%; padding: var(--s-4); background: var(--text-primary); 
                    color: var(--bg-color); border: none; border-radius: var(--radius-md); 
                    font-weight: 800; cursor: pointer; transition: var(--transition-luxe);
                    letter-spacing: 1px;
                }
                .morandi-main-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: var(--shadow-luxe); filter: brightness(1.1); }
                .morandi-main-btn:disabled { opacity: 0.15; filter: grayscale(1); }

                .morandi-outline-btn { 
                    background: transparent; border: 1px solid var(--glass-border); 
                    color: var(--text-secondary); padding: var(--s-2) var(--s-6); 
                    border-radius: 30px; cursor: pointer; margin-bottom: var(--s-4);
                    transition: var(--transition-luxe); font-size: 0.9rem; font-weight: 600;
                }
                .morandi-outline-btn:hover { border-color: var(--text-primary); color: var(--text-primary); }

                /* Quick Regulate Section */
                .quick-regulate-section {
                    margin-top: var(--s-6);
                    padding: var(--s-6);
                    background: hsla(0,0%,100%,0.02);
                    border-radius: var(--radius-md);
                    border: 1px dashed var(--glass-border);
                    text-align: center;
                }
                .quick-regulate-title {
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                    margin-bottom: var(--s-4);
                }
                .quick-regulate-chips {
                    display: flex;
                    flex-wrap: wrap;
                    gap: var(--s-2);
                    justify-content: center;
                    margin-bottom: var(--s-6);
                }
                .regulate-chip {
                    padding: var(--s-2) var(--s-4);
                    background: var(--glass-bg);
                    border: 1px solid var(--glass-border);
                    border-radius: 20px;
                    font-size: 0.85rem;
                    color: var(--text-primary);
                    cursor: default;
                    transition: var(--transition-luxe);
                }
                .regulate-chip:hover {
                    background: var(--glass-border);
                    transform: translateY(-2px);
                }

                /* Resume Prompt */
                .resume-prompt-overlay { position: absolute; inset: 0; background: hsla(0, 0%, 10%, 0.8); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: var(--s-6); backdrop-filter: var(--glass-blur); }
                .resume-card { 
                    background: var(--bg-secondary); border: 1px solid var(--glass-border); 
                    padding: var(--s-10) var(--s-8); border-radius: var(--radius-luxe); 
                    text-align: center; width: 100%; max-width: 360px;
                    box-shadow: var(--shadow-luxe);
                }
                .resume-card h3 { font-size: 1.4rem; font-weight: 800; margin-bottom: var(--s-2); }
                .resume-card p { color: var(--text-secondary); margin-bottom: var(--s-8); font-size: 0.95rem; line-height: 1.5; }
                .resume-actions { display: flex; flex-direction: column; gap: var(--s-3); }
 
                /* Crisis Modal */
                .crisis-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: hsla(0, 0%, 5%, 0.88);
                    backdrop-filter: blur(12px);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: var(--s-6);
                }
                .crisis-modal {
                    background: var(--bg-secondary);
                    border: 1px solid hsla(30, 50%, 60%, 0.3);
                    border-radius: var(--radius-luxe);
                    padding: var(--s-8) var(--s-6);
                    max-width: 380px;
                    width: 100%;
                    text-align: center;
                    box-shadow: 0 0 60px hsla(30, 50%, 60%, 0.1);
                }
                .crisis-icon { font-size: 3rem; margin-bottom: var(--s-4); }
                .crisis-modal h3 {
                    font-size: 1.4rem;
                    font-weight: 800;
                    margin-bottom: var(--s-3);
                }
                .crisis-modal p {
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    line-height: 1.7;
                    margin-bottom: var(--s-6);
                }
                .crisis-hotlines {
                    display: flex;
                    flex-direction: column;
                    gap: var(--s-3);
                    margin-bottom: var(--s-6);
                }
                .crisis-hotline-btn {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: var(--s-4) var(--s-5);
                    background: hsla(30, 50%, 60%, 0.1);
                    border: 1px solid hsla(30, 50%, 60%, 0.25);
                    border-radius: var(--radius-md);
                    text-decoration: none;
                    color: var(--text-primary);
                    font-size: 1rem;
                    font-weight: 600;
                    transition: var(--transition);
                }
                .crisis-hotline-btn:hover {
                    background: hsla(30, 50%, 60%, 0.2);
                    transform: translateY(-2px);
                }
                .crisis-hotline-btn span {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    font-weight: 400;
                }
                .crisis-continue-btn {
                    width: 100%;
                    padding: var(--s-3);
                    background: transparent;
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-md);
                    color: var(--text-secondary);
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: var(--transition);
                }
                .crisis-continue-btn:hover {
                    color: var(--text-primary);
                    border-color: var(--text-secondary);
                }

                /* Centering State */
                .centering-state { height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: var(--s-8); }
                .centering-circle { 
                    width: 100px; height: 100px; border-radius: 50%; 
                    filter: blur(30px); opacity: 0.5; 
                    animation: breatheLuxe 3s cubic-bezier(0.4, 0, 0.2, 1) infinite; 
                }
                @keyframes breatheLuxe {
                    0%, 100% { transform: scale(1); opacity: 0.3; }
                    50% { transform: scale(1.8); opacity: 0.7; }
                }
                .centering-state h2 { font-size: 1.8rem; font-weight: 800; letter-spacing: -0.5px; opacity: 0.9; }
                .centering-state p { color: var(--text-secondary); font-size: 1rem; line-height: 1.8; opacity: 0.7; }
            `}</style>
        </div>
    );
};

export default CheckInFlow;
