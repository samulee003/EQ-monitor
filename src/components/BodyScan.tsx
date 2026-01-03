import React, { useState } from 'react';
import { Quadrant } from '../data/emotionData';

interface BodyScanProps {
    quadrant: Quadrant;
    onComplete: (data: { location: string; sensation: string }) => void;
    onBack: () => void;
}

// SVG Icon Components - Morandi-compatible monochrome icons
const icons = {
    head: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="10" r="6" />
            <path d="M8 16c0 2 1.5 4 4 4s4-2 4-4" />
            <circle cx="10" cy="9" r="0.5" fill="currentColor" />
            <circle cx="14" cy="9" r="0.5" fill="currentColor" />
        </svg>
    ),
    throat: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <ellipse cx="12" cy="12" rx="4" ry="6" />
            <path d="M10 9h4" />
            <path d="M10 12h4" />
            <path d="M10 15h4" />
        </svg>
    ),
    chest: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 4c-4 0-7 3-7 7 0 3 2 6 7 10 5-4 7-7 7-10 0-4-3-7-7-7z" />
            <path d="M12 8v4" />
            <path d="M10 10h4" />
        </svg>
    ),
    stomach: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <ellipse cx="12" cy="13" rx="6" ry="7" />
            <path d="M9 11c0-1 1.5-2 3-2s3 1 3 2" />
            <circle cx="12" cy="14" r="2" />
        </svg>
    ),
    shoulders: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 14c0-3 3-5 8-5s8 2 8 5" />
            <circle cx="12" cy="6" r="3" />
            <path d="M8 14v4" />
            <path d="M16 14v4" />
        </svg>
    ),
    whole: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="5" r="2.5" />
            <path d="M12 8v5" />
            <path d="M8 10l4 3 4-3" />
            <path d="M12 13l-3 7" />
            <path d="M12 13l3 7" />
        </svg>
    ),
    // Sensation icons
    tension: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 4v16" />
            <path d="M8 8l4-4 4 4" />
            <path d="M8 16l4 4 4-4" />
        </svg>
    ),
    heat: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 20c4 0 6-3 6-6 0-4-6-10-6-10S6 10 6 14c0 3 2 6 6 6z" />
            <path d="M12 16v-4" />
        </svg>
    ),
    heartbeat: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M3 12h4l2-4 4 8 2-4h6" />
        </svg>
    ),
    breathless: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 12h3c2 0 3-1 3-2s-1-2-3-2" />
            <path d="M4 16h5c2 0 3-1 3-2s-1-2-3-2" />
            <path d="M4 20h7c2 0 3-1 3-2s-1-2-3-2" />
        </svg>
    ),
    light: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v4" />
            <path d="M12 18v4" />
            <path d="M4.93 4.93l2.83 2.83" />
            <path d="M16.24 16.24l2.83 2.83" />
        </svg>
    ),
    warm: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="M4 12H2" />
            <path d="M22 12h-2" />
        </svg>
    ),
    energy: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
    ),
    vibrate: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="M5 8v8" />
            <path d="M19 8v8" />
            <rect x="8" y="5" width="8" height="14" rx="2" />
        </svg>
    ),
    heavy: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 2v8" />
            <circle cx="12" cy="16" r="6" />
            <path d="M9 16h6" />
        </svg>
    ),
    cold: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 2v20" />
            <path d="M17 7l-5 5-5-5" />
            <path d="M17 17l-5-5-5 5" />
            <path d="M2 12h20" />
        </svg>
    ),
    hollow: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="8" strokeDasharray="4 2" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    limp: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M8 4c4 0 6 3 6 6s-2 6-6 8" />
            <path d="M8 12h6" />
            <circle cx="6" cy="18" r="2" />
        </svg>
    ),
    throatTight: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <ellipse cx="12" cy="12" rx="3" ry="6" />
            <path d="M6 12h2" />
            <path d="M16 12h2" />
            <path d="M4 8l4 4-4 4" />
            <path d="M20 8l-4 4 4 4" />
        </svg>
    ),
    chestBlocked: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="6" y="6" width="12" height="12" rx="1" />
            <path d="M10 10h4v4h-4z" fill="currentColor" opacity="0.3" />
            <path d="M6 10h12" />
            <path d="M6 14h12" />
        </svg>
    ),
    relaxed: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 12c2-2 4-3 8-3s6 1 8 3" />
            <path d="M4 16c2-2 4-3 8-3s6 1 8 3" />
            <circle cx="8" cy="8" r="1" />
            <circle cx="16" cy="8" r="1" />
        </svg>
    ),
    steady: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 12h4l2-3 4 6 2-3h4l2 3h2" />
        </svg>
    ),
    still: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="8" />
            <circle cx="12" cy="12" r="3" />
            <circle cx="12" cy="12" r="1" fill="currentColor" />
        </svg>
    ),
    flowing: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 8c4 0 4 4 8 4s4-4 8-4" />
            <path d="M4 16c4 0 4 4 8 4s4-4 8-4" />
        </svg>
    ),
};

