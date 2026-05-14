import React, { useMemo } from 'react';
import { useLanguage } from '../services/LanguageContext';
import { type Quadrant } from '../data/emotionData';
import './MoodMeter.css';

interface MoodMeterProps {
  onSelectQuadrants: (qs: Quadrant[]) => void;
}

const MoodMeter: React.FC<MoodMeterProps> = ({ onSelectQuadrants }) => {
  const { t } = useLanguage();
  const [selectedQs, setSelectedQs] = React.useState<Quadrant[]>([]);

  const quadrants: { id: Quadrant; label: string; desc: string }[] = useMemo(() => [
    { id: 'red', label: t('高能量 / 不愉快'), desc: t('焦慮、壓力、憤怒') },
    { id: 'yellow', label: t('高能量 / 愉快'), desc: t('興奮、喜悅、動力') },
    { id: 'blue', label: t('低能量 / 不愉快'), desc: t('悲傷、疲憊、抑鬱') },
    { id: 'green', label: t('低能量 / 愉快'), desc: t('平靜、放鬆、知足') },
  ], [t]);

  const toggleQuadrant = (id: Quadrant) => {
    setSelectedQs(prev =>
      prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id]
    );
  };

  const updateAura = (color: string | null) => {
    if (selectedQs.length > 0 && !color) {
      // If something is selected and we're leaving, keep the selection color or a mix
      return;
    }
    document.documentElement.style.setProperty(
      '--aura-color',
      color ? `${color}44` : 'transparent'
    );
  };

  const getHexColor = (id: Quadrant) => {
    switch (id) {
      case 'red': return '#B48A89';
      case 'yellow': return '#CDB99C';
      case 'blue': return '#8E9DAA';
      case 'green': return '#A1A892';
      default: return '';
    }
  };

  return (
    <div className="mood-meter-container fade-in">
      <div className="mood-meter-header">
        <h1>{t('你現在感覺如何？')}</h1>
        <p>{t('可以選擇多個最貼近你當前能量與心情的色塊')}</p>
      </div>

      <div className="spheres-layout">
        {/* 軸線 */}
        <div className="axis-line axis-vertical" aria-hidden="true" />
        <div className="axis-line axis-horizontal" aria-hidden="true" />

        {/* 軸標籤 */}
        <span className="axis-label axis-top">{t('高能量')}</span>
        <span className="axis-label axis-bottom">{t('低能量')}</span>
        <span className="axis-label axis-left">{t('不愉快')}</span>
        <span className="axis-label axis-right">{t('愉快')}</span>

        {quadrants.map((q) => (
          <div
            key={q.id}
            className={`sphere-wrapper ${q.id} ${selectedQs.includes(q.id) ? 'active' : ''}`}
            onClick={() => toggleQuadrant(q.id)}
            onMouseEnter={() => updateAura(getHexColor(q.id))}
            onMouseLeave={() => updateAura(null)}
            role="button"
            tabIndex={0}
            aria-pressed={selectedQs.includes(q.id)}
            aria-label={`${q.label.replace(/\s*\/\s*/g, '')} - ${q.id === 'red' ? '紅色' : q.id === 'yellow' ? '黃色' : q.id === 'blue' ? '藍色' : '綠色'}象限`}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleQuadrant(q.id)}
            data-testid={`mood-quadrant-${q.id}`}
          >
            <div className="sphere-orbital">
              <div className="sphere">
                <div className="sphere-inner"></div>
                <div className="sphere-glow"></div>
              </div>
            </div>
            <div className="sphere-info">
              <span className="sphere-label">{q.label}</span>
              <span className="sphere-desc">{q.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <button
        className="morandi-main-btn confirm-btn"
        disabled={selectedQs.length === 0}
        onClick={() => onSelectQuadrants(selectedQs)}
        data-testid="mood-confirm"
      >
        {t('確認選擇')}
      </button>

    </div>
  );
};

export default MoodMeter;
