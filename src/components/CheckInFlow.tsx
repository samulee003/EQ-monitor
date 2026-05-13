import React, { useState } from 'react';
import MoodMeter from './MoodMeter';
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
import QuickStats from './QuickStats';
import QuickCheckIn, { type QuickCheckInData } from './QuickCheckIn';
import ParentScenarios from './ParentScenarios';
import { useRulerFlow } from '../hooks/useRulerFlow';
import { useLanguage } from '../services/LanguageContext';
import { type Emotion } from '../data/emotionData';
import { dataAdapter, settingsStore } from '../adapters';
import { logger } from '../utils/logger';
import { type RulerLogEntry } from '../types/RulerTypes';

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
    const isParentRole = settingsStore.getUserRole() === 'parent';
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

    const navigateToHistory = () => {
        if (typeof window !== 'undefined') {
            window.location.hash = 'history';
        }
    };

    const handleQuickComplete = async (data: QuickCheckInData) => {
        const quickLog: Omit<RulerLogEntry, 'id'> = {
            emotions: [{
                id: data.emotion.id,
                name: data.emotion.name,
                quadrant: data.emotion.quadrant,
                energy: data.emotion.energy ?? 3,
                pleasantness: data.emotion.pleasantness ?? 3,
            }],
            intensity: data.intensity,
            bodyScan: null,
            understanding: {
                trigger: data.scenarioTag || '',
                what: data.scenarioTag || '',
                who: '',
                where: '',
                need: null,
                message: '',
            },
            expressing: data.note ? {
                expression: data.note,
                prompt: '快速紀錄',
                mode: 'quick',
            } : null,
            regulating: null,
            postMood: '',
            timestamp: data.timestamp,
            isFullFlow: false,
        };

        try {
            await dataAdapter.logs.create(quickLog);
        } catch (error) {
            logger.error('[CheckInFlow] Quick check-in save failed', { error: String(error) });
        } finally {
            setQuickMode(null);
            await resetFlow();
        }
    };

    return (
        <div className="check-in-flow fade-in">
            {/* Quick mode views */}
            {quickMode === 'quick' && (
                <QuickCheckIn
                    onComplete={handleQuickComplete}
                    onCancel={() => setQuickMode(null)}
                />
            )}
            {quickMode === 'parent' && (
                <ParentScenarios onDismiss={() => setQuickMode(null)} />
            )}

            {/* Show QuickStats + Quick Entry Buttons on home screen */}
            {!quickMode && step === 'recognizing' && !showResumePrompt && (
                <>
                    <section className="sanctuary-hero" aria-label={t('情緒檢測首頁')}>
                        <div className="sanctuary-orb sanctuary-orb-one" aria-hidden="true"></div>
                        <div className="sanctuary-orb sanctuary-orb-two" aria-hidden="true"></div>
                        <div className="sanctuary-hero-topline">
                            <div className="sanctuary-mark">今心</div>
                            <p className="sanctuary-kicker">{t('情緒檢測首頁')}</p>
                        </div>
                        <div className="sanctuary-copy">
                            <h1>{t('現在的你，感覺如何？')}</h1>
                            <p>{t('撥開思緒的雲霧，聽聽心底的聲音。')}</p>
                        </div>
                        <div className="sanctuary-pulse-grid" aria-hidden="true">
                            <div className="sanctuary-pulse-card pulse-red">
                                <span>{t('高能量')}</span>
                                <strong>{t('低愉悅')}</strong>
                            </div>
                            <div className="sanctuary-pulse-card pulse-yellow">
                                <span>{t('高能量')}</span>
                                <strong>{t('高愉悅')}</strong>
                            </div>
                            <div className="sanctuary-pulse-card pulse-blue">
                                <span>{t('低能量')}</span>
                                <strong>{t('低愉悅')}</strong>
                            </div>
                            <div className="sanctuary-pulse-card pulse-green">
                                <span>{t('低能量')}</span>
                                <strong>{t('高愉悅')}</strong>
                            </div>
                        </div>
                        <div className="sanctuary-actions">
                            <button type="button" onClick={() => setQuickMode('quick')}>
                                <span className="action-icon">記</span>
                                <span className="action-copy">
                                    <strong>{t('快速紀錄')}</strong>
                                    <small>{t('60 秒內完成')}</small>
                                </span>
                            </button>
                            <button type="button" onClick={navigateToHistory}>
                                <span className="action-icon">史</span>
                                <span className="action-copy">
                                    <strong>{t('歷史紀錄')}</strong>
                                    <small>{t('回看今天與最近變化')}</small>
                                </span>
                            </button>
                        </div>
                    </section>
                    <section className="stitch-panel stats-panel" aria-label={t('快速統計')}>
                        <div className="panel-heading">
                            <p>{t('快速統計')}</p>
                            <span>{t('從日常累積裡看見自己')}</span>
                        </div>
                        <QuickStats />
                    </section>
                    <section className="stitch-panel quick-entry-panel" aria-label={t('快速入口')}>
                        <div className="panel-heading">
                            <p>{t('快速入口')}</p>
                            <span>{t('你可以直接開始短版紀錄，或切換到親職支援')}</span>
                        </div>
                        <div className={`quick-entry-buttons${isParentRole ? ' is-parent' : ''}`}>
                        <button className="quick-entry-btn" onClick={() => setQuickMode('quick')}>
                            <span className="qe-icon">記</span>
                            <div className="qe-text">
                                <span className="qe-title">{t('快速記錄')}</span>
                                <span className="qe-desc">{t('< 60 秒完成')}</span>
                            </div>
                        </button>
                        {isParentRole && (
                            <button className="quick-entry-btn parent-entry" onClick={() => setQuickMode('parent')}>
                                <span className="qe-icon">親</span>
                                <div className="qe-text">
                                    <span className="qe-title">{t('親職支援')}</span>
                                    <span className="qe-desc">{t('即時行動指引')}</span>
                                </div>
                            </button>
                        )}
                        </div>
                    </section>
                </>
            )}

            {!quickMode && step !== 'summary' && !showResumePrompt && (
                <div className="stitch-progress-shell">
                    <RulerProgress
                        currentStep={step}
                        isFullFlow={isFullFlow}
                        selectedQuadrant={selectedQuadrants[0] || undefined}
                    />
                </div>
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

                <div className={`ruler-stage-shell${step === 'recognizing' ? ' is-home-stage' : ''}`}>
                    <div className="ruler-stage-backdrop" aria-hidden="true"></div>
                    <div className="ruler-stage-frame">
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
                    </div>
                </div>
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

        </div>
    );
};

export default CheckInFlow;
