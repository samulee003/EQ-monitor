import React, { useState } from 'react';
import { Quadrant } from '../data/emotionData';

interface BodyScanProps {
    quadrant: Quadrant;
    onComplete: (data: { location: string; sensation: string }) => void;
    onBack: () => void;
}

const bodyLocations = [
    { id: 'head', label: '頭部', icon: '🧠' },
    { id: 'throat', label: '喉嚨', icon: '🗣️' },
    { id: 'chest', label: '胸口', icon: '🫁' },
    { id: 'stomach', label: '腹部', icon: '🔋' },
    { id: 'shoulders', label: '肩膀', icon: '💪' },
    { id: 'whole', label: '全身', icon: '🧘' },
];

const sensationsByQuadrant: Record<Quadrant, { label: string; icon: string }[]> = {
    red: [
        { label: '緊繃', icon: '⚡' },
        { label: '灼熱', icon: '🔥' },
        { label: '心跳加速', icon: '💓' },
        { label: '屏息', icon: '💨' },
    ],
    yellow: [
        { label: '輕盈', icon: '🎈' },
        { label: '溫暖', icon: '☀️' },
        { label: '充滿能量', icon: '🔋' },
        { label: '震動', icon: '✨' },
    ],
    blue: [
        { label: '沉重', icon: '🌑' },
        { label: '冰冷', icon: '❄️' },
        { label: '空洞', icon: '🕳️' },
        { label: '疲軟', icon: '🥀' },
    ],
    green: [
        { label: '放鬆', icon: '🍃' },
        { label: '平穩', icon: '🌊' },
        { label: '沉靜', icon: '🧘' },
        { label: '通暢', icon: '🌬️' },
    ],
};

const BodyScan: React.FC<BodyScanProps> = ({ quadrant, onComplete, onBack }) => {
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
    const [selectedSensation, setSelectedSensation] = useState<string | null>(null);

    const sensations = sensationsByQuadrant[quadrant];

    return (
        <div className="body-scan-step fade-in">
            <div className="step-header">
                <button className="nav-btn" onClick={onBack}>← 返回</button>
                <div className="step-label-container">
                    <span className="step-title">Recognizing 體感掃描</span>
                </div>
            </div>

            <div className="section-intro">
                <h2>感受你的身體</h2>
                <p>情緒通常會先反映在生理上。試著掃描一下，你感覺到了什麼？</p>
            </div>

            <div className="scan-content">
                <div className="scan-section">
                    <label className="heading-sm">1. 感覺最明顯的部位</label>
                    <div className="location-grid">
                        {bodyLocations.map(loc => (
                            <button
                                key={loc.id}
                                className={`location-btn ${selectedLocation === loc.label ? 'active' : ''}`}
                                onClick={() => setSelectedLocation(loc.label)}
                            >
                                <span className="loc-icon">{loc.icon}</span>
                                <span className="loc-label">{loc.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="scan-section">
                    <label className="heading-sm">2. 那種感覺像是...</label>
                    <div className="sensation-grid">
                        {sensations.map(sens => (
                            <button
                                key={sens.label}
                                className={`sensation-btn ${selectedSensation === sens.label ? 'active' : ''}`}
                                onClick={() => setSelectedSensation(sens.label)}
                            >
                                <span className="sens-icon">{sens.icon}</span>
                                <span className="sens-label">{sens.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <button
                className="morandi-main-btn"
                disabled={!selectedLocation || !selectedSensation}
                onClick={() => onComplete({ location: selectedLocation!, sensation: selectedSensation! })}
            >
                進入情緒標記
            </button>

            <style>{`
                .body-scan-step { display: flex; flex-direction: column; gap: 2rem; }
                .step-header { display: flex; justify-content: space-between; align-items: center; }
                .step-label-container { font-size: 0.85rem; color: var(--text-secondary); background: var(--glass-bg); padding: 0.4rem 0.8rem; border-radius: 20px; }
                
                .section-intro h2 { font-size: 1.5rem; margin-bottom: 0.5rem; }
                .section-intro p { color: var(--text-secondary); font-size: 0.9rem; }

                .scan-content { display: flex; flex-direction: column; gap: 2rem; }
                .scan-section { display: flex; flex-direction: column; gap: 1rem; }

                .location-grid, .sensation-grid { 
                    display: grid; 
                    grid-template-columns: repeat(3, 1fr); 
                    gap: 12px; 
                }

                .location-btn, .sensation-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    padding: 1rem 0.5rem;
                    background: var(--bg-secondary);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-md);
                    cursor: pointer;
                    transition: var(--transition);
                }

                .location-btn.active, .sensation-btn.active {
                    background: var(--text-primary);
                    color: var(--bg-color);
                    border-color: var(--text-primary);
                    transform: translateY(-4px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }

                .loc-icon, .sens-icon { font-size: 1.4rem; }
                .loc-label, .sens-label { font-size: 0.85rem; font-weight: 500; }

                .morandi-main-btn { 
                    width: 100%; padding: 1.25rem; background: var(--text-primary); 
                    color: var(--bg-color); font-weight: 700; border: none; 
                    border-radius: var(--radius-md); cursor: pointer; transition: var(--transition);
                }
                .morandi-main-btn:disabled { opacity: 0.3; cursor: not-allowed; }
            `}</style>
        </div>
    );
};

export default BodyScan;
