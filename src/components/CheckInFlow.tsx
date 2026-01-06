import React from 'react';
import MoodMeter from './MoodMeter';
import EmotionGrid from './EmotionGrid';
import BodyScan from './BodyScan';
import UnderstandingStep from './UnderstandingStep';
import ExpressingStep from './ExpressingStep';
import RegulatingStep from './RegulatingStep';
import RulerProgress from './RulerProgress';
import { useRulerFlow } from '../hooks/useRulerFlow';
import { useLanguage } from '../services/LanguageContext';
import { uiIcons } from './icons/SvgIcons';

const CheckInFlow: React.FC = () => {
    const { t } = useLanguage();
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

    return (
        <div className="check-in-flow fade-in">
            {step !== 'summary' && !showResumePrompt && (
                <RulerProgress
                    currentStep={step}
                    isFullFlow={isFullFlow}
                    selectedQuadrant={selectedQuadrants[0]} // Use first as primary for progress colors
                />
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

                {step === 'recognizing' && (
                    <MoodMeter
                        onSelectQuadrant={(q) => handleMoodComplete([q], 5)}
                    />
                )}

                {step === 'centering' && selectedQuadrants.length > 0 && (
                    <div className="centering-state">
                        <div className="centering-circle" style={{ backgroundColor: `var(--color-${selectedQuadrants[0]})` }}></div>
                        <h2>{t('沉靜，並感受...')}</h2>
                        <p>{t('閉上雙眼，深呼吸一次。')}<br />{t('捕捉身體當下的細微信號。')}</p>
                    </div>
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
                        onSelectEmotions={handleEmotionSelect}
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
                    <div className="neuro-check-card">
                        <div className="summary-icon">{uiIcons.brain}</div>
                        <h2>{t('調節後的感覺？')}</h2>
                        <p className="summary-desc">{t('觀察一下現在的內在狀態是否有微小的變化？')}</p>

                        <div className="mood-shift-options">
                            {['感覺輕鬆多了', '平靜了一些', '依然差不多', '產生了新思緒'].map(option => (
                                <button
                                    key={option}
                                    className={`option-chip ${postRegulationMood === option ? 'active' : ''}`}
                                    onClick={() => setPostRegulationMood(option)}
                                >
                                    {t(option)}
                                </button>
                            ))}
                        </div>

                        <button
                            className="morandi-main-btn"
                            disabled={!postRegulationMood}
                            onClick={handleNeuroCheckComplete}
                        >
                            {t('完成調節')}
                        </button>
                    </div>
                )}

                {step === 'summary' && selectedEmotions.length > 0 && (
                    <div className="summary-card">
                        {/* Confetti celebration */}
                        <div className="confetti-container">
                            {[...Array(12)].map((_, i) => (
                                <div
                                    key={i}
                                    className="confetti-piece"
                                    style={{
                                        '--delay': `${i * 0.1}s`,
                                        '--x': `${(Math.random() - 0.5) * 200}px`,
                                        '--rotation': `${Math.random() * 360}deg`,
                                        '--color': ['var(--color-red)', 'var(--color-yellow)', 'var(--color-blue)', 'var(--color-green)'][i % 4]
                                    } as React.CSSProperties}
                                />
                            ))}
                        </div>
                        <div className="summary-icon celebration-bounce">{uiIcons.sparkle}</div>
                        <h2>{t('覺察之旅完成')}</h2>

                        <div className="ruler-checklist">
                            <div className="checklist-item done">
                                <span className="step-tag r">R</span>
                                <span>{t('成功辨識情緒能量')}</span>
                            </div>
                            <div className="checklist-item done">
                                <span className="step-tag l">L</span>
                                <span>{t('標記情緒：')}<b>{selectedEmotions.map(e => t(e.name)).join('、')}</b></span>
                            </div>
                            {isFullFlow && (
                                <>
                                    <div className="checklist-item done">
                                        <span className="step-tag u">U</span>
                                        <span>{t('理清觸發因素')}</span>
                                    </div>
                                    <div className="checklist-item done">
                                        <span className="step-tag e">E</span>
                                        <span>{t('完成情感表達')}</span>
                                    </div>
                                    <div className="checklist-item done">
                                        <span className="step-tag r2">R</span>
                                        <span>{t('執行調節策略')}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {!isFullFlow && (
                            <div className="quick-regulate-section">
                                <p className="quick-regulate-title">{t('💡 想試試快速調節嗎？')}</p>
                                <div className="quick-regulate-chips">
                                    {selectedEmotions[0].quadrant === 'red' && (
                                        <>
                                            <span className="regulate-chip">{t('🧘 深呼吸練習')}</span>
                                            <span className="regulate-chip">{t('🖐️ 五感接地')}</span>
                                        </>
                                    )}
                                    {selectedEmotions[0].quadrant === 'yellow' && (
                                        <>
                                            <span className="regulate-chip">{t('🙏 感恩清單')}</span>
                                            <span className="regulate-chip">{t('💃 放首歌動一動')}</span>
                                        </>
                                    )}
                                    {selectedEmotions[0].quadrant === 'blue' && (
                                        <>
                                            <span className="regulate-chip">{t('☕ 泡杯熱飲')}</span>
                                            <span className="regulate-chip">{t('💕 對自己說句好話')}</span>
                                        </>
                                    )}
                                    {selectedEmotions[0].quadrant === 'green' && (
                                        <>
                                            <span className="regulate-chip">{t('🧘 三分鐘靜坐')}</span>
                                            <span className="regulate-chip">{t('📖 讀一段文字')}</span>
                                        </>
                                    )}
                                </div>
                                <button className="morandi-outline-btn" onClick={() => { setIsFullFlow(true); setStep('understanding'); }}>
                                    {t('開啟完整 RULER 探索')}
                                </button>
                            </div>
                        )}

                        <button className="morandi-main-btn" onClick={resetFlow}>{t('返回')}</button>
                    </div>
                )}
            </div>

            <style>{`
                .check-in-flow { width: 100%; position: relative; }
                
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
