import React, { useState, useEffect } from 'react';
import { Emotion, Quadrant } from '../data/emotionData';

interface RegulatingStepProps {
    emotion: Emotion;
    onComplete: (data: { selectedStrategies: string[] }) => void;
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

    const strategies = strategiesByQuadrant[emotion.quadrant];

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

    const handleInteractiveComplete = (title: string) => {
        setSelectedStrategies(prev => Array.from(new Set([...prev, title])));
        setActiveInteractive(null);
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
                            <button className="confirm-pacer-btn" onClick={() => handleInteractiveComplete('引導式深呼吸')}>我感覺好多了</button>
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
                                <button className="confirm-pacer-btn" onClick={() => handleInteractiveComplete('5-4-3-2-1 接地法')}>回到現下</button>
                            )}
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
                                <div className="strategy-icon">{s.icon}</div>
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
                .regulating-step { display: flex; flex-direction: column; gap: 2rem; min-height: 500px; }
                .step-header { display: flex; justify-content: space-between; align-items: center; }
                .step-label-container { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-secondary); background: var(--glass-bg); padding: 0.4rem 0.8rem; border-radius: 20px; }
                .dot { width: 8px; height: 8px; border-radius: 50%; }
                .section-intro h2 { font-size: 1.5rem; margin-bottom: 0.5rem; }
                .section-intro p { color: var(--text-secondary); font-size: 0.9rem; }
                
                .strategies-grid { display: flex; flex-direction: column; gap: 12px; }
                .strategy-item { display: flex; align-items: center; gap: 1.2rem; padding: 1.25rem; background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: var(--radius-md); cursor: pointer; transition: var(--transition); position: relative; }
                .strategy-item.interactive { border-left: 4px solid var(--text-primary); }
                .strategy-item.active { border-color: var(--text-primary); background: rgba(255,255,255,0.05); }
                .strategy-icon { font-size: 1.8rem; }
                .strategy-meta h3 { margin: 0 0 0.25rem 0; font-size: 1.05rem; }
                .strategy-meta p { margin: 0; font-size: 0.85rem; color: var(--text-secondary); }
                .checked-mark { position: absolute; right: 1.5rem; color: var(--text-primary); font-weight: 800; }
                
                /* Interactive Overlays */
                .interactive-overlay { 
                    position: fixed; inset: 0; background: var(--bg-color); 
                    z-index: 100; padding: 2rem; display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                }
                .close-overlay { position: absolute; top: 2rem; right: 2rem; background: none; border: none; color: var(--text-primary); font-size: 1.5rem; cursor: pointer; }

                /* Breathing Pacer */
                .breathing-session { display: flex; flex-direction: column; align-items: center; gap: 3rem; }
                .pacer-circle { 
                    width: 240px; height: 240px; border-radius: 50%; 
                    background: var(--text-primary); display: flex; 
                    align-items: center; justify-content: center;
                    transition: all 4s ease-in-out; opacity: 0.4;
                }
                .pacer-circle.inhale { transform: scale(1.5); opacity: 0.8; transition-duration: 4s; }
                .pacer-circle.hold { transform: scale(1.5); opacity: 0.8; transition-duration: 4s; }
                .pacer-circle.exhale { transform: scale(0.6); opacity: 0.2; transition-duration: 6s; }
                .pacer-text { color: var(--bg-color); font-weight: 700; font-size: 1.5rem; }

                /* Grounding */
                .grounding-session { display: flex; flex-direction: column; align-items: center; gap: 2rem; width: 100%; max-width: 400px; }
                .task-card { background: var(--bg-secondary); padding: 3rem 2rem; border-radius: var(--radius-md); text-align: center; width: 100%; border: 1px solid var(--glass-border); }
                .task-count { font-size: 4rem; font-weight: 900; color: var(--text-primary); display: block; margin-bottom: 1rem; }
                .task-text { font-size: 1.25rem; font-weight: 600; }
                .task-progress { display: flex; gap: 10px; opacity: 0.3; }
                .progress-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-secondary); }
                .progress-dot.active { background: var(--text-primary); opacity: 1; }

                .next-task-btn, .confirm-pacer-btn { 
                    width: 100%; padding: 1.25rem; background: var(--text-primary); 
                    color: var(--bg-color); font-weight: 700; border: none; 
                    border-radius: var(--radius-md); cursor: pointer;
                }

                .morandi-main-btn { 
                    width: 100%; padding: 1.25rem; background: var(--text-primary); 
                    color: var(--bg-color); font-weight: 700; border: none; 
                    border-radius: var(--radius-md); margin-top: 1rem; cursor: pointer; transition: var(--transition);
                }
                .morandi-main-btn:disabled { opacity: 0.3; }
            `}</style>
        </div>
    );
};

export default RegulatingStep;