const bodyLocations = [
    { id: 'head', label: '頭部', icon: icons.head, popular: true },
    { id: 'throat', label: '喉嚨', icon: icons.throat, popular: false },
    { id: 'chest', label: '胸口', icon: icons.chest, popular: true },
    { id: 'stomach', label: '腹部', icon: icons.stomach, popular: false },
    { id: 'shoulders', label: '肩膀', icon: icons.shoulders, popular: true },
    { id: 'whole', label: '全身', icon: icons.whole, popular: false },
];

const sensationsByQuadrant: Record<Quadrant, { id: string; label: string; icon: React.ReactNode }[]> = {
    red: [
        { id: 'tension', label: '緊繃', icon: icons.tension },
        { id: 'heat', label: '灼熱', icon: icons.heat },
        { id: 'heartbeat', label: '心跳加速', icon: icons.heartbeat },
        { id: 'breathless', label: '屏息', icon: icons.breathless },
    ],
    yellow: [
        { id: 'light', label: '輕盈', icon: icons.light },
        { id: 'warm', label: '溫暖', icon: icons.warm },
        { id: 'energy', label: '充滿能量', icon: icons.energy },
        { id: 'vibrate', label: '震動', icon: icons.vibrate },
    ],
    blue: [
        { id: 'heavy', label: '沉重', icon: icons.heavy },
        { id: 'cold', label: '冰冷', icon: icons.cold },
        { id: 'hollow', label: '空洞', icon: icons.hollow },
        { id: 'limp', label: '疲軟', icon: icons.limp },
        { id: 'throatTight', label: '喉嚨緊縮', icon: icons.throatTight },
        { id: 'chestBlocked', label: '胸口堵塞', icon: icons.chestBlocked },
    ],
    green: [
        { id: 'relaxed', label: '放鬆', icon: icons.relaxed },
        { id: 'steady', label: '平穩', icon: icons.steady },
        { id: 'still', label: '沉靜', icon: icons.still },
        { id: 'flowing', label: '通暢', icon: icons.flowing },
    ],
};

