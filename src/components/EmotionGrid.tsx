import React, { useState, useMemo, useCallback } from 'react';
import { emotions, type Quadrant, type Emotion } from '../data/emotionData';
import { useLanguage } from '../services/LanguageContext';
import { settingsStore } from '../adapters';
import './EmotionGrid.css';

interface EmotionGridProps {
  quadrants: Quadrant[];
  onSelectEmotions: (es: Emotion[], intensity: number) => void;
  onBack: () => void;
}

const quadrantColors: Record<Quadrant, string> = {
  red: 'var(--color-red)',
  yellow: 'var(--color-yellow)',
  blue: 'var(--color-blue)',
  green: 'var(--color-green)',
};

interface EmotionBubbleProps {
  emotion: Emotion;
  isSelected: boolean;
  onToggle: (e: Emotion) => void;
  t: (text: string) => string;
  color: string;
  index: number;
}

const EmotionBubble = React.memo(({ emotion, isSelected, onToggle, t, color, index }: EmotionBubbleProps) => {
  return (
    <button
      className={`emotion-bubble ${isSelected ? 'active' : ''}`}
      style={{
        '--bubble-color': color,
        animationDelay: `${index * 0.05}s`
      } as React.CSSProperties}
      onClick={() => onToggle(emotion)}
    >
      {t(emotion.name)}
    </button>
  );
});
EmotionBubble.displayName = 'EmotionBubble';

const EmotionGrid: React.FC<EmotionGridProps> = ({ quadrants, onSelectEmotions, onBack }) => {
  const [selectedEmotions, setSelectedEmotions] = useState<Emotion[]>([]);
  const [isIntensityStep, setIsIntensityStep] = useState(false);
  const [intensity, setIntensity] = useState(5);
  const { t } = useLanguage();

  const selectedIds = useMemo(() => new Set(selectedEmotions.map(e => e.id)), [selectedEmotions]);

  const isParentRole = useMemo(() =>
    settingsStore.getUserRole() === 'parent',
    []
  );

  const filteredEmotions = useMemo(() =>
    emotions.filter(e => quadrants.includes(e.quadrant) && (!e.isParenting || isParentRole)),
    [quadrants, isParentRole]
  );

  const toggleEmotion = useCallback((e: Emotion) => {
    setSelectedEmotions(prev => {
      const exists = prev.find(item => item.id === e.id);
      if (exists) return prev.filter(item => item.id !== e.id);
      return [...prev, e];
    });
  }, []);

  const handleConfirm = () => {
    onSelectEmotions(selectedEmotions, intensity);
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
          <span className="step-tag">{t('喚名感覺與強度')}</span>
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

        {/* Previous styles for intensity-step remain same */}
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
              <span>{t(q === 'red' ? '很滿/卡住' : q === 'yellow' ? '很滿/順心' : q === 'blue' ? '很慢/卡住' : '很慢/順心')}</span>
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
          <EmotionBubble
            key={emotion.id}
            emotion={emotion}
            isSelected={selectedIds.has(emotion.id)}
            onToggle={toggleEmotion}
            t={t}
            color={quadrantColors[emotion.quadrant]}
            index={index}
          />
        ))}
      </div>

      <button
        className="morandi-main-btn"
        disabled={selectedEmotions.length === 0}
        onClick={() => setIsIntensityStep(true)}
      >
        {t('下一步')}
      </button>

    </div>
  );
};

export default EmotionGrid;
