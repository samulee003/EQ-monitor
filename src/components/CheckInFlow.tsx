import React, { useState } from 'react';
import MoodMeter from './MoodMeter';
import EmotionGrid from './EmotionGrid';
import UnderstandingStep from './UnderstandingStep';
import ExpressingStep from './ExpressingStep';
import RegulatingStep from './RegulatingStep';
import { Quadrant, Emotion } from '../data/emotionData';

type Step = 'recognizing' | 'labeling' | 'understanding' | 'expressing' | 'regulating' | 'neuroCheck' | 'summary';

const steps: { key: Step; label: string; letter: string }[] = [
    { key: 'recognizing', label: '辨別', letter: 'R' },
    { key: 'labeling', label: '標記', letter: 'L' },
    { key: 'understanding', label: '理解', letter: 'U' },
    { key: 'expressing', label: '表達', letter: 'E' },
    { key: 'regulating', label: '調節', letter: 'R' },
];

const CheckInFlow: React.FC = () => {
    const [step, setStep] = useState<Step>('recognizing');
    const [selectedQuadrant, setSelectedQuadrant] = useState<Quadrant | null>(null);
    const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
    const [emotionIntensity, setEmotionIntensity] = useState(5);
    const [understandingData, setUnderstandingData] = useState<any>(null);
    const [expressingData, setExpressingData] = useState<any>(null);
    const [regulatingData, setRegulatingData] = useState<any>(null);
    const [isFullFlow, setIsFullFlow] = useState(false);
    const [postRegulationMood, setPostRegulationMood] = useState<string>('');

    const currentStepIndex = steps.findIndex(s => s.key === step);

    // Load Draft on Mount
    React.useEffect(() => {
        const savedDraft = localStorage.getItem('ruler_draft');
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                setStep(draft.step || 'recognizing');
                setSelectedQuadrant(draft.selectedQuadrant || null);
                setSelectedEmotion(draft.selectedEmotion || null);
                setEmotionIntensity(draft.emotionIntensity || 5);
                setUnderstandingData(draft.understandingData || null);
                setExpressingData(draft.expressingData || null);
                setRegulatingData(draft.regulatingData || null);
                setIsFullFlow(draft.isFullFlow || false);
                setPostRegulationMood(draft.postRegulationMood || '');
            } catch (e) {
                console.error("Failed to load RULER draft", e);
            }
        }
    }, []);

    // Save Draft on Change
    React.useEffect(() => {
        if (step === 'summary') {
            localStorage.removeItem('ruler_draft');
        } else {
            const draft = {
                step,
                selectedQuadrant,
                selectedEmotion,
                emotionIntensity,
                understandingData,
                expressingData,
                regulatingData,
                isFullFlow,
                postRegulationMood
            };
            localStorage.setItem('ruler_draft', JSON.stringify(draft));
        }
    }, [step, selectedQuadrant, selectedEmotion, emotionIntensity, understandingData, expressingData, regulatingData, isFullFlow, postRegulationMood]);

    React.useEffect(() => {
        if (selectedQuadrant) {
            const colors: Record<Quadrant, string> = { red: '#C58B8A', yellow: '#D5C1A5', blue: '#97A6B4', green: '#AAB09B' };
            document.documentElement.style.setProperty('--aura-color', `${colors[selectedQuadrant]}44`);
        } else {
            document.documentElement.style.setProperty('--aura-color', 'transparent');
        }
    }, [selectedQuadrant]);

    const handleMoodComplete = (quadrant: Quadrant, intensity: number) => {
        setSelectedQuadrant(quadrant);
        setEmotionIntensity(intensity);
        setStep('labeling');
    };

    const handleEmotionSelect = (e: Emotion) => {
        setSelectedEmotion(e);
        if (isFullFlow) {
            setStep('understanding');
        } else {
            setStep('summary');
            saveData(e, null, null, null, '', emotionIntensity);
        }
    };

    const saveData = (emotion: Emotion | null, u: any, e: any, r: any, p: string = '', intensity: number = 5) => {
        const fullData = {
            emotion: emotion || selectedEmotion,
            intensity: intensity || emotionIntensity,
            understanding: u || understandingData,
            expressing: e || expressingData,
            regulating: r || regulatingData,
            postMood: p || postRegulationMood,
            timestamp: new Date().toISOString(),
        };

        const existing = JSON.parse(localStorage.getItem('feelings_logs') || '[]');
        localStorage.setItem('feelings_logs', JSON.stringify([fullData, ...existing]));
        localStorage.removeItem('ruler_draft');
    };

    const handleUnderstandingComplete = (data: any) => {
        setUnderstandingData(data);
        setStep('expressing');
    };

    const handleExpressingComplete = (data: any) => {
        setExpressingData(data);
        setStep('regulating');
    };

    const handleRegulatingComplete = (data: any) => {
        setRegulatingData(data);
        setStep('neuroCheck');
    };

    const handleNeuroCheckComplete = () => {
        saveData(null, null, null, regulatingData, postRegulationMood);
        setStep('summary');
    };

    const resetFlow = () => {
        localStorage.removeItem('ruler_draft');
        setStep('recognizing');
        setSelectedQuadrant(null);
        setSelectedEmotion(null);
        setUnderstandingData(null);
        setExpressingData(null);
        setRegulatingData(null);
        setPostRegulationMood('');
        setIsFullFlow(false);
    };

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
                {step === 'recognizing' && (
                    <MoodMeter
                        onSelectQuadrant={(q) => handleMoodComplete(q, 5)}
                    />
                )}

                {step === 'labeling' && selectedQuadrant && (
                    <EmotionGrid
                        quadrant={selectedQuadrant}
                        onSelectEmotion={handleEmotionSelect}
                        onBack={() => setStep('recognizing')}
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
                        <div className="summary-icon">🧠</div>
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
                        <div className="summary-icon">✨</div>
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
                
                .progress-container { display: flex; justify-content: space-between; position: relative; margin-bottom: 2rem; }
                .progress-point { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; z-index: 2; opacity: 0.3; transition: 0.3s; }
                .progress-point.active { opacity: 1; }
                .point-circle { width: 30px; height: 30px; border-radius: 50%; background: var(--bg-secondary); border: 1px solid var(--glass-border); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; }
                .progress-point.current .point-circle { background: var(--text-primary); color: var(--bg-color); transform: scale(1.1); }
                .point-label { font-size: 0.65rem; color: var(--text-secondary); }
                
                .progress-line-bg { position: absolute; top: 15px; left: 0; right: 0; height: 1px; background: var(--glass-border); z-index: 1; }
                .progress-line-active { position: absolute; top: 15px; left: 0; height: 1px; background: var(--text-secondary); z-index: 1; transition: 0.6s ease; }

                .flow-content-wrapper { position: relative; min-height: 400px; }
                .fade-slide-in { animation: fadeSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .summary-card, .neuro-check-card { text-align: center; padding: 2rem; background: var(--bg-secondary); border-radius: var(--radius-lg); border: 1px solid var(--glass-border); }
                .summary-icon { font-size: 3rem; margin-bottom: 1rem; }
                .summary-desc { color: var(--text-secondary); margin-bottom: 2rem; }

                .ruler-checklist { text-align: left; display: flex; flex-direction: column; gap: 0.8rem; margin-bottom: 2rem; }
                .checklist-item { display: flex; align-items: center; gap: 0.8rem; font-size: 0.9rem; }
                .step-tag { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 800; color: #1a1a1a; }
                .step-tag.r { background: var(--color-red); }
                .step-tag.l { background: var(--color-yellow); }
                .step-tag.u { background: var(--color-blue); }
                .step-tag.e { background: var(--color-yellow); }
                .step-tag.r2 { background: var(--color-green); }

                .mood-shift-options { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-bottom: 2rem; }
                .option-chip { padding: 0.6rem 1rem; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 20px; color: var(--text-primary); cursor: pointer; }
                .option-chip.active { background: var(--text-primary); color: var(--bg-color); }

                .morandi-main-btn { width: 100%; padding: 1rem; background: var(--text-primary); color: var(--bg-color); border: none; border-radius: var(--radius-md); font-weight: 700; cursor: pointer; }
                .morandi-outline-btn { background: transparent; border: 1px solid var(--text-primary); color: var(--text-primary); padding: 0.6rem 1.2rem; border-radius: 20px; cursor: pointer; margin-bottom: 1rem; }
            `}</style>
        </div>
    );
};

export default CheckInFlow;
