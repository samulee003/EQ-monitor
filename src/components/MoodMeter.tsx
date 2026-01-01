import React from 'react';
import { Quadrant } from '../data/emotionData';

interface MoodMeterProps {
  onSelectQuadrant: (q: Quadrant) => void;
}

const quadrants: { id: Quadrant; label: string; desc: string }[] = [
  { id: 'red', label: '高能量 / 不愉快', desc: '焦慮、壓力、憤怒' },
  { id: 'yellow', label: '高能量 / 愉快', desc: '興奮、喜悅、動力' },
  { id: 'blue', label: '低能量 / 不愉快', desc: '悲傷、疲憊、抑鬱' },
  { id: 'green', label: '低能量 / 愉快', desc: '平靜、放鬆、知足' },
];

const MoodMeter: React.FC<MoodMeterProps> = ({ onSelectQuadrant }) => {
  const updateAura = (color: string | null) => {
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
        <h1>你現在感覺如何？</h1>
        <p>選擇一個最貼近你當前能量與心情的色塊</p>
      </div>

      <div className="spheres-layout">
        {quadrants.map((q) => (
          <div
            key={q.id}
            className={`sphere-wrapper ${q.id}`}
            onClick={() => onSelectQuadrant(q.id)}
            onMouseEnter={() => updateAura(getHexColor(q.id))}
            onMouseLeave={() => updateAura(null)}
          >
            <div className="sphere">
              <div className="sphere-inner"></div>
              <div className="sphere-glow"></div>
            </div>
            <div className="sphere-info">
              <span className="sphere-label">{q.label}</span>
              <span className="sphere-desc">{q.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .mood-meter-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3rem;
        }

        .mood-meter-header {
          text-align: center;
        }

        .mood-meter-header h1 {
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #fff 0%, #aaa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .mood-meter-header p {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }

        /* Spheres Layout - 2x2 Grid */
        .spheres-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          gap: 2rem;
          width: 100%;
          max-width: 400px;
          margin: 0 auto;
        }

        .sphere-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: var(--transition);
          padding: 1rem;
        }

        .sphere-wrapper.red { grid-area: 1 / 1; }
        .sphere-wrapper.yellow { grid-area: 1 / 2; }
        .sphere-wrapper.blue { grid-area: 2 / 1; }
        .sphere-wrapper.green { grid-area: 2 / 2; }

        .sphere {
          width: 120px;
          height: 120px;
          position: relative;
          transition: var(--transition);
        }

        .sphere-inner {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.85;
          filter: blur(1px);
          border: 2px solid rgba(255, 255, 255, 0.2);
          transition: var(--transition);
        }

        .sphere-glow {
          position: absolute;
          inset: -10px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.12;
          filter: blur(10px);
          transition: var(--transition);
        }

        /* Color assignments */
        .red { color: var(--color-red); }
        .yellow { color: var(--color-yellow); }
        .blue { color: var(--color-blue); }
        .green { color: var(--color-green); }

        .sphere-info {
          margin-top: 1rem;
          text-align: center;
          opacity: 0.7;
          transition: var(--transition);
          pointer-events: none;
        }

        .sphere-label {
          display: block;
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 0.2rem;
        }

        .sphere-desc {
          display: block;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        /* Hover States */
        .sphere-wrapper:hover {
          transform: scale(1.08);
          z-index: 10;
        }

        .sphere-wrapper:hover .sphere-inner {
          opacity: 1;
          filter: blur(1px);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .sphere-wrapper:hover .sphere-glow {
          opacity: 0.35;
          filter: blur(12px);
        }

        .sphere-wrapper:hover .sphere-info {
          opacity: 1;
          transform: translateY(5px);
        }

        @media (max-width: 480px) {
          .spheres-layout {
            gap: 1.5rem;
            max-width: 320px;
          }
          .sphere { width: 90px; height: 90px; }
        }
      `}</style>
    </div>
  );
};

export default MoodMeter;
