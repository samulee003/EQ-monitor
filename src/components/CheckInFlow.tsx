import React, { useState } from 'react';
import EmotionQuadrantPicker from './EmotionQuadrantPicker';
import EmotionGrid from './EmotionGrid';
import BodyScan from './BodyScan';
import UnderstandingStep from './UnderstandingStep';
import './CheckInFlow.css';
import ExpressingStep from './ExpressingStep';
import RegulatingStep from './RegulatingStep';
import RulerProgress from './RulerProgress';
import SummaryStep from './steps/SummaryStep';
import NeuroCheckStep from './steps/NeuroCheckStep';
import CenteringStep from './steps/CenteringStep';
import { useRulerFlow } from '../hooks/useRulerFlow';
import { useLanguage } from '../services/LanguageContext';
import { type Emotion } from '../data/emotionData';

// 高風險情緒 ID：選擇時提供安全資源
const HIGH_RISK_EMOTION_IDS = new Set([
    'hopeless', 'helpless', 'desolate',     // 絕望的、無望的、孤寂的
    'miserable', 'despondent', 'depressed',  // 悲慘的、消沈的、抑鬱的
    'enraged', 'furious', 'panicked',        // 憤怒的、暴怒的、驚惶失措的
]);

const CheckInFlow: React.FC = () => {
    const { t } = useLanguage();
    const [showCrisisModal, setShowCrisisModal] = useState(false);
    const {
        step,
        selectedQuadrants,
        selectedEmotions,
        showResumePrompt,
        isFullFlow,
        setStep,
        setIsFullFlow,
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
            {step !== 'recognizing' && step !== 'summary' && !showResumePrompt && (
                <div className="stitch-progress-shell">
                    <RulerProgress
                        currentStep={step}
                        isFullFlow={isFullFlow}
                        selectedQuadrant={selectedQuadrants[0] || undefined}
                    />
                </div>
            )}

            <div key={step} className="flow-content-wrapper fade-slide-in">
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

                <div className={`ruler-stage-shell${step === 'recognizing' ? ' is-home-stage' : ''}`}>
                    <div className="ruler-stage-backdrop" aria-hidden="true"></div>
                    <div className="ruler-stage-frame">
                        {step === 'recognizing' && (
                            <EmotionQuadrantPicker
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
                    </div>
                </div>
            </div>

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

        </div>
    );
};

export default CheckInFlow;
