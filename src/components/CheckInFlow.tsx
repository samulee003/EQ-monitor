import React from 'react';
import MoodMeter from './MoodMeter';
import EmotionGrid from './EmotionGrid';
import BodyScan from './BodyScan';
import UnderstandingStep from './UnderstandingStep';
import ExpressingStep from './ExpressingStep';
import RegulatingStep from './RegulatingStep';
import { useRulerFlow, steps } from '../hooks/useRulerFlow';
import { uiIcons } from './icons/SvgIcons';

const CheckInFlow: React.FC = () => {
    const {
        step,
        selectedQuadrant,
        selectedEmotion,
        showResumePrompt,
        isFullFlow,
        postRegulationMood,
        currentStepIndex,
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
            {step !== 'summary' && isFullFlow && (
                <div className="progress-container">
                    {steps.map((s, i) => (
                        <div key={s.key} className={`progress-point ${i <= currentStepIndex ? 'active' : ''} ${i === currentStepIndex ? 'current' : ''}`}>
                            <div className="point-circle">{s.letter}</div>
                            <span className="point-label">{s.label}</span>
                        </div>
                    ))}
                    <div className="progress-line-bg"></div>
                    <div className="progress-line-active" style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}></div>
                </div>
            )}

            <div key={step} className="flow-content-wrapper fade-slide-in">
                {showResumePrompt && (
                    <div className="resume-prompt-overlay fade-in">
                        <div className="resume-card">
                            <h3>繼續之前的旅程？</h3>
                            <p>我們為你保留了上一次的覺察進度。</p>
                            <div className="resume-actions">
                                <button className="morandi-main-btn" onClick={resumeDraft}>繼續</button>
                                <button className="morandi-outline-btn" onClick={() => { setShowResumePrompt(false); resetFlow(); }}>重新開始</button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'recognizing' && (
                    <MoodMeter
                        onSelectQuadrant={(q) => handleMoodComplete(q, 5)}
                    />
                )}

                {step === 'centering' && selectedQuadrant && (
                    <div className="centering-state">
                        <div className="centering-circle" style={{ backgroundColor: `var(--color-${selectedQuadrant})` }}></div>
                        <h2>沉靜，並感受...</h2>
                        <p>閉上雙眼，深呼吸一次。<br />捕捉身體當下的細微信號。</p>
                    </div>
                )}

                {step === 'bodyScan' && selectedQuadrant && (
                    <BodyScan
                        quadrant={selectedQuadrant}
                        onComplete={handleBodyScanComplete}
                        onBack={() => setStep('recognizing')}
                    />
                )}

                {step === 'labeling' && selectedQuadrant && (
                    <EmotionGrid
                        quadrant={selectedQuadrant}
                        onSelectEmotion={handleEmotionSelect}
                        onBack={() => setStep('bodyScan')}
                    />
                )}

                {step === 'understanding' && selectedEmotion && (
                    <UnderstandingStep
                        emotion={selectedEmotion}
                        onComplete={handleUnderstandingComplete}
                        onBack={() => setStep('labeling')}
                    />
                )}

                {step === 'expressing' && selectedEmotion && (
                    <ExpressingStep
                        emotion={selectedEmotion}
                        onComplete={handleExpressingComplete}
                        onBack={() => setStep('understanding')}
                    />
                )}

                {step === 'regulating' && selectedEmotion && (
                    <RegulatingStep
                        emotion={selectedEmotion}
                        onComplete={handleRegulatingComplete}
                        onBack={() => setStep('expressing')}
                    />
                )}
                {step === 'neuroCheck' && (
                    <div className="neuro-check-card">
                        <div className="summary-icon">{uiIcons.brain}</div>
                        <h2>調節後的感覺？</h2>
                        <p className="summary-desc">觀察一下現在的內在狀態是否有微小的變化？</p>

                        <div className="mood-shift-options">
                            {['感覺輕鬆多了', '平靜了一些', '依然差不多', '產生了新思緒'].map(option => (
                                <button
                                    key={option}
                                    className={`option-chip ${postRegulationMood === option ? 'active' : ''}`}
                                    onClick={() => setPostRegulationMood(option)}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>

                        <button
                            className="morandi-main-btn"
                            disabled={!postRegulationMood}
                            onClick={handleNeuroCheckComplete}
                        >
                            完成調節
                        </button>
                    </div>
                )}

                {step === 'summary' && selectedEmotion && (
                    <div className="summary-card">
                        <div className="summary-icon">{uiIcons.sparkle}</div>
                        <h2>覺察之旅完成</h2>
                        <p className="summary-desc">
                            感謝你與自己的 <span style={{ color: `var(--color-${selectedEmotion.quadrant})`, fontWeight: 600 }}>{selectedEmotion.name}</span> 對話。
                        </p>

                        <div className="ruler-checklist">
                            <div className="checklist-item done">
                                <span className="step-tag r">R</span>
                                <span>成功辨識情緒能量</span>
                            </div>
                            <div className="checklist-item done">
                                <span className="step-tag l">L</span>
                                <span>標記情緒：<b>{selectedEmotion.name}</b></span>
                            </div>
                            {isFullFlow && (
                                <>
                                    <div className="checklist-item done">
                                        <span className="step-tag u">U</span>
                                        <span>理清觸發因素</span>
                                    </div>
                                    <div className="checklist-item done">
                                        <span className="step-tag e">E</span>
                                        <span>完成情感表達</span>
                                    </div>
                                    <div className="checklist-item done">
                                        <span className="step-tag r2">R</span>
                                        <span>執行調節策略</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {!isFullFlow && (
                            <div className="deep-check-in-promo">
                                <button className="morandi-outline-btn" onClick={() => { setIsFullFlow(true); setStep('understanding'); }}>
                                    開啟更深層 RULER 探索
                                </button>
                            </div>
                        )}

                        <button className="morandi-main-btn" onClick={resetFlow}>返回</button>
                    </div>
                )}
            </div>

            <style>{`
                .check-in-flow { width: 100%; position: relative; }
                
                .progress-container { display: flex; justify-content: space-between; position: relative; margin-bottom: var(--s-12); }
                .progress-point { display: flex; flex-direction: column; align-items: center; gap: var(--s-2); z-index: 2; opacity: 0.3; transition: var(--transition-luxe); }
                .progress-point.active { opacity: 1; }
                .point-circle { width: 32px; height: 32px; border-radius: 50%; background: var(--bg-secondary); border: 1px solid var(--glass-border); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; backdrop-filter: var(--glass-blur); }
                .progress-point.current .point-circle { background: var(--text-primary); color: var(--bg-color); transform: scale(1.2); box-shadow: var(--shadow-luxe); }
                .point-label { font-size: 0.65rem; color: var(--text-secondary); font-weight: 600; letter-spacing: 1px; }
                
                .progress-line-bg { position: absolute; top: 16px; left: 0; right: 0; height: 1px; background: var(--glass-border); z-index: 1; }
                .progress-line-active { position: absolute; top: 16px; left: 0; height: 1px; background: var(--text-secondary); z-index: 1; transition: 1s cubic-bezier(0.16, 1, 0.3, 1); }

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
