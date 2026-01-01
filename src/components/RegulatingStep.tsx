import React, { useState } from 'react';
import { Emotion, Quadrant } from '../data/emotionData';

interface RegulatingStepProps {
    emotion: Emotion;
    onComplete: (data: { selectedStrategies: string[] }) => void;
    onBack: () => void;
}

const strategiesByQuadrant: Record<Quadrant, { icon: string; title: string; desc: string }[]> = {
    red: [
        { icon: '🌬️', title: '深呼吸', desc: '吸氣4秒、屏息4秒、吐氣6秒' },
        { icon: '🚶', title: '短暫散步', desc: '離開當前環境，活動一下身體' },
        { icon: '🎵', title: '平靜音樂', desc: '聆聽柔和的旋律來緩解張力' },
        { icon: '✍️', title: '紙上書寫', desc: '寫下煩惱後將紙張揉碎' },
        { icon: '💧', title: '冰水洗臉', desc: '利用低溫觸覺快速啟動副交感神經' },
        { icon: '🧘', title: '肌肉放鬆', desc: '從腳趾到肩膀依次緊繃後徹底釋放' },
    ],
    yellow: [
        { icon: '📝', title: '感恩記錄', desc: '寫下三件此刻感到美好的事' },
        { icon: '🤝', title: '與人分享', desc: '向好友傳遞你這份好心情' },
        { icon: '🎯', title: '規劃下一步', desc: '趁著高動力設定一個小目標' },
        { icon: '🕺', title: '小小慶祝', desc: '獎勵自己一個喜歡的小驚喜' },
        { icon: '✨', title: '讚美他人', desc: '發一則訊息真誠地感謝某人的存在' },
        { icon: '🧩', title: '心流活動', desc: '投入一件純粹感興趣的創作或小遊戲' },
    ],
    blue: [
        { icon: '☀️', title: '沐浴陽光', desc: '到窗邊或戶外感受溫暖光影' },
        { icon: '🍵', title: '溫暖飲品', desc: '泡一杯熱茶或咖啡安撫心靈' },
        { icon: '🚶', title: '低度運動', desc: '簡單的伸展或散步恢復活力' },
        { icon: '📻', title: '聆聽內容', desc: '聽一段溫暖的 Podcast 或故事' },
        { icon: '🧹', title: '整理空間', desc: '簡單整理書桌或床鋪，找回掌控感' },
        { icon: '🕯️', title: '香味療癒', desc: '點燃香氛或感受熟悉的乾淨氣味' },
    ],
    green: [
        { icon: '🧘', title: '靜坐冥想', desc: '花五分鐘專注於當下的呼吸' },
        { icon: '📖', title: '靜心閱讀', desc: '翻閱幾頁喜愛的文學或詩集' },
        { icon: '🌿', title: '綠意環繞', desc: '觀察身邊的植物或去公園走走' },
        { icon: '🎨', title: '隨意塗鴉', desc: '不帶目的地記錄線條與色彩' },
        { icon: '🍎', title: '正念進食', desc: '細細品味一口水果的酸甜與質地' },
        { icon: '📵', title: '數位排毒', desc: '放下手機一刻鐘，只與現實世界共處' },
    ],
};

const RegulatingStep: React.FC<RegulatingStepProps> = ({ emotion, onComplete, onBack }) => {
    const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
    const strategies = strategiesByQuadrant[emotion.quadrant];

    const toggleStrategy = (title: string) => {
        setSelectedStrategies(prev =>
            prev.includes(title) ? prev.filter(s => s !== title) : [...prev, title]
        );
    };

    return (
        <div className="regulating-step fade-in">
            <div className="step-header">
                <button className="nav-btn" onClick={onBack}>← 返回</button>
                <div className="step-label-container">
                    <span className="dot" style={{ backgroundColor: `var(--color-${emotion.quadrant})` }}></span>
                    <span className="step-title">Regulating 調節</span>
                </div>
            </div>

            <div className="section-intro">
                <h2>調節情緒節奏</h2>
                <p>根據你的情緒狀態，推薦以下調節方式：</p>
            </div>

            <div className="strategies-grid">
                {strategies.map(s => (
                    <div
                        key={s.title}
                        className={`strategy-item ${selectedStrategies.includes(s.title) ? 'active' : ''}`}
                        onClick={() => toggleStrategy(s.title)}
                    >
                        <div className="strategy-icon">
                            {s.icon}
                            {s.title === '深呼吸' && <div className="breathe-pulse"></div>}
                        </div>
                        <div className="strategy-meta">
                            <h3>{s.title}</h3>
                            <p>{s.desc}</p>
                        </div>
                        {selectedStrategies.includes(s.title) && <div className="checked-mark">●</div>}
                    </div>
                ))}
            </div>

            <button className="morandi-main-btn" onClick={() => onComplete({ selectedStrategies })}>
                完成這段旅程
            </button>

            <style>{`
        .regulating-step { display: flex; flex-direction: column; gap: 2rem; }
        .step-header { display: flex; justify-content: space-between; align-items: center; }
        .step-label-container { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-secondary); background: var(--glass-bg); padding: 0.4rem 0.8rem; border-radius: 20px; }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .section-intro h2 { font-size: 1.5rem; margin-bottom: 0.5rem; }
        .section-intro p { color: var(--text-secondary); font-size: 0.9rem; }
        
        .strategies-grid { display: flex; flex-direction: column; gap: 12px; }
        .strategy-item { display: flex; align-items: center; gap: 1.2rem; padding: 1.25rem; background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: var(--radius-md); cursor: pointer; transition: var(--transition); position: relative; }
        .strategy-item.active { border-color: var(--text-primary); background: rgba(255,255,255,0.05); }
        .strategy-icon { font-size: 1.8rem; position: relative; }
        .breathe-pulse { 
            position: absolute; 
            top: 50%; left: 50%; 
            width: 40px; height: 40px; 
            margin: -20px 0 0 -20px; 
            background: var(--text-primary); 
            border-radius: 50%; 
            opacity: 0.2; 
            z-index: -1;
            animation: breathePulse 3s infinite ease-in-out; 
        }

        @keyframes breathePulse {
            0% { transform: scale(0.8); opacity: 0.1; }
            50% { transform: scale(1.8); opacity: 0.3; }
            100% { transform: scale(0.8); opacity: 0.1; }
        }

        .strategy-meta h3 { margin: 0 0 0.25rem 0; font-size: 1.05rem; }
        .strategy-meta p { margin: 0; font-size: 0.85rem; color: var(--text-secondary); }
        .checked-mark { position: absolute; right: 1.5rem; color: var(--text-primary); }
        
        .morandi-main-btn { width: 100%; padding: 1.25rem; background: var(--text-primary); color: var(--bg-color); font-weight: 700; font-size: 1.1rem; border: none; border-radius: var(--radius-md); margin-top: 1rem; cursor: pointer; transition: var(--transition); }
        .morandi-main-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
      `}</style>
        </div>
    );
};

export default RegulatingStep;
