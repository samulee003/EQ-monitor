import { useState, useEffect } from 'react';
import { BreathingAnimation } from './BreathingAnimation';
import styles from './MetaMomentOverlay.module.css';

interface Props {
  onClose: () => void;
  onComplete: (result: { bestSelf: string; strategy: string }) => void;
}

const STEPS = [
  {
    title: 'Step 1: 感知 (Sense)',
    content:
      '先暫停一下，感受一下你的身體。你的心跳如何？肩膀緊嗎？肚子有什麼感覺？',
  },
  {
    title: 'Step 2: 暫停 (Stop)',
    content: '讓我們一起深呼吸，給情緒一些空間。',
  },
  {
    title: 'Step 3: 看見最好的自己',
    content:
      '想一想，當你處於最好的狀態時，你是什麼樣子？充滿耐心？冷靜？有同理心？',
  },
  {
    title: 'Step 4: 策略與行動',
    content: '選擇一個策略來幫助你回到平衡：',
  },
];

const STRATEGIES = [
  '繼續深呼吸 1 分鐘',
  '去外面散步 5 分鐘',
  '喝一杯水',
  '寫下現在的感受',
  '打給我的「馬文叔叔」',
];

export function MetaMomentOverlay({ onClose, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [bestSelf, setBestSelf] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="meta-moment-title"
      data-testid="meta-moment-overlay"
      data-step={step}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>🆘</div>
          <h2
            id="meta-moment-title"
            className={styles.headerTitle}
          >
            Meta-Moment 緊急協助
          </h2>
        </div>
        <button
          onClick={onClose}
          aria-label="關閉"
          className={styles.closeButton}
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.stepLabel} data-testid="meta-moment-step-title">
          {STEPS[step].title}
        </div>
        <p className={styles.stepContent}>
          {STEPS[step].content}
        </p>

        <div className={styles.crisisCard} aria-label="緊急求助資訊">
          <p>如果你或身邊的人有立即危險，請先離開危險環境並聯絡當地緊急服務。</p>
          <div className={styles.hotlineRow}>
            <a href="tel:1925">安心專線 1925</a>
            <a href="tel:1909">生命線 1909</a>
          </div>
        </div>

        {step === 1 && <BreathingAnimation />}

        {step === 2 && (
          <input
            type="text"
            value={bestSelf}
            onChange={(e) => setBestSelf(e.target.value)}
            placeholder="例如：冷靜、有耐心"
            className={styles.bestSelfInput}
            aria-label="描述你最好的自己"
          />
        )}

        {step === 3 && (
          <div className={styles.strategyList}>
            {STRATEGIES.map((s) => (
              <button
                key={s}
                onClick={() => onComplete({ bestSelf, strategy: s })}
                className={styles.strategyButton}
              >
                <span>✓</span>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer Action */}
      {step < 3 && (
        <div className={styles.footer}>
          <button
            onClick={handleNext}
            className={styles.nextButton}
            data-testid="meta-moment-next"
          >
            {step === 0
              ? '我準備好了，開始呼吸'
              : step === 1
                ? '呼吸完成'
                : '下一步'}
          </button>
        </div>
      )}
    </div>
  );
}
