import React, { useState } from 'react';
import { emotions, Quadrant, Emotion } from '../data/emotionData';
import { useLanguage } from '../services/LanguageContext';

interface EmotionGridProps {
  quadrants: Quadrant[];
  onSelectEmotions: (es: Emotion[]) => void;
  onBack: () => void;
}

const EmotionGrid: React.FC<EmotionGridProps> = ({ quadrants, onSelectEmotions, onBack }) => {
  const [selectedEmotions, setSelectedEmotions] = useState<Emotion[]>([]);
  const [isIntensityStep, setIsIntensityStep] = useState(false);
  const [intensity, setIntensity] = useState(5);
  const { t } = useLanguage();

  const filteredEmotions = emotions.filter(e => quadrants.includes(e.quadrant));

  const quadrantColors: Record<Quadrant, string> = {
    red: 'var(--color-red)',
    yellow: 'var(--color-yellow)',
    blue: 'var(--color-blue)',
    green: 'var(--color-green)',
  };

  const toggleEmotion = (e: Emotion) => {
    setSelectedEmotions(prev => {
      const exists = prev.find(item => item.id === e.id);
      if (exists) return prev.filter(item => item.id !== e.id);
      return [...prev, e];
    });
  };

  const handleConfirm = () => {
    onSelectEmotions(selectedEmotions);
  };

  // Calculate dynamic color interpolate based on intensity
  const getIntensityStyle = () => {
    const factor = intensity / 10;
    const baseColor = selectedEmotions.length > 0 ? quadrantColors[selectedEmotions[0].quadrant] : 'var(--text-primary)';
    return {
      '--current-vibrancy': factor,
      '--dynamic-color': baseColor,
      '--glow-size': `${5 + factor * 15}px`,
    } as React.CSSProperties;
  };

  if (isIntensityStep) {
    return (
      <div className="intensity-step fade-in" style={getIntensityStyle()}>
        <div className="selection-header">
          <button className="nav-btn" onClick={() => setIsIntensityStep(false)}>{t('← 重新選擇')}</button>
          <span className="step-tag">{t('Labeling 標記強度')}</span>
        </div>

        <div className="intensity-display">
          <div className="preview-sphere">
            <div className="sphere-core"></div>
            <div className="sphere-glow-layer"></div>
            <div className="emotions-cloud">
              {selectedEmotions.map(e => (
                <span key={e.id} className="emotion-name-tag">{t(e.name)}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="intensity-control-card">
          <div className="intensity-header">
            <label>{t('這些感覺目前有多強烈？')}</label>
            <span className="intensity-value">{intensity}</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={intensity}
            onChange={(e) => setIntensity(parseInt(e.target.value))}
            className="morandi-slider"
          />
          <div className="slider-labels">
            <span>{t('微弱')}</span>
            <span>{t('中等')}</span>
            <span>{t('極度')}</span>
          </div>
        </div>

        <button className="morandi-main-btn" onClick={handleConfirm}>
          {t('確認並前往下一步')}
        </button>

        <style>{`
            .emotions-cloud { 
                position: relative; z-index: 2; display: flex; flex-wrap: wrap; 
                justify-content: center; gap: 8px; padding: 1rem; max-width: 250px;
            }
            .emotion-name-tag { 
                font-size: 1rem; font-weight: 700; color: #fff; 
                text-shadow: 0 2px 10px rgba(0,0,0,0.5); background: rgba(0,0,0,0.1);
                padding: 4px 12px; border-radius: 20px;
            }
        `}</style>
        {/* Previous styles for intensity-step remain same */}
        <style>{`
            .intensity-step { display: flex; flex-direction: column; gap: 2.5rem; align-items: center; width: 100%; }
            .step-tag { font-size: 0.8rem; color: var(--text-secondary); background: var(--glass-bg); padding: 0.4rem 0.8rem; border-radius: 20px; }
            .intensity-display { height: 260px; display: flex; align-items: center; justify-content: center; width: 100%; position: relative; }
            .preview-sphere { width: 160px; height: 160px; position: relative; display: flex; align-items: center; justify-content: center; }
            .sphere-core { position: absolute; inset: 0; border-radius: 50%; background: var(--dynamic-color); border: 2px solid rgba(255,255,255, calc(0.15 + var(--current-vibrancy) * 0.5)); box-shadow: 0 0 calc(var(--glow-size) * 0.6) var(--dynamic-color); transition: all 0.3s ease; opacity: 0.8; }
            .sphere-glow-layer { position: absolute; inset: -15px; border-radius: 50%; background: var(--dynamic-color); opacity: calc(0.1 + var(--current-vibrancy) * 0.2); filter: blur(calc(var(--glow-size) * 0.8)); transition: all 0.3s ease; }
            .intensity-control-card { width: 100%; background: var(--bg-secondary); padding: 2rem; border-radius: var(--radius-md); border: 1px solid var(--glass-border); }
            .intensity-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
            .intensity-value { font-size: 2rem; font-weight: 800; color: var(--dynamic-color); font-family: 'Outfit', sans-serif; }
            .morandi-slider { -webkit-appearance: none; width: 100%; height: 6px; border-radius: 3px; background: rgba(255,255,255,0.1); outline: none; transition: 0.2s; }
            .morandi-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 24px; height: 24px; border-radius: 50%; background: var(--dynamic-color); cursor: pointer; border: 4px solid var(--bg-secondary); box-shadow: 0 0 15px var(--dynamic-color); }
            .slider-labels { display: flex; justify-content: space-between; margin-top: 1rem; color: var(--text-secondary); font-size: 0.8rem; }
            .morandi-main-btn { width: 100%; padding: 1.25rem; background: var(--text-primary); color: var(--bg-color); font-weight: 700; font-size: 1.1rem; border: none; border-radius: var(--radius-md); cursor: pointer; transition: var(--transition); }
        `}</style>
      </div>
    );
  }

  return (
    <div className="emotion-selection-container fade-in">
      <div className="selection-header">
        <button className="nav-btn" onClick={onBack}>{t('← 返回')}</button>
        <div className="current-contexts">
          {quadrants.map(q => (
            <div key={q} className="context-chip">
              <span className="dot" style={{ backgroundColor: quadrantColors[q] }}></span>
              <span>{t(q === 'red' ? '高能量/不愉快' : q === 'yellow' ? '高能量/愉快' : q === 'blue' ? '低能量/不愉快' : '低能量/愉快')}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="selection-title">
        <h2>{t('精確標記你的感受')}</h2>
        <p>{t('可以選擇多個最能引起共鳴的詞彙')}</p>
      </div>

      <div className="bubbles-container">
        {filteredEmotions.map((emotion, index) => (
          <button
            key={emotion.id}
            className={`emotion-bubble ${selectedEmotions.find(e => e.id === emotion.id) ? 'active' : ''}`}
            style={{
              '--bubble-color': quadrantColors[emotion.quadrant],
              animationDelay: `${index * 0.05}s`
            } as React.CSSProperties}
            onClick={() => toggleEmotion(emotion)}
          >
            {t(emotion.name)}
          </button>
        ))}
      </div>

      <button
        className="morandi-main-btn"
        disabled={selectedEmotions.length === 0}
        onClick={() => setIsIntensityStep(true)}
      >
        {t('下一步')}
      </button>

      <style>{`
        .current-contexts { display: flex; gap: 8px; flex-wrap: wrap; }
        .context-chip { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: var(--text-secondary); background: var(--glass-bg); padding: 0.3rem 0.6rem; border-radius: 20px; }
        .emotion-bubble.active {
            background: var(--bubble-color);
            color: #1a1a1a;
            border-color: #fff;
            transform: scale(1.1);
            box-shadow: 0 8px 16px rgba(0,0,0,0.3);
        }

        .emotion-selection-container { display: flex; flex-direction: column; gap: 2rem; }
        .selection-header { display: flex; justify-content: space-between; align-items: center; }
        .current-context { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-secondary); background: var(--glass-bg); padding: 0.4rem 0.8rem; border-radius: 20px; }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .selection-title h2 { font-size: 1.5rem; margin-bottom: 0.5rem; }
        .selection-title p { color: var(--text-secondary); font-size: 0.9rem; }
        .bubbles-container { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; padding: 1rem 0; }
        .emotion-bubble { padding: 0.75rem 1.25rem; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 30px; color: var(--text-primary); font-size: 0.95rem; cursor: pointer; transition: var(--transition); animation: float 4s ease-in-out infinite; animation-fill-mode: both; }
        .emotion-bubble:hover { background: var(--bubble-color); color: #1a1a1a; border-color: var(--bubble-color); transform: scale(1.1) translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .emotion-bubble:nth-child(2n) { animation-duration: 4.5s; }
        .emotion-bubble:nth-child(3n) { animation-duration: 3.8s; }
        .emotion-bubble:nth-child(5n) { animation-duration: 5s; }
      `}</style>
    </div>
  );
};

export default EmotionGrid;