const BodyScan: React.FC<BodyScanProps> = ({ quadrant, onComplete, onBack }) => {
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
    const [selectedSensation, setSelectedSensation] = useState<string | null>(null);

    const sensations = sensationsByQuadrant[quadrant];

    // Color mapping for quadrants
    const quadrantColors: Record<Quadrant, string> = {
        red: '#C58B8A',
        yellow: '#D5C1A5',
        blue: '#97A6B4',
        green: '#AAB09B'
    };

    React.useEffect(() => {
        document.documentElement.style.setProperty('--aura-color', `${quadrantColors[quadrant]}33`);
        document.documentElement.style.setProperty('--accent-scan', quadrantColors[quadrant]);
    }, [quadrant]);

    return (
        <div className="body-scan-step fade-in">
            <div className="step-header">
                <button className="nav-btn" onClick={onBack}>← 返回</button>
                <div className="step-label-container">
                    <span className="step-dot" />
                    <span className="step-tag">Recognizing</span>
                </div>
            </div>

            <div className="section-intro">
                <h2>感受你的身體</h2>
                <p className="intro-text">情緒通常會先反映在生理上。試著掃描一下，你感覺到了什麼？</p>
            </div>

            <div className="scan-content">
                <div className="scan-section">
                    <label className="heading-sm">1. 感覺最明顯的部位</label>
                    <div className="location-grid">
                        {bodyLocations.map(loc => (
                            <button
                                key={loc.id}
                                className={`scan-btn location-btn ${selectedLocation === loc.label ? 'active' : ''} ${loc.popular ? 'popular' : ''}`}
                                onClick={() => setSelectedLocation(loc.label)}
                                aria-pressed={selectedLocation === loc.label}
                            >
                                <div className="icon-wrapper">
                                    <span className="scan-icon">{loc.icon}</span>
                                </div>
                                <span className="scan-label">{loc.label}</span>
                                {loc.popular && <span className="popular-dot" aria-hidden="true" />}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="scan-section">
                    <label className="heading-sm">2. 那種感覺像是...</label>
                    <div className="sensation-grid">
                        {sensations.map(sens => (
                            <button
                                key={sens.id}
                                className={`scan-btn sensation-btn ${selectedSensation === sens.label ? 'active' : ''}`}
                                onClick={() => setSelectedSensation(sens.label)}
                                aria-pressed={selectedSensation === sens.label}
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
                    display: flex;
                    align-items: center;
                    gap: var(--s-2);
                    font-size: 0.75rem; 
                    font-weight: 800; 
                    letter-spacing: 1.5px;
                    color: var(--text-primary);  /* Improved contrast */
                    background: var(--glass-bg); 
                    padding: var(--s-2) var(--s-4); 
                    border-radius: 30px; 
                    border: 1px solid var(--glass-border); 
                    backdrop-filter: var(--glass-blur);
                    text-transform: uppercase;
                }
                .step-dot {
                    width: 8px;
                    height: 8px;
                    background: var(--accent-scan, var(--text-primary));
                    border-radius: 50%;
                    animation: pulse 2s ease-in-out infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.6; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
                
                .section-intro h2 { 
                    font-size: 1.8rem; 
                    font-weight: 800; 
                    margin-bottom: var(--s-3); 
                    letter-spacing: -0.5px;
                    color: var(--text-primary);  /* Explicit contrast */
                }
                .intro-text { 
                    color: var(--text-secondary); 
                    font-size: 1rem;  /* Slightly larger for readability */
                    line-height: 1.7; 
                    opacity: 0.9;  /* Better contrast than default */
                }

                .scan-content { display: flex; flex-direction: column; gap: var(--s-10); }
                .scan-section { display: flex; flex-direction: column; gap: var(--s-5); }
                .heading-sm { 
                    font-size: 0.9rem; 
                    font-weight: 700; 
                    color: var(--text-primary);  /* Improved: was secondary */
                    opacity: 0.85;
                    letter-spacing: 0.5px; 
                }

                .location-grid, .sensation-grid { 
                    display: grid; 
                    grid-template-columns: repeat(2, 1fr); 
                    gap: var(--s-4); 
                }

                .scan-btn {
                    display: flex;
                    align-items: center;
                    gap: var(--s-5);
                    padding: var(--s-5) var(--s-5);
                    background: var(--glass-bg);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-md);
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    backdrop-filter: var(--glass-blur);
                    color: var(--text-secondary);
                    text-align: left;
                    position: relative;
                    overflow: hidden;
                }

                /* Popular items get subtle initial highlight */
                .scan-btn.popular {
                    border-color: hsla(0, 0%, 100%, 0.12);
                    background: hsla(0, 0%, 100%, 0.03);
                }
                .popular-dot {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    width: 6px;
                    height: 6px;
                    background: var(--accent-scan, var(--text-secondary));
                    border-radius: 50%;
                    opacity: 0.4;
                }

                .scan-btn:hover {
                    border-color: var(--accent-scan, hsla(0, 0%, 100%, 0.25));
                    background: hsla(0, 0%, 100%, 0.05);
                    transform: translateY(-2px);
                    color: var(--text-primary);
                }

                .scan-btn.active {
                    background: hsla(0, 0%, 100%, 0.08);
                    color: var(--text-primary);
                    border-color: var(--accent-scan, var(--text-primary));
                    box-shadow: 
                        0 4px 24px hsla(0, 0%, 0%, 0.3),
                        inset 0 0 20px hsla(0, 0%, 100%, 0.04);
                    transform: translateY(-3px) scale(1.02);
                }

                .icon-wrapper {
                    width: 44px;
                    height: 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: hsla(0, 0%, 100%, 0.04);
                    border-radius: 12px;
                    border: 1px solid hsla(0, 0%, 100%, 0.06);
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    flex-shrink: 0;
                }

                .scan-btn:hover .icon-wrapper {
                    background: hsla(0, 0%, 100%, 0.08);
                    border-color: var(--accent-scan, hsla(0, 0%, 100%, 0.15));
                }

                .scan-btn.active .icon-wrapper {
                    background: var(--accent-scan, var(--text-primary));
                    border-color: transparent;
                }

                .scan-icon { 
                    width: 22px;
                    height: 22px;
                    color: var(--text-secondary);
                    opacity: 0.7;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .scan-btn:hover .scan-icon { 
                    opacity: 0.9;
                    color: var(--text-primary);
                }

                .scan-btn.active .scan-icon {
                    color: var(--bg-color);
                    opacity: 1;
                    transform: scale(1.1);
                }

                .scan-label { 
                    font-size: 0.95rem; 
                    font-weight: 600;  /* Slightly less heavy for elegance */
                    letter-spacing: 0.3px;
                }

                .morandi-main-btn { margin-top: var(--s-4); }
                .morandi-main-btn:disabled { 
                    opacity: 0.2; 
                    cursor: not-allowed; 
                    filter: grayscale(1);
                    transform: none;
                }
            `}</style>
        </div>
    );
};

export default BodyScan;
