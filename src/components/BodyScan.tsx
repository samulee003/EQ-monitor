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
        { label: '喉嚨緊縮', icon: '🧣' },
        { label: '胸口堵塞', icon: '🧱' },
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

    // Update aura color on mount
    React.useEffect(() => {
        const colors = {
            red: '#C58B8A',
            yellow: '#D5C1A5',
            blue: '#97A6B4',
            green: '#AAB09B'
        };
        document.documentElement.style.setProperty('--aura-color', `${colors[quadrant]}33`);
    }, [quadrant]);

    return (
        <div className="body-scan-step fade-in">
            <div className="step-header">
                <button className="nav-btn" onClick={onBack}>← 返回</button>
                <div className="step-label-container">
                    <span className="step-tag">Recognizing 體感掃描</span>
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
                                className={`scan-btn location-btn ${selectedLocation === loc.label ? 'active' : ''}`}
                                onClick={() => setSelectedLocation(loc.label)}
                            >
                                <div className="icon-wrapper">
                                    <span className="scan-icon">{loc.icon}</span>
                                </div>
                                <span className="scan-label">{loc.label}</span>
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
                                className={`scan-btn sensation-btn ${selectedSensation === sens.label ? 'active' : ''}`}
                                onClick={() => setSelectedSensation(sens.label)}
                            >
                                <div className="icon-wrapper">
                                    <span className="scan-icon">{sens.icon}</span>
                                </div>
                                <span className="scan-label">{sens.label}</span>
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
                .body-scan-step { display: flex; flex-direction: column; gap: var(--s-8); }
                .step-header { display: flex; justify-content: space-between; align-items: center; }
                .step-label-container { 
                    font-size: 0.7rem; font-weight: 800; letter-spacing: 1px;
                    color: var(--text-secondary); background: var(--glass-bg); 
                    padding: var(--s-1) var(--s-3); border-radius: 30px; 
                    border: 1px solid var(--glass-border); backdrop-filter: var(--glass-blur);
                    text-transform: uppercase;
                }
                
                .section-intro h2 { font-size: 1.8rem; font-weight: 800; margin-bottom: var(--s-2); letter-spacing: -0.5px; }
                .section-intro p { color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6; }

                .scan-content { display: flex; flex-direction: column; gap: var(--s-10); }
                .scan-section { display: flex; flex-direction: column; gap: var(--s-5); }
                .heading-sm { font-size: 0.9rem; font-weight: 700; color: var(--text-secondary); opacity: 0.8; letter-spacing: 0.5px; }

                /* 2-Column Grid for more breathing room */
                .location-grid, .sensation-grid { 
                    display: grid; 
                    grid-template-columns: repeat(2, 1fr); 
                    gap: var(--s-4); 
                }

                .scan-btn {
                    display: flex;
                    align-items: center;
                    gap: var(--s-6);
                    padding: var(--s-5) var(--s-6);
                    background: var(--glass-bg);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-md);
                    cursor: pointer;
                    transition: var(--transition-luxe);
                    backdrop-filter: var(--glass-blur);
                    color: var(--text-secondary);
                    text-align: left;
                    position: relative;
                    overflow: hidden;
                }

                .scan-btn:hover {
                    border-color: hsla(0, 0%, 100%, 0.2);
                    background: var(--glass-border);
                    transform: translateX(4px);
                    color: var(--text-primary);
                }

                .scan-btn.active {
                    background: hsla(0, 0%, 100%, 0.05);
                    color: var(--text-primary);
                    border-color: var(--text-primary);
                    box-shadow: 
                        var(--shadow-luxe),
                        inset 0 0 15px hsla(0, 0%, 100%, 0.05);
                    transform: translateX(6px) scale(1.02);
                }

                .icon-wrapper {
                    width: 44px;
                    height: 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: hsla(0, 0%, 100%, 0.03);
                    border-radius: 12px;
                    border: 1px solid var(--glass-border);
                    transition: var(--transition-luxe);
                }

                .scan-btn.active .icon-wrapper {
                    background: var(--text-primary);
                    border-color: var(--text-primary);
                }

                .scan-icon { 
                    font-size: 1.4rem; 
                    /* Advanced Morandi Filtering for Emojis */
                    filter: sepia(0.3) saturate(0.4) brightness(0.85);
                    opacity: 0.6;
                    transition: var(--transition-luxe);
                }
                
                .scan-btn:hover .scan-icon { opacity: 0.8; }

                .scan-btn.active .scan-icon {
                    filter: brightness(0) invert(1);
                    opacity: 1;
                    transform: scale(1.1);
                }

                .scan-label { 
                    font-size: 0.95rem; 
                    font-weight: 700; 
                    letter-spacing: 0.5px;
                }

                .morandi-main-btn { margin-top: var(--s-4); }
                .morandi-main-btn:disabled { 
                    opacity: 0.15; 
                    cursor: not-allowed; 
                    filter: grayscale(1);
                    transform: none;
                }
            `}</style>
        </div>
    );
};

export default BodyScan;
