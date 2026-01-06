import React, { useMemo } from 'react';
import { useLanguage } from '../services/LanguageContext';
import { Quadrant } from '../data/emotionData';

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
            aria-label={`${q.label}: ${q.desc}`}
            onKeyDown={(e) => e.key === 'Enter' && toggleQuadrant(q.id)}
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
      >
        {t('確認選擇')}
      </button>

      <style>{`
        .mood-meter-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4rem;
          min-height: 60vh;
          justify-content: center;
        }

        .mood-meter-header {
          text-align: center;
          max-width: 320px;
        }

        .mood-meter-header h1 {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 1rem;
          letter-spacing: -0.5px;
          line-height: 1.2;
        }

        .mood-meter-header p {
          color: var(--text-secondary);
          font-size: 0.95rem;
          line-height: 1.6;
        }

        /* Orbital Layout */
        .spheres-layout {
          position: relative;
          width: 340px;
          height: 340px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Axis Lines */
        .axis-line {
          position: absolute;
          background: var(--glass-border);
          z-index: 1;
        }
        .axis-vertical {
          width: 1px;
          height: 100%;
          left: 50%;
        }
        .axis-horizontal {
          width: 100%;
          height: 1px;
          top: 50%;
        }

        /* Axis Labels */
        .axis-label {
          position: absolute;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 1px;
          color: var(--text-secondary);
          opacity: 0.7;
          text-transform: uppercase;
          z-index: 1;
        }
        .axis-top { top: -8px; left: 50%; transform: translateX(-50%); }
        .axis-bottom { bottom: -8px; left: 50%; transform: translateX(-50%); }
        .axis-left { left: -12px; top: 50%; transform: translateY(-50%) rotate(-90deg); }
        .axis-right { right: -12px; top: 50%; transform: translateY(-50%) rotate(90deg); }

        .sphere-wrapper {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: var(--transition-luxe);
          z-index: 2;
        }

        /* Staggered Orbital Mapping */
        .sphere-wrapper.red { transform: translate(-80px, -90px); }
        .sphere-wrapper.yellow { transform: translate(90px, -70px); }
        .sphere-wrapper.blue { transform: translate(-95px, 90px); }
        .sphere-wrapper.green { transform: translate(75px, 85px); }

        .sphere-orbital {
          padding: 20px;
          transition: var(--transition-luxe);
        }

        .sphere {
          width: 85px;
          height: 85px;
          position: relative;
          transition: var(--transition-luxe);
        }

        .sphere-inner {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.9;
          filter: blur(0.5px);
          box-shadow: 
            inset 0 4px 8px hsla(0, 0%, 100%, 0.3),
            inset 0 -4px 8px rgba(0,0,0,0.2),
            0 10px 25px -5px rgba(0,0,0,0.3);
          transition: var(--transition-luxe);
        }

        .sphere-glow {
          position: absolute;
          inset: -15px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.15;
          filter: blur(20px);
          transition: var(--transition-luxe);
        }

        .red { color: var(--color-red); }
        .yellow { color: var(--color-yellow); }
        .blue { color: var(--color-blue); }
        .green { color: var(--color-green); }

        .sphere-info {
          position: absolute;
          bottom: -45px;
          text-align: center;
          opacity: 0;
          transition: var(--transition-luxe);
          transform: translateY(10px);
          pointer-events: none;
          min-width: 140px;
        }

        .sphere-label {
          display: block;
          font-weight: 700;
          font-size: 0.9rem;
          margin-bottom: 0.2rem;
          letter-spacing: 0.5px;
        }

        .sphere-desc {
          display: block;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        /* Hover States - Luxe Magnetic Feel */
        .sphere-wrapper:hover {
          z-index: 10;
        }

        .sphere-wrapper:hover .sphere-orbital {
          transform: translateY(-8px);
        }

        .sphere-wrapper:hover .sphere {
          transform: scale(1.15);
        }

        .sphere-wrapper:hover .sphere-inner {
          opacity: 1;
          box-shadow: 
            inset 0 4px 12px hsla(0, 0%, 100%, 0.4),
            inset 0 -6px 12px rgba(0,0,0,0.3),
            0 15px 35px -5px rgba(0,0,0,0.4);
        }

        .sphere-wrapper:hover .sphere-glow {
          opacity: 0.4;
          filter: blur(24px);
          transform: scale(1.2);
        }

        .sphere-wrapper:hover .sphere-info {
          opacity: 1;
          transform: translateY(0);
        }

        /* Active/Selected State */
        .sphere-wrapper.active .sphere {
          transform: scale(1.1);
        }
        .sphere-wrapper.active .sphere-inner {
          box-shadow: 
            inset 0 4px 12px hsla(0, 0%, 100%, 0.5),
            0 0 20px currentColor;
          border: 2px solid #fff;
        }
        .sphere-wrapper.active .sphere-glow {
          opacity: 0.6;
          filter: blur(30px);
        }
        .sphere-wrapper.active .sphere-info {
          opacity: 1;
          transform: translateY(0);
        }

        .confirm-btn {
          max-width: 200px;
          margin-top: -1rem;
        }

        @media (max-width: 480px) {
          .spheres-layout {
            transform: scale(0.75);
            margin: -2rem 0;
          }
          .mood-meter-header h1 { font-size: 1.6rem; }
          .mood-meter-header p { font-size: 0.85rem; }
          .mood-meter-container { gap: 2rem; }
          
          .sphere-info {
            bottom: -55px;
            transform: translateY(5px) scale(1.15); /* Slightly larger text to compensate for container scale */
          }
        }
        
        @media (max-height: 670px) {
          .spheres-layout {
            transform: scale(0.65);
          }
          .mood-meter-container { gap: 1rem; }
        }
      `}</style>
    </div>
  );
};

export default MoodMeter;
