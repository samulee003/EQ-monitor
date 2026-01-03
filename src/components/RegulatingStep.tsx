import React, { useState, useEffect } from 'react';
import { Emotion, Quadrant } from '../data/emotionData';

import { RegulatingData } from '../types/RulerTypes';

interface RegulatingStepProps {
    emotion: Emotion;
    onComplete: (data: RegulatingData) => void;
    onBack: () => void;
}

const strategiesByQuadrant: Record<Quadrant, { icon: string; title: string; desc: string; type?: 'interactive' }[]> = {
    red: [
        { icon: '🌬️', title: '引導式深呼吸', desc: '進入跟隨節奏的呼吸練習', type: 'interactive' },
        { icon: '🤚', title: '5-4-3-2-1 接地法', desc: '透過感官重新連結當下', type: 'interactive' },
        { icon: '🏃', title: '強效宣洩', desc: '進行 30 秒的身心快速擺動' },
        { icon: '💧', title: '冰水刺激', desc: '利用溫差快速平復情緒' },
    ],
    yellow: [
        { icon: '📝', title: '感恩清單', desc: '寫三件此刻讓你感到美好的事' },
        { icon: '✨', title: '傳遞喜悅', desc: '發送一則讚美訊息給他人' },
        { icon: '🎯', title: '目標設定', desc: '趁著能量高設定今天的小目標' },
        { icon: '🕺', title: '慶祝舞動', desc: '放一首歌，隨意地動一動身體' },
    ],
    blue: [
        { icon: '☕', title: '暖心儀式', desc: '為自己準備一杯有溫度的飲品' },
        { icon: '🧹', title: '微小掌控', desc: '整理三件桌上的雜物' },
        { icon: '🧸', title: '自我慈悲', desc: '對自己說一句溫柔的鼓勵' },
        { icon: '🪴', title: '觀察植物', desc: '凝視一片葉子或窗外的景色' },
    ],
    green: [
        { icon: '🧘', title: '三分鐘靜坐', desc: '純粹地與當下的平靜同在' },
        { icon: '📖', title: '慢讀時刻', desc: '細讀一段優美的文字' },
        { icon: '🖍️', title: '隨意塗鴉', desc: '不帶目的地記錄線條與色彩' },
        { icon: '📵', title: '數位離線', desc: '給自己 10 分鐘的無擾空間' },
    ],
};

