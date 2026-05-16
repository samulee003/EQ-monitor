import React, { useMemo } from 'react';
import { useLanguage } from '../services/LanguageContext';
import { type Quadrant } from '../data/emotionData';
import './EmotionQuadrantPicker.css';

interface EmotionQuadrantPickerProps {
  onSelectQuadrants: (qs: Quadrant[]) => void;
}

const EmotionQuadrantPicker: React.FC<EmotionQuadrantPickerProps> = ({ onSelectQuadrants }) => {
  const { t } = useLanguage();
  const [selectedQs, setSelectedQs] = React.useState<Quadrant[]>([]);

  const quadrants: { id: Quadrant; label: string; desc: string }[] = useMemo(() => [
    { id: 'red', label: t('很滿 / 卡住'), desc: t('緊繃、焦躁、快爆開') },
    { id: 'yellow', label: t('很滿 / 順心'), desc: t('有勁、期待、被點亮') },
    { id: 'blue', label: t('很慢 / 卡住'), desc: t('低落、疲累、想躲起來') },
    { id: 'green', label: t('很慢 / 順心'), desc: t('安穩、鬆開、剛剛好') },
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
    <div className="emotion-quadrant-picker-container fade-in">
      <div className="emotion-quadrant-picker-header">
        <span className="emotion-kicker">{t('今日心情')}</span>
        <h1>{t('先選一個最像現在的狀態')}</h1>
        <p>{t('不用想很準，選接近的就好。等一下阿念會陪你慢慢整理。')}</p>
      </div>

      <div className="spheres-layout">
        {/* 軸線 */}
        <div className="axis-line axis-vertical" aria-hidden="true" />
        <div className="axis-line axis-horizontal" aria-hidden="true" />

        {/* 軸標籤 */}
        <span className="axis-label axis-top">{t('身體很滿')}</span>
        <span className="axis-label axis-bottom">{t('身體很慢')}</span>
        <span className="axis-label axis-left">{t('不太舒服')}</span>
        <span className="axis-label axis-right">{t('比較順心')}</span>

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
            aria-label={`${q.label}，${q.desc}，${q.id === 'red' ? '紅色' : q.id === 'yellow' ? '黃色' : q.id === 'blue' ? '藍色' : '綠色'}狀態區`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleQuadrant(q.id);
              }
            }}
            data-testid={`emotion-quadrant-${q.id}`}
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

      <p className="selection-hint" aria-live="polite">
        {selectedQs.length > 0
          ? t('下一步：幫你找一個更準的情緒詞')
          : t('先不用知道原因，點一格就好')}
      </p>

      <button
        className="morandi-main-btn confirm-btn"
        disabled={selectedQs.length === 0}
        onClick={() => onSelectQuadrants(selectedQs)}
        data-testid="emotion-confirm"
      >
        {selectedQs.length > 1 ? t('用這些狀態開始') : t('用這個狀態開始')}
      </button>

    </div>
  );
};

export default EmotionQuadrantPicker;