const RegulatingStep: React.FC<RegulatingStepProps> = ({ emotion, onComplete, onBack }) => {
    const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
    const [activeInteractive, setActiveInteractive] = useState<string | null>(null);
    const [breatheStage, setBreatheStage] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
    const [groundingStep, setGroundingStep] = useState(0);
    const [isReflecting, setIsReflecting] = useState(false);
    const [reflectionText, setReflectionText] = useState('');

    const strategies = strategiesByQuadrant[emotion.quadrant];

    // Update aura color on mount
    useEffect(() => {
        document.documentElement.style.setProperty('--aura-color', `hsla(var(--h-${emotion.quadrant}), var(--s-${emotion.quadrant}), var(--l-${emotion.quadrant}), 0.2)`);
    }, [emotion.quadrant]);

    // Breathing Pacer Logic
    useEffect(() => {
        if (activeInteractive === '引導式深呼吸') {
            let timer: any;
            const cycle = () => {
                setBreatheStage('inhale');
                timer = setTimeout(() => {
                    setBreatheStage('hold');
                    timer = setTimeout(() => {
                        setBreatheStage('exhale');
                        timer = setTimeout(cycle, 6000);
                    }, 4000);
                }, 4000);
            };
            cycle();
            return () => clearTimeout(timer);
        }
    }, [activeInteractive]);

    const toggleStrategy = (title: string, type?: string) => {
        if (type === 'interactive') {
            setActiveInteractive(title);
            return;
        }
        setSelectedStrategies(prev =>
            prev.includes(title) ? prev.filter(s => s !== title) : [...prev, title]
        );
    };

    const handleInteractiveComplete = () => {
        setIsReflecting(true);
    };

    const finishReflection = () => {
        setSelectedStrategies(prev => Array.from(new Set([...prev, activeInteractive!])));
        setActiveInteractive(null);
        setIsReflecting(false);
        setReflectionText('');
    };

    const groundingTasks = [
        "觀察 5 個你能看到的物品",
        "感受 4 個你能觸碰到的質地",
        "聆聽 3 個你能聽到的聲音",
        "分辨 2 個你能聞到的氣味",
        "品味 1 個你能想到的美好滋味"
    ];

    return (
        <div className="regulating-step fade-in">
            {activeInteractive ? (
                <div className="interactive-overlay fade-in">
                    <button className="close-overlay" onClick={() => setActiveInteractive(null)}>✕</button>
                    {activeInteractive === '引導式深呼吸' && (
                        <div className="breathing-session">
                            <div className={`pacer-circle ${breatheStage}`}>
                                <div className="pacer-text">
                                    {breatheStage === 'inhale' ? '吸氣...' : breatheStage === 'hold' ? '屏息' : '吐氣...'}
                                </div>
                            </div>
                            <p className="breathing-desc">放鬆肩膀，跟隨圓圈的節奏</p>
                            <button className="confirm-pacer-btn" onClick={() => handleInteractiveComplete()}>我感覺好多了</button>
                        </div>
                    )}
                    {activeInteractive === '5-4-3-2-1 接地法' && (
                        <div className="grounding-session">
                            <div className="task-card">
                                <span className="task-count">{5 - groundingStep}</span>
                                <p className="task-text">{groundingTasks[groundingStep]}</p>
                            </div>
                            <div className="task-progress">
                                {groundingTasks.map((_, i) => (
                                    <div key={i} className={`progress-dot ${i <= groundingStep ? 'active' : ''}`}></div>
                                ))}
                            </div>
                            {groundingStep < 4 ? (
                                <button className="next-task-btn" onClick={() => setGroundingStep(s => s + 1)}>完成這項</button>
                            ) : (
                                <button className="confirm-pacer-btn" onClick={() => handleInteractiveComplete()}>回到現下</button>
                            )}
                        </div>
                    )}

                    {isReflecting && (
                        <div className="reflection-overlay fade-in">
                            <div className="reflection-card">
                                <h3>此刻的感覺？</h3>
                                <p>在練習之後，試著捕捉這一刻內在的微小轉變...</p>
                                <textarea
                                    className="morandi-textarea"
                                    placeholder="我感覺到..."
                                    value={reflectionText}
                                    onChange={(e) => setReflectionText(e.target.value)}
                                    autoFocus
                                />
                                <button className="confirm-pacer-btn" onClick={finishReflection}>完成紀錄</button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <div className="step-header">
                        <button className="nav-btn" onClick={onBack}>← 返回</button>
                        <div className="step-label-container">
                            <span className="dot" style={{ backgroundColor: `var(--color-${emotion.quadrant})` }}></span>
                            <span className="step-title">Regulating 調節與平衡</span>
                        </div>
                    </div>

                    <div className="section-intro">
                        <h2>調節你的能量</h2>
                        <p>選擇一個引導式練習，或幾項簡單的動作來恢復平衡。</p>
                    </div>

                    <div className="strategies-grid">
                        {strategies.map(s => (
                            <div
                                key={s.title}
                                className={`strategy-item ${s.type === 'interactive' ? 'interactive' : ''} ${selectedStrategies.includes(s.title) ? 'active' : ''}`}
                                onClick={() => toggleStrategy(s.title, s.type)}
                            >
                                <div className="strategy-icon-wrapper">
                                    <div className="strategy-icon">{s.icon}</div>
                                </div>
                                <div className="strategy-meta">
                                    <h3>{s.title}</h3>
                                    <p>{s.desc}</p>
                                </div>
                                {selectedStrategies.includes(s.title) && <div className="checked-mark">✓</div>}
                            </div>
                        ))}
                    </div>

                    <button className="morandi-main-btn" disabled={selectedStrategies.length === 0} onClick={() => onComplete({ selectedStrategies })}>
                        完成本次練習
                    </button>
                </>
            )}

            <style>{`
                .regulating-step { display: flex; flex-direction: column; gap: var(--s-8); min-height: 500px; }
                .step-header { display: flex; justify-content: space-between; align-items: center; }
                .step-label-container { 
                    display: flex; align-items: center; gap: var(--s-2); 
                    font-size: 0.75rem; font-weight: 800; letter-spacing: 1px;
                    color: var(--text-secondary); background: var(--glass-bg); 
                    padding: var(--s-1) var(--s-4); border-radius: 30px;
                    border: 1px solid var(--glass-border); backdrop-filter: var(--glass-blur);
                    text-transform: uppercase;
                }
                .dot { width: 8px; height: 8px; border-radius: 50%; opacity: 0.6; }
                .section-intro h2 { font-size: 1.8rem; font-weight: 800; margin-bottom: var(--s-2); letter-spacing: -0.5px; }
                .section-intro p { color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6; }
                
                .strategies-grid { display: flex; flex-direction: column; gap: var(--s-3); }
                .strategy-item { 
                    display: flex; align-items: center; gap: var(--s-5); padding: var(--s-5); 
                    background: var(--bg-secondary); border: 1px solid var(--glass-border); 
                    border-radius: var(--radius-md); cursor: pointer; transition: var(--transition-luxe); 
                    position: relative; overflow: hidden;
                }
                .strategy-item:hover { border-color: hsla(0,0%,100%,0.2); background: var(--glass-border); transform: translateX(4px); }
                .strategy-item.interactive { border-left: 4px solid var(--text-primary); }
                .strategy-item.active { border-color: var(--text-primary); background: hsla(0,0%,100%,0.05); box-shadow: var(--shadow-luxe); transform: scale(1.02); }
                
                .strategy-icon-wrapper {
                    width: 52px;
                    height: 52px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: hsla(0,0%,100%,0.03);
                    border-radius: 16px;
                    border: 1px solid var(--glass-border);
                    transition: var(--transition-luxe);
                    flex-shrink: 0;
                }
                .strategy-item.active .strategy-icon-wrapper {
                    background: var(--text-primary);
                    border-color: var(--text-primary);
                }

                .strategy-icon { 
                    font-size: 1.6rem; 
                    filter: sepia(0.3) saturate(0.4) brightness(0.85);
                    opacity: 0.6;
                    transition: var(--transition-luxe); 
                }
                .strategy-item.active .strategy-icon { 
                    filter: brightness(0) invert(1);
                    opacity: 1;
                    transform: scale(1.1); 
                }
                
                .strategy-meta h3 { margin: 0 0 4px 0; font-size: 1rem; font-weight: 700; letter-spacing: 0.5px; }
                .strategy-meta p { margin: 0; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4; }
                .checked-mark { position: absolute; right: var(--s-6); color: var(--text-primary); font-weight: 900; filter: drop-shadow(0 0 10px rgba(255,255,255,0.3)); opacity: 0.8; }
                .strategy-item.active .checked-mark { color: #fff; }
                
                /* Interactive Overlays */
                .interactive-overlay { 
                    position: fixed; inset: 0; background: var(--bg-color); 
                    z-index: 1000; padding: var(--s-12) var(--s-6); display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    background-image: radial-gradient(circle at center, hsla(0,0%,100%,0.03) 0%, transparent 70%);
                }
                .close-overlay { position: absolute; top: var(--s-8); right: var(--s-8); background: var(--glass-bg); border: 1px solid var(--glass-border); color: var(--text-primary); width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: var(--transition-luxe); backdrop-filter: var(--glass-blur); }
                .close-overlay:hover { background: var(--glass-border); transform: rotate(90deg); }

                /* Breathing Pacer */
                .breathing-session { display: flex; flex-direction: column; align-items: center; gap: var(--s-12); width: 100%; }
                .pacer-circle { 
                    width: 260px; height: 260px; border-radius: 50%; 
                    background: var(--text-primary); display: flex; 
                    align-items: center; justify-content: center;
                    transition: all 4s cubic-bezier(0.4, 0, 0.2, 1); 
                    box-shadow: 0 0 80px hsla(0, 0%, 100%, 0.1);
                }
                .pacer-circle::after { content: ''; position: absolute; inset: -20px; border: 1px solid hsla(0, 0%, 100%, 0.1); border-radius: 50%; animation: pulseAura 4s infinite; }
                
                @keyframes pulseAura {
                    from { transform: scale(1); opacity: 0.5; }
                    to { transform: scale(1.3); opacity: 0; }
                }

                .pacer-circle.inhale { transform: scale(1.4); filter: brightness(1.2); transition-duration: 4s; }
                .pacer-circle.hold { transform: scale(1.4); transition-duration: 4s; }
                .pacer-circle.exhale { transform: scale(0.6); filter: brightness(0.8); transition-duration: 6s; }
                .pacer-text { color: var(--bg-color); font-weight: 800; font-size: 1.6rem; letter-spacing: 2px; }
                .breathing-desc { color: var(--text-secondary); font-size: 1rem; font-weight: 500; opacity: 0.8; }

                /* Grounding */
                .grounding-session { display: flex; flex-direction: column; align-items: center; gap: var(--s-8); width: 100%; max-width: 400px; }
                .task-card { 
                    background: var(--bg-secondary); padding: var(--s-12) var(--s-6); 
                    border-radius: var(--radius-luxe); text-align: center; width: 100%; 
                    border: 1px solid var(--glass-border); box-shadow: var(--shadow-luxe);
                    position: relative; overflow: hidden;
                }
                .task-card::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: var(--text-primary); opacity: 0.2; }
                .task-count { font-size: 5rem; font-weight: 900; color: var(--text-primary); display: block; margin-bottom: var(--s-4); line-height: 1; }
                .task-text { font-size: 1.3rem; font-weight: 700; color: var(--text-primary); }
                .task-progress { display: flex; gap: var(--s-3); margin-top: var(--s-4); }
                .progress-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--text-secondary); opacity: 0.2; transition: var(--transition-luxe); }
                .progress-dot.active { background: var(--text-primary); opacity: 0.8; transform: scale(1.2); }

                .next-task-btn, .confirm-pacer-btn { 
                    width: 100%; padding: var(--s-4); background: var(--text-primary); 
                    color: var(--bg-color); font-weight: 800; border: none; 
                    border-radius: var(--radius-md); cursor: pointer; transition: var(--transition-luxe);
                    font-size: 1.05rem; letter-spacing: 1px;
                }
                .next-task-btn:hover, .confirm-pacer-btn:hover { transform: translateY(-2px); box-shadow: var(--shadow-luxe); filter: brightness(1.1); }

                /* Reflection Overlay */
                .reflection-overlay {
                    position: absolute; inset: 0; background: hsla(0, 0%, 10%, 0.95);
                    display: flex; align-items: center; justify-content: center; z-index: 1100;
                    padding: var(--s-6); backdrop-filter: var(--glass-blur);
                }
                .reflection-card {
                    background: var(--bg-secondary); border: 1px solid var(--glass-border);
                    padding: var(--s-8) var(--s-6); border-radius: var(--radius-luxe); 
                    width: 100%; max-width: 360px;
                    display: flex; flex-direction: column; gap: var(--s-4); text-align: center;
                    box-shadow: var(--shadow-luxe);
                }
                .reflection-card h3 { font-size: 1.5rem; font-weight: 800; margin: 0; }
                .reflection-card p { font-size: 0.9rem; color: var(--text-secondary); margin-bottom: var(--s-2); line-height: 1.6; }
                
                .reflection-card .morandi-textarea {
                    width: 100%; min-height: 100px; background: hsla(0,0%,0%,0.3);
                    border: 1px solid var(--glass-border); border-radius: var(--radius-md);
                    padding: var(--s-4); color: var(--text-primary); font-family: inherit;
                    resize: none; outline: none; transition: var(--transition-luxe);
                    font-size: 1rem;
                }
                .reflection-card .morandi-textarea:focus { border-color: var(--text-secondary); }

                .morandi-main-btn:disabled { opacity: 0.15; filter: grayscale(1); transform: none; }
            `}</style>
        </div>
    );
};

export default RegulatingStep;
